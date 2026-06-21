import {useInfiniteQuery} from '@tanstack/react-query';
import {filtercategouryposts} from '../../API/categoury';
import React from 'react';

export const useUserProfileFeed = (
  userId,
  category = 'All',
  limit = 50,
  options = {},
) => {
  const query = useInfiniteQuery({
    queryKey: ['userProfile', userId, category, limit],
    queryFn: async ({pageParam}) => {
      const cursor = pageParam?.cursor || null;
      const direction = pageParam?.direction || 'older';

      console.log(
        '🚀 API CALL START for userId:',
        userId,
        '| Category:',
        category,
        '| Cursor:',
        cursor,
      );

      const response = await filtercategouryposts(
        category,
        limit,
        cursor,
        direction,
        userId,
      );

      console.log(
        '✅ API RESPONSE RECEIVED for userId:',
        userId,
        '| Posts count:',
        response.data?.messege?.posts?.length || 0,
      );

      return response.data;
    },
    initialPageParam: {cursor: null, direction: 'older'},
    getNextPageParam: lastPage => {
      const nextCursor = lastPage?.messege?.pagination?.nextCursor;
      return nextCursor ? {cursor: nextCursor, direction: 'older'} : undefined;
    },
    getPreviousPageParam: firstPage => {
      const prevCursor = firstPage?.messege?.pagination?.previousCursor;
      return prevCursor ? {cursor: prevCursor, direction: 'newer'} : undefined;
    },

    // ⭐ ADD THESE TO REDUCE CACHE UPDATES
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    structuralSharing: true, // ⭐ Important!

    enabled: options.enabled !== undefined ? options.enabled : !!userId,
    retry: options.retry ?? 2,
    ...options,
  });

  // ⭐ Calculate allPosts - but keep it stable
  const allPosts = React.useMemo(() => {
    return query.data?.pages?.flatMap(page => page?.messege?.posts || []) || [];
  }, [query.data]);

  // ❌ REMOVE THIS - It logs on every render
  // React.useEffect(() => {
  //     if (query.data && !query.isFetching) {
  //         console.log('💾 DATA FROM CACHE...');
  //     }
  // }, [query.data, query.isFetching, userId, category, allPosts]);

  // ✅ RETURN A SIMPLE OBJECT - Don't wrap in useMemo
  return {
    data: allPosts,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchingPreviousPage: query.isFetchingPreviousPage,
    error: query.error,
    hasNextPage: query.hasNextPage,
    hasPreviousPage: query.hasPreviousPage,
    fetchNextPage: query.fetchNextPage,
    fetchPreviousPage: query.fetchPreviousPage,
    refetch: query.refetch,
  };
};

// new but use memo isssue

// import { useInfiniteQuery } from '@tanstack/react-query';
// import { filtercategouryposts } from '../../API/categoury';
// import React from 'react';

// /**
//  * User Profile Feed Hook
//  *
//  * @param {string} userId - The user ID whose posts to fetch
//  * @param {string} category - Category filter ('All' or specific category name)
//  * @param {number} limit - Number of posts per page (default: 50)
//  * @param {Object} options - Additional query options
//  */
// export const useUserProfileFeed = (userId, category = 'All', limit = 50, options = {}) => {
//     const query = useInfiniteQuery({
//         queryKey: ['userProfile', userId, category, limit],

//         queryFn: async ({ pageParam }) => {
//             const cursor = pageParam?.cursor || null;
//             const direction = pageParam?.direction || 'older';

//             console.log('🚀 API CALL START for userId:', userId, '| Category:', category, '| Cursor:', cursor);

//             const response = await filtercategouryposts(
//                 category,
//                 limit,
//                 cursor,
//                 direction,
//                 userId
//             );

//             console.log('✅ API RESPONSE RECEIVED for userId:', userId, '| Posts count:', response.data?.messege?.posts?.length || 0);

//             return response.data;
//         },

//         initialPageParam: { cursor: null, direction: 'older' },

//         getNextPageParam: (lastPage) => {
//             const nextCursor = lastPage?.messege?.pagination?.nextCursor;
//             return nextCursor ? { cursor: nextCursor, direction: 'older' } : undefined;
//         },

//         getPreviousPageParam: (firstPage) => {
//             const prevCursor = firstPage?.messege?.pagination?.previousCursor;
//             return prevCursor ? { cursor: prevCursor, direction: 'newer' } : undefined;
//         },

//         enabled: options.enabled !== undefined ? options.enabled : !!userId,
//         staleTime: options.staleTime || 5 * 60 * 1000,
//         gcTime: options.gcTime || 30 * 60 * 1000,
//         maxPages: options.maxPages || 3,
//         refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
//         refetchOnMount: options.refetchOnMount ?? false,
//         retry: options.retry ?? 2,
//         ...options,
//     });

//     const allPosts = React.useMemo(() => {
//         return query.data?.pages?.flatMap(page => page?.messege?.posts || []) || [];
//     }, [query.data]);

//     React.useEffect(() => {
//         if (query.data && !query.isFetching) {
//             console.log(
//                 '💾 DATA FROM CACHE for userId:', userId,
//                 '| Category:', category,
//                 '| Total posts:', allPosts.length
//             );
//         }
//     }, [query.data, query.isFetching, userId, category, allPosts]);

