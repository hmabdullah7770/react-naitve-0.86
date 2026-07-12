import {getallPost,SearchPost} from '../../API/post';
import { useQuery, useInfiniteQuery,useQueryClient  } from '@tanstack/react-query';

export const useGetAllPost = (
  limit,
  cursor,
  userId,
  category,
  sortBy,
  sortType,
  includeCount,
  options = {}
) => {
  console.log('🔵 [useGetAllPost] Hook called with params:', {
    limit,
    cursor,
    userId,
    category,
    sortBy,
    sortType,
    includeCount,
    enabled: options.enabled
  });

  const result = useQuery({
    queryKey: ['getallPost', limit, cursor, userId, category, sortBy, sortType, includeCount],
    queryFn: async () => {
      console.log('🚀 [useGetAllPost] API CALL STARTED - Fetching posts...');
      console.log('📤 Request params:', { limit, cursor, userId, category, sortBy, sortType, includeCount });
      
      try {
        const response = await getallPost(limit, cursor, userId, category, sortBy, sortType, includeCount);
        console.log('✅ [useGetAllPost] API CALL SUCCESS');
        console.log('📥 Full Response:', response);
        console.log('📦 Response data:', response?.data);
        console.log('🎯 Posts array:', response?.data?.data?.posts);
        console.log('📊 Posts count:', response?.data?.data?.posts?.length || 0);
        console.log('🔢 Total count:', response?.data?.data?.totalCount);
        console.log('➡️ Next cursor:', response?.data?.data?.nextCursor);
        return response;
      } catch (error) {
        console.log('❌ [useGetAllPost] API CALL FAILED');
        console.log('💥 Error:', error);
        console.log('💥 Error response:', error?.response);
        console.log('💥 Error message:', error?.message);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - caches for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keeps cache for 10 minutes (was cacheTime in v4)
    ...options, // Spread any additional options (like enabled)
  });

  // Log the query result state
  console.log('📊 [useGetAllPost] Query State:', {
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    isSuccess: result.isSuccess,
    dataExists: !!result.data,
    enabled: options.enabled
  });

  return result;
};


export const useSearchPost = (
  { search, adminpassword, addcomment, filtername, category, size = 10 } = {},
  options = {}
) => {
  console.log('🔵 [useSearchPost] hook called →', { search, addcomment, filtername, category, size, enabled: options.enabled ?? true });

  return useInfiniteQuery({
    queryKey: ['searchPost', search, adminpassword, addcomment, filtername, category, size],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🚀 [useSearchPost] queryFn firing → search:', search, '| from (offset):', pageParam);
      try {
        const response = await SearchPost({
          search,
          adminpassword,
          from: pageParam,
          addcomment,
          filtername,
          category,
          size,
        });
        console.log('✅ [useSearchPost] raw response:', JSON.stringify(response.data, null, 2));
        console.log('✅ [useSearchPost] posts:', response.data?.messege?.posts);
        return response.data;
      } catch (error) {
        console.error('❌ [useSearchPost] API error → search:', search, '| error:', error.message);
        throw error;
      }
    },
    enabled: !!search && (options.enabled ?? true),
    refetchOnMount: true,
    getNextPageParam: (lastPage, allPages) => {
      const posts = lastPage?.messege?.posts || [];
      console.log('[useSearchPost] getNextPageParam → posts returned:', posts.length, '| size:', size);
      // if fewer posts came back than requested, there's no more data
      if (posts.length < size) return undefined;
      // next offset = total posts fetched so far
      const totalFetched = allPages.reduce((sum, page) => sum + (page?.messege?.posts?.length || 0), 0);
      return totalFetched;
    },
    select: (data) => {
      const result = [];
      const pages = data.pages;
      console.log('[useSearchPost] select → total pages:', pages.length);
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
        console.log(`[useSearchPost] select → page ${i} posts count:`, posts?.length ?? 0);
        if (posts && Array.isArray(posts)) {
          for (let j = 0; j < posts.length; j++) {
            result.push(posts[j]);
          }
        }
      }
      console.log('[useSearchPost] select → final result count:', result.length);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'online',
    keepPreviousData: true,
    maxPages: 10,
  });
};



// export const useGetAllPost = (limit,cursor,userId,category,sortBy,sortType,includeCount) => { {
//   return useQuery(
//     ['getallPost', limit,cursor,userId,category,sortBy,sortType,includeCount],
//     () => getallPost(limit,cursor,userId,category,sortBy,sortType,includeCount),
//     {
//       keepPreviousData: true,
//       staleTime: 5 * 60 * 1000, // 5 minutes
//     }
//   );
// }};
