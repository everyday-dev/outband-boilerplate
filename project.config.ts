export const ProjectConfig = {
    hardware: {
        useMockService: false,
    },
    ble: {
        scanTimeoutMs: 5000,
        services: {
            wifi: {
                service_uuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                ssid_uuid: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                psk_uuid: 'e3223119-9445-4e96-a4a1-85358ce291d3',
                state_uuid: 'b8424a1e-84b8-4c3e-8263-ea080cd7a2f5',
            },
            thermostat: {
                service_uuid: 'deba20ce-81ac-41ec-9873-22a7026c4ef7',
                setpoint_uuid: '6528ca44-6ad0-4cdd-ac97-abbefbe0fe6e',
                current_temp_uuid: 'f8255020-077b-4614-930e-ec04da25da61',
                state_uuid: '815e16a3-0deb-4eaa-b7e1-687860b2e5e4',
            },
            ecg: {
                service_uuid: 'a3875323-9993-4a7b-b541-19a9e29a3a93',
                waveform_uuid: '60139b4d-0441-4712-986c-0e86236b3252',
                bpm_uuid: '7a21b34e-0123-4567-89ab-cdef01234567',
            },
        },
    },
} as const;
