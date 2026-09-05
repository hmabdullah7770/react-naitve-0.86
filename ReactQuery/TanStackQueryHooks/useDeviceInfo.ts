import {
  storeDeviceInfo,
  getUserDevices,
  getDeviceById,
  updateDeviceHealth,
   linkUserToDevice,
} from '../../API/deviceinfo';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  DeviceRegistrationPayload,
  DeviceHealthPayload,
} from '../../services/deviceInfoService';
import { AxiosError } from 'axios';   // ← ADD THIS IMPORT

// -----------------------------------------------------------------------
// STORE / UPDATE DEVICE INFO  (POST /devices/store)
// Call this once on every app boot — no auth required on this route
// -----------------------------------------------------------------------
export const useStoreDeviceInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceData: DeviceRegistrationPayload) =>
      storeDeviceInfo(deviceData),
    onSuccess: (data) => {
      console.log('Device info stored successfully', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error: AxiosError) => {
      // console.error('Store device info error:', error);
       console.error('Store device info error:', error);
  console.error('Server response data:', error?.response?.data);   // ← ADD THIS
  console.error('Status code:', error?.response?.status);          // ← ADD THIS
    },
  });
};

// -----------------------------------------------------------------------
// LINK USER TO DEVICE  (PATCH /devices/:deviceId/link-user)
// Call once right after login, when a valid JWT is available
// -----------------------------------------------------------------------
export const useLinkUserToDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => linkUserToDevice(id),
    onSuccess: (data) => {
      console.log('User linked to device successfully', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: (error: Error) => {
      console.error('Link user to device error:', error);
    },
  });
};

// -----------------------------------------------------------------------
// GET ALL DEVICES FOR LOGGED-IN USER  (GET /devices/user)
// -----------------------------------------------------------------------
export const useUserDevices = (
  options: Partial<UseQueryOptions> = {},
) => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: getUserDevices,
    ...options,
  });
};

// -----------------------------------------------------------------------
// GET SINGLE DEVICE BY ID  (GET /devices/:deviceId)
// -----------------------------------------------------------------------
export const useDeviceById = (
  deviceId: string | undefined,
  options: Partial<UseQueryOptions> = {},
) => {
  return useQuery({
    queryKey: ['devices', deviceId],
    queryFn: () => getDeviceById(deviceId as string),
    enabled: !!deviceId,
    ...options,
  });
};

// -----------------------------------------------------------------------
// UPDATE DEVICE HEALTH  (PUT /devices/:deviceId/health)
// Call periodically, e.g. on AppState -> 'active'
// -----------------------------------------------------------------------
interface UpdateDeviceHealthVariables {
  deviceId: string;
  healthData: DeviceHealthPayload;
}

export const useUpdateDeviceHealth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, healthData }: UpdateDeviceHealthVariables) =>
      updateDeviceHealth(deviceId, healthData),
    onSuccess: (data, variables) => {
      console.log('Device health updated successfully', data);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({
        queryKey: ['devices', variables.deviceId],
      });
    },
    onError: (error: Error) => {
      console.error('Update device health error:', error);
    },
  });
};


// import {
//   storeDeviceInfo,
//   getUserDevices,
//   getDeviceById,
//   updateDeviceHealth,
// } from '../../API/deviceinfo';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// // -----------------------------------------------------------------------
// // STORE / UPDATE DEVICE INFO  (POST /devices/store)
// // Call this once on first launch / after login
// // -----------------------------------------------------------------------
// export const useStoreDeviceInfo = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (deviceData) => storeDeviceInfo(deviceData),
//     onSuccess: (data) => {
//       console.log('Device info stored successfully', data);
//       queryClient.invalidateQueries({ queryKey: ['devices'] });
//     },
//     onError: (error) => {
//       console.error('Store device info error:', error);
//     },
//   });
// };

// // -----------------------------------------------------------------------
// // GET ALL DEVICES FOR LOGGED-IN USER  (GET /devices/user)
// // -----------------------------------------------------------------------
// export const useUserDevices = (options = {}) => {
//   return useQuery({
//     queryKey: ['devices'],
//     queryFn: getUserDevices,
//     ...options,
//   });
// };

// // -----------------------------------------------------------------------
// // GET SINGLE DEVICE BY ID  (GET /devices/:deviceId)
// // -----------------------------------------------------------------------
// export const useDeviceById = (deviceId, options = {}) => {
//   return useQuery({
//     queryKey: ['devices', deviceId],
//     queryFn: () => getDeviceById(deviceId),
//     enabled: !!deviceId,
//     ...options,
//   });
// };

// // -----------------------------------------------------------------------
// // UPDATE DEVICE HEALTH  (PUT /devices/:deviceId/health)
// // Call periodically e.g. on AppState -> 'active'
// // -----------------------------------------------------------------------
// export const useUpdateDeviceHealth = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ deviceId, healthData }) =>
//       updateDeviceHealth(deviceId, healthData),
//     onSuccess: (data, variables) => {
//       console.log('Device health updated successfully', data);
//       queryClient.invalidateQueries({ queryKey: ['devices'] });
//       queryClient.invalidateQueries({
//         queryKey: ['devices', variables.deviceId],
//       });
//     },
//     onError: (error) => {
//       console.error('Update device health error:', error);
//     },
//   });
// };