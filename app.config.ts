import { ConfigContext, ExpoConfig } from 'expo/config';
import 'tsx/cjs';

export default ({ config }: ConfigContext): ExpoConfig => ({
    name: 'outband-boilerplate',
    slug: 'outband-boilerplate',
    scheme: 'outband-boilerplate',
    version: '1.0.0',

    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.yourcompany.yourapp',
    },

    android: {
        package: 'com.yourcompany.yourapp',
        adaptiveIcon: {
            backgroundColor: '#FFFFFF',
            foregroundImage: './assets/images/adaptive-icon.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
    },

    web: {
        output: 'static',
        favicon: './assets/images/favicon.png',
    },

    plugins: [
        [
            'react-native-ble-plx',
            {
                isBackgroundEnabled: false,
                modes: ['peripheral', 'central'],
                bluetoothAlwaysPermission: `Allow Outband Boilerplate to connect to bluetooth devices`,
            },
        ],
        'expo-router',
        [
            'expo-splash-screen',
            {
                image: './assets/images/outband.png',
                imageWidth: 200,
                backgroundColor: '#ffffff',
                dark: {
                    image: './assets/images/outband_white.png',
                    backgroundColor: '#000000',
                },
            },
        ],
        'expo-web-browser',
    ],

    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
});
