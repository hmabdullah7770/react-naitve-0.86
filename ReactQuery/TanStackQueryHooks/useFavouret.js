import { addtofavouret , removefromfavouret} from "../../API/favouret"
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import {  filtercategouryposts } from '../../API/categoury';

export const useFavouret = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: addtofavouret,
        onSuccess: (data) => {
            console.log('Added to favouret successfully', data)

            queryClient.invalidateQueries({ queryKey: ['favouret'] })
    queryClient.invalidateQueries({ queryKey: ['categoryPostDataFavouret'] }); // ← fix key
        },
        onError: error => {
            console.error('Add to favouret error:', error)
        },
    })
}


export const useRemoveFavouret = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (postIds) => {
            console.log('[useRemoveFavouret] sending postIds:', JSON.stringify(postIds)); // ✅ now works
            return removefromfavouret(postIds);
        },
        onSuccess: (data) => {
            console.log('Removed from favouret successfully', data)
            queryClient.invalidateQueries({ queryKey: ['favouret'] })
            queryClient.invalidateQueries({ queryKey: ['categoryPostDataFavouret'] })
        },
        onError: error => {
            console.error('Remove from favouret error:', error)
        },
    })
}

export const usegetPostsByCategoryFavouret = (category, limit, favouret = true, direction, cursor, options = {}) => {
    console.log('[FavouretFeed] 🔍 hook called → category:', category, '| enabled:', options.enabled ?? true);
    
    return useInfiniteQuery({
        queryKey: ['categoryPostDataFavouret', category, limit],
        queryFn: async ({ pageParam = null}) => {
            console.log('[FavouretFeed] 🚀 queryFn firing → category:', category, '| pageParam:', pageParam);
            try {
                const response = await filtercategouryposts(category, limit, pageParam, 'older', favouret);
                console.log('[FavouretFeed] ✅ raw response:', JSON.stringify(response.data, null, 2));
                console.log('[FavouretFeed] ✅ posts:', response.data?.messege?.posts);
                console.log('[FavouretFeed] ✅ pagination:', response.data?.messege?.pagination);
                return response.data;
            } catch (error) {
                console.error('[FavouretFeed] ❌ API Error → category:', category, '| error:', error.message);
                throw error;
            }
        },
        // enabled: options.enabled ?? true,
        enabled: !!category && (options.enabled ?? true),  // ← disable when category is null
refetchOnMount: true,  // ← was false, preventing queryFn from firing
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.messege?.pagination;
            console.log('[FavouretFeed] getNextPageParam → pagination:', pagination);
            if (!pagination?.hasNextPage) return undefined;
            return pagination.nextCursor ?? undefined; 
        },
        select: (data) => {
            const result = [];
            const pages = data.pages;
            console.log('[FavouretFeed] select → total pages:', pages.length);
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
                console.log(`[FavouretFeed] select → page ${i} posts count:`, posts?.length ?? 0);
                if (posts && Array.isArray(posts)) {
                    for (let j = 0; j < posts.length; j++) {
                        result.push(posts[j]);
                    }
                }
            }
            console.log('[FavouretFeed] select → final result count:', result.length);
            return result;
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // refetchOnMount: false,
        networkMode: 'online',
        keepPreviousData: true,
        maxPages: 10,
    });
};
