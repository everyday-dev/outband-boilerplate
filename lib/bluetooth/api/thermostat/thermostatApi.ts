import { withTimeout } from '@/lib/withTimeout';
import { ProjectConfig } from '@/project.config';
import { bleCore } from '../../index';
import { ThermostatState, ThermostatStateDictionary } from './types';

export const ThermostatApi = {
    /**
     * Update the Thermostat setpoint
     * @param setpoint Thermostat setpoint
     * @param timeoutMs Maximum time to wait to set the setpoint.
     */
    updateSetpoint: async (
        setpoint: ThermostatState,
        timeoutMs: number = 2500,
    ): Promise<void> => {
        const sendSetpoint = async () => {
            await bleCore.writeData(
                ProjectConfig.ble.services.thermostat.service_uuid,
                ProjectConfig.ble.services.thermostat.setpoint_uuid,
                setpoint,
            );
        };

        await withTimeout(
            sendSetpoint(),
            timeoutMs,
            'Timeout sending Thermostat Setpoint',
        );
    },

    /**
     * Update the Thermostat state/mode
     * @param state New Themostat state
     * @param timeoutMs Maximum time to wait to set the state.
     */
    updateState: async (
        state: number,
        timeoutMs: number = 2500,
    ): Promise<void> => {
        const sendState = async () => {
            await bleCore.writeData(
                ProjectConfig.ble.services.thermostat.service_uuid,
                ProjectConfig.ble.services.thermostat.state_uuid,
                state,
            );
        };

        await withTimeout(
            sendState(),
            timeoutMs,
            'Timeout sending Thermostat State',
        );
    },

    /**
     * Retrieve the next state info given the current state
     * @param state Current state
     * @returns Returns the tuple for the next Thermostat state
     */
    getNextStateInfo: (currentState: ThermostatState | null) => {
        return currentState !== null
            ? currentState + 1 >= ThermostatState.THERMOSTAT__MAX__
                ? ThermostatStateDictionary[ThermostatState.THERMOSTAT_OFF]
                : ThermostatStateDictionary[
                      (currentState + 1) as ThermostatState
                  ]
            : ThermostatStateDictionary[ThermostatState.THERMOSTAT_OFF];
    },
};
