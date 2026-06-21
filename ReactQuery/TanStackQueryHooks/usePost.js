import {getallPost} from '../../API/post';
import { useQuery } from '@tanstack/react-query';

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
