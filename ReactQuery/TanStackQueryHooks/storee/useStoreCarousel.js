import {getstorecarousel,createstorecarousel,deletestorecarousel} from '../../../API/storee/store_carousel';
// import {useQuery} from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useGetStoreCarousel = storeId => {
  return useQuery({
    queryKey: ['getStoreCarousel', storeId],
    queryFn: async () => {
      console.log('🌐 useGetStoreCarousel — cache miss, calling API...'); // Only logs when API is actually called
      const result = await getstorecarousel(storeId);
      console.log('✅ useGetStoreCarousel — API response received:', result);
      return result;
    },
    enabled: !!storeId, // ✅ Don't fetch if storeId is undefined/null
    gcTime: 0, // ✅ This one line is the only thing you need — dumps cache on leave
  });
};


// export const useCreateStoreCarousel = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       images, carouselname, title, description, buttonText, buttonTextColor,
//       buttonHoverTextColor, buttonBackground, buttonHoverBackground, buttonShadow,
//       buttonShadowColor, buttonBorder, buttonBorderColor, titleColor, tileBackground,
//       descriptionColor, discriptionBackgroundColor, fontFamily, category, storeId
//     }) =>
//       createstorecarousel(
//         images, carouselname, title, description, buttonText, buttonTextColor,
//         buttonHoverTextColor, buttonBackground, buttonHoverBackground, buttonShadow,
//         buttonShadowColor, buttonBorder, buttonBorderColor, titleColor, tileBackground,
//         descriptionColor, discriptionBackgroundColor, fontFamily, category, storeId
//       ),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['getStoreCarousel', variables.storeId] });
//       console.log('✅ useCreateStoreCarousel — carousel created, cache invalidated');
//     },
//     onError: (error) => {
//       console.error('❌ useCreateStoreCarousel — error:', error);
//     },
//   });
// };



export const useCreateStoreCarousel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, storeId }) => {
      console.log('🌐 useCreateStoreCarousel — calling API with storeId:', storeId);
      const result = await createstorecarousel(storeId, formData);
      console.log('✅ useCreateStoreCarousel — API response received:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['getStoreCarousel', variables.storeId] });
      console.log('✅ useCreateStoreCarousel — cache invalidated for storeId:', variables.storeId);
    },
    onError: (error) => {
      console.error('❌ useCreateStoreCarousel — error:', error);
    },
  });
};

export const useDeleteStoreCarousel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, carouselId }) => {
      console.log('🌐 useDeleteStoreCarousel — calling API with storeId:', storeId, 'carouselId:', carouselId);
      const result = await deletestorecarousel(storeId, carouselId);
      console.log('✅ useDeleteStoreCarousel — API response received:', result); // ← added
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['getStoreCarousel', variables.storeId] });
      console.log('✅ useDeleteStoreCarousel — carousel deleted, cache invalidated');
    },
    onError: (error) => {
      console.error('❌ useDeleteStoreCarousel — error:', error);
    },
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
