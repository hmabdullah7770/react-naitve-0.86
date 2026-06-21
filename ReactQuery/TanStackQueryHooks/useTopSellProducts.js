import { useInfiniteQuery } from '@tanstack/react-query';
import { GetTopProducts } from '../../API/storee/store_product';

export const useTopSellProducts = (category = 'All', limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['topProducts', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await GetTopProducts(category, limit, pageParam);
        if (__DEV__) console.log('TopProducts API Response:', JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (error) {
        if (__DEV__) console.error('API Error:', category, error.message);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.currentPage + 1;
    },
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const products = page?.data?.products || page?.products || [];
        
        if (products && Array.isArray(products)) {
          for (let j = 0; j < products.length; j++) {
            result.push(products[j]);
          }
        }
      }

      if (__DEV__) console.log('TopProducts Extracted:', result.length, 'items');
      return result;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    networkMode: 'online',
    keepPreviousData: true,
    maxPages: 10,
  });
};

// import { useInfiniteQuery } from '@tanstack/react-query';
// import { GetTopProducts } from '../../API/storee/store_product';

// // ✅ Optimized top products infinite query hook
// export const useTopSellProducts = (category = 'All', limit = 20) => {
//   return useInfiniteQuery({
//     queryKey: ['topProducts', category, limit],
//     queryFn: async ({ pageParam = 1 }) => {
//       try {
//         const response = await GetTopProducts(category, limit, pageParam);
//         return response.data;
//       } catch (error) {
//         if (__DEV__) console.error('API Error:', category, error.message);
//         throw error;
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.currentPage + 1;
//     },
//     // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
//     select: (data) => {
//       const result = [];
//       const pages = data.pages;
      
//       for (let i = 0; i < pages.length; i++) {
//         const page = pages[i];
//         const products = page?.data?.products || page?.products || [];
        
//         if (products && Array.isArray(products)) {
//           // ✅ Push individual items instead of spread operator
//           for (let j = 0; j < products.length; j++) {
//             result.push(products[j]);
//           }
//         }
//       }
      
//       return result;
//     },
//     staleTime: 30 * 1000, // ✅ 30 seconds - products change less frequently than posts
//     gcTime: 5 * 60 * 1000, // 5 minutes cache
//     retry: 1, // ✅ Reduce retries to fail faster
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: true,
//     refetchOnMount: false,
//     networkMode: 'online',
//     keepPreviousData: true, // ✅ Smooth transitions between pages
//     maxPages: 10, // ✅ Limit cached pages to prevent memory bloat
//   });
// };