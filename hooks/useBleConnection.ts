import { bleCore } from '@/lib/bluetooth';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

/**
 * A hook for managing and observing the connection state of a BLE peripheral.
 * @description
 * This hook provides methods to initiate or terminate a connection while
 * reactively tracking the connection status via global events.
 * @caveat **Hybrid State Management**
 * - `isBleConnected`: This is **Globally Synchronized**. It listens to the `bleCore`
 * singleton via `DeviceEventEmitter`. If the device disconnects (manually or
 * due to range), all components using this hook will update simultaneously.
 * - `isBleConnecting`: This is **Locally Scoped**. If Component A starts a connection,
 * Component B will NOT know that a connection is in progress. For this reason it is recommened
 * to only have a Single component manage a device connection via the `bleConnect` method at one time.
 */
export function useBleConnection() {
    const [isBleConnected, setIsBleConnected] = useState<boolean>(false);
    const [isBleConnecting, setIsBleConnecting] = useState<boolean>(false);

    useEffect(() => {
        bleCore.isDeviceConnected().then(setIsBleConnected);

        const subscription = DeviceEventEmitter.addListener(
            'ble-connection-change',
            (status: boolean) => {
                setIsBleConnected(status);
            },
        );

        return () => {
            subscription.remove();
        };
    }, []);

    /**
     * Initiates a connection to a specific peripheral.
     * @param deviceId - The unique identifier of the target device.
     * @param timeoutMs - Maximum time (ms) to wait for the handshake and
     * service discovery before failing. Defaults to 2500ms.
     */
    const bleConnect = useCallback(
        async (deviceId: string, timeoutMs: number = 2500) => {
            setIsBleConnecting(true);
            try {
                return await bleCore.connect(deviceId, timeoutMs);
            } catch (error) {
                return false;
            } finally {
                setIsBleConnecting(false);
            }
        },
        [],
    );

    /**
     * Requests a global disconnection from the currently connected peripheral.
     * @description
     * Calling this will eventually trigger the `ble-connection-change` event
     * globally, causing all active `useBleConnection` hooks to update their
     * `isBleConnected` state to false.
     */
    const bleDisconnect = useCallback(() => {
        bleCore.disconnect();
    }, []);

    return {
        isBleConnected,
        isBleConnecting,
        bleConnect,
        bleDisconnect,
    };
}
