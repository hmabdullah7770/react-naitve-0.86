import { useInfiniteQuery } from '@tanstack/react-query';
import { GetTopStores } from '../../API/storee/store_createstore';

// ✅ Optimized top stores infinite query hook
export const useGetTopStore = (category = 'All', limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['topStores', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await GetTopStores(category, limit, pageParam);
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
    // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stores = page?.data?.Store || page?.Store || [];
        
        if (stores && Array.isArray(stores)) {
          // ✅ Push individual items instead of spread operator
          for (let j = 0; j < stores.length; j++) {
            result.push(stores[j]);
          }
        }
      }
      
      return result;
    },
    staleTime: 30 * 1000, // ✅ 30 seconds - stores change less frequently than posts
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1, // ✅ Reduce retries to fail faster
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    networkMode: 'online',
    keepPreviousData: true, // ✅ Smooth transitions between pages
    maxPages: 10, // ✅ Limit cached pages to prevent memory bloat
  });
};