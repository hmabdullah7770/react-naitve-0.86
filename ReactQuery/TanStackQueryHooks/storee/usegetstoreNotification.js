import {
  togglegetstornotfication,
  getstoresubscriberlist,
} from '../../../API/storee/store_get_notification'; // adjust path as needed
import {useQuery, useMutation} from '@tanstack/react-query';

export const useToggleStoreNotification = () => {
  return useMutation({
    mutationFn: async (storeId) => {
      console.log('🌐 useToggleStoreNotification — calling API with storeId:', storeId);
      const result = await togglegetstornotfication(storeId);
      console.log('✅ useToggleStoreNotification — API response received:', result);
      return result;
    },
  });
};

export const useGetStoreSubscriberList = (storeId) => {
  return useQuery({
    queryKey: ['getStoreSubscriberList', storeId],
    queryFn: async () => {
      console.log('🌐 useGetStoreSubscriberList — cache miss, calling API with storeId:', storeId);
      const result = await getstoresubscriberlist(storeId);
      console.log('✅ useGetStoreSubscriberList — API response received:', result);
      return result;
    },
    enabled: !!storeId,
    gcTime: 0,
  });
};