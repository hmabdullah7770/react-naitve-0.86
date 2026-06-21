import {
  addtocart,
  getcart,
  removefromcart,
  clearcart,
} from '../../../API/storee/store_cart';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

export const useGetCart = (userId, storeId) => {
  return useQuery({
    queryKey: ['getCart', userId, storeId],
    queryFn: async () => {
      console.log('🛒 useGetCart — calling API...', {userId, storeId});
      try {
        const result = await getcart(userId, storeId);
        console.log('✅ useGetCart — response:', result);
        return result;
      } catch (error) {
        console.log(
          '❌ useGetCart — ERROR:',
          error?.response?.data ?? error?.message ?? error,
        );
        throw error; // re-throw so React Query handles it
      }
    },
    enabled: !!userId && !!storeId,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => addtocart(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['getCart']});
         console.log('✅ useAddToCart — response:',data);
          
        },
    onError: error => {
      console.error('Add to cart error:', error);
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => removefromcart(payload),
    onSuccess: response => {
      queryClient.invalidateQueries({queryKey: ['getCart']});
      console.log('✅ Remove from cart — response:', response?.data);
    },
    onError: error => {
      console.error('Remove from cart error:', error);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => clearcart(payload),
    onSuccess: response => {
      queryClient.invalidateQueries({queryKey: ['getCart']});
      console.log('✅ Clear cart — response:', response?.data);
    },
    onError: error => {
      console.error('Clear cart error:', error);
    },
  });
};
