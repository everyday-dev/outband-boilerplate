import { bleCore } from '@/lib/bluetooth';
import { Buffer } from 'buffer';
import { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

export type StreamStrategy = 'time' | 'index' | 'custom';

/**
 * Options for the useBleStream hook.
 */
export interface StreamOptions {
    /** Number of notifications to accumulate before triggering a React state update. Default: 20 */
    batchSize?: number;
    /** 'index' uses a simple counter, 'time' uses Date.now(), 'custom' requires a customX function. Default: 'index' */
    strategy?: StreamStrategy;
    /** Required if strategy is 'custom'. Allows extracting X (timestamp/seq) from the received raw Buffer. */
    customX?: (buffer: Buffer, index: number) => number;
    /** The total number of points kept in the visible data window. Default: 100 */
    maxHistory?: number;
}

/**
 * A high-performance hook for streaming binary BLE data into a coordinate-based data window.
 * @param serviceUUID The BLE service UUID to subscribe to.
 * @param charUUID The BLE characteristic UUID providing notifications.
 * @param parser Function to extract the Y value from the raw Buffer.
 * @param options Configuration for batching, strategy, and history.
 * @returns An array of {x, y} objects for mapping directly to components
 */
export function useBleStream<T>(
    serviceUUID: string,
    charUUID: string,
    parser: (buffer: Buffer) => T,
    options: StreamOptions = {},
) {
    const {
        batchSize = 20,
        strategy = 'index',
        customX,
        maxHistory = 100,
    } = options;

    const [dataWindow, setDataWindow] = useState<{ x: number; y: T }[]>([]);
    const accumulatorRef = useRef<{ x: number; y: T }[]>([]);
    const totalSamplesRef = useRef<number>(0);

    useEffect(() => {
        let isMounted = true;
        bleCore.startStreaming(serviceUUID, charUUID);

        const eventName = `ble-notify-${charUUID}`;
        const listener = DeviceEventEmitter.addListener(
            eventName,
            (incomingB64: string) => {
                const rawBuffer = Buffer.from(incomingB64, 'base64');
                const currentIndex = totalSamplesRef.current++;

                let xValue: number;
                if (strategy === 'custom' && customX) {
                    xValue = customX(rawBuffer, currentIndex);
                } else if (strategy === 'time') {
                    xValue = Date.now();
                } else {
                    xValue = currentIndex;
                }

                const parsedY = parser(rawBuffer);

                accumulatorRef.current.push({ x: xValue, y: parsedY });

                if (accumulatorRef.current.length >= batchSize) {
                    const newBatch = [...accumulatorRef.current];
                    accumulatorRef.current = [];

                    if (isMounted) {
                        setDataWindow((prevWindow) => {
                            const combined = [...prevWindow, ...newBatch];
                            return combined.slice(-maxHistory);
                        });
                    }
                }
            },
        );

        return () => {
            isMounted = false;
            listener.remove();
            bleCore.stopStreaming(charUUID);
        };
    }, [
        serviceUUID,
        charUUID,
        batchSize,
        strategy,
        customX,
        parser,
        maxHistory,
    ]);

    return dataWindow;
}
