import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addbanner, deletebanner, getallbanner } from '../../API/banner'; // adjust path to your api file

// Query key — keep it centralized so invalidation stays consistent
export const BANNER_QUERY_KEY = ['banners'];

// GET all banners
export const useGetAllBanner = () => {
  return useQuery({
    queryKey: BANNER_QUERY_KEY,
    queryFn: async () => {
      console.log('🌐 useGetAllBanner — cache miss, calling API...');
      const result = await getallbanner();
      console.log('✅ useGetAllBanner — API response received:', result);
      return result;
    },
  });
};

// ADD banner
export const useAddBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bannerImage, bannerbutton }) => {
      console.log('🌐 useAddBanner — calling API with:', { bannerImage, bannerbutton });
      return addbanner(bannerImage, bannerbutton);
    },
    onSuccess: (data) => {
      console.log('✅ useAddBanner — success, response:', data);
      queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
    },
    onError: (error) => {
      console.log('❌ useAddBanner — error:', error);
    },
  });
};

// DELETE banner
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerId) => {
      console.log('🌐 useDeleteBanner — calling API with bannerId:', bannerId);
      return deletebanner(bannerId);
    },
    onSuccess: (data) => {
      console.log('✅ useDeleteBanner — success, response:', data);
      queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
    },
    onError: (error) => {
      console.log('❌ useDeleteBanner — error:', error);
    },
  });
};
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { addbanner, deletebanner, getallbanner } from '../../API/banner'; // adjust path to your api file

// // Query key — keep it centralized so invalidation stays consistent
// export const BANNER_QUERY_KEY = ['banners'];

// // GET all banners
// export const useGetAllBanner = () => {
//   return useQuery({
//     queryKey: BANNER_QUERY_KEY,
//     queryFn: getallbanner,
//   });
// };

// // ADD banner
// export const useAddBanner = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ bannerImage, bannerbutton }) => addbanner(bannerImage, bannerbutton),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
//     },
//   });
// };

// // DELETE banner
// export const useDeleteBanner = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (bannerId) => deletebanner(bannerId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
//     },
//   });
// };