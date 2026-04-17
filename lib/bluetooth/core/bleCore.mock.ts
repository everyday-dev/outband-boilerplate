import { ProjectConfig } from '@/project.config';
import { Buffer } from 'buffer';
import { DeviceEventEmitter } from 'react-native';
import { ThermostatState } from '../api/thermostat/types';
import { WifiState } from '../api/wifi/types';
import { IBleCore } from '../types';

type MockStreamConfig = {
    intervalMs: number;
    generate: (index: number) => any;
};

type MockStreamRecord = {
    intervalId: number;
    listenersCount: number;
};

const MOCK_REGISTRY: Record<string, MockStreamConfig> = {
    [ProjectConfig.ble.services.wifi.ssid_uuid]: {
        intervalMs: 1000,
        generate: () => 'Outband-Wifi',
    },
    [ProjectConfig.ble.services.wifi.state_uuid]: {
        intervalMs: 1000,
        generate: () => WifiState.WIFI_CONNECTED,
    },
    [ProjectConfig.ble.services.thermostat.current_temp_uuid]: {
        intervalMs: 3000,
        generate: () => {
            const drift = (Math.random() - 0.5) * 0.5;
            return parseFloat((65 + drift).toFixed(1));
        },
    },
    [ProjectConfig.ble.services.thermostat.setpoint_uuid]: {
        intervalMs: 10000,
        generate: () => 68,
    },
    [ProjectConfig.ble.services.thermostat.state_uuid]: {
        intervalMs: 10000,
        generate: () => ThermostatState.THERMOSTAT_HEATING,
    },
    [ProjectConfig.ble.services.ecg.waveform_uuid]: {
        intervalMs: 20,
        generate: (index: number) => {
            const frequency = 0.2;
            const sineValue = Math.sin(index * frequency);
            return Math.floor((sineValue + 1) * 127.5);
        },
    },
    [ProjectConfig.ble.services.ecg.bpm_uuid]: {
        intervalMs: 2000,
        generate: () => 60 + Math.floor(Math.random() * 2), // Natural jitter
    },
};

const DEFAULT_MOCK_STREAM: MockStreamConfig = {
    intervalMs: 1000,
    generate: () => parseFloat((Math.random() * 5 + 20).toFixed(1)).toString(),
};

export class BleCoreMock implements IBleCore {
    public manager = { state: 'PoweredOn' };
    public connectedDevice: any | null = null;

    private activeStreams = new Map<string, MockStreamRecord>();

    public async requestBluetoothPermission(): Promise<boolean> {
        return true;
    }

    public scanForDevices(
        onDeviceFound: (device: any) => void,
        onScanError: (error: Error | null) => void,
        whitelist?: string[] | null,
    ) {
        setTimeout(() => {
            onDeviceFound({
                id: 'mock-1234',
                name: 'Outband Mock Device',
                rssi: -45,
                serviceUUIDs: [],
            });
        }, 1000);
    }

    public stopScanning() {}

    public getConnectedDeviceId(): string {
        return this.connectedDevice ? this.connectedDevice.id : '';
    }

    public async isDeviceConnected(): Promise<boolean> {
        return this.connectedDevice !== null;
    }

    public getDeviceRssi(): number | null {
        return this.connectedDevice ? -45 : null;
    }

    public getDeviceServiceUUIDs(): string[] | null {
        return this.connectedDevice ? [] : null;
    }

    public getConnectionMTU(): number | null {
        return this.connectedDevice ? ProjectConfig.ble.requestedMtu : null;
    }

    public connect(
        deviceId: string,
        timeoutMs: number = 2500,
        mtu: number = 23,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.connectedDevice = deviceId;
                DeviceEventEmitter.emit('ble-connection-change', true);
                resolve(true);
            }, 1000);
        });
    }

    public disconnect() {
        if (!this.connectedDevice) return;

        this.connectedDevice = null;

        this.activeStreams.forEach((stream) =>
            clearInterval(stream.intervalId),
        );
        this.activeStreams.clear();

        DeviceEventEmitter.emit('ble-connection-change', false);
    }

    public async writeData(
        serviceUUID: string,
        charUUID: string,
        data: string | number | Uint8Array | Buffer,
        withResponse: boolean = true,
    ): Promise<void> {
        if (!this.connectedDevice)
            return Promise.reject(new Error('Device not connected'));

        const delay = withResponse ? 80 : 10;

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }

    public async readData(
        serviceUUID: string,
        charUUID: string,
    ): Promise<string> {
        if (!this.connectedDevice)
            return Promise.reject('Device not connected');

        const config = MOCK_REGISTRY[charUUID] || DEFAULT_MOCK_STREAM;
        const mockData = config.generate(0);

        let dataBuffer: Buffer;

        if (Buffer.isBuffer(mockData)) {
            dataBuffer = mockData;
        } else if (typeof mockData === 'number') {
            if (!Number.isInteger(mockData)) {
                dataBuffer = Buffer.alloc(4);
                dataBuffer.writeFloatLE(mockData, 0);
            } else {
                dataBuffer = Buffer.alloc(1);
                dataBuffer.writeUInt8(mockData, 0);
            }
        } else {
            dataBuffer = Buffer.from(String(mockData));
        }

        return Promise.resolve(dataBuffer.toString('base64'));
    }

    public startStreaming(serviceUUID: string, charUUID: string) {
        const existingStream = this.activeStreams.get(charUUID);
        if (existingStream) {
            existingStream.listenersCount += 1;
            return;
        }

        const config = MOCK_REGISTRY[charUUID] || DEFAULT_MOCK_STREAM;
        let streamIndex = 0;

        const intervalId = setInterval(() => {
            const mockData = config.generate(streamIndex++);
            let dataBuffer: Buffer;

            if (Buffer.isBuffer(mockData)) {
                dataBuffer = mockData;
            } else if (typeof mockData === 'number') {
                dataBuffer = Buffer.alloc(1);
                dataBuffer.writeUInt8(Math.floor(mockData), 0);
            } else {
                dataBuffer = Buffer.from(String(mockData));
            }

            DeviceEventEmitter.emit(
                `ble-notify-${charUUID}`,
                dataBuffer.toString('base64'),
            );
        }, config.intervalMs);

        this.activeStreams.set(charUUID, { intervalId, listenersCount: 1 });
    }

    public stopStreaming(charUUID: string) {
        const existingStream = this.activeStreams.get(charUUID);
        if (!existingStream) return;

        existingStream.listenersCount -= 1;

        if (existingStream.listenersCount <= 0) {
            clearInterval(existingStream.intervalId);
            this.activeStreams.delete(charUUID);
        }
    }
}
