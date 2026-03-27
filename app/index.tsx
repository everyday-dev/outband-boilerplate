import OutbandLogo from '@/components/OutbandLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { NAV_THEME } from '@/lib/theme';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import { TouchableOpacity, View } from 'react-native';

export default function Index() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();

    const isDark = colorScheme === 'dark';

    const openInAppLink = async (link: string) => {
        await WebBrowser.openBrowserAsync(link);
    };

    return (
        <View>
            <Stack.Screen
                options={{
                    headerShown: false,
                    title: 'Home',
                }}
            />
            <View className="flex flex-col items-center justify-center h-screen-safe">
                <View className="flex-1 flex flex-col w-full items-center justify-center gap-8">
                    <OutbandLogo
                        size={150}
                        color={NAV_THEME[isDark ? 'dark' : 'light'].colors.text}
                    />
                    <Text className="text-center text-6xl font-bold font-mono py-1">
                        Outband Boilerplate
                    </Text>
                    <Button onPress={() => router.navigate('/instructions')}>
                        <Text className="font-mono uppercase">
                            Connect Device
                        </Text>
                    </Button>
                </View>
                <Badge variant={'secondary'}>
                    <TouchableOpacity
                        onPress={() => openInAppLink('https://outband.app')}
                    >
                        <Text className="font-mono text-xs font-semibold px-2 py-1">
                            Build your own Bluetooth IoT app &rarr;
                        </Text>
                    </TouchableOpacity>
                </Badge>
            </View>
        </View>
    );
}
