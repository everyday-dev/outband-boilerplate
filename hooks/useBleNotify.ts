import { bleCore } from '@/lib/bluetooth';
import { Buffer } from 'buffer';
import { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

/**
 * Configuration options for the useBleNotify hook.
 */
interface BleNotifyOptions<T> {
    /** A transform function to convert the incoming Buffer into the desired type T. */
    parser?: (decodedData: Buffer) => T;
    /** The sampling factor used to reduce UI updates (e.g., 10 updates only every 10th sample). */
    decimate?: number;
    /** A value used to initialize state if the device read fails or before the first notification. */
    defaultVal?: T;
}

/**
 * A reactive hook for subscribing to real-time BLE Characteristic notifications.
 * * On mount, the hook attempts to hydrate state via a Characteristic read. If the read
 * fails, it falls back to the provided defaultVal. It then listens for incoming
 * notifications, applying decimation to throttle high-frequency updates.
 * * @param serviceUUID - The UUID of the BLE service.
 * @param charUUID - The UUID of the characteristic to observe.
 * @param options - Configuration for parsing, throttling, and default state.
 * @returns The most recent parsed value, or null if no data is available.
 */
export function useBleNotify<T = string>(
    serviceUUID: string,
    charUUID: string,
    options: BleNotifyOptions<T> = {},
) {
    const {
        decimate = 1,
        defaultVal,
        parser = (buf: Buffer) => buf.toString('utf8') as unknown as T,
    } = options;

    const [data, setData] = useState<T | null>(defaultVal ?? null);
    const counterRef = useRef<number>(0);

    useEffect(() => {
        let isMounted = true;

        const initialHydrate = async () => {
            try {
                const b64data = await bleCore.readData(serviceUUID, charUUID);
                if (isMounted && b64data) {
                    const rawBuffer = Buffer.from(b64data, 'base64');
                    setData(parser(rawBuffer));
                }
            } catch (err) {
                if (isMounted && defaultVal !== undefined) {
                    setData(defaultVal);
                } else if (isMounted) {
                    console.warn(
                        `useBleNotify: Failed to hydrate ${charUUID} and no defaultVal was provided.`,
                    );
                }
            }
        };

        initialHydrate();

        bleCore.startStreaming(serviceUUID, charUUID);

        const eventName = `ble-notify-${charUUID}`;
        const listener = DeviceEventEmitter.addListener(
            eventName,
            (incomingData: string) => {
                counterRef.current++;

                if (counterRef.current >= decimate) {
                    counterRef.current = 0;

                    if (isMounted) {
                        const rawDat = Buffer.from(incomingData, 'base64');
                        setData(parser(rawDat));
                    }
                }
            },
        );

        return () => {
            isMounted = false;
            listener.remove();
            bleCore.stopStreaming(charUUID);
        };
    }, [serviceUUID, charUUID, decimate, defaultVal]);

    return data;
}
