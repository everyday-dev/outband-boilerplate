import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useBleConnection } from '@/hooks/useBleConnection';
import { useBleNotify } from '@/hooks/useBleNotify';
import { ThermostatApi } from '@/lib/bluetooth/api/thermostat/thermostatApi';
import {
    ThermostatState,
    ThermostatStateDictionary,
} from '@/lib/bluetooth/api/thermostat/types';
import { ProjectConfig } from '@/project.config';
import { Buffer } from 'buffer';
import { ChevronDown, ChevronUp, SunSnow } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export default function ThermostatCard() {
    const { isBleConnected } = useBleConnection();
    const thermostatSetpoint = useBleNotify<number>(
        ProjectConfig.ble.services.thermostat.service_uuid,
        ProjectConfig.ble.services.thermostat.setpoint_uuid,
        (dat: Buffer) => {
            return dat.readUint8(0);
        },
    );
    const currentTemp = useBleNotify<number>(
        ProjectConfig.ble.services.thermostat.service_uuid,
        ProjectConfig.ble.services.thermostat.current_temp_uuid,
        (dat: Buffer) => {
            return dat.readUint8(0);
        },
    );
    const thermostatState = useBleNotify<ThermostatState>(
        ProjectConfig.ble.services.thermostat.service_uuid,
        ProjectConfig.ble.services.thermostat.state_uuid,
        (dat: Buffer) => {
            return dat.readUint8(0);
        },
    );

    if (!isBleConnected) return null;

    const activeState = thermostatState ?? ThermostatState.THERMOSTAT_OFF;
    const stateConfig =
        ThermostatStateDictionary[activeState] ??
        ThermostatStateDictionary[ThermostatState.THERMOSTAT_OFF];
    const nextState = (((thermostatState ?? ThermostatState.THERMOSTAT_OFF) +
        1) %
        4) as ThermostatState;
    const nextStateConfig =
        ThermostatStateDictionary[nextState] ??
        ThermostatStateDictionary[ThermostatState.THERMOSTAT_OFF];

    return (
        <Card className="py-2">
            <Accordion type="single" defaultValue="item-1" className="w-full">
                <AccordionItem className="border-0" value="item-1">
                    <CardHeader>
                        <AccordionTrigger>
                            <CardTitle>
                                <View className="flex flex-row items-center gap-2">
                                    <Icon as={SunSnow} />
                                    <CardTitle>Thermostat</CardTitle>
                                </View>
                            </CardTitle>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="h-48 flex flex-row items-center justify-center">
                            <View className="relative grow h-full items-center justify-center rounded-xl">
                                <Text
                                    className={`text-9xl font-bold font-mono`}
                                >
                                    {thermostatSetpoint}
                                </Text>
                                <Text
                                    className={`text-2xl font-bold font-mono pb-4`}
                                >
                                    {currentTemp}
                                </Text>
                                <Badge className="absolute bottom-0">
                                    <Icon
                                        size={12}
                                        as={stateConfig.icon}
                                        pointerEvents="none"
                                        className="text-secondary"
                                    />
                                    <Text>{stateConfig.msg}</Text>
                                </Badge>
                            </View>
                            <View className="flex flex-col py-4 border border-muted rounded-full h-full justify-between">
                                <Button
                                    variant={'link'}
                                    onPress={() => {
                                        if (thermostatSetpoint)
                                            ThermostatApi.updateSetpoint(
                                                thermostatSetpoint + 1,
                                            );
                                    }}
                                >
                                    <View>
                                        <Icon
                                            size={24}
                                            as={ChevronUp}
                                            pointerEvents="none"
                                        />
                                    </View>
                                </Button>
                                <Button
                                    variant={'link'}
                                    onPress={() => {
                                        ThermostatApi.updateState(nextState);
                                    }}
                                >
                                    <Icon
                                        size={24}
                                        as={nextStateConfig.icon}
                                        pointerEvents="none"
                                    />
                                </Button>
                                <Button
                                    variant={'link'}
                                    onPress={() => {
                                        if (thermostatSetpoint)
                                            ThermostatApi.updateSetpoint(
                                                thermostatSetpoint - 1,
                                            );
                                    }}
                                >
                                    <Icon
                                        size={24}
                                        as={ChevronDown}
                                        pointerEvents="none"
                                    />
                                </Button>
                            </View>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
