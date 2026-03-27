import { bleCore } from '@/lib/bluetooth';
import { Buffer } from 'buffer';
import { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

/**
 * A reactive hook for subscribing to real-time BLE Characteristic notifications. On mount
 * the hook will attempt to hydrate via a Characteristic read. If 'Read' is unsupported,
 * the state remains null until the first notification.
 * @param serviceUUID - The UUID of the service containing the characteristic.
 * @param charUUID - The UUID of the characteristic to observe.
 * @param parser - A transform function to convert the incoming data into your desired type. Defaults to parsing incoming data
 * as a string
 * @param decimate - The sampling factor used to reduce the frequency of UI updates.
 * If a peripheral sends data at a high frequency (e.g., every 10ms), providing
 * a decimate value of `10` will cause the hook to only update the `data` state
 * every 10th sample (approx. every 100ms). This is highly recommended for telemetry
 * data to prevent "State Flooding," where the React render cycle cannot keep up with the
 * incoming BLE events.
 * @returns The most recent value emitted by the peripheral, or null if no
 * data has been received/read yet.
 */
export function useBleNotify<T = string>(
    serviceUUID: string,
    charUUID: string,
    parser: (decodedData: Buffer) => T = (buf) =>
        buf.toString('utf8') as unknown as T,
    decimate: number = 1,
) {
    const [data, setData] = useState<T | null>(null);
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
                // Swallow the error. This would likely happen if we
                // tried to read a characteristic that didn't have a READ property
                // and is only set to NOTIFY
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
    }, [serviceUUID, charUUID]);

    return data;
}
