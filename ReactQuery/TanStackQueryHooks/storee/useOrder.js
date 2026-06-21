import {
  createstoreorder,
  getstoreorders,
  getstorecustomerorderbystoreid,
  deleteOrderbycustomer,
  deleteOrderByOwner,
} from '../../../API/storee/store_order';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => createstoreorder(payload),
    onSuccess: data => {
      console.log('Order created successfully ✅', data);
      queryClient.invalidateQueries({queryKey: ['orders']});
    },
    onError: error => {
      console.log('Order creation failed ❌', error);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => deleteOrderbycustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['getCart']});
    },
    onError: error => {
      console.error('Remove from cart error:', error);
    },
  });
};

export const useRemoveOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => deleteOrderByOwner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['getCart']});
    },
    onError: error => {
      console.error('Remove from cart error:', error);
    },
  });
};

{
  /* get order by owner*/
}

export const useGetOrders = ({storeId, enabled}) => {
  return useQuery({
    queryKey: ['orders', storeId],
    queryFn: async () => {
      console.log('🌐 order — cache miss, calling API...'); // Only logs when API is actually called
      const result = await getstoreorders(storeId);
      console.log('✅ order — API response received:', result);
      return result;
    },
    // enabled: !!storeId, // ✅ Don't fetch if storeId is undefined/null
     enabled: !!storeId && enabled,  // ← both conditions must be true
    gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
  });
};

export const useGetCustomerOrdersbyStoreId = ({
  page = 1,
  limit = 10,
  status,
  storeId,
  enabled 
} = {}) => {
  return useQuery({
    queryKey: ['customerorders', page, limit, status, storeId], // ← all params in key so cache is unique per combination
    queryFn: async () => {
      console.log('🌐 customerorder — cache miss, calling API...');
      const result = await getstorecustomerorderbystoreid(
        storeId,
        page,
        limit,
        status,
      );
      console.log('✅ customerorder — API response received:', result);
      return result;
    },
    // enabled: true, // ← removed !!storeId since storeId is now optional
     enabled: !!storeId && enabled,  // ← both conditions must be true
    gcTime: 0,
  });
};

{
  /* get order by customer*/
}

// export const useGetCustomerOrders = storeId => {
//   return useQuery({
//     queryKey: ['customerorders', storeId],
//     queryFn: async () => {
//       console.log('🌐 customerorder — cache miss, calling API...'); // Only logs when API is actually called
//       const result = await getstorecustomerorder(storeId);
//       console.log('✅ customerorder — API response received:', result);
//       return result;
//     },
//     enabled: !!storeId, // ✅ Don't fetch if storeId is undefined/null
//     gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
//   });
// };
