import { ProjectConfig } from '@/project.config';
import * as ExpoDevice from 'expo-device';
import { BleCore } from './core/bleCore';
import { BleCoreMock } from './core/bleCore.mock';

const isSimulator = !ExpoDevice.isDevice;
const forceMock = ProjectConfig.hardware.useMockService;
const useMock = isSimulator || forceMock;

export const bleCore = useMock ? new BleCoreMock() : new BleCore();
