import { Flame, PowerOff, Snowflake, SunSnow } from 'lucide-react-native';

export enum ThermostatState {
    THERMOSTAT_OFF = 0,
    THERMOSTAT_AUTO = 1,
    THERMOSTAT_HEATING = 2,
    THERMOSTAT_COOLING = 3,
    THERMOSTAT__MAX__ = 4,
}

export const ThermostatStateDictionary = {
    [ThermostatState.THERMOSTAT_OFF]: { msg: 'Off', icon: PowerOff },
    [ThermostatState.THERMOSTAT_AUTO]: { msg: 'Auto', icon: SunSnow },
    [ThermostatState.THERMOSTAT_HEATING]: { msg: 'Heating', icon: Flame },
    [ThermostatState.THERMOSTAT_COOLING]: { msg: 'Cooling', icon: Snowflake },
    [ThermostatState.THERMOSTAT__MAX__]: { msg: 'INVALID', icon: PowerOff },
};
