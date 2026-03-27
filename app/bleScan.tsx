import BleScanList from '@/components/BleScanList';
import ServiceDescModal from '@/components/ServiceDescModal';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function BleScan() {
    const [isModalVisible, setIsModalVisible] = useState(false);

    return (
        <View className="relative flex-1 gap-4 px-4 pt-4">
            <Stack.Screen
                options={{
                    title: 'Discovery',
                    headerShown: true,
                }}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Bluetooth Discovery</CardTitle>
                    <CardDescription>
                        {`Devices advertising with the Outband Boilerplate services will appear here. The service consists of multiple characteristics allowing configuration of the device.`}
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Badge>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(true)}
                        >
                            <Text className="font-mono">Learn more &rarr;</Text>
                        </TouchableOpacity>
                    </Badge>
                    <ServiceDescModal
                        onReqClose={() => {
                            setIsModalVisible(false);
                        }}
                        isVisible={isModalVisible}
                    />
                </CardFooter>
            </Card>
            <BleScanList />
        </View>
    );
}
