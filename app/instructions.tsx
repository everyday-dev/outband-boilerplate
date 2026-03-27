import InstructionsGraphic from '@/components/InstructionsGraphic';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { NAV_THEME } from '@/lib/theme';
import { router, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

export default function ProvisionInstructions() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View className="flex-1 px-4 pt-4">
            <Stack.Screen
                options={{
                    title: 'Prepare Device',
                    headerShown: true,
                }}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Prepare device</CardTitle>
                    <CardDescription>
                            {`Preparing a device for bluetooth connection will typically involve a physical interaction to start the process. i.e. pressing and holding a push-button for several seconds, or holding a button during boot up.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <View className="flex flex-col items-center">
                        <InstructionsGraphic height={150} width={300} color={NAV_THEME[isDark ? 'dark' : 'light'].colors.text}/>
                    </View>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onPress={() => {
                            router.navigate('/bleScan');
                        }}
                    >
                        <Text className="font-mono uppercase">
                            Scan for Devices
                        </Text>
                    </Button>
                </CardFooter>
            </Card>
        </View>
    );
}
