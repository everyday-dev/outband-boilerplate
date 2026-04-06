import { useBleNotify } from '@/hooks/useBleNotify';
import { useBleStream } from '@/hooks/useBleStream';
import { ProjectConfig } from '@/project.config';
import { HandHeart } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import {
    VictoryAxis,
    VictoryChart,
    VictoryContainer,
    VictoryLine,
    VictoryScatter,
} from 'victory-native';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

export default function EcgCard() {
    const maxHistory = 100;
    const eraseGap = 20;
    const batchSize = 2;

    const ecgWaveform = useBleStream(
        ProjectConfig.ble.services.ecg.service_uuid,
        ProjectConfig.ble.services.ecg.waveform_uuid,
        (buf: Buffer) => buf.readUInt8(0),
        {
            strategy: 'custom',
            customX: (data, index) => index % maxHistory,
            batchSize: batchSize,
            maxHistory: maxHistory,
        },
    );

    const heartRate = useBleNotify<number>(
        ProjectConfig.ble.services.ecg.service_uuid,
        ProjectConfig.ble.services.ecg.bpm_uuid,
        {
            parser: (buf) => buf.readUInt8(0),
            defaultVal: 60,
        },
    );

    const styles = useMemo(
        () => ({
            grid: {
                stroke: '#064e3b',
                strokeDasharray: '4, 4',
                strokeWidth: 0.5,
            },
            axis: {
                axis: { stroke: 'transparent' },
                ticks: { stroke: 'transparent' },
                tickLabels: { fill: 'transparent' },
            },
        }),
        [],
    );

    const { leadingSegment, currentX } = useMemo(() => {
        if (ecgWaveform.length === 0)
            return { leadingSegment: [], currentX: 0 };

        const head = ecgWaveform[ecgWaveform.length - 1].x;

        const isPointInGap = (x: number) => {
            const gapEnd = (head + eraseGap) % maxHistory;

            if (head + eraseGap <= maxHistory) {
                return x > head && x <= gapEnd;
            } else {
                return x > head || x <= gapEnd;
            }
        };

        const filtered = ecgWaveform.filter((d) => !isPointInGap(d.x));
        const sorted = [...filtered].sort((a, b) => a.x - b.x);

        const leading = sorted.filter((d) => d.x <= head);

        return {
            leadingSegment: leading,
            currentX: head,
        };
    }, [ecgWaveform, maxHistory, eraseGap]);

    return (
        <Card className="py-2">
            <Accordion type="single" defaultValue="item-1" className="w-full">
                <AccordionItem className="border-0" value="item-1">
                    <CardHeader>
                        <AccordionTrigger>
                            <CardTitle>
                                <View className="flex flex-row items-center gap-2">
                                    <Icon as={HandHeart} />
                                    <CardTitle>Live ECG</CardTitle>
                                </View>
                            </CardTitle>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="relative flex flex-col items-center justify-center">
                            <VictoryChart
                                width={340}
                                height={180}
                                padding={0}
                                domain={{
                                    x: [0, maxHistory * 0.9],
                                    y: [-10, 300],
                                }}
                                containerComponent={
                                    <VictoryContainer responsive={false} />
                                }
                            >
                                <VictoryAxis
                                    dependentAxis
                                    style={{
                                        ...styles.axis,
                                        grid: styles.grid,
                                    }}
                                />
                                <VictoryAxis
                                    style={{
                                        ...styles.axis,
                                        grid: styles.grid,
                                    }}
                                />
                                <VictoryLine
                                    data={leadingSegment}
                                    animate={false}
                                    interpolation="monotoneX"
                                    style={{
                                        data: {
                                            stroke: '#10b981',
                                            strokeWidth: 2.5,
                                        },
                                    }}
                                />
                                {leadingSegment.length > 0 && (
                                    <VictoryScatter
                                        data={[
                                            {
                                                x: currentX,
                                                y: leadingSegment[
                                                    leadingSegment.length - 1
                                                ].y,
                                            },
                                        ]}
                                        size={3}
                                        style={{ data: { fill: '#fff' } }}
                                    />
                                )}
                            </VictoryChart>
                            <View className="absolute flex flex-row gap-2 top-1 right-3 border border-muted rounded-lg bg-primary p-2">
                                <Text className="text-green-500 text-5xl font-mono leading-none">
                                    {heartRate ?? '--'}
                                </Text>
                                <Text className="text-green-800 text-xs font-bold uppercase">
                                    BPM
                                </Text>
                            </View>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
