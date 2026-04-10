import { Subscription, UUID } from 'react-native-ble-plx';

export type StreamRecord = {
    subscription: Subscription;
    listenersCount: number;
};

export interface IBleCore {
    /**
     * Requests necessary Bluetooth and Location permissions based on the OS and Android API level.
     * @returns {Promise<boolean>} True if all permissions are granted, false otherwise.
     */
    requestBluetoothPermission(): Promise<boolean>;

    /**
     * Starts scanning for BLE devices.
     * @param onDeviceFound Callback fired when a matching device is discovered.
     * @param onScanError Callback fired if the scan encounters an error.
     * @param whitelist Array of Service UUIDs to scan for. If omitted (undefined), defaults to the Provisioning Service. If explicitly set to `null`, performs a completely open scan.
     */
    scanForDevices(
        onDeviceFound: (device: any) => void,
        onScanError: (error: Error | null) => void,
        whitelist?: string[] | null,
    ): void;

    /**
     * Stops the active BLE device scan.
     */
    stopScanning(): void;

    /**
     * Retrieves the ID (MAC address on Android, UUID on iOS) of the currently connected device.
     * @returns {string} The device ID, or an empty string if no device is connected.
     */
    getConnectedDeviceId(): string;

    /**
     * Checks if there is an active BLE device connection
     * @returns {Promise<boolean>} True if a BLE device is connected, false otherwise.
     */
    isDeviceConnected(): Promise<boolean>;

    /**
     * Retrieves the last known Received Signal Strength Indicator (RSSI) of the connected device.
     * This value represents the signal strength in dBm (e.g., -45 is strong, -90 is weak).
     * * @returns {number | null} The RSSI value, or null if no device is currently connected.
     */
    getDeviceRssi(): number | null;

    /**
     * Retrieves the list of Service UUIDs associated with the currently connected device.
     * Note: This array is populated from the device's advertisement data during scanning,
     * or fully populated after explicitly discovering the device's services.
     * @returns {UUID[] | null} An array of Service UUID strings, or null if no device is connected.
     */
    getDeviceServiceUUIDs(): UUID[] | null;

    /**
     * Retrieves the negotatiated MTU size for the connection. This value could be lower than
     * the inital requested MTU based on the devices capabilities and settings.
     * * @returns {number | null} The MTU value, or null if no device is currently connected.
     */
    getConnectionMTU(): number | null;

    /**
     * Attempts a BLE connection to the deviceId provided and discovers its services and characteristics.
     * @param deviceId: Unique ID (MAC address on Android, UUID on iOS) of the device you want to connec to
     * @param timeoutMs Maximum time to wait for the connection before aborting..
     * @param mtu Requested MTU for the new connection.
     */
    connect(deviceId: string, timeoutMs: number, mtu: number): Promise<boolean>;

    /**
     * Disconnects the active Device. Internal Disconnect handler will also cleanup any active streams
     * initiated via Notify, Stream, MultiStream, and Sync hooks.
     */
    disconnect(): void;

    /**
     * Sends data to a specific characteristic.
     * Handles type conversion internally:
     * - `string`: Encoded as UTF-8.
     * - `number`: Encoded as a single 8-bit unsigned byte.
     * - `Buffer | Uint8Array`: Sent as raw binary.
     * @param serviceUUID The UUID of the service containing the characteristic.
     * @param charUUID The UUID of the characteristic to write to.
     * @param data The payload to send to the peripheral.
     * @param withResponse If true (default), the function waits for an acknowledgment (ACK)
     * from the peripheral. If false, it uses 'Write Without Response', which is faster
     * but offers no delivery guarantee at the application layer.
     * @throws Error if no device is connected or the write operation fails.
     */
    writeData(
        serviceUUID: string,
        charUUID: string,
        data: string | number | Uint8Array | Buffer,
        withResponse: boolean,
    ): Promise<void>;

    /**
     * Performs a one-time read of a characteristic's value.
     * @param serviceUUID The UUID of the service.
     * @param charUUID The UUID of the characteristic.
     * @returns {Promise<string>} The raw value as a Base64 string.
     * Use a parser (like Buffer) to decode this into your desired type.
     */
    readData(serviceUUID: string, charUUID: string): Promise<string>;

    /**
     * Subscribes to notifications for a characteristic.
     * Emits events via `DeviceEventEmitter` with the key `ble-notify-${charUUID}`.
     * * Internally manages a `listenersCount`; if multiple components subscribe to
     * the same characteristic, only one physical BLE subscription is created.
     * * @param serviceUUID The UUID of the service.
     * @param charUUID The UUID of the characteristic to stream.
     */
    startStreaming(serviceUUID: string, charUUID: string): void;

    /**
     * Decrements the listener count for a streaming characteristic.
     * If the listener count reaches zero, the physical BLE notification
     * subscription is terminated to save battery and bandwidth.
     * * @param charUUID The UUID of the characteristic to stop streaming.
     */
    stopStreaming(charUUID: string): void;
}
