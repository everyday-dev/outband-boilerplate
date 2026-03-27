import { ProjectConfig } from '@/project.config';
import { Modal, ScrollView, View } from 'react-native';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './ui/card';
import { Text } from './ui/text';

type CharacteristicDetails = {
    title: string;
    description: string;
    uuid: string;
    properties?: string[];
};

type ServiceDetails = {
    title: string;
    description: string;
    uuid: string;
    characteristics: CharacteristicDetails[];
    value: string;
};

export const services: ServiceDetails[] = [
    {
        title: 'WiFi Settings',
        description:
            'Service allowing a user to configure a devices WiFi Network settings as well as read out the currently connected WiFi SSID and network state.',
        uuid: ProjectConfig.ble.services.wifi.service_uuid,
        characteristics: [
            {
                title: 'SSID',
                description:
                    'Current WiFi SSID the device is connected to. Writing a new SSID with optional PSK followed by setting state to `Connecting` will initiate a new WiFi connection.',
                uuid: ProjectConfig.ble.services.wifi.ssid_uuid,
                properties: ['READ', 'WRITE', 'NOTIFY'],
            },
            {
                title: 'PSK',
                description: 'Optional PSK for the new WiFi connection.',
                uuid: ProjectConfig.ble.services.wifi.psk_uuid,
                properties: ['WRITE'],
            },
            {
                title: 'State',
                description:
                    'Current state of the WiFi state machine. IDLE = 0, CONNECTING = 1, CONNECTED = 2, ERROR = 3.',
                uuid: ProjectConfig.ble.services.wifi.state_uuid,
                properties: ['READ', 'WRITE', 'NOTIFY'],
            },
        ],
        value: 'item-1',
    },
    {
        title: 'ECG Monitor',
        description:
            'Real-time electro-cardiogram service providing live waveform data and calculated heart rate metrics.',
        uuid: ProjectConfig.ble.services.ecg.service_uuid,
        characteristics: [
            {
                title: 'Waveform',
                description:
                    'High-frequency stream of ECG lead data. Provides a packed binary buffer containing the voltage sample.',
                uuid: ProjectConfig.ble.services.ecg.waveform_uuid,
                properties: ['NOTIFY'],
            },
            {
                title: 'Heart Rate',
                description:
                    'The calculated beats per minute (BPM) derived from the R-peak intervals of the waveform.',
                uuid: ProjectConfig.ble.services.ecg.bpm_uuid,
                properties: ['NOTIFY'],
            },
        ],
        value: 'item-2',
    },
    {
        title: 'Thermostat Control',
        description:
            'Environment control service for monitoring ambient temperature and adjusting the HVAC target setpoint.',
        uuid: ProjectConfig.ble.services.thermostat.service_uuid,
        characteristics: [
            {
                title: 'Ambient Temp',
                description:
                    'The current temperature measured by the onboard sensor in degrees Fahrenheit.',
                uuid: ProjectConfig.ble.services.thermostat.current_temp_uuid,
                properties: ['READ', 'NOTIFY'],
            },
            {
                title: 'Target Setpoint',
                description:
                    'The desired temperature for the HVAC system to maintain.',
                uuid: ProjectConfig.ble.services.thermostat.setpoint_uuid,
                properties: ['READ', 'WRITE', 'NOTIFY'],
            },
            {
                title: 'HVAC Mode',
                description:
                    'Current operating mode. OFF = 0, AUTO = 1, HEAT = 2, COOL = 3.',
                uuid: ProjectConfig.ble.services.thermostat.state_uuid,
                properties: ['READ', 'WRITE', 'NOTIFY'],
            },
        ],
        value: 'item-3',
    },
];

export default function ServiceDescModal({
    onReqClose,
    isVisible,
}: {
    onReqClose: () => void;
    isVisible: boolean;
}) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onReqClose}
        >
            <View className="w-full h-full bg-card/95 rounded-3xl p-4 shadow-xl flex flex-col items-center justify-center">
                <Card className="max-h-screen-safe my-32 flex flex-col">
                    <CardHeader>
                        <View className="gap-4">
                            <CardTitle>Outband Boilerplate Services</CardTitle>
                            <CardDescription>
                                {`The Outband BLE devices use several Services and Characteristics with Read, Write, and Notify properties to demonstrate use cases you might run into when interfacing with a BLE device. Implement a service below on your device to see it in action.`}
                            </CardDescription>
                        </View>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <ScrollView>
                            <Accordion type="single" collapsable>
                                {services.map((service, idx) => {
                                    return (
                                        <AccordionItem
                                            key={service.value}
                                            value={service.value}
                                        >
                                            <AccordionTrigger>
                                                <Text>{service.title}</Text>
                                            </AccordionTrigger>
                                            <AccordionContent className="flex flex-col gap-4">
                                                <View className="gap-2">
                                                    <View className="flex flex-col items-start gap-2">
                                                        <Text className="text-xs text-foreground">
                                                            {
                                                                service.description
                                                            }
                                                        </Text>
                                                        <Badge
                                                            key={idx}
                                                            variant={
                                                                'secondary'
                                                            }
                                                        >
                                                            <Text className="text-xs font-mono w-fit">
                                                                {service.uuid}
                                                            </Text>
                                                        </Badge>
                                                    </View>
                                                    {service.characteristics &&
                                                        service.characteristics
                                                            ?.length > 0 &&
                                                        service.characteristics?.map(
                                                            (char, idx) => (
                                                                <View
                                                                    key={
                                                                        char.uuid
                                                                    }
                                                                    className="flex flex-col items-start gap-2 border-t border-muted py-2"
                                                                >
                                                                    <Text className="text-sm font-medium">
                                                                        {
                                                                            char.title
                                                                        }
                                                                    </Text>
                                                                    <Text className="text-xs">
                                                                        {
                                                                            char.description
                                                                        }
                                                                    </Text>

                                                                    <View className="flex flex-row items-center gap-2">
                                                                        <Text className="text-xs">
                                                                            Properites:
                                                                        </Text>
                                                                        {char.properties?.map(
                                                                            (
                                                                                prop,
                                                                                idx,
                                                                            ) => {
                                                                                return (
                                                                                    <Badge
                                                                                        key={
                                                                                            prop +
                                                                                            idx
                                                                                        }
                                                                                        variant={
                                                                                            'secondary'
                                                                                        }
                                                                                    >
                                                                                        <Text>
                                                                                            {
                                                                                                prop
                                                                                            }
                                                                                        </Text>
                                                                                    </Badge>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </View>
                                                                    <Badge
                                                                        key={
                                                                            idx
                                                                        }
                                                                        variant={
                                                                            'secondary'
                                                                        }
                                                                    >
                                                                        <Text className="text-xs font-mono w-fit">
                                                                            {
                                                                                char.uuid
                                                                            }
                                                                        </Text>
                                                                    </Badge>
                                                                </View>
                                                            ),
                                                        )}
                                                </View>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </ScrollView>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onPress={onReqClose}>
                            <Text className="font-mono uppercase">{`got it`}</Text>
                        </Button>
                    </CardFooter>
                </Card>
            </View>
        </Modal>
    );
}
