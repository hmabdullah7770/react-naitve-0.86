import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getCategoryNamesList, getPostsByCategory, getCategoryData, getPostFeed, getVideoFeed  } from '../../API/categoury';

// ✅ Optimized category names hook
export const useCategoryNames = () => {
  return useQuery({
    queryKey: ['categoryNames'],
    queryFn: async () => {
      const response = await getCategoryNamesList();
      return response.data;
    },
    select: (data) => ({
      list: (data?.messege || []).map(item => ({
        id: item._id,
        name: item.categouryname || item.categoryname,
      })),
      total: data?.messege?.length || 0,
    }),
    staleTime: 10 * 60 * 1000, // ✅ 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // ✅ 30 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
};

// ✅ CRITICAL FIX: Optimized infinite query with proper memoization
export const usegetPostsByCategory = (category, limit) => {
  return useInfiniteQuery({
    queryKey: ['categoryPostData', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await getPostsByCategory(category, limit, pageParam);
        return response.data;
      } catch (error) {
        if (__DEV__) console.error('API Error:', category, error.message);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.messege?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.currentPage + 1;
    },
    // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
        
        if (posts && Array.isArray(posts)) {
          // ✅ Push individual items instead of spread operator
          for (let j = 0; j < posts.length; j++) {
            result.push(posts[j]);
          }
        }
      }
      
      return result;
    },
    staleTime: 30 * 1000, // ✅ 30 seconds - feed data changes frequently
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

// ✅ Optimized category data infinite query
export const useCategoryDataInfinite = (category, limit) => {
  return useInfiniteQuery({
    queryKey: ['categoryData', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await getCategoryData(category, limit, pageParam);
        return response.data;
      } catch (error) {
        if (__DEV__) console.error('API Error:', category, error.message);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.messege?.pagination;
      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
    // ✅ Optimized select with for loop
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const cards = page?.messege?.cards || page?.data?.messege?.cards || page?.cards;
        
        if (cards && Array.isArray(cards)) {
          for (let j = 0; j < cards.length; j++) {
            result.push(cards[j]);
          }
        }
      }
      
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

// ✅ Placeholder for following users posts
export const usegetFollowingUsersPosts = (category, limit) => {
  // Implement when needed
  return null;
};






// ✅ Optimized image/post feed infinite query
export const usePostFeed = (category, limit) => {
  return useInfiniteQuery({
    queryKey: ['postFeed', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await getPostFeed(category, limit, pageParam);
        return response.data;
      } catch (error) {
        if (__DEV__) console.error('API Error:', category, error.message);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.messege?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.currentPage + 1;
    },
    // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
        
        if (posts && Array.isArray(posts)) {
          // ✅ Push individual items instead of spread operator
          for (let j = 0; j < posts.length; j++) {
            result.push(posts[j]);
          }
        }
      }
      
      return result;
    },
    staleTime: 30 * 1000, // ✅ 30 seconds - feed data changes frequently
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

// ✅ Optimized video feed infinite query
export const useVideoFeed = (category, limit) => {
  return useInfiniteQuery({
    queryKey: ['videoFeed', category, limit],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await getVideoFeed(category, limit, pageParam);
        return response.data;
      } catch (error) {
        if (__DEV__) console.error('API Error:', category, error.message);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.messege?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return pagination.currentPage + 1;
    },
    // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
    select: (data) => {
      const result = [];
      const pages = data.pages;
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const videos = page?.messege?.videos || page?.data?.messege?.videos || page?.videos || page?.posts;
        
        if (videos && Array.isArray(videos)) {
          // ✅ Push individual items instead of spread operator
          for (let j = 0; j < videos.length; j++) {
            result.push(videos[j]);
          }
        }
      }
      
      return result;
    },
    staleTime: 30 * 1000, // ✅ 30 seconds - video feed data changes frequently
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







// import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
// import { getCategoryNamesList, getPostsByCategory, getCategoryData } from '../../API/categoury';

// // ✅ Optimized category names hook
// export const useCategoryNames = () => {
//   return useQuery({
//     queryKey: ['categoryNames'],
//     queryFn: async () => {
//       const response = await getCategoryNamesList();
//       return response.data;
//     },
//     select: (data) => ({
//       list: (data?.messege || []).map(item => ({
//         id: item._id,
//         name: item.categouryname || item.categoryname,
//       })),
//       total: data?.messege?.length || 0,
//     }),
//     staleTime: 10 * 60 * 1000, // ✅ 10 minutes - categories rarely change
//     gcTime: 30 * 60 * 1000, // ✅ 30 minutes cache
//     retry: 2,
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: true,
//     refetchOnMount: false,
//   });
// };

// // ✅ CRITICAL FIX: Optimized infinite query with proper memoization
// export const usegetPostsByCategory = (category, limit) => {
//   return useInfiniteQuery({
//     queryKey: ['categoryPostData', category, limit],
//     queryFn: async ({ pageParam = 1 }) => {
//       try {
//         const response = await getPostsByCategory(category, limit, pageParam);
//         return response.data;
//       } catch (error) {
//         if (__DEV__) console.error('API Error:', category, error.message);
//         throw error;
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.messege?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.currentPage + 1;
//     },
//     // ✅ CRITICAL: Optimized select function - use for loop instead of flatMap
//     select: (data) => {
//       const result = [];
//       const pages = data.pages;
      
//       for (let i = 0; i < pages.length; i++) {
//         const page = pages[i];
//         const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
        
//         if (posts && Array.isArray(posts)) {
//           // ✅ Push individual items instead of spread operator
//           for (let j = 0; j < posts.length; j++) {
//             result.push(posts[j]);
//           }
//         }
//       }
      
//       return result;
//     },
//     staleTime: 30 * 1000, // ✅ 30 seconds - feed data changes frequently
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

// // ✅ Optimized category data infinite query
// export const useCategoryDataInfinite = (category, limit) => {
//   return useInfiniteQuery({
//     queryKey: ['categoryData', category, limit],
//     queryFn: async ({ pageParam = 1 }) => {
//       try {
//         const response = await getCategoryData(category, limit, pageParam);
//         return response.data;
//       } catch (error) {
//         if (__DEV__) console.error('API Error:', category, error.message);
//         throw error;
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.messege?.pagination;
//       return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
//     },
//     // ✅ Optimized select with for loop
//     select: (data) => {
//       const result = [];
//       const pages = data.pages;
      
//       for (let i = 0; i < pages.length; i++) {
//         const page = pages[i];
//         const cards = page?.messege?.cards || page?.data?.messege?.cards || page?.cards;
        
//         if (cards && Array.isArray(cards)) {
//           for (let j = 0; j < cards.length; j++) {
//             result.push(cards[j]);
//           }
//         }
//       }
      
//       return result;
//     },
//     staleTime: 30 * 1000,
//     gcTime: 5 * 60 * 1000,
//     retry: 1,
//     refetchOnWindowFocus: false,
//     refetchOnReconnect: true,
//     refetchOnMount: false,
//     networkMode: 'online',
//     keepPreviousData: true,
//     maxPages: 10,
//   });
// };

// // ✅ Placeholder for following users posts
// export const usegetFollowingUsersPosts = (category, limit) => {
//   // Implement when needed
//   return null;
// };










// // TanStack Query Hooks (hooks/useCategories.js)
// import { useEffect } from 'react';
// import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
// import { getCategoryNamesList, getCategoryData ,getfollowingCategoryData,getunifiedfeed,getunifiedfollowingfeed ,getPostsByCategory ,getFollowingUsersPosts  } from '../../API/categoury';

// export const useCategoryNames = () => {
//   return useQuery({
//     queryKey: ['categoryNames'],
//     queryFn: async () => {
//       const response = await getCategoryNamesList();
//       return response.data; // return the data object directly
//     },
//     select: (data) => ({
//       list: (data?.messege || []).map(item => ({
//         id: item._id,
//         name: item.categouryname || item.categoryname,
//       })),
//       total: data?.messege?.length || 0,
//     }),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // Replaced cacheTime with gcTime (new TanStack Query)
//     retry: 2,
//     refetchOnWindowFocus: true,
//     refetchOnReconnect: true, // ✅ Refetch when network reconnects
//     refetchOnMount: true, // ✅ Refetch on mount if data is stale
//   });
// };






// export const usegetPostsByCategory = (category, limit) => {
//   if (__DEV__) {
//     console.log('🔥 usegetPostsByCategory called with:', {
//       category,
//       limit,
//       categoryType: typeof category,
//       categoryLength: category?.length,
//     });
//   }

//   return useInfiniteQuery({
//     queryKey: ['categoryPostData', category, limit],
//     queryFn: async ({ pageParam = 1 }) => {
//       if (__DEV__) console.log('📡 Making API call to getPostsByCategory with params:', {
//         category,
//         limit,
//         pageParam,
//         timestamp: new Date().toISOString(),
//       });

//       try {
//         const response = await getPostsByCategory(category, limit, pageParam);

//         if (__DEV__) console.log('✅ getPostsByCategory API response received:', {
//           category,
//           pageParam,
//           responseStatus: response?.status,
//           hasData: !!response?.data,
//           dataKeys: response?.data ? Object.keys(response.data) : [],
//           postsCount: response?.data?.messege?.posts?.length || 0,
//           pagination: response?.data?.messege?.pagination,
//           timestamp: new Date().toISOString(),
//         });

//         return response.data; // This should return the data object that contains messege.posts
//       } catch (error) {
//         console.error('❌ getPostsByCategory API call failed:', {
//           category,
//           pageParam,
//           error: error.message,
//           errorStatus: error?.response?.status,
//           errorData: error?.response?.data,
//           timestamp: new Date().toISOString(),
//         });
//         throw error;
//       }
//     },
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.messege?.pagination;
//       const hasNextPage = pagination?.hasNextPage;
//       const nextPage = hasNextPage ? pagination.currentPage + 1 : undefined;

//       if (__DEV__) console.log('🔄 getNextPageParam check:', {
//         category,
//         currentPage: pagination?.currentPage,
//         hasNextPage,
//         nextPage,
//         totalPages: pagination?.totalPages,
//       });

//       return nextPage;
//     },
//     select: (data) => {
//       // Flatten all posts from all pages into a single array
//       const flattenedPosts = data.pages.flatMap(page => {
//         if (page?.messege?.posts) {return page.messege.posts;}
//         if (page?.data?.messege?.posts) {return page.data.messege.posts;}
//         if (page?.posts) {return page.posts;}
//         return [];
//       });

//       if (__DEV__) console.log('📊 Data selection result:', {
//         category,
//         totalPages: data.pages.length,
//         totalPosts: flattenedPosts.length,
//         pagesStructure: data.pages.map((page, index) => ({
//           pageIndex: index,
//           postsCount: page?.messege?.posts?.length || 0,
//           hasValidStructure: !!page?.messege?.posts,
//         })),
//       });

//       return flattenedPosts;
//     },
//     staleTime: 2 * 1000, // 2 seconds - data stays fresh for 2 seconds
//     gcTime: 5 * 60 * 1000, // 5 minutes - cache retention time
//     retry: 2, // Retry failed requests twice
//     refetchOnWindowFocus: false, // Don't refetch when window gains focus
//     refetchOnReconnect: true, // Refetch when network reconnects
//     // Optional: Add these for better UX
//     refetchOnMount: 'always', // Always refetch on component mount
//     networkMode: 'online', // Only run queries when online

//     // Add onSuccess and onError callbacks for additional logging
//     onSuccess: (data) => {
//       if (__DEV__) console.log('🎉 usegetPostsByCategory query successful:', {
//         category,
//         postsCount: data?.length || 0,
//         firstPost: data?.[0]?.title || 'No posts',
//       });
//     },

//     onError: (error) => {
//       // Keep errors visible in all environments but minimize object logging
//       console.error('💥 usegetPostsByCategory query failed:', category, error?.message);
//     },
//   });
// };



// // export const usegetPostsByCategory  = (category, limit) => {
// //   return useInfiniteQuery({
// //     queryKey: ['categoryPostData', category, limit],
// //     queryFn: async ({ pageParam = 1 }) => {
// //       const response = await getPostsByCategory(category, limit, pageParam);
// //       return response.data; // This should return the data object that contains messege.posts
// //     },
// //     getNextPageParam: (lastPage) => {
// //       const pagination = lastPage?.messege?.pagination;
// //       return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
// //     },
// //     select: (data) => {
// //       // Flatten all posts from all pages into a single array
// //       return data.pages.flatMap(page => {
// //         if (page?.messege?.posts) return page.messege.posts;
// //         if (page?.data?.messege?.posts) return page.data.messege.posts;
// //         if (page?.posts) return page.posts;
// //         return [];
// //       });
// //     },
// //     staleTime: 2 * 1000, // 2 seconds - data stays fresh for 2 seconds
// //     gcTime: 5 * 60 * 1000, // 5 minutes - cache retention time
// //     retry: 2, // Retry failed requests twice
// //     refetchOnWindowFocus: false, // Don't refetch when window gains focus
// //     refetchOnReconnect: true, // Refetch when network reconnects
// //     // Optional: Add these for better UX
// //     refetchOnMount: 'always', // Always refetch on component mount
// //     networkMode: 'online', // Only run queries when online
// //   });
// // };







// export const usegetFollowingUsersPosts = (category,limit)=>{


// };








// //optimized

// // export const useCategoryNames = () => queryOptions({

// //   // const dispatch = useDispatch();


// //     queryKey: ['categoryNames'],
// //     queryFn: async () => {

// //       const response = await getCategoryNamesList();

// //       return response;
// //     },
// //     staleTime: 5 * 60 * 1000, // 5 minutes
// //     gcTime: 10 * 60 * 1000, // Replaced cacheTime with gcTime (new TanStack Query)
// //     retry: 2,
// //     refetchOnWindowFocus: true,
// //     refetchOnReconnect: true, // ✅ Refetch when network reconnects
// //     refetchOnMount: true, // ✅ Refetch on mount if data is stale


// //     // onSuccess: (data) => {

// //     //   dispatch(clearError());
// //     // },
// //     // onError: (error) => {

// //     //   dispatch(setError(error.message));
// //     // }
// //   });





// // Updated React Query hook with 2-second stale time
// export const useCategoryDataInfinite = (category, limit) => {
//   return useInfiniteQuery({
//     queryKey: ['categoryData', category, limit],
//     queryFn: async ({ pageParam = 1 }) => {
//       const response = await getCategoryData(category, limit, pageParam);
//       return response.data; // This should return the data object that contains messege.cards
//     },
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.messege?.pagination;
//       return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
//     },
//     select: (data) => {
//       // Flatten all cards from all pages into a single array
//       return data.pages.flatMap(page => {
//         if (page?.messege?.cards) {return page.messege.cards;}
//         if (page?.data?.messege?.cards) {return page.data.messege.cards;}
//         if (page?.cards) {return page.cards;}
//         return [];
//       });
//     },
//     staleTime: 2 * 1000, // 2 seconds - data stays fresh for 2 seconds
//     gcTime: 5 * 60 * 1000, // 5 minutes - cache retention time
//     retry: 2, // Retry failed requests twice
//     refetchOnWindowFocus: false, // Don't refetch when window gains focus
//     refetchOnReconnect: true, // Refetch when network reconnects
//     // Optional: Add these for better UX
//     refetchOnMount: 'always', // Always refetch on component mount
//     networkMode: 'online', // Only run queries when online
//   });
// };












// // export const useFollowingCategoryDataInfinite = (category, limit) => {
// //   return useInfiniteQuery({
// //     queryKey: ['followingCategoryData', category, limit],
// //     queryFn: async ({ pageParam = 1 }) => {
// //       console.log('🔥 Calling getfollowingCategoryData API with params:', { category, limit, page: pageParam });
// //       const response = await getfollowingCategoryData(category, limit, pageParam);
// //       console.log('✅ getfollowingCategoryData response:', response);
// //       return response.data; // This should return the data object that contains messege.cards
// //     },
// //     getNextPageParam: (lastPage) => {
// //       const pagination = lastPage?.messege?.pagination;
// //       return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
// //     },
// //     // Added stale time configuration
// //     staleTime: 2 * 1000, // 2 seconds - data stays fresh for 2 seconds
// //     gcTime: 5 * 60 * 1000, // 5 minutes - cache retention time
// //     retry: 2, // Retry failed requests twice
// //     refetchOnWindowFocus: false, // Don't refetch when window gains focus
// //     refetchOnReconnect: true, // Refetch when network reconnects
// //     // Optional: Add these for better UX
// //     refetchOnMount: 'always', // Always refetch on component mount
// //     networkMode: 'online', // Only run queries when online
// //     }
// //   );
// // };





// //new for unified feed


// // getunifiedfeed
// //getunifiedfollowingfeed

// // // Prefetch all category data for each category name, with a 1s delay between each
// // export const usePrefetchAllCategoryData = (limit = 5) => {
// //   const queryClient = useQueryClient();
// //   const { data } = useCategoryNames();
// //   const categories = data?.list || [];

// //   useEffect(() => {
// //     if (!categories.length) return;
// //     let cancelled = false;
// //     async function prefetchAll() {
// //       for (let i = 0; i < categories.length; i++) {
// //         if (cancelled) break;
// //         const categoryName = categories[i].name;
// //         await queryClient.prefetchInfiniteQuery({
// //           queryKey: ['categoryData', categoryName, limit],
// //           queryFn: ({ pageParam = 1 }) =>
// //             getCategoryData(categoryName, limit, pageParam).then(res => res.data),
// //         });
// //         await new Promise(res => setTimeout(res, 1000));
// //       }
// //     }
// //     prefetchAll();
// //     return () => {
// //       cancelled = true;
// //     };
// //   }, [categories, queryClient, limit]);
// // };