//     return React.useMemo(() => ({
//         data: allPosts,
//         isLoading: query.isLoading,
//         isFetching: query.isFetching,
//         isFetchingNextPage: query.isFetchingNextPage,
//         isFetchingPreviousPage: query.isFetchingPreviousPage,
//         error: query.error,
//         hasNextPage: query.hasNextPage,
//         hasPreviousPage: query.hasPreviousPage,
//         fetchNextPage: query.fetchNextPage,
//         fetchPreviousPage: query.fetchPreviousPage,
//         refetch: query.refetch,
//     }), [
//         allPosts,
//         query.isLoading,
//         query.isFetching,
//         query.isFetchingNextPage,
//         query.isFetchingPreviousPage,
//         query.error,
//         query.hasNextPage,
//         query.hasPreviousPage,
//         query.fetchNextPage,
//         query.fetchPreviousPage,
//         query.refetch,
//     ]);
// };

/**
 * Usage Examples:
 *
 * // Basic usage (default 50 posts per page)
 * const feed = useUserProfileFeed(userId);
 *
 * // Custom limit
 * const feed = useUserProfileFeed(userId, 'All', 100);
 *
 * // With custom options
 * const feed = useUserProfileFeed(userId, 'All', 50, {
 *   enabled: !!userId,
 *   staleTime: 10 * 60 * 1000,
 * });
 */

// new

/**
 * Usage Example:
 *
 * const {
 *   data: posts,
 *   isLoading,
 *   hasNextPage,
 *   fetchNextPage,
 * } = useUserProfileFeed(userId, 'All', 50);
 *
 * // In FlashList:
 * <FlashList
 *   data={posts}
 *   onEndReached={() => hasNextPage && fetchNextPage()}
 * />
 */

// import { useInfiniteQuery } from '@tanstack/react-query';
// import { filtercategouryposts } from '../../API/categoury';
// import React from 'react';

// /**
//  * User Profile Feed Hook
//  *
//  * @param {string} userId - The user ID whose posts to fetch
//  * @param {string} category - Category filter ('All' or specific category)
//  * @param {number} limit - Number of posts per page
//  *
//  * How caching works:
//  * - Each userId gets its own cache
//  * - When you visit User A → Cache: ['userProfile', 'userA', 'All', 10]
//  * - When you visit User A again → Uses cached data (NO API call)
//  * - When you visit User B → Cache: ['userProfile', 'userB', 'All', 10] → New API call
//  * - When you go back to User A → Uses cached data again (NO API call)
//  */
// export const useUserProfileFeed = (userId, category = 'All', limit = 10) => {
//     const query = useInfiniteQuery({
//         queryKey: ['userProfile', userId, category, limit],

//         queryFn: async ({ pageParam }) => {
//             const cursor = pageParam?.cursor || null;
//             const direction = pageParam?.direction || 'older';

//             console.log('🚀 API CALL START for userId:', userId, '| Category:', category, '| Cursor:', cursor);

//             const response = await filtercategouryposts(
//                 category,
//                 limit,
//                 cursor,
//                 direction,
//                 userId
//             );

//             console.log('✅ API RESPONSE RECEIVED for userId:', userId, '| Posts count:', response.data?.messege?.posts?.length || 0);

//             return response.data;
//         },

//         initialPageParam: { cursor: null, direction: 'older' },

//         getNextPageParam: (lastPage) => {
//             const nextCursor = lastPage?.messege?.pagination?.nextCursor;
//             return nextCursor ? { cursor: nextCursor, direction: 'older' } : undefined;
//         },

//         getPreviousPageParam: (firstPage) => {
//             const prevCursor = firstPage?.messege?.pagination?.previousCursor;
//             return prevCursor ? { cursor: prevCursor, direction: 'newer' } : undefined;
//         },

//         enabled: !!userId,
//         staleTime: 5 * 60 * 1000,  // Cache is fresh for 5 minutes
//         gcTime: 30 * 60 * 1000,    // Keep in memory for 30 minutes
//         maxPages: 3,
//     });

//     // Log when data comes from cache
//     React.useEffect(() => {
//         if (query.data && !query.isFetching) {
//             console.log('💾 DATA FROM CACHE for userId:', userId, '| Category:', category, '| Total posts:', allPosts.length);
//         }
//     }, [query.data, query.isFetching, userId, category,allPosts]);

//     const allPosts = query.data?.pages?.flatMap(page => page?.messege?.posts || []) || [];

//     return {
//         data: allPosts,
//         isLoading: query.isLoading,
//         isFetching: query.isFetching,
//         isFetchingNextPage: query.isFetchingNextPage,
//         isFetchingPreviousPage: query.isFetchingPreviousPage,
//         error: query.error,
//         hasNextPage: query.hasNextPage,
//         hasPreviousPage: query.hasPreviousPage,
//         fetchNextPage: query.fetchNextPage,
//         fetchPreviousPage: query.fetchPreviousPage,
//         refetch: query.refetch,
//     };
// };
