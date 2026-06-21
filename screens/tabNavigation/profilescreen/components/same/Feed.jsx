import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useUserProfileFeed } from '../../../../../ReactQuery/TanStackQueryHooks/useUserProfileFeed';
import Card from './Card';
import SkeletonPost from './feed-performance/SkeletonPost';
import { FlashList } from '@shopify/flash-list';

const LIMIT = 50;
const VIEWPORT_STAY_DURATION = 50;

const Feed = ({
  onScroll: externalOnScroll,
  scrollEventThrottle = 16,
  ListHeaderComponent: ExternalHeader,
  categorySticky,
  categoryHeight = 0,
  isScreenFocused = true,
  userId
}) => {
  // ===================================================================
  // ✅ ALL HOOKS CALLED UNCONDITIONALLY AT THE TOP
  // ===================================================================
  
  // Refs
  const listRef = useRef(null);
  const viewportTimerRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const loadedItemsCountRef = useRef(0);
  const lastContentOffset = useRef(0);
  const isScrollingUp = useRef(false);

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [centerItemId, setCenterItemId] = useState(null);
  const [playableItemId, setPlayableItemId] = useState(null);

  // ✅ ALWAYS call the hook - control via enabled option
  const {
    data: allItems,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useUserProfileFeed(userId, 'All', LIMIT, {
    enabled: !!userId
  });

  // ===================================================================
  // ✅ EFFECTS
  // ===================================================================

  // Track loaded items
  useEffect(() => {
    if (allItems && allItems.length > 0) {
      loadedItemsCountRef.current = allItems.length;
      console.log('📊 [Feed] Total loaded items:', allItems.length);
    }
  }, [allItems]);

  // Pause videos on screen blur
  useEffect(() => {
    if (!isScreenFocused) {
      console.log('🚫 Screen unfocused - Clearing playable video');
      setPlayableItemId(null);
      if (viewportTimerRef.current) {
        clearTimeout(viewportTimerRef.current);
        viewportTimerRef.current = null;
      }
    }
  }, [isScreenFocused]);

  // Video playback control
  useEffect(() => {
    if (viewportTimerRef.current) {
      clearTimeout(viewportTimerRef.current);
      viewportTimerRef.current = null;
    }

    if (!centerItemId || !isScreenFocused) {
      setPlayableItemId(null);
      return;
    }

    if (centerItemId !== playableItemId) {
      setPlayableItemId(null);
    }

    viewportTimerRef.current = setTimeout(() => {
      console.log('▶️ Item now playable:', centerItemId);
      setPlayableItemId(centerItemId);
    }, VIEWPORT_STAY_DURATION);

    return () => {
      if (viewportTimerRef.current) {
        clearTimeout(viewportTimerRef.current);
        viewportTimerRef.current = null;
      }
    };
  }, [centerItemId, isScreenFocused, playableItemId]);

  // ===================================================================
  // ✅ CALLBACKS
  // ===================================================================

  const handleScroll = useCallback((event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;

    if (currentOffsetY < lastContentOffset.current) {
      isScrollingUp.current = true;
    } else if (currentOffsetY > lastContentOffset.current) {
      isScrollingUp.current = false;
    }
    lastContentOffset.current = currentOffsetY;

    if (
      isScrollingUp.current && 
      currentOffsetY < 500 && 
      hasPreviousPage && 
      !isFetchingPreviousPage && 
      userId
    ) {
      fetchPreviousPage();
    }

    if (externalOnScroll) {
      externalOnScroll(event);
    }
  }, [externalOnScroll, hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage, userId]);

  const onRefresh = useCallback(async () => {
    console.log('🔄 MANUAL REFRESH TRIGGERED');
    setRefreshing(true);
    loadedItemsCountRef.current = 0;
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const loadMoreData = useCallback(() => {
    const now = Date.now();

    if (loadedItemsCountRef.current < LIMIT) {
      console.log(`⏸️ API CALL BLOCKED - Not enough items yet (${loadedItemsCountRef.current}/${LIMIT})`);
      return;
    }

    if (now - lastFetchTimeRef.current < 2000) {
      console.log('⏸️ API CALL BLOCKED - Too soon (debounced)');
      return;
    }

    if (isLoadingRef.current || isFetchingNextPage || !hasNextPage || refreshing) {
      console.log('⏸️ API CALL BLOCKED - Already loading or no more pages');
      return;
    }

    console.log('📥 TRIGGERING NEXT PAGE LOAD - Item count:', loadedItemsCountRef.current);
    isLoadingRef.current = true;
    lastFetchTimeRef.current = now;

    fetchNextPage().finally(() => {
      isLoadingRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

  const onEndReached = useCallback(() => {
    console.log('📍 onEndReached TRIGGERED - Current items:', loadedItemsCountRef.current);
    
    if (
      hasNextPage && 
      !isLoadingRef.current && 
      !isFetchingNextPage && 
      !refreshing && 
      loadedItemsCountRef.current >= LIMIT
    ) {
      loadMoreData();
    } else {
      console.log('⏸️ onEndReached IGNORED - Conditions not met');
    }
  }, [hasNextPage, isFetchingNextPage, refreshing, loadMoreData]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0) {
      setCenterItemId(null);
      return;
    }

    const mostVisible = viewableItems.reduce((prev, current) => {
      const prevPercent = prev.item?.viewablePercentage || 0;
      const currentPercent = current.item?.viewablePercentage || 0;
      return currentPercent > prevPercent ? current : prev;
    });

    if (mostVisible && mostVisible.item?._id && mostVisible.item._id !== centerItemId) {
      console.log('👁️ CENTER ITEM:', mostVisible.item._id, '| Visibility:', mostVisible.item.viewablePercentage + '%');
      setCenterItemId(mostVisible.item._id);
    }
  }, [centerItemId]);

  const renderItem = useCallback(({ item }) => {
    const isVisible = centerItemId === item._id;
    const isPlayable = playableItemId === item._id;

    return (
      <Card
        item={item}
        isVisible={isVisible}
        isPlayable={isPlayable}
      />
    );
  }, [centerItemId, playableItemId]);

  const keyExtractor = useCallback((item) => item._id, []);

  // ===================================================================
  // ✅ MEMOIZED VALUES
  // ===================================================================

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 70,
    waitForInteraction: false,
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged }
  ]).current;

  const contentContainerStyle = useMemo(() => ({
    paddingVertical: 5,
    paddingTop: categorySticky ? categoryHeight : 5,
  }), [categorySticky, categoryHeight]);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#1FFFA5']}
      tintColor="#1FFFA5"
    />
  ), [refreshing, onRefresh]);

  const ListFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerContainer}>
        <SkeletonPost />
      </View>
    );
  }, [isFetchingNextPage]);

  // ===================================================================
  // ✅ RENDER
  // ===================================================================

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={allItems || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={480}
        ListHeaderComponent={ExternalHeader}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={contentContainerStyle}
        refreshControl={refreshControl}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footerContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
});

