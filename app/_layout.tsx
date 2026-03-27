import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { cssInterop, useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import '../global.css';

cssInterop(LinearGradient, { className: 'style' });

export default function RootLayout() {
    const { colorScheme, setColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = NAV_THEME[isDark ? 'dark' : 'light'];

    // REMOVE TO ENABLE SYSTEM CONTROL OF COLOR SCHEME
    useEffect(() => setColorScheme('light'));

    return (
        <ThemeProvider value={theme}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
            />

            {/* The wrapper View anchors the absolute background */}
            <View className="flex-1 bg-black">
                <LinearGradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    colors={[theme.colors.background, theme.colors.accentMuted]}
                    locations={[0.5, 1]}
                    dither={false}
                    // absolute inset-0 ensures it stretches to the full View size
                    className="absolute inset-0"
                />

                <Stack
                    screenOptions={{
                        contentStyle: { backgroundColor: 'transparent' },
                        headerStyle: { backgroundColor: 'transparent' },
                        headerShadowVisible: false,
                    }}
                />
            </View>

            <PortalHost />
        </ThemeProvider>
    );
}
