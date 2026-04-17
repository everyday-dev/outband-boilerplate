import EcgCard from '@/components/EcgCard';
import NUSCard from '@/components/NUSCard';
import ThermostatCard from '@/components/ThermostatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import WifiCredentialsCard from '@/components/WifiCredentialsCard';
import { useBleConnection } from '@/hooks/useBleConnection';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function DeviceDetailsScreen() {
    const { deviceId, deviceName, rssi } = useLocalSearchParams<{
        deviceId: string;
        deviceName: string;
        rssi: string;
    }>();
    const { isBleConnected, isBleConnecting, bleConnect, bleDisconnect } =
        useBleConnection();

    useFocusEffect(
        useCallback(() => {
            return () => {
                bleDisconnect();
            };
        }, [bleDisconnect]),
    );

    return (
        <View className="flex-1 px-4 pt-4">
            <Stack.Screen options={{ title: deviceName || 'Device Setup' }} />
            <KeyboardAwareScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 40,
                    gap: 8,
                }}
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Hardware Link</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-row flex-wrap gap-2 items-start">
                        <Badge variant="secondary">
                            <View className="flex flex-row items-center gap-2">
                                {!isBleConnecting && (
                                    <View
                                        className={`w-2 h-2 rounded-full ${isBleConnected ? 'bg-green-500' : 'bg-red-500'}`}
                                    />
                                )}
                                {isBleConnecting && (
                                    <ActivityIndicator className="text-primary" />
                                )}
                                <Text className="text-secondary-foreground font-mono">
                                    {isBleConnected
                                        ? 'Connected'
                                        : 'Disconnected'}
                                </Text>
                            </View>
                        </Badge>
                        {isBleConnected && (
                            <>
                                <Badge variant="secondary">
                                    <Text className="text-primary font-mono text-xs">
                                        {deviceId}
                                    </Text>
                                </Badge>
                                <Badge variant="secondary">
                                    <Text className="text-primary font-mono text-xs">
                                        {`RSSI: ${rssi}dBm`}
                                    </Text>
                                </Badge>
                            </>
                        )}
                    </CardContent>
                    {!isBleConnecting && !isBleConnected && (
                        <CardFooter>
                            <Button
                                className="w-full"
                                onPress={() => {
                                    bleConnect(deviceId);
                                }}
                            >
                                <Text className="font-mono uppercase">
                                    Connect
                                </Text>
                            </Button>
                        </CardFooter>
                    )}
                </Card>
                {isBleConnected && <NUSCard />}
                {isBleConnected && <WifiCredentialsCard />}
                {isBleConnected && <ThermostatCard />}
                {isBleConnected && <EcgCard />}
            </KeyboardAwareScrollView>
        </View>
    );
}
