import { bleCore } from '@/lib/bluetooth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';

/**
 * A lifecycle-managed hook for discovering nearby BLE peripherals.
 * @description
 * This hook encapsulates the full scanning workflow: permission requests,
 * device deduplication, and hardware cleanup.
 * @caveat **Local Lifecycle Management**
 * This hook is "greedy." When the component using this hook unmounts, it will
 * trigger `stopScanning()` on the hardware, regardless of whether other
 * components are active. For this reason it is recommened to only have a single
 * component using the hook at any given time.
 */
export function useBleScan() {
    const [bleDevices, setBleDevices] = useState<Device[]>([]);
    const [isBleScanning, setIsBleScanning] = useState(false);
    const [bleError, setBleError] = useState<Error | null>(null);
    const scanTimeoutRef = useRef<number | null>(null);

    /**
     * Manually terminates the active scan session.
     * @description
     * Use this once a target device is selected to immediately free up the
     * Bluetooth radio for the connection phase. This is also called automatically
     * on component unmount.
     */
    const stopBleScan = useCallback(() => {
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }

        bleCore.stopScanning();
        setIsBleScanning(false);
    }, []);

    /**
     * Initiates the BLE discovery process.
     * @note Will request Bluetooth permissions if not previously granted when called.
     * @param allowList - Optional array of Service UUIDs. Only devices advertising
     * these services will be added to `bleDevices`.
     * @param timeoutMs - Duration (ms) before the scan automatically stops.
     * Defaults to 5000ms. Set to 0 to scan indefinitely.
     */
    const startBleScan = useCallback(
        async (allowList?: string[], timeoutMs: number = 5000) => {
            setIsBleScanning(true);
            setBleError(null);
            setBleDevices([]);

            const hasPermission = await bleCore.requestBluetoothPermission();
            if (!hasPermission) {
                setBleError(new Error('Bluetooth permissions not granted'));
                return;
            }

            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            bleCore.scanForDevices(
                (newDevice) => {
                    setBleDevices((prev) => {
                        if (prev.some((d) => d.id === newDevice.id))
                            return prev;
                        return [...prev, newDevice];
                    });
                },
                (err) => {
                    console.error('Scan Error:', err);
                    setBleError(err);
                    setIsBleScanning(false);
                },
                allowList,
            );

            if (timeoutMs > 0) {
                scanTimeoutRef.current = setTimeout(() => {
                    stopBleScan();
                }, timeoutMs);
            }
        },
        [stopBleScan],
    );

    useEffect(() => {
        return () => {
            stopBleScan();
        };
    }, [stopBleScan]);

    return { bleDevices, isBleScanning, bleError, startBleScan, stopBleScan };
}