export default Feed;

// new code 
// import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// import { View, Text, StyleSheet, RefreshControl } from 'react-native';
// import { useSelector } from 'react-redux';
// // import { useCategoryNames, usegetPostsByCategory } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
// import { useUserProfileFeed, useSmartFilteredFeed, saveScrollPosition } from '../../../../../ReactQuery/TanStackQueryHooks/useUserProfileFeed';
// import Card from './Card';
// import SkeletonPost from './feed-performance/SkeletonPost';
// import { FlashList } from '@shopify/flash-list';

// const LIMIT = 50; // ✅ Set to 50 as per your requirement
// const VIEWPORT_STAY_DURATION = 50;

// const Feed = ({
//   onScroll: externalOnScroll,
//   scrollEventThrottle = 16,
//   ListHeaderComponent: ExternalHeader,
//   categorySticky,
//   categoryHeight = 0,
//   isScreenFocused = true,
//   userId
// }) => {
//   const { selectedCategoryIndex } = useSelector(state => state.category);
//   const listRef = useRef(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // ✅ Filter API Toggle
//   const [filterApi, setFilterApi] = useState(true);

//   // ✅ Single center item tracking
//   const [centerItemId, setCenterItemId] = useState(null);
//   const [playableItemId, setPlayableItemId] = useState(null);

//   const viewportTimerRef = useRef(null);
//   const lastFetchTimeRef = useRef(0);
//   const isLoadingRef = useRef(false);

//   // // Get categories
//   // const { data, isLoading: isLoadingCategories } = useCategoryNames();
//    const categories = "All";

//   // const categoriesWithAll = useMemo(() => {
//   //   const allCategory = { id: '6834c7f5632a2871571413f7', name: 'All' };
//   //   const filtered = categories.filter(cat => cat.name?.toLowerCase() !== 'all');
//   //   return [allCategory, ...filtered];
//   // }, [categories]);

//   // const selectedCategoryName = categoriesWithAll[selectedCategoryIndex]?.name;

//   // ✅ 1. Legacy Query (Old Code)
//   // const legacyQuery = usegetPostsByCategory(selectedCategoryName, LIMIT);

//   // ✅ 2. Smart Feed Query (New Code) - Only enabled when userId is provided
//   const smartQuery = useUserProfileFeed(
//     // selectedCategoryName, 
//     userId,       // ✅ 1st parameter
//     categories,   // ✅ 2nd parameter
//     LIMIT ,        // ✅ 3rd parameter
//     {
//       enabled: !!userId // Only run if userId exists
//     }
//   );

//   // ✅ 3. Select active query data based on toggle and userId
//   const {
//     data: allItems,
//     isLoading,
//     error,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     refetch,
//     fetchPreviousPage,
//     hasPreviousPage,
//     isFetchingPreviousPage,
//   } = (filterApi && userId) ? smartQuery : legacyQuery;

//   // ✅ Track loaded item count to prevent unnecessary API calls
//   const loadedItemsCountRef = useRef(0);

//   // Update loaded items count when data changes
//   useEffect(() => {
//     if (allItems && allItems.length > 0) {
//       loadedItemsCountRef.current = allItems.length;
//       console.log('📊 [Feed] Total loaded items:', allItems.length);
//     }
//   }, [allItems]);

//   // ✅ Handle scroll for bi-directional fetching
//   const lastContentOffset = useRef(0);
//   const isScrollingUp = useRef(false);

//   const handleScroll = (event) => {
//     const currentOffsetY = event.nativeEvent.contentOffset.y;

//     // 1. Detect Direction
//     if (currentOffsetY < lastContentOffset.current) {
//       isScrollingUp.current = true;
//     } else if (currentOffsetY > lastContentOffset.current) {
//       isScrollingUp.current = false;
//     }
//     lastContentOffset.current = currentOffsetY;

//     // 2. Trigger "Fetch Newer" (Gap Filling)
//     if (isScrollingUp.current && currentOffsetY < 500 && hasPreviousPage && !isFetchingPreviousPage && filterApi && userId) {
//       fetchPreviousPage();
//     }

//     // Call external scroll handler if exists
//     if (externalOnScroll) {
//       externalOnScroll(event);
//     }
//   };

//   // ✅ Pause all videos when screen loses focus
//   useEffect(() => {
//     if (!isScreenFocused) {
//       console.log('🚫 Screen unfocused - Clearing playable video');
//       setPlayableItemId(null);
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     }
//   }, [isScreenFocused]);

//   // ✅ Only allow playback if screen is focused
//   useEffect(() => {
//     if (viewportTimerRef.current) {
//       clearTimeout(viewportTimerRef.current);
//       viewportTimerRef.current = null;
//     }

//     if (!centerItemId || !isScreenFocused) {
//       setPlayableItemId(null);
//       return;
//     }

//     if (centerItemId !== playableItemId) {
//       setPlayableItemId(null);
//     }

//     viewportTimerRef.current = setTimeout(() => {
//       console.log('▶️ Item now playable:', centerItemId);
//       setPlayableItemId(centerItemId);
//     }, VIEWPORT_STAY_DURATION);

//     return () => {
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     };
//   }, [centerItemId, isScreenFocused]);

//   // ✅ Refresh
//   const onRefresh = useCallback(async () => {
//     console.log('🔄 MANUAL REFRESH TRIGGERED');
//     setRefreshing(true);
//     loadedItemsCountRef.current = 0;
//     try {
//       await refetch();
//     } finally {
//       setRefreshing(false);
//     }
//   }, [refetch]);

//   // ✅ Load more with strict debounce and item count check
//   const loadMoreData = useCallback(() => {
//     const now = Date.now();

//     // Check if we've reached the limit threshold (50 items)
//     if (loadedItemsCountRef.current < LIMIT) {
//       console.log(`⏸️ API CALL BLOCKED - Not enough items yet (${loadedItemsCountRef.current}/${LIMIT})`);
//       return;
//     }

//     if (now - lastFetchTimeRef.current < 2000) {
//       console.log('⏸️ API CALL BLOCKED - Too soon (debounced)');
//       return;
//     }

//     if (isLoadingRef.current || isFetchingNextPage || !hasNextPage || refreshing) {
//       console.log('⏸️ API CALL BLOCKED - Already loading or no more pages');
//       return;
//     }

//     console.log('📥 TRIGGERING NEXT PAGE LOAD - Item count:', loadedItemsCountRef.current);
//     isLoadingRef.current = true;
//     lastFetchTimeRef.current = now;

//     fetchNextPage().finally(() => {
//       isLoadingRef.current = false;
//     });
//   }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

//   // ✅ OnEndReached with logging
//   const onEndReached = useCallback(() => {
//     console.log('📍 onEndReached TRIGGERED - Current items:', loadedItemsCountRef.current);
    
//     // Only fetch next page if we have at least LIMIT items loaded
//     if (hasNextPage && !isLoadingRef.current && !isFetchingNextPage && !refreshing && loadedItemsCountRef.current >= LIMIT) {
//       loadMoreData();
//     } else {
//       console.log('⏸️ onEndReached IGNORED - Conditions not met');
//     }
//   }, [hasNextPage, isFetchingNextPage, refreshing, loadMoreData]);

//   // ✅ Combine internal viewport tracking with external scroll handler
//   const handleScrollCombined = useCallback((event) => {
//     handleScroll(event);
//   }, [externalOnScroll, hasPreviousPage, isFetchingPreviousPage, filterApi, fetchPreviousPage, userId]);

//   // ✅ Simplified viewport detection
//   const onViewableItemsChanged = useCallback(({ viewableItems }) => {
//     if (!viewableItems || viewableItems.length === 0) {
//       setCenterItemId(null);
//       return;
//     }

//     // Get the most visible item
//     const mostVisible = viewableItems.reduce((prev, current) => {
//       const prevPercent = prev.item?.viewablePercentage || 0;
//       const currentPercent = current.item?.viewablePercentage || 0;
//       return currentPercent > prevPercent ? current : prev;
//     });

//     if (mostVisible && mostVisible.item?._id && mostVisible.item._id !== centerItemId) {
//       console.log('👁️ CENTER ITEM:', mostVisible.item._id, '| Visibility:', mostVisible.item.viewablePercentage + '%');
//       setCenterItemId(mostVisible.item._id);
//     }
//   }, [centerItemId]);

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 50,
//     minimumViewTime: 70,
//     waitForInteraction: false,
//   }).current;

//   const viewabilityConfigCallbackPairs = useRef([
//     { viewabilityConfig, onViewableItemsChanged }
//   ]).current;

//   // ✅ Render item
//   const renderItem = useCallback(({ item }) => {
//     const isVisible = centerItemId === item._id;
//     const isPlayable = playableItemId === item._id;

//     return (
//       <Card
//         item={item}
//         isVisible={isVisible}
//         isPlayable={isPlayable}
//       />
//     );
//   }, [centerItemId, playableItemId]);

//   const keyExtractor = useCallback((item) => item._id, []);

//   // ✅ Content inset for sticky category
//   const contentContainerStyle = useMemo(() => ({
//     paddingVertical: 5,
//     paddingTop: categorySticky ? categoryHeight : 5,
//   }), [categorySticky, categoryHeight]);

//   // ✅ Components
//   const refreshControl = useMemo(() => (
//     <RefreshControl
//       refreshing={refreshing}
//       onRefresh={onRefresh}
//       colors={['#1FFFA5']}
//       tintColor="#1FFFA5"
//     />
//   ), [refreshing, onRefresh]);

//   const CombinedListHeaderComponent = useMemo(() => {
//     if (!ExternalHeader) return null;
//     return ExternalHeader;
//   }, [ExternalHeader]);

//   const ListFooterComponent = useMemo(() => {
//     if (!isFetchingNextPage) return null;
//     return (
//       <View style={styles.footerContainer}>
//         <SkeletonPost />
//       </View>
//     );
//   }, [isFetchingNextPage]);

//   // const ListEmptyComponent = useMemo(() => {
//   //   if (isLoading || isLoadingCategories) {
//   //     return (
//   //       <View style={styles.centerContainer}>
//   //         {[0, 1, 2].map((i) => (
//   //           <SkeletonPost key={`skeleton-empty-${i}`} />
//   //         ))}
//   //       </View>
//   //     );
//   //   }

//   //   if (error) {
//   //     return (
//   //       <View style={styles.centerContainer}>
//   //         <Text style={styles.errorText}>Failed to load feed. Pull down to retry.</Text>
//   //       </View>
//   //     );
//   //   }

//   //   return (
//   //     <View style={styles.centerContainer}>
//   //       <Text style={styles.emptyText}>No posts available</Text>
//   //     </View>
//   //   );
//   // }, [isLoading, isLoadingCategories, error]);

//   // if (isLoading || isLoadingCategories) {
//   //   return (
//   //     <View style={styles.centerContainer}>
//   //       {[0, 1, 2].map((i) => (
//   //         <SkeletonPost key={`skeleton-loading-${i}`} />
//   //       ))}
//   //     </View>
//   //   );
//   // }

//   return (
//     <View style={styles.container}>
//       <FlashList
//         ref={listRef}
//         data={allItems || []}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         onScroll={handleScrollCombined}
//         scrollEventThrottle={scrollEventThrottle}
//         onEndReached={onEndReached}
//         onEndReachedThreshold={0.5}
//         showsVerticalScrollIndicator={false}
//         estimatedItemSize={480}
//         ListHeaderComponent={CombinedListHeaderComponent}
//         ListFooterComponent={ListFooterComponent}
//         // ListEmptyComponent={ListEmptyComponent}
//         contentContainerStyle={contentContainerStyle}
//         refreshControl={refreshControl}
//         viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   contentContainer: {
//     paddingVertical: 5,
//   },
//   footerContainer: {
//     paddingHorizontal: 12,
//     paddingBottom: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff4444',
//     textAlign: 'center',
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//   },
// });

// export default Feed;







// import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// import { View, Text, StyleSheet, RefreshControl } from 'react-native';
// import { useSelector } from 'react-redux';
// import { useCategoryNames, usegetPostsByCategory } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
// import {useUserProfileFeed, useSmartFilteredFeed, saveScrollPosition } from '../../../ReactQuery/TanstackDB/FilterCategoury';
// import Card from './Card';
// import SkeletonPost from './feed-performance/SkeletonPost';
// import { FlashList } from '@shopify/flash-list';

// // const LIMIT = 20; // ✅ Updated to 20 as requested
// const LIMIT = 20; // ✅ Updated to 20 as requested
// const VIEWPORT_STAY_DURATION = 50;


// const Feed = ({
//   // onScroll: externalOnScroll,
//   // scrollEventThrottle = 16,
//   // ListHeaderComponent: ExternalHeader,
//   // categorySticky,
//   // categoryHeight = 0,
//   // isScreenFocused = true, // ✅ NEW: Receive screen focus state
//   userId
// }) => {
//   const { selectedCategoryIndex } = useSelector(state => state.category);
//   const listRef = useRef(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // ✅ New Filter API Toggle
//   const [filterApi, setFilterApi] = useState(true);

//   // ✅ Single center item tracking
//   const [centerItemId, setCenterItemId] = useState(null);
//   const [playableItemId, setPlayableItemId] = useState(null);

//   const viewportTimerRef = useRef(null);
//   const lastFetchTimeRef = useRef(0);
//   const isLoadingRef = useRef(false);
//   const apiCallCountRef = useRef(0);

//   // Get categories
//   const { data, isLoading: isLoadingCategories } = useCategoryNames();
//   const categories = data?.list || [];

//   const categoriesWithAll = useMemo(() => {
//     const allCategory = { id: '6834c7f5632a2871571413f7', name: 'All' };
//     const filtered = categories.filter(cat => cat.name?.toLowerCase() !== 'all');
//     return [allCategory, ...filtered];
//   }, [categories]);

//   const selectedCategoryName = categoriesWithAll[selectedCategoryIndex]?.name;

//   // ✅ 1. Legacy Query (Old Code)
//   const legacyQuery = usegetPostsByCategory(selectedCategoryName, LIMIT);

//   // ✅ 2. Smart Feed Query (New Code)
//   const smartQuery = useUserProfileFeed(selectedCategoryName, LIMIT,userId);

//   // ✅ 3. Select active query data based on toggle
//   const {
//     data: allItems,
//     isLoading,
//     error,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     refetch,
//     // ✅ Add bi-directional scrolling support
//     fetchPreviousPage,
//     hasPreviousPage,
//     isFetchingPreviousPage,
//   } = filterApi ? smartQuery : legacyQuery;

//   // ✅ Handle scroll to top for bi-directional fetching
//   const lastContentOffset = useRef(0);
//   const isScrollingUp = useRef(false);

//   const handleScroll = (event) => {
//     const currentOffsetY = event.nativeEvent.contentOffset.y;

//     // 1. Detect Direction
//     if (currentOffsetY < lastContentOffset.current) {
//       isScrollingUp.current = true;
//     } else if (currentOffsetY > lastContentOffset.current) {
//       isScrollingUp.current = false;
//     }
//     lastContentOffset.current = currentOffsetY;

//     // 2. Trigger "Fetch Newer" (Gap Filling)
//     // Trigger if scrolling UP AND near top (e.g. < 500px) to ensure smooth loading before hitting edge
//     if (isScrollingUp.current && currentOffsetY < 500 && hasPreviousPage && !isFetchingPreviousPage && filterApi) {
//       // console.log('🔼 SCROLL UP DETECTED (Near Top): Fetching newer posts...');
//       fetchPreviousPage();
//     }

//     // Call external scroll handler if exists
//     if (externalOnScroll) {
//       externalOnScroll(event);
//     }
//   };


//   // ✅ CRITICAL: Pause all videos when screen loses focus
//   useEffect(() => {
//     if (!isScreenFocused) {
//       console.log('🚫 Screen unfocused - Clearing playable video');
//       setPlayableItemId(null);
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     }
//   }, [isScreenFocused]);








//   // ✅ UPDATED: Only allow playback if screen is focused
//   useEffect(() => {
//     if (viewportTimerRef.current) {
//       clearTimeout(viewportTimerRef.current);
//       viewportTimerRef.current = null;
//     }

//     if (!centerItemId || !isScreenFocused) {
//       setPlayableItemId(null);
//       return;
//     }

//     if (centerItemId !== playableItemId) {
//       setPlayableItemId(null);
//     }

//     viewportTimerRef.current = setTimeout(() => {
//       console.log('▶️ Item now playable:', centerItemId);
//       setPlayableItemId(centerItemId);
//     }, VIEWPORT_STAY_DURATION);

//     return () => {
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     };
//   }, [centerItemId, isScreenFocused]);






//   // ✅ Set initial center item - REMOVED to prevent race condition.
//   // FlashList onViewableItemsChanged handles this naturally after layout.
//   // useEffect(() => {
//   //   if (allItems && allItems.length > 0) {
//   //     setCenterItemId(allItems[0]._id);
//   //   }
//   // }, [allItems]);

//   // ✅ Track previous category to save position on change
//   const prevCategoryRef = useRef(selectedCategoryName);
//   const centerItemIdRef = useRef(centerItemId); // Ref to hold latest without dependency loop

//   // Keep ref in sync
//   useEffect(() => {
//     centerItemIdRef.current = centerItemId;
//   }, [centerItemId]);

//   // // ✅ 1. SAVE SCROLL POSITION (Cleanup Effect)
//   // // This logic runs when category changes OR component unmounts
//   // useEffect(() => {
//   //   return () => {
//   //     const categoryToSave = prevCategoryRef.current;
//   //     const itemToSave = centerItemIdRef.current;

//   //     if (categoryToSave && itemToSave) {
//   //       console.log(`💾 [Feed] Saving Scroll on LEAVE/CHANGE: ${categoryToSave} -> ${itemToSave}`);
//   //       saveScrollPosition(categoryToSave, itemToSave);
//   //     }
//   //   };
//   // }, [selectedCategoryName]); // Runs cleanup when this changes

//   // // ✅ 2. RESTORE SCROLL POSITION (Mount/Change Effect)
//   // useEffect(() => {
//   //   // Update ref for next save
//   //   prevCategoryRef.current = selectedCategoryName;

//   //   if (selectedCategoryName && listRef.current) {
//   //     console.log(`🔄 CATEGORY CHANGED: ${selectedCategoryName}`);

//   //     const savedId = smartQuery.initialScrollIndex;

//   //     if (savedId) {
//   //       console.log(`📍 RESTORING SCROLL to: ${savedId}`);

//   //       // Small timeout to allow FlashList to settle with new data
//   //       setTimeout(() => {
//   //         try {
//   //           listRef.current?.scrollToItem({ item: { _id: savedId }, animated: false });
//   //         } catch (e) {
//   //           console.log('⚠️ Scroll restore failed (item missing?)', e);
//   //           listRef.current?.scrollToOffset({ offset: 0, animated: false });
//   //         }
//   //       }, 100);
//   //     } else {
//   //       // Normal Reset
//   //       listRef.current.scrollToOffset({ offset: 0, animated: false });
//   //     }

//   //     isLoadingRef.current = false;
//   //     lastFetchTimeRef.current = 0;
//   //     apiCallCountRef.current = 0;

//   //     setPlayableItemId(null);
//   //     if (viewportTimerRef.current) {
//   //       clearTimeout(viewportTimerRef.current);
//   //       viewportTimerRef.current = null;
//   //     }
//   //   }
//   // }, [selectedCategoryName, smartQuery.initialScrollIndex]);

//   // ✅ Viewport timer management
//   useEffect(() => {
//     if (viewportTimerRef.current) {
//       clearTimeout(viewportTimerRef.current);
//       viewportTimerRef.current = null;
//     }

//     if (!centerItemId) {
//       setPlayableItemId(null);
//       return;
//     }

//     if (centerItemId !== playableItemId) {
//       setPlayableItemId(null);
//     }

//     viewportTimerRef.current = setTimeout(() => {
//       console.log('▶️ Item now playable:', centerItemId);
//       setPlayableItemId(centerItemId);
//     }, VIEWPORT_STAY_DURATION);

//     return () => {
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     };
//   }, [centerItemId]);

//   // // ✅ Refresh
//   // const onRefresh = useCallback(async () => {
//   //   console.log('🔄 MANUAL REFRESH TRIGGERED');
//   //   setRefreshing(true);
//   //   apiCallCountRef.current = 0;
//   //   try {
//   //     await refetch();
//   //   } finally {
//   //     setRefreshing(false);
//   //   }
//   // }, [refetch]);

//   // ✅ Load more with strict debounce
//   const loadMoreData = useCallback(() => {
//     const now = Date.now();

//     if (now - lastFetchTimeRef.current < 2000) {
//       console.log('⏸️ API CALL BLOCKED - Too soon (debounced)');
//       return;
//     }

//     if (isLoadingRef.current || isFetchingNextPage || !hasNextPage || refreshing) {
//       console.log('⏸️ API CALL BLOCKED - Already loading or no more pages');
//       return;
//     }

//     console.log('📥 TRIGGERING NEXT PAGE LOAD');
//     isLoadingRef.current = true;
//     lastFetchTimeRef.current = now;

//     fetchNextPage().finally(() => {
//       isLoadingRef.current = false;
//     });
//   }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

//   // ✅ OnEndReached with logging
//   const onEndReached = useCallback(() => {
//     console.log('📍 onEndReached TRIGGERED');
//     if (hasNextPage && !isLoadingRef.current && !isFetchingNextPage && !refreshing) {
//       loadMoreData();
//     } else {
//       console.log('⏸️ onEndReached IGNORED - Conditions not met');
//     }
//   }, [hasNextPage, isFetchingNextPage, refreshing, loadMoreData]);

//   // ✅ Combine internal viewport tracking with external scroll handler
//   const handleScrollCombined = useCallback((event) => {
//     // Call our new scroll handler which handles bi-directional fetching AND external events
//     handleScroll(event);

//     // Internal viewport tracking remains unchanged
//     // (viewabilityConfigCallbackPairs handles this)
//   }, [externalOnScroll, hasPreviousPage, isFetchingPreviousPage, filterApi, fetchPreviousPage]);

//   // ✅ CRITICAL: Simplified viewport detection
//   const onViewableItemsChanged = useCallback(({ viewableItems }) => {
//     if (!viewableItems || viewableItems.length === 0) {
//       setCenterItemId(null);
//       return;
//     }

//     // Get the most visible item
//     const mostVisible = viewableItems.reduce((prev, current) => {
//       const prevPercent = prev.item?.viewablePercentage || 0;
//       const currentPercent = current.item?.viewablePercentage || 0;
//       return currentPercent > prevPercent ? current : prev;
//     });

//     if (mostVisible && mostVisible.item?._id && mostVisible.item._id !== centerItemId) {
//       console.log('👁️ CENTER ITEM:', mostVisible.item._id, '| Visibility:', mostVisible.item.viewablePercentage + '%');
//       setCenterItemId(mostVisible.item._id);
//     }
//   }, [centerItemId]);

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 50,
//     minimumViewTime: 70,
//     waitForInteraction: false,
//   }).current;

