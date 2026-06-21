import {
  getstoreproduct,
  getproductbyId,
  getproductbyIds,
  deleteProduct,
  addproduct,
  updateProduct
} from '../../../API/storee/store_product';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export const useGetStoreProducts = storeId => {
  return useQuery({
    queryKey: ['getStoreProducts', storeId],
    queryFn: async () => {
      console.log('🌐 useGetStoreProducts — cache miss, calling API...'); // Only logs when API is actually called
      const result = await getstoreproduct(storeId);
      console.log('✅ useGetStoreProducts — API response received:', result);
      return result;
    },
    enabled: !!storeId, // ✅ Don't fetch if storeId is undefined/null
    gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
  });
};

export const useGetProductsId = productId => {
  return useQuery({
    queryKey: ['getproductbyId', productId],
    queryFn: async () => {
      console.log('🌐 useGetStoreProducts — cache miss, calling API...'); // Only logs when API is actually called
      const result = await getproductbyId(productId);
      console.log('✅ useGetStoreProducts — API response received:', result);
      return result;
    },
    enabled: !!productId, // ✅ Don't fetch if storeId is undefined/null
    gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
  });
};

export const useGetProductsIds = (productIds,options = {}) => {
  return useQuery({
    queryKey: [
      'getproductbyIds',
      Array.isArray(productIds) ? [...productIds].sort() : [],
    ],
    queryFn: async () => {
      console.log('🌐 useGetProductsIds — calling API with:', productIds);
      const result = await getproductbyIds(productIds);
      console.log('✅ useGetProductsIds — response:', result);
      return result;
    },
    enabled:
      Array.isArray(productIds) &&
      productIds.length > 0 &&
      (options.enabled ?? true), // ✅
    gcTime: 0,
  });
};


export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, productId }) => {
      console.log('🌐 useDeleteProduct — calling API with:', { storeId, productId });
      const result = await deleteProduct(storeId, productId);
      console.log('✅ useDeleteProduct — API response received:', result);
      return result;
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ['getStoreProducts', storeId] });
    },
  });
};



export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, productData }) => {
      console.log('🌐 useAddProduct — calling API with:', { storeId, productData });
      const result = await addproduct(storeId, productData);
      console.log('✅ useAddProduct — API response received:', result);
      return result;
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ['getStoreProducts', storeId] });
      console.log('✅ useAddProduct — cache invalidated for storeId:', storeId);
    },
    onError: (error) => {
      console.error('❌ useAddProduct — error:', error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, productId, productData }) => {
      console.log('🌐 useUpdateProduct — calling API with:', { storeId, productId, productData });
      const result = await updateProduct(storeId, productId, productData);
      console.log('✅ useUpdateProduct — API response received:', result);
      return result;
    },
    onSuccess: (_, { storeId, productId }) => {
      queryClient.invalidateQueries({ queryKey: ['getStoreProducts', storeId] });
      queryClient.invalidateQueries({ queryKey: ['getproductbyId', productId] });
      console.log('✅ useUpdateProduct — cache invalidated');
    },
    onError: (error) => {
      console.error('❌ useUpdateProduct — error:', error);
    },
  });
};