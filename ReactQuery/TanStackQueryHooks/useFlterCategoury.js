import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { getPostsByCategory, filtercategouryposts } from '../../API/categoury';

const filterApi = true;

/**
 * useFlterCategoury Hook - SMART FEED v3
 * 
 * Core Logic:
 * 1. Always fetch "All" feed first (this is our source of truth).
 * 2. When user selects a specific category:
 *    a) INSTANTLY filter items from "All" cache using `post.category === selectedCategory`
 *    b) NO API call on mount - just show cached items!
 * 3. When user scrolls to end (onEndReached):
 *    a) Find the LAST item's `inCategoryId` from the filtered cache
 *    b) Call API with that cursor and direction='older'
 *    c) Merge results, deduplicate
 * 4. When user pulls to refresh (scroll up past cache):
 *    a) Find the FIRST item's `inCategoryId` from the merged data
 *    b) Call API with that cursor and direction='newer'
 *    c) Prepend results, deduplicate
 * 5. Cache limit: maxPages = 3
 */
export const useFlterCategoury = (category, limit) => {
    // =========================================================================
    // LEGACY PATH (Page-based - OLD CODE PRESERVED)
    // =========================================================================
    if (!filterApi) {
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
            select: (data) => {
                const result = [];
                const pages = data.pages;
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    const posts = page?.messege?.posts || page?.data?.messege?.posts || page?.posts;
                    if (posts && Array.isArray(posts)) {
                        for (let j = 0; j < posts.length; j++) {
                            result.push(posts[j]);
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
            maxPages: 3,
        });
    }

    // =========================================================================
    // NEW PATH (Smart Feed - Cursor-based with Frontend Filtering)
    // =========================================================================
    const queryClient = useQueryClient();

    // Track category-specific fetched data separately (NOT using useInfiniteQuery for category!)
    const [categoryExtraData, setCategoryExtraData] = useState([]);
    const [isFetchingCategory, setIsFetchingCategory] = useState(false);
    const [hasMoreCategory, setHasMoreCategory] = useState(true);
    const lastCategoryRef = useRef(category);

    // Reset category data when category changes
    useEffect(() => {
        if (lastCategoryRef.current !== category) {
            console.log(`🔄 CATEGORY CHANGED: ${lastCategoryRef.current} → ${category}`);
            setCategoryExtraData([]);
            setHasMoreCategory(true);
            lastCategoryRef.current = category;
        }
    }, [category]);

    // 1. "All" Feed Query - This is our SOURCE OF TRUTH
    const allQuery = useInfiniteQuery({
        queryKey: ['smartFeed', 'All', limit],
        queryFn: async ({ pageParam }) => {
            const cursor = typeof pageParam === 'object' ? pageParam?.cursor : pageParam;
            const direction = typeof pageParam === 'object' ? pageParam?.direction : 'older';

            console.log('═══════════════════════════════════════');
            console.log(`🚀 API CALL: ALL`);
            console.log(`   - Cursor: ${cursor || 'NULL (Start)'}`);
            console.log(`   - Direction: ${direction}`);
            console.log(`   - Limit: ${limit}`);
            console.log('═══════════════════════════════════════');

            const response = await filtercategouryposts('All', limit, cursor || null, direction);
            console.log('📦 API RESPONSE:', response.data?.messege?.posts?.length || 0, 'posts');

            return response.data;
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => {
            const nextCursor = lastPage?.messege?.pagination?.nextCursor;
            return nextCursor ? { cursor: nextCursor, direction: 'older' } : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            const prevCursor = firstPage?.messege?.pagination?.previousCursor;
            return prevCursor ? { cursor: prevCursor, direction: 'newer' } : undefined;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        maxPages: 3,
    });

    // 2. Extract raw posts from allQuery
    const allPosts = useMemo(() => {
        if (!allQuery.data?.pages) return [];
        const posts = allQuery.data.pages.flatMap(page => page?.messege?.posts || []);
        return posts;
    }, [allQuery.data]);

    // 3. Filter posts for the current category from "All" cache
    const filteredFromAll = useMemo(() => {
        const isAll = category === 'all' || category === 'All';
        if (isAll) {
            return allPosts;
        }

        // Filter by category name (case-insensitive)
        const filtered = allPosts.filter(post =>
            post.category?.toLowerCase() === category?.toLowerCase()
        );

        console.log(`📋 FILTER FROM CACHE: "${category}"`);
        console.log(`   - Total in All: ${allPosts.length}`);
        console.log(`   - Matched: ${filtered.length}`);
        if (filtered.length > 0) {
            console.log(`   - First: ${filtered[0]?.inCategoryId}`);
            console.log(`   - Last: ${filtered[filtered.length - 1]?.inCategoryId}`);
        }

        return filtered;
    }, [allPosts, category]);

    // 4. Merge filtered + extra fetched data (deduplicated)
    const mergedData = useMemo(() => {
        const isAll = category === 'all' || category === 'All';
        if (isAll) {
            return allPosts;
        }

        // Merge: Cached items first, then extra fetched items
        const seen = new Set();
        const result = [];

        // Add filtered items from "All" cache
        filteredFromAll.forEach(post => {
            if (!seen.has(post._id)) {
                seen.add(post._id);
                result.push(post);
            }
        });

        // Add extra fetched items (from category-specific API calls)
        categoryExtraData.forEach(post => {
            if (!seen.has(post._id)) {
                seen.add(post._id);
                result.push(post);
            }
        });

        console.log(`📊 MERGED DATA: ${result.length} items (${filteredFromAll.length} from cache + ${categoryExtraData.length} from API)`);

        return result;
    }, [category, filteredFromAll, categoryExtraData, allPosts]);

    // 5. Fetch Next Page (Scroll Down - Older)
    const fetchNextPage = useCallback(async () => {
        const isAll = category === 'all' || category === 'All';

        // If on "All", use the native allQuery.fetchNextPage
        if (isAll) {
            if (allQuery.hasNextPage && !allQuery.isFetchingNextPage) {
                return allQuery.fetchNextPage();
            }
            return;
        }

        // For specific categories, fetch more from API manually
        if (isFetchingCategory || !hasMoreCategory) {
            console.log('⏸️ CATEGORY FETCH BLOCKED - Already fetching or no more pages');
            return;
        }

        // Find the LAST item's inCategoryId from merged data
        const lastItem = mergedData[mergedData.length - 1];
        const cursor = lastItem?.inCategoryId || null;

        console.log('═══════════════════════════════════════');
        console.log(`🚀 API CALL: ${category} (SCROLL DOWN - On Demand)`);
        console.log(`   - Cursor: ${cursor || 'NULL (Start)'}`);
        console.log(`   - Direction: older`);
        console.log(`   - Limit: ${limit}`);
        console.log('═══════════════════════════════════════');

        setIsFetchingCategory(true);
        try {
            const response = await filtercategouryposts(category, limit, cursor, 'older');
            const newPosts = response.data?.messege?.posts || [];
            const hasNext = response.data?.messege?.pagination?.hasNextPage;

            console.log(`✅ RECEIVED: ${newPosts.length} items, hasNextPage: ${hasNext}`);

            if (newPosts.length > 0) {
                setCategoryExtraData(prev => [...prev, ...newPosts]);
            }
            setHasMoreCategory(!!hasNext);
        } catch (error) {
            console.error('❌ FETCH ERROR:', error.message);
        } finally {
            setIsFetchingCategory(false);
        }
    }, [category, mergedData, limit, isFetchingCategory, hasMoreCategory, allQuery]);

    // 6. Fetch Previous Page (Scroll Up / Refresh - Newer)
    const fetchPreviousPage = useCallback(async () => {
        const isAll = category === 'all' || category === 'All';

        // If on "All", use the native allQuery.fetchPreviousPage
        if (isAll) {
            if (allQuery.hasPreviousPage && !allQuery.isFetchingPreviousPage) {
                return allQuery.fetchPreviousPage();
            }
            return;
        }

        // For specific categories, fetch newer items from API
        if (isFetchingCategory) {
            console.log('⏸️ NEWER FETCH BLOCKED - Already fetching');
            return;
        }

        // Find the FIRST item's inCategoryId from merged data
        const firstItem = mergedData[0];
        const cursor = firstItem?.inCategoryId || null;

        if (!cursor) {
            console.log('⚠️ No cursor for newer fetch - no data yet');
            return;
        }

        console.log('═══════════════════════════════════════');
        console.log(`🚀 API CALL: ${category} (SCROLL UP / REFRESH)`);
        console.log(`   - Cursor: ${cursor}`);
        console.log(`   - Direction: newer`);
        console.log(`   - Limit: ${limit}`);
        console.log('═══════════════════════════════════════');

        setIsFetchingCategory(true);
        try {
            const response = await filtercategouryposts(category, limit, cursor, 'newer');
            const newPosts = response.data?.messege?.posts || [];

            console.log(`✅ RECEIVED: ${newPosts.length} newer items`);

            if (newPosts.length > 0) {
                // Prepend newer items
                setCategoryExtraData(prev => [...newPosts, ...prev]);
            }
        } catch (error) {
            console.error('❌ FETCH ERROR:', error.message);
        } finally {
            setIsFetchingCategory(false);
        }
    }, [category, mergedData, limit, isFetchingCategory, allQuery]);

    // 7. Refetch (Reset and refresh)
    const refetch = useCallback(async () => {
        console.log('🔄 REFETCH TRIGGERED');
        setCategoryExtraData([]);
        setHasMoreCategory(true);
        return allQuery.refetch();
    }, [allQuery]);

    // 8. Return the interface that Feed.jsx expects
    const isAll = category === 'all' || category === 'All';
    const returnHasNextPage = isAll ? allQuery.hasNextPage : hasMoreCategory;

    console.log(`🎯 RETURN for "${category}": ${mergedData.length} items, hasNextPage: ${returnHasNextPage}`);

    return {
        data: mergedData,
        isLoading: isAll ? allQuery.isLoading : (allQuery.isLoading && mergedData.length === 0),
        isFetching: isAll ? allQuery.isFetching : (allQuery.isFetching || isFetchingCategory),
        isFetchingNextPage: isAll ? allQuery.isFetchingNextPage : isFetchingCategory,
        isFetchingPreviousPage: isAll ? allQuery.isFetchingPreviousPage : isFetchingCategory,
        error: allQuery.error,
        hasNextPage: returnHasNextPage,
        hasPreviousPage: isAll ? allQuery.hasPreviousPage : (mergedData.length > 0),
        fetchNextPage,
        fetchPreviousPage,
        refetch,
    };
};



