import api from '../services/apiservice';

// @route   POST /api/v1/devices/store
// @desc    Store or update device info (call once on first launch / login)
export const storeDeviceInfo = (deviceData) =>
  api.post(`/devices/store`, {
    deviceId: deviceData.deviceId,
    deviceName: deviceData.deviceName,
    brand: deviceData.brand,
    model: deviceData.model,
    systemName: deviceData.systemName,
    systemVersion: deviceData.systemVersion,
    totalRAM: deviceData.totalRAM,
    totalStorage: deviceData.totalStorage,
    appVersion: deviceData.appVersion,
    isAuth :deviceData.isAuth,
  });

// @route   GET /api/v1/devices/user
// @desc    Get all devices registered for the logged-in user
export const getUserDevices = () =>
  api.get(`/devices/user`);

// @route   GET /api/v1/devices/:deviceId
// @desc    Get a single device by deviceId (must belong to logged-in user)
export const getDeviceById = (deviceId) =>
  api.get(`/devices/${deviceId}`);

// @route   PUT /api/v1/devices/:deviceId/health
// @desc    Send a health snapshot (RAM/storage/battery) for a device
export const updateDeviceHealth = (deviceId, healthData) =>
  api.put(`/devices/${deviceId}/health`, {
    freeRAM: healthData.freeRAM,
    freeStorage: healthData.freeStorage,
    batteryLevel: healthData.batteryLevel,
    isCharging: healthData.isCharging,
  });

  export const linkUserToDevice = (id) =>
  api.patch(`/devices/${id}/link-user`);