import { useBleConnection } from '@/hooks/useBleConnection';
import { useBleScan } from '@/hooks/useBleScan';
import { ProjectConfig } from '@/project.config';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Badge } from './ui/badge';
import { Card, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Text } from './ui/text';

const serviceAllowList: string[] = [
    ProjectConfig.ble.services.wifi.service_uuid,
    ProjectConfig.ble.services.thermostat.service_uuid,
    ProjectConfig.ble.services.ecg.service_uuid,
];

/**
 * A reusable, self-contained list component that handles BLE scanning,
 * permission requests, state management, and device page navigation
 * * **Note on Interaction:** When a user presses a device in the list, this component automatically
 * stops the active Bluetooth scan, locks in the selected device globally, and navigates to the device page
 * to attempt to connect to the selected device.
 */
export default function BleScanList() {
    const { bleDevices, isBleScanning, startBleScan, stopBleScan } =
        useBleScan();
    const { isBleConnecting, bleConnect } = useBleConnection();

    useFocusEffect(
        useCallback(() => {
            startBleScan(serviceAllowList, ProjectConfig.ble.scanTimeoutMs);

            return stopBleScan;
        }, [startBleScan, stopBleScan]),
    );

    return isBleConnecting ? (
        <View className="flex flex-row gap-2 w-full items-center justify-center pt-4">
            <ActivityIndicator />
            <Text>Connecting</Text>
        </View>
    ) : (
        <>
            <FlatList
                className="w-full"
                data={bleDevices}
                keyExtractor={(item) => item.id}
                refreshing={isBleScanning}
                onRefresh={() => {
                    startBleScan(serviceAllowList);
                }}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center p-8 mt-10 gap-4">
                        {isBleScanning ? (
                            <>
                                <Text className="text-sm text-secondary-foreground font-mono text-center">
                                    Scanning for devices...
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text className="text-sm text-secondary-foreground font-mono text-center">
                                    No devices found.
                                </Text>
                                <Text className="text-xs text-secondary-foreground/70 text-center">
                                    Make sure your device is powered on and
                                    within range. Pull down to refresh.
                                </Text>
                            </>
                        )}
                    </View>
                }
                renderItem={({ item }: { item: any }) => (
                    <Pressable
                        onPress={async () => {
                            const connected = await bleConnect(
                                item.id,
                                ProjectConfig.ble.deviceConnectTimeoutMs,
                                ProjectConfig.ble.requestedMtu,
                            );
                            if (connected)
                                router.navigate({
                                    pathname: `/device/[deviceId]`,
                                    params: {
                                        deviceId: item.id,
                                        deviceName:
                                            item.name || 'Unkown Device',
                                        rssi: item.rssi
                                            ? String(item.rssi)
                                            : '',
                                    },
                                });
                        }}
                        className="mb-2"
                    >
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <CardTitle>
                                    {item.name ? item.name : item.id}
                                </CardTitle>
                            </CardHeader>
                            <CardFooter className="flex gap-2">
                                <Badge variant={'secondary'}>
                                    <Text className="font-mono">
                                        {`RSSI: ${item.rssi}dBm`}
                                    </Text>
                                </Badge>
                            </CardFooter>
                        </Card>
                    </Pressable>
                )}
                contentContainerStyle={{ paddingVertical: 10 }}
                showsVerticalScrollIndicator={false}
            />
            <View className="items-center pb-8">
                <Badge className="bg-blue-500">
                    <Text className="font-mono text-secondary dark:text-primary">
                        Devices discovered: {bleDevices.length}
                    </Text>
                </Badge>
            </View>
        </>
    );
}