//   const viewabilityConfigCallbackPairs = useRef([
//     { viewabilityConfig, onViewableItemsChanged }
//   ]).current;

//   // ✅ Render item
//   const renderItem = useCallback(({ item }) => {
//     const isVisible = centerItemId === item._id;
//     const isPlayable = playableItemId === item._id;

//     return (
//       <Card
//         item={item}
//         isVisible={isVisible}
//         isPlayable={isPlayable}
//       />
//     );
//   }, [centerItemId, playableItemId]);

//   const keyExtractor = useCallback((item) => item._id, []);

//   // ✅ Content inset for sticky category
//   const contentContainerStyle = useMemo(() => ({
//     paddingVertical: 5,
//     paddingTop: categorySticky ? categoryHeight : 5,
//   }), [categorySticky, categoryHeight]);

//   // ✅ Components
//   const refreshControl = useMemo(() => (
//     <RefreshControl
//       refreshing={refreshing}
//       onRefresh={onRefresh}
//       colors={['#1FFFA5']}
//       tintColor="#1FFFA5"
//     />
//   ), [refreshing, onRefresh]);

//   // ✅ Combine external header with footer
//   const CombinedListHeaderComponent = useMemo(() => {
//     if (!ExternalHeader) return null;
//     return ExternalHeader;
//   }, [ExternalHeader]);

//   const ListFooterComponent = useMemo(() => {
//     if (!isFetchingNextPage) return null;
//     return (
//       <View style={styles.footerContainer}>
//         <SkeletonPost />
//       </View>
//     );
//   }, [isFetchingNextPage]);

//   const ListEmptyComponent = useMemo(() => {
//     if (isLoading || isLoadingCategories) {
//       return (
//         <View style={styles.centerContainer}>
//           {[0, 1, 2].map((i) => (
//             <SkeletonPost key={`skeleton-empty-${i}`} />
//           ))}
//         </View>
//       );
//     }

//     if (error) {
//       return (
//         <View style={styles.centerContainer}>
//           <Text style={styles.errorText}>Failed to load feed. Pull down to retry.</Text>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.centerContainer}>
//         <Text style={styles.emptyText}>No posts available</Text>
//       </View>
//     );
//   }, [isLoading, isLoadingCategories, error]);

//   if (isLoading || isLoadingCategories) {
//     return (
//       <View style={styles.centerContainer}>
//         {[0, 1, 2].map((i) => (
//           <SkeletonPost key={`skeleton-loading-${i}`} />
//         ))}
//       </View>
//     );
//   }

//   // ✅ CONDITIONAL RENDERING OF FLASHLIST
//   return (
//     <View style={styles.container}>
//       {filterApi ? (
//         <FlashList
//           ref={listRef}
//           data={allItems || []}
//           renderItem={renderItem}
//           keyExtractor={keyExtractor}
//           onScroll={handleScrollCombined}
//           scrollEventThrottle={scrollEventThrottle}
//           onEndReached={onEndReached}
//           onEndReachedThreshold={0.5}
//           showsVerticalScrollIndicator={false}
//           estimatedItemSize={480}
//           ListHeaderComponent={CombinedListHeaderComponent}
//           ListFooterComponent={ListFooterComponent}
//           ListEmptyComponent={ListEmptyComponent}
//           contentContainerStyle={contentContainerStyle}
//           refreshControl={refreshControl}
//           viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
//         />
//       ) : (
//         <FlashList
//           ref={listRef}
//           data={allItems || []}
//           renderItem={renderItem}
//           keyExtractor={keyExtractor}
//           onScroll={handleScrollCombined}
//           scrollEventThrottle={scrollEventThrottle}
//           onEndReached={onEndReached}
//           onEndReachedThreshold={0.5}
//           showsVerticalScrollIndicator={false}
//           estimatedItemSize={480}
//           ListHeaderComponent={CombinedListHeaderComponent}
//           ListFooterComponent={ListFooterComponent}
//           ListEmptyComponent={ListEmptyComponent}
//           contentContainerStyle={contentContainerStyle}
//           refreshControl={refreshControl}
//           viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//   },
//   contentContainer: {
//     paddingVertical: 5,
//   },
//   footerContainer: {
//     paddingHorizontal: 12,
//     paddingBottom: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#ff4444',
//     textAlign: 'center',
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//   },
// });

// export default Feed;

