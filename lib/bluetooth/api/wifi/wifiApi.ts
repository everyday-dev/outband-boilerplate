import { withTimeout } from '@/lib/withTimeout';
import { ProjectConfig } from '@/project.config';
import { bleCore } from '../../index';
import { WifiState } from './types';

export const WifiApi = {
    /**
     * Sequentially writes the SSID, PSK, and State characteristics to trigger WiFi provisioning.
     * @param ssid The WiFi network name.
     * @param psk The WiFi network password.
     * @param timeoutMs Maximum time to wait for the entire sequence to finish (default: 5000ms).
     */
    sendCredentials: async (
        ssid: string,
        psk: string,
        timeoutMs: number = 5000,
    ): Promise<void> => {
        if (!ssid) {
            throw new Error('SSID cannot be empty');
        }

        // Define the sequence of writes
        const provisioningTask = async () => {
            await bleCore.writeData(
                ProjectConfig.ble.services.wifi.service_uuid,
                ProjectConfig.ble.services.wifi.ssid_uuid,
                ssid,
            );
            await bleCore.writeData(
                ProjectConfig.ble.services.wifi.service_uuid,
                ProjectConfig.ble.services.wifi.psk_uuid,
                psk,
            );
            await bleCore.writeData(
                ProjectConfig.ble.services.wifi.service_uuid,
                ProjectConfig.ble.services.wifi.state_uuid,
                WifiState.WIFI_CONNECTING,
            );
        };

        await withTimeout(
            provisioningTask(),
            timeoutMs,
            'Timeout writing WiFi credentials',
        ).catch((error) => {
            console.error('Failed to write WiFi Credentials: ' + error);
        });
    },

    /**
     * Performs a one-off read of the SSID characteristic to get the currently connected network.
     * @returns {Promise<string>} The connected SSID, or an empty string if disconnected/failed.
     */
    getConnectedWifi: async (): Promise<string> => {
        try {
            const ssid = await bleCore.readData(
                ProjectConfig.ble.services.wifi.service_uuid,
                ProjectConfig.ble.services.wifi.ssid_uuid,
            );

            return Buffer.from(ssid, 'base64').toString('utf-8').trim();
        } catch (error) {
            return '';
        }
    },
};
