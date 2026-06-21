import {
  getstoreRating,
  getuselist,
  addStoreRating,
  deletestorerating,
} from '../../../API/storee/store_rating'; // adjust path as needed
import {useQuery, useMutation} from '@tanstack/react-query';

export const useGetStoreRating = (storeId) => {
  return useQuery({
    queryKey: ['getStoreRating', storeId],
    queryFn: async () => {
      console.log('🌐 useGetStoreRating — cache miss, calling API with storeId:', storeId);
      const result = await getstoreRating(storeId);
      console.log('✅ useGetStoreRating — API response received:', result);
      return result;
    },
    enabled: !!storeId,
    gcTime: 0,
  });
};

export const useGetRatingList = (storeId) => {
  return useQuery({
    queryKey: ['getRatingList', storeId],
    queryFn: async () => {
      console.log('🌐 useGetRatingList — cache miss, calling API with storeId:', storeId);
      const result = await getuselist(storeId);
      console.log('✅ useGetRatingList — API response received:', result);
      return result;
    },
    enabled: !!storeId,
    gcTime: 0,
  });
};

export const useAddStoreRating = () => {
  return useMutation({
    mutationFn: async ({rating, storeId, review}) => {
      console.log('🌐 useAddStoreRating — calling API with:', {rating, storeId, review});
      const result = await addStoreRating(rating, storeId, review);
      console.log('✅ useAddStoreRating — API response received:', result);
      return result;
    },
  });
};

export const useDeleteStoreRating = () => {
  return useMutation({
    mutationFn: async (storeId) => {
      console.log('🌐 useDeleteStoreRating — calling API with storeId:', storeId);
      const result = await deletestorerating(storeId);
      console.log('✅ useDeleteStoreRating — API response received:', result);
      return result;
    },
  });
};