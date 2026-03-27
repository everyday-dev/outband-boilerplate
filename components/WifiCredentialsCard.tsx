import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useBleConnection } from '@/hooks/useBleConnection';
import { useBleNotify } from '@/hooks/useBleNotify';
import { WifiState } from '@/lib/bluetooth/api/wifi/types';
import { WifiApi } from '@/lib/bluetooth/api/wifi/wifiApi';
import { ProjectConfig } from '@/project.config';
import { Buffer } from 'buffer';
import { Wifi } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';

export default function WifiCredentialsCard() {
    const { isBleConnected } = useBleConnection();
    const currentSsid = useBleNotify<string>(
        ProjectConfig.ble.services.wifi.service_uuid,
        ProjectConfig.ble.services.wifi.ssid_uuid,
    );
    const wifiState = useBleNotify<number>(
        ProjectConfig.ble.services.wifi.service_uuid,
        ProjectConfig.ble.services.wifi.state_uuid,
        (dat: Buffer) => {
            return dat.readUint8(0);
        },
    );

    const ssidInputRef = useRef<TextInput>(null);
    const [isWifiConnecting, setIsWifiConnecting] = useState(false);
    const [isWifiConnected, setIsWifiConnected] = useState(false);
    const [ssid, setSsid] = useState('');
    const [psk, setPsk] = useState('');

    useEffect(() => {
        switch (wifiState) {
            case WifiState.WIFI_CONNECTED:
                setIsWifiConnected(true);
                setIsWifiConnecting(false);
                break;

            case WifiState.WIFI_ERROR:
                setIsWifiConnected(false);
                setIsWifiConnecting(false);
                break;

            case WifiState.WIFI_IDLE:
                setIsWifiConnecting(false);
                break;

            case WifiState.WIFI_CONNECTING:
                setIsWifiConnecting(true);
                setIsWifiConnected(false);
            default:
                break;
        }
    }, [wifiState]);

    const handleWifiConnectionRequest = async () => {
        if (ssid.trim() === '') {
            setSsid('');
            ssidInputRef.current?.focus();
            return;
        }

        WifiApi.sendCredentials(ssid.trim(), psk.trim()).catch((error) => {
            setIsWifiConnected(false);
            setIsWifiConnecting(false);
        });

        setSsid('');
        setPsk('');
    };

    if (!isBleConnected) return null;

    return (
        <Card className="py-2">
            <Accordion type="single" defaultValue="item-1" className="w-full">
                <AccordionItem className="border-0" value="item-1">
                    <CardHeader>
                        <AccordionTrigger>
                            <CardTitle>
                                <View className="flex flex-row items-center gap-2">
                                    <Icon as={Wifi} />
                                    <CardTitle>WiFi Settings</CardTitle>
                                </View>
                            </CardTitle>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="flex flex-col items-start gap-4">
                            <Badge className="w-fit" variant={'secondary'}>
                                <View className="flex flex-row items-center gap-2">
                                    {!isWifiConnecting && (
                                        <View
                                            className={`w-2 h-2 rounded-full ${isWifiConnected ? 'bg-green-500' : 'bg-red-500'}`}
                                        />
                                    )}
                                    {isWifiConnecting && (
                                        <ActivityIndicator className="text-primary" />
                                    )}
                                    <Text className="text-secondary-foreground font-mono">
                                        {currentSsid?.length
                                            ? currentSsid
                                            : 'Disconnected'}
                                    </Text>
                                </View>
                            </Badge>
                            <View className="w-full flex flex-col gap-4">
                                <Input
                                    ref={ssidInputRef}
                                    keyboardType="default"
                                    textContentType="none"
                                    autoComplete="off"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    placeholder="Network Name (SSID)"
                                    onChangeText={setSsid}
                                    value={ssid}
                                />
                                <Input
                                    keyboardType="default"
                                    textContentType="password"
                                    autoComplete="off"
                                    secureTextEntry={true}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    placeholder="Password (PSK)"
                                    onChangeText={setPsk}
                                    value={psk}
                                />
                                <Button onPress={handleWifiConnectionRequest}>
                                    <Text className="font-mono uppercase">
                                        {`update wifi credentials`}
                                    </Text>
                                </Button>
                            </View>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
