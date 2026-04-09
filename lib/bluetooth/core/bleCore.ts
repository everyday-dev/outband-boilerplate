import { Buffer } from 'buffer';
import { DeviceEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription, UUID } from 'react-native-ble-plx';
import { IBleCore, StreamRecord } from '../types';

export class BleCore implements IBleCore {
    public manager: BleManager;
    public connectedDevice: Device | null = null;

    private activeStreams = new Map<string, StreamRecord>();
    private disconnectListener: Subscription | null = null;

    constructor() {
        this.manager = new BleManager();
    }

    public async requestBluetoothPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') return true;

        if (
            Platform.OS === 'android' &&
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ) {
            const apiLevel = parseInt(Platform.Version.toString(), 10);

            if (apiLevel < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }

            if (
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            ) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_CONNECT'] ===
                        PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] ===
                        PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] ===
                        PermissionsAndroid.RESULTS.GRANTED
                );
            }
        }
        return false;
    }

    public scanForDevices(
        onDeviceFound: (device: Device) => void,
        onScanError: (error: Error | null) => void,
        whitelist?: string[] | null,
    ) {
        if (!this.manager) {
            onScanError(new Error('BLE Manager not initialized.'));
            return;
        }

        this.manager.startDeviceScan(
            whitelist || null,
            null,
            (error, device) => {
                if (error) {
                    this.manager.stopDeviceScan();
                    onScanError(error);
                    return;
                }
                if (device) onDeviceFound(device);
            },
        );
    }

    public stopScanning() {
        this.manager?.stopDeviceScan();
    }

    public getConnectedDeviceId(): string {
        return this.connectedDevice ? this.connectedDevice.id : '';
    }

    public async isDeviceConnected(): Promise<boolean> {
        if (this.connectedDevice)
            return await this.connectedDevice.isConnected();
        return false;
    }

    public getDeviceRssi(): number | null {
        return this.connectedDevice ? this.connectedDevice.rssi : null;
    }

    public getDeviceServiceUUIDs(): UUID[] | null {
        return this.connectedDevice ? this.connectedDevice.serviceUUIDs : null;
    }

    public async connect(
        deviceId: string,
        timeoutMs: number = 2500,
        mtu: number = 23,
    ): Promise<boolean> {
        if (!this.manager) {
            throw new Error('BLE Manager not initialized.');
        }

        return await this.manager
            .connectToDevice(deviceId, { timeout: timeoutMs, requestMTU: mtu })
            .then(async (device) => {
                await device.discoverAllServicesAndCharacteristics();

                this.connectedDevice = device;

                this.setupDisconnectListener(device.id);

                DeviceEventEmitter.emit('ble-connection-change', true);

                return true;
            })
            .catch((err) => {
                throw new Error(`Failed to connect to device: ${err}`);
            });
    }

    public disconnect() {
        if (!this.connectedDevice) return;
        this.connectedDevice.cancelConnection().catch(() => {});
    }

    public async writeData(
        serviceUUID: string,
        charUUID: string,
        data: string | number | Uint8Array | Buffer,
        withResponse: boolean = true,
    ): Promise<void> {
        if (!this.connectedDevice) throw new Error('No device connected');

        let base64Data: string;

        if (typeof data === 'string') {
            base64Data = Buffer.from(data, 'utf-8').toString('base64');
        } else if (typeof data === 'number') {
            base64Data = Buffer.from([data]).toString('base64');
        } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
            base64Data = Buffer.from(data).toString('base64');
        } else {
            throw new Error('Unsupported data type for BLE write');
        }

        if (withResponse) {
            await this.connectedDevice.writeCharacteristicWithResponseForService(
                serviceUUID,
                charUUID,
                base64Data,
            );
        } else {
            await this.connectedDevice.writeCharacteristicWithoutResponseForService(
                serviceUUID,
                charUUID,
                base64Data,
            );
        }
    }

    public async readData(
        serviceUUID: string,
        charUUID: string,
    ): Promise<string> {
        if (!this.connectedDevice) throw new Error('No device connected');

        const characteristic =
            await this.connectedDevice.readCharacteristicForService(
                serviceUUID,
                charUUID,
            );

        return characteristic.value || '';
    }

    public startStreaming(serviceUUID: string, charUUID: string) {
        if (!this.connectedDevice) return;

        const existingStream = this.activeStreams.get(charUUID);
        if (existingStream) {
            existingStream.listenersCount += 1;
            return;
        }

        const subscription =
            this.connectedDevice.monitorCharacteristicForService(
                serviceUUID,
                charUUID,
                (error, characteristic) => {
                    if (error) {
                        // Swallow the error.
                        return;
                    }

                    if (characteristic && characteristic.value !== null) {
                        DeviceEventEmitter.emit(
                            `ble-notify-${charUUID}`,
                            characteristic.value,
                        );
                    }
                },
            );

        this.activeStreams.set(charUUID, { subscription, listenersCount: 1 });
    }

    public stopStreaming(charUUID: string) {
        const existingStream = this.activeStreams.get(charUUID);
        if (!existingStream) return;

        existingStream.listenersCount -= 1;

        if (existingStream.listenersCount <= 0) {
            existingStream.subscription.remove();
            this.activeStreams.delete(charUUID);
        }
    }

    /**
     * Sets up the global broadcaster for unexpected drops.
     * Replaces the old `onDeviceDisconnected` callback method.
     */
    private setupDisconnectListener(deviceId: string) {
        if (this.disconnectListener) {
            this.disconnectListener.remove();
        }

        this.disconnectListener = this.manager.onDeviceDisconnected(
            deviceId,
            (error, device) => {
                this.connectedDevice = null;

                this.activeStreams.forEach((stream) =>
                    stream.subscription.remove(),
                );
                this.activeStreams.clear();

                this.disconnectListener = null;

                DeviceEventEmitter.emit('ble-connection-change', false);
            },
        );
    }
}
