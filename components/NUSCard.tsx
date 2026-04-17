import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useBleConnection } from '@/hooks/useBleConnection';
import { useBleStream } from '@/hooks/useBleStream';
import { ProjectConfig } from '@/project.config';
import { FileTerminal } from 'lucide-react-native';
import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Text } from './ui/text';

export default function NUSCard() {
    const scrollViewRef = useRef<ScrollView>(null);
    const { isBleConnected } = useBleConnection();
    const nusLogs = useBleStream(
        ProjectConfig.ble.services.nus.service_uuid,
        ProjectConfig.ble.services.nus.uart_tx,
        (buf: Buffer) => buf.toString('utf8'),
        {
            strategy: 'index',
            batchSize: 1,
            maxHistory: 100,
        },
    );

    if (!isBleConnected) return null;

    return (
        <Card className="py-2">
            <Accordion type="single" defaultValue="item-1" className="w-full">
                <AccordionItem className="border-0" value="item-1">
                    <CardHeader>
                        <AccordionTrigger>
                            <CardTitle>
                                <View className="flex flex-row items-center gap-2">
                                    <Icon as={FileTerminal} />
                                    <CardTitle>NUS BLE Logging</CardTitle>
                                </View>
                            </CardTitle>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="flex flex-col items-start gap-4 max-h-96 h-96 bg-primary py-4">
                            <ScrollView
                                ref={scrollViewRef}
                                onContentSizeChange={() =>
                                    scrollViewRef.current?.scrollToEnd({
                                        animated: true,
                                    })
                                }
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={true}
                            >
                                {nusLogs.map((item) => (
                                    <View key={item.x} className="flex-row">
                                        <Text className="text-secondary">
                                            {item.y}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
