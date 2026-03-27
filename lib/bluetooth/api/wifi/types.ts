/**
 * Standardized states for a BLE peripheral's WiFi subsystem.
 * These map to the raw byte (uint8) received via BLE notifications.
 */
export enum WifiState {
    /** Subsystem is inactive or in a default standby state. */
    WIFI_IDLE = 0,

    /** The peripheral is currently attempting to authenticate with a network. */
    WIFI_CONNECTING = 1,

    /** Connection established and network resources (IP address) are ready. */
    WIFI_CONNECTED = 2,

    /** Authentication failed or network not found */
    WIFI_ERROR = 3,
}
