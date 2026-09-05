/**
 * deviceInfoService.ts
 * -----------------------------------------------------------------------
 * Custom wrapper around `react-native-device-info` that returns ONLY the
 * fields your backend (Device model + device.controller.js) expects,
 * already shaped as ready-to-POST payloads.
 *
 * Why a wrapper instead of calling DeviceInfo directly everywhere?
 *  - Single source of truth for field names -> matches your Mongoose schema
 *  - Handles iOS/Android differences (fingerprint & apiLevel are Android-only)
 *  - Handles the "freeRAM" gap (no native getFreeMemory() exists — derived)
 *  - Easy to swap the underlying library later without touching your app code
 *
 * Install once:
 *   npm i react-native-device-info
 *   cd ios && pod install
 * -----------------------------------------------------------------------
 */

import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// -----------------------------------------------------------------------
// TYPES — match your Device model / device.controller.js exactly
// -----------------------------------------------------------------------

/** Matches the body expected by POST /api/v1/devices/store */
export interface DeviceRegistrationPayload {
  deviceId: string;
  deviceName: string;
  brand: string;
  model: string;
  systemName: string;
  systemVersion: string;
  totalRAM: number;
  totalStorage: number;
  appVersion: string;
isAuth: boolean;              // ← ADD THIS
}

/** Matches the body expected by PUT /api/v1/devices/:deviceId/health */
export interface DeviceHealthPayload {
  freeRAM: number;
  freeStorage: number;
  batteryLevel: number;
  isCharging: boolean;
}

/** Matches the `deviceMetadata` sub-object in your Device model */
export interface DeviceMetadata {
  manufacturer: string;
  fingerprint: string | null;
  apiLevel: number | null;
  carrier: string;
  hasNotch: boolean;
  isTablet: boolean;
  isEmulator: boolean;
}

/** Full payload: registration fields + buildNumber + deviceMetadata */
export interface FullDeviceInfoPayload extends DeviceRegistrationPayload {
  buildNumber: string;
  deviceMetadata: DeviceMetadata;
}

// -----------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------

/**
 * Matches the body expected by:
 *   POST /api/v1/devices/store   (storeDeviceInfo controller)
 */
export async function getDeviceRegistrationPayload(
   isAuth: boolean,              // ← ADD THIS PARAM
): Promise<DeviceRegistrationPayload> {
      // ← ADD THIS PARAM
  const [deviceId, deviceName, totalRAM, totalStorage] = await Promise.all([
    DeviceInfo.getUniqueId(),
    DeviceInfo.getDeviceName(),
    DeviceInfo.getTotalMemory(),
    DeviceInfo.getTotalDiskCapacity(),
  ]);

  return {
    deviceId,
    deviceName,
    brand: DeviceInfo.getBrand(),
    model: DeviceInfo.getModel(),
    systemName: DeviceInfo.getSystemName(),
    systemVersion: DeviceInfo.getSystemVersion(),
    totalRAM,
    totalStorage,
    appVersion: DeviceInfo.getVersion(),
    isAuth,                     // ← ADD THIS
  };
}

/**
 * Matches the body expected by:
 *   PUT /api/v1/devices/:deviceId/health   (updateDeviceHealth controller)
 *
 * Note: There is no native "free RAM" API on iOS or Android, so it is
 * derived as (totalMemory - usedMemory). This is an approximation, not
 * an exact OS-level free-memory figure.
 */
export async function getDeviceHealthPayload(): Promise<DeviceHealthPayload> {
  const [totalMemory, usedMemory, freeStorage, batteryLevel, isCharging] =
    await Promise.all([
      DeviceInfo.getTotalMemory(),
      DeviceInfo.getUsedMemory(),
      DeviceInfo.getFreeDiskStorage(),
      DeviceInfo.getBatteryLevel(),
      DeviceInfo.isBatteryCharging(),
    ]);

  return {
    freeRAM: totalMemory - usedMemory,
    freeStorage,
    batteryLevel,
    isCharging,
  };
}

/**
 * Matches the `deviceMetadata` sub-object in your Device model:
 *   { manufacturer, fingerprint, apiLevel, carrier, hasNotch, isTablet, isEmulator }
 *
 * `fingerprint` and `apiLevel` are Android-only. On iOS they come back
 * as `null` on purpose — your schema does not mark them as required,
 * so this is safe to store as-is.
 */
export async function getDeviceMetadata(): Promise<DeviceMetadata> {
  const isAndroid = Platform.OS === 'android';

  const [manufacturer, carrier, isEmulator, fingerprint, apiLevel] =
    await Promise.all([
      DeviceInfo.getManufacturer(),
      DeviceInfo.getCarrier(),
      DeviceInfo.isEmulator(),
      isAndroid ? DeviceInfo.getFingerprint() : Promise.resolve(null),
      isAndroid ? DeviceInfo.getApiLevel() : Promise.resolve(null),
    ]);

  return {
    manufacturer,
    fingerprint,
    apiLevel,
    carrier,
    hasNotch: DeviceInfo.hasNotch(),
    isTablet: DeviceInfo.isTablet(),
    isEmulator,
  };
}

/**
 * Convenience: builds the FULL registration payload including
 * deviceMetadata + buildNumber, in case you want to send everything
 * in one call on first app launch.
 */
export async function getFullDeviceInfoPayload( isAuth: boolean): Promise<FullDeviceInfoPayload> {
  const [registration, metadata] = await Promise.all([
    getDeviceRegistrationPayload(isAuth),
    getDeviceMetadata(),
  ]);

  return {
    ...registration,
    buildNumber: DeviceInfo.getBuildNumber(),
    deviceMetadata: metadata,
  };
}