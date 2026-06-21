import {
  getStoreById,
  getStoreByIds,
} from '../../../API/storee/store_createstore';
import {useQuery} from '@tanstack/react-query';

export const useGetStoreById = storeId => {
  return useQuery({
    queryKey: ['getStoreById', storeId],
    queryFn: async () => {
      console.log('🌐 useGetStoreById — cache miss, calling API...'); // Only logs when API is actually called
      const result = await getStoreById(storeId);
      console.log('✅ useGetStoreById — API response received:', result);
      return result;
    },
    enabled: !!storeId, // ✅ Don't fetch if storeId is undefined/null
    gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
  });
};

export const useGetStoreIds = (storeIds, options = {}) => {
  return useQuery({
    queryKey: [
      'getstorebyIds',
      Array.isArray(storeIds) ? [...storeIds].sort() : [],
    ],
    queryFn: async () => {
      console.log('🌐 useGetStoreIds — calling API with:', storeIds);
      const result = await getStoreByIds(storeIds);
      console.log('✅ useGetStoreIds — response:', result);
      return result;
    },
    enabled:
      Array.isArray(storeIds) &&
      storeIds.length > 0 &&
      (options.enabled ?? true), // ✅
    gcTime: 0,
  });
};

// import {getStoreById} from '../../../API/storee/store_createstore';
// import {useQuery} from '@tanstack/react-query';

// export const useGetStoreById = (storeId) => {
//   return useQuery({
//     queryKey: ['getStoreById', storeId],
//     queryFn: () => getStoreById(storeId),
//   });
// };

//     queryFn: async () => {
//       console.log('🌐 useGetUser — cache miss, calling API...'); // Only logs when API is actually called
//       const result = await getuser();
//       console.log('✅ useGetUser — API response received:', result);
//       return result;
//     },
