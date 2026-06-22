import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useCategoryNames } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
import { useSmartFilteredFeed, saveScrollPosition, } from '../../../ReactQuery/TanstackDB/FilterCategoury';
import { usegetPostsByCategoryFavouret } from '../../../ReactQuery/TanStackQueryHooks/useFavouret';
import Card from './Card';
import SkeletonPost from './feed-performance/SkeletonPost';
import { FlashList } from '@shopify/flash-list';
import { resetDeleteStatus } from '../../../Redux/action/post';
import FEATURE_FLAGS from '../../../config/featureFlags';
import useFiveStarFavourite from '../../../hooks/useFiveStarFavourite';
import useRatingQueue from '../../../hooks/useRatingQueue';
import useRemoveFavouretQueue from '../../../hooks/useRemoveFavouretQueue';
// ✅ Fix — add this
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import useHLSPrefetch from '../../../hooks/useHLSPrefetch';

const LIMIT = 20;
const VIEWPORT_STAY_MS = 50;
const FETCH_DEBOUNCE_MS = 2000;
const SCROLL_UP_THRESHOLD = 300;



// ─────────────────────────────────────────────────────────────────────────────
const Feed = ({
  onScroll: externalOnScroll,
  scrollEventThrottle = 16,
  ListHeaderComponent: ExternalHeader,
  categorySticky,
  categoryHeight = 0,
  isScreenFocused = true,
  selectedCategoryId,  // ← receive as prop
}) => {

  console.log('>>>>>>>>[Feed] 🔄 Feed component rendering');
  const navigation = useNavigation(); // ✅ Get navigation instance
  // inside Feed component:
  const queryClient = useQueryClient();
  const { flushOnScreenLeave } = useFiveStarFavourite(); // ← lives here only
  const { flushRatingsOnScreenLeave } = useRatingQueue(); // ✅ Get the screen leave flush function
  const { flushRemovalsOnScreenLeave } = useRemoveFavouretQueue(); // ✅ Get the screen leave flush function


  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      flushOnScreenLeave();
    });
    return unsubscribe;
  }, [navigation]);





  // If the user just switched TO Favouret (from somewhere else), flush


  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      flushRatingsOnScreenLeave();
    });
    return unsubscribe;
  }, [navigation]);


  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      flushRemovalsOnScreenLeave();
    });
    return unsubscribe;
  }, [navigation]);



  const dispatch = useDispatch();
  // const { selectedCategoryIndex } = useSelector(state => state.category);
  // const { selectedCategoryId } = useSelector(state => state.category);
  const deleteStatus = useSelector(state => state.post.deleteStatus);

  const listRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Video playback ──────────────────────────────────────────────────────────
  const [centerItemId, setCenterItemId] = useState(null);
  const [playableItemId, setPlayableItemId] = useState(null);
  const viewportTimerRef = useRef(null);

  // ── Scroll refs ─────────────────────────────────────────────────────────────
  const lastOffsetY = useRef(0);
  const lastFetchDownRef = useRef(0);
  const lastFetchUpRef = useRef(0);
  const isFetchingDownRef = useRef(false);
  const centerItemRef = useRef(null);

  // ── PENDING SCROLL ref ───────────────────────────────────────────────────────
  //
  // THE FIX FOR THE TIMING BUG:
  //
  // Problem: when selectedCategoryName changes, two things happen "at the same time":
  //   1. The scroll effect fires  → but allItems still has OLD data
  //   2. The hook loads new data  → allItems updates AFTER the scroll already ran
  //
  // Fix: instead of scrolling immediately when the category changes,
  //      we STORE what we want to scroll to in pendingScrollRef.
  //      Then a SEPARATE effect watches allItems and executes the scroll
  //      only once data has actually arrived.
  //
  // pendingScrollRef.current shapes:
  //   null                          → no scroll pending
  //   { type: 'top' }               → scroll to absolute top (first visit)
  //   { type: 'item', itemId: '…' } → scroll to a specific saved item
  //
  const pendingScrollRef = useRef(null);

  // ── Categories ──────────────────────────────────────────────────────────────
  const { data, isLoading: isLoadingCategories } = useCategoryNames();
  const categories = data?.list || [];
  const FAVOURET_CATEGORY = { id: '6a0d5ae2ea04eb0e558dd92b', name: 'Favouret' };
  const ALL_CATEGORY = { id: '6834c7f5632a2871571413f7', name: 'All' };

  // const categoriesWithAll = useMemo(() => {
  //   const allCat = { id: '6834c7f5632a2871571413f7', name: 'All' };
  //   return [allCat, ...categories.filter(c => c.name?.toLowerCase() !== 'all')];
  // }, [categories]);
  const categoriesWithAll = useMemo(() => {
    const filteredList = categories.filter(cat => {
      const name = cat.name?.toLowerCase();
      return name !== 'all' && name !== 'favouret';
    });
    return [FAVOURET_CATEGORY, ALL_CATEGORY, ...filteredList];
  }, [categories]);

  // const selectedCategoryName = categoriesWithAll[selectedCategoryIndex]?.name;
  //  const selectedCategoryName = categoriesWithAll[selectedCategoryId]?.name;
  const selectedCategoryName = categoriesWithAll.find(cat => cat.id === selectedCategoryId)?.name;

  const prevCategoryRef = useRef(selectedCategoryName);


  // when user selct favouret we push to favouret queue
  useEffect(() => {
    const prev = prevCategoryRef.current;
    prevCategoryRef.current = selectedCategoryName;

    if (selectedCategoryName === 'Favouret' && prev !== 'Favouret') {
      (async () => {

        queryClient.removeQueries({ queryKey: ['categoryPostDataFavouret'] });

        // queue has items → flush first, then refetch
        await flushOnScreenLeave();

        // await flushOnScreenLeave();
        favouretFeed.refetch();
      })();
    }
  }, [selectedCategoryName])



  // ── Feed data ────────────────────────────────────────────────────────────────
  const isFavouret = selectedCategoryName === 'Favouret';

  const smartFeed = useSmartFilteredFeed(
    isFavouret ? null : selectedCategoryName,   // skip when Favouret
    LIMIT
  );

  const favouretFeed = usegetPostsByCategoryFavouret(
    isFavouret ? 'All' : null,
    // isFavouret ? selectedCategoryName : null,   // skip when NOT Favouret
    LIMIT
  );


  // ── Feed data ────────────────────────────────────────────────────────────────
  const {
    data: allItems,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
    refetch,
    savedScrollPosition,
    categoryFirstPost,

  } = isFavouret ? favouretFeed : smartFeed;

  const isFetchingPrevRef = useRef(false);
  isFetchingPrevRef.current = isFetchingPreviousPage;



  //hls prefetching
  const { clearPrefetchCache } = useHLSPrefetch(centerItemId, allItems);

  // ── Refetch after delete ─────────────────────────────────────────────────────
  useEffect(() => {
    if (deleteStatus === 'success') {
      refetch();
      dispatch(resetDeleteStatus());
    }
  }, [deleteStatus, refetch, dispatch]);

  // ── Pause video when screen loses focus ─────────────────────────────────────
  useEffect(() => {
    if (!isScreenFocused) {
      setPlayableItemId(null);
      clearTimeout(viewportTimerRef.current);
    }
  }, [isScreenFocused]);

  // ── Viewport timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(viewportTimerRef.current);
    if (!centerItemId || !isScreenFocused) {
      setPlayableItemId(null);
      return;
    }
    if (centerItemId !== playableItemId) setPlayableItemId(null);
    viewportTimerRef.current = setTimeout(
      () => setPlayableItemId(centerItemId),
      VIEWPORT_STAY_MS,
    );
    return () => clearTimeout(viewportTimerRef.current);
  }, [centerItemId, isScreenFocused]);

  useEffect(() => { centerItemRef.current = centerItemId; }, [centerItemId]);

  // ── SAVE scroll position when LEAVING a category ─────────────────────────────


  const leavingCategoryRef = useRef(selectedCategoryName);

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) return;
    leavingCategoryRef.current = selectedCategoryName;
    return () => {
      const leavingCat = leavingCategoryRef.current;
      const centreItem = centerItemRef.current;
      if (!leavingCat || !centreItem) return;
      // allItems is captured via closure — still holds the leaving category's data
      const post = (allItems || []).find(p => p._id === centreItem);
      saveScrollPosition(leavingCat, centreItem, post?.inCategoryId ?? null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryName]);

  // ── STEP 1: Category changes → SET the pending scroll, reset state ───────────
  //
  // We do NOT scroll here. We only record WHAT we want to scroll to.
  // The actual scroll happens in Step 2 once allItems has the correct data.
  //
  useEffect(() => {
    // Reset playback and fetch debounce for the new category
    setPlayableItemId(null);
    clearTimeout(viewportTimerRef.current);
    isFetchingDownRef.current = false;
    lastFetchDownRef.current = 0;
    lastFetchUpRef.current = 0;
    clearPrefetchCache(); // ← add here (Hls prefetching)
    if (!FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) {
      if (categoryFirstPost?.itemId) {
        pendingScrollRef.current = { type: 'item', itemId: categoryFirstPost.itemId };
      } else {
        pendingScrollRef.current = { type: 'top' };
      }
    }
    // eslint-disable-line



    // Decide WHAT to scroll to when data arrives

    if (FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) {
      if (savedScrollPosition?.itemId) {
        // User was here before → resume from where they left
        pendingScrollRef.current = { type: 'item', itemId: savedScrollPosition.itemId };
      } else {
        // First visit → go to top
        pendingScrollRef.current = { type: 'top' };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryName]);



  // ── History tracking ────────────────────────────────────────────────────────
  const historyPosts = useRef([]);
  const historyTimerRef = useRef(null);

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_TWO_SECOND_HISTORY) return; // ← guard inside, not outside

    clearTimeout(historyTimerRef.current);
    if (!centerItemId || !isScreenFocused) return;

    historyTimerRef.current = setTimeout(() => {
      const post = (allItems || []).find(p => p._id === centerItemId);
      if (!post) return;

      const alreadySaved = historyPosts.current.some(h => h._id === centerItemId);
      if (alreadySaved) return;

      const entry = {
        _id: post._id,
        inCategoryId: post.inCategoryId ?? null,
        category: selectedCategoryName ?? null,
        watchedAt: new Date().toISOString(),
      };

      historyPosts.current = [...historyPosts.current, entry];
    }, 2000);

    return () => clearTimeout(historyTimerRef.current);
  }, [centerItemId, isScreenFocused, allItems, selectedCategoryName]);

  useEffect(() => {
    if (!FEATURE_FLAGS.USE_TWO_SECOND_HISTORY) return; // ← guard inside

    if (!isScreenFocused) {
      setPlayableItemId(null);
      clearTimeout(viewportTimerRef.current);
      clearTimeout(historyTimerRef.current);
    }
  }, [isScreenFocused]);
  // ── STEP 2: allItems updated → EXECUTE the pending scroll ───────────────────
  //
  // This effect fires every time allItems changes (new category data arrived,
  // or a new page was fetched). We only act if there is a pending scroll.
  //
  // This guarantees the scroll always runs AFTER the list has real data.
  //
  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending || !listRef.current || !allItems?.length) return;

    // Consume the pending scroll so it only fires once
    pendingScrollRef.current = null;

    setTimeout(() => {
      try {
        if (pending.type === 'item') {
          const targetPost = allItems.find(p => p._id === pending.itemId);
          if (targetPost) {
            listRef.current?.scrollToItem({ item: targetPost, animated: false });
            console.log(`📍 [Feed] Scroll restored: "${selectedCategoryName}" → ${pending.itemId}`);
          } else {
            // Saved item not in cache yet → scroll to top instead
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }
        } else {
          // type === 'top'
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
      } catch {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }, 50);
    // allItems is the trigger — fires when data actually arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems]);

  // ── SCROLL HANDLER ────────────────────────────────────────────────────────────
  const handleScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const goingUp = y < lastOffsetY.current;
    lastOffsetY.current = y;

    if (
      goingUp &&
      y < SCROLL_UP_THRESHOLD &&
      !isFetchingPrevRef.current &&
      Date.now() - lastFetchUpRef.current > FETCH_DEBOUNCE_MS
    ) {
      lastFetchUpRef.current = Date.now();
      fetchPreviousPage();
    }

    externalOnScroll?.(event);
  }, [fetchPreviousPage, externalOnScroll]);

  // ── onEndReached ─────────────────────────────────────────────────────────────
  const onEndReached = useCallback(() => {
    const now = Date.now();
    if (
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchingDownRef.current ||
      refreshing ||
      now - lastFetchDownRef.current < FETCH_DEBOUNCE_MS
    ) return;

    isFetchingDownRef.current = true;
    lastFetchDownRef.current = now;
    fetchNextPage().finally(() => { isFetchingDownRef.current = false; });
  }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

  // ── Pull-to-refresh ──────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  // ── Viewability ──────────────────────────────────────────────────────────────
  const viewableCallbackRef = useRef(null);
  viewableCallbackRef.current = ({ viewableItems }) => {
    if (!viewableItems?.length) { setCenterItemId(null); return; }
    const best = viewableItems.reduce((a, b) =>
      (b.item?.viewablePercentage || 0) > (a.item?.viewablePercentage || 0) ? b : a,
    );
    if (best?.item?._id && best.item._id !== centerItemId) {
      setCenterItemId(best.item._id);
    }
  };

  const stableOnViewable = useRef((info) => viewableCallbackRef.current(info)).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 70,
    waitForInteraction: false,
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: stableOnViewable },
  ]).current;

  // ── Render helpers ───────────────────────────────────────────────────────────
  // ✅ FIX: selectedCategoryName was used inside but missing from the
  // dependency array. Without it, `activeCategoryName` passed to Card could
  // go stale after a category switch until centerItemId/playableItemId
  // happened to change for unrelated reasons — affecting the categoryName
  // passed to navigation.navigate('PostReel', ...) on card tap.
  const renderItem = useCallback(({ item }) => (
    <Card
      item={item}
      isVisible={centerItemId === item._id}
      isPlayable={playableItemId === item._id}
      activeCategoryName={selectedCategoryName}
    />
  ), [centerItemId, playableItemId, selectedCategoryName]);

  const keyExtractor = useCallback((item) => item._id, []);

  // ✅ FlashList v2 recycling hint: items of the same "type" recycle into
  // each other more efficiently than treating every row as identical. Since
  // Card renders fundamentally different layouts per post (text, single
  // media, 1x1/1x2/1x3/2x2 grids, carousel), telling FlashList the type up
  // front helps it pick better recycling candidates during fast scroll.
  // This intentionally mirrors (a simplified version of) Card's own
  // mediaType logic — FlashList needs the type before the item renders.
  const getItemType = useCallback((item) => {
    const { pattern, imagecount = 0, videocount = 0 } = item;
    const totalMedia = imagecount + videocount;

    if (totalMedia === 0) return 'text';
    if (pattern === 'carousel') return 'carousel';
    if (pattern === '1x2' || pattern === 'grid_1_2') return '1x2';
    if (pattern === '1x3' || pattern === 'grid_1_3') return '1x3';
    if (pattern === '2x2' || pattern === 'grid_2x2') return '2x2';
    return 'single-or-grid';
  }, []);

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

  const ListFooterComponent = useMemo(() => (
    isFetchingNextPage
      ? <View style={styles.footer}><SkeletonPost /></View>
      : null
  ), [isFetchingNextPage]);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading || isLoadingCategories) {
      return <View style={styles.center}>{[0, 1, 2].map(i => <SkeletonPost key={i} />)}</View>;
    }
    if (error) {
      return <View style={styles.center}><Text style={styles.errorText}>Failed to load. Pull down to retry.</Text></View>;
    }
    return <View style={styles.center}><Text style={styles.emptyText}>No posts yet</Text></View>;
  }, [isLoading, isLoadingCategories, error]);

  if ((isLoading || isLoadingCategories) && !allItems?.length) {
    return <View style={styles.center}>{[0, 1, 2].map(i => <SkeletonPost key={i} />)}</View>;
  }

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={allItems || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ExternalHeader}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={contentContainerStyle}
        refreshControl={refreshControl}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        maintainVisibleContentPosition={{ disabled: false }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  footer: { paddingHorizontal: 12, paddingBottom: 20 },
  errorText: { fontSize: 16, color: '#ff4444', textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
});

export default Feed;



// +++++++++++++++++++++++++++++++++++++feed a little old+++++++++++++++++++++++++++++++++++++++++++


// import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// import { View, Text, StyleSheet, RefreshControl } from 'react-native';
// import { useSelector, useDispatch } from 'react-redux';
// import { useCategoryNames } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
// import { useSmartFilteredFeed, saveScrollPosition, } from '../../../ReactQuery/TanstackDB/FilterCategoury';
// import { usegetPostsByCategoryFavouret } from '../../../ReactQuery/TanStackQueryHooks/useFavouret';
// import Card from './Card';
// import SkeletonPost from './feed-performance/SkeletonPost';
// import { FlashList } from '@shopify/flash-list';
// import { resetDeleteStatus } from '../../../Redux/action/post';
// import FEATURE_FLAGS from '../../../config/featureFlags';
// import useFiveStarFavourite from '../../../hooks/useFiveStarFavourite';
// import useRatingQueue from '../../../hooks/useRatingQueue';
// import useRemoveFavouretQueue from '../../../hooks/useRemoveFavouretQueue';
// // ✅ Fix — add this
// import { useNavigation } from '@react-navigation/native';
// import { useQueryClient } from '@tanstack/react-query';
// import useHLSPrefetch from '../../../hooks/useHLSPrefetch';

// const LIMIT = 20;
// const VIEWPORT_STAY_MS = 50;
// const FETCH_DEBOUNCE_MS = 2000;
// const SCROLL_UP_THRESHOLD = 300;



// // ─────────────────────────────────────────────────────────────────────────────
// const Feed = ({
//   onScroll: externalOnScroll,
//   scrollEventThrottle = 16,
//   ListHeaderComponent: ExternalHeader,
//   categorySticky,
//   categoryHeight = 0,
//   isScreenFocused = true,
//   selectedCategoryId,  // ← receive as prop
// }) => {

//   console.log('>>>>>>>>[Feed] 🔄 Feed component rendering');
//   const navigation = useNavigation(); // ✅ Get navigation instance
//   // inside Feed component:
//   const queryClient = useQueryClient();
//   const { flushOnScreenLeave } = useFiveStarFavourite(); // ← lives here only
//   const { flushRatingsOnScreenLeave } = useRatingQueue(); // ✅ Get the screen leave flush function
//   const { flushRemovalsOnScreenLeave } = useRemoveFavouretQueue(); // ✅ Get the screen leave flush function


//   useEffect(() => {
//     const unsubscribe = navigation.addListener('blur', () => {
//       flushOnScreenLeave();
//     });
//     return unsubscribe;
//   }, [navigation]);





//   // If the user just switched TO Favouret (from somewhere else), flush


//   useEffect(() => {
//     const unsubscribe = navigation.addListener('blur', () => {
//       flushRatingsOnScreenLeave();
//     });
//     return unsubscribe;
//   }, [navigation]);


//   useEffect(() => {
//     const unsubscribe = navigation.addListener('blur', () => {
//       flushRemovalsOnScreenLeave();
//     });
//     return unsubscribe;
//   }, [navigation]);



//   const dispatch = useDispatch();
//   // const { selectedCategoryIndex } = useSelector(state => state.category);
//   // const { selectedCategoryId } = useSelector(state => state.category);
//   const deleteStatus = useSelector(state => state.post.deleteStatus);

//   const listRef = useRef(null);
//   const [refreshing, setRefreshing] = useState(false);

//   // ── Video playback ──────────────────────────────────────────────────────────
//   const [centerItemId, setCenterItemId] = useState(null);
//   const [playableItemId, setPlayableItemId] = useState(null);
//   const viewportTimerRef = useRef(null);

//   // ── Scroll refs ─────────────────────────────────────────────────────────────
//   const lastOffsetY = useRef(0);
//   const lastFetchDownRef = useRef(0);
//   const lastFetchUpRef = useRef(0);
//   const isFetchingDownRef = useRef(false);
//   const centerItemRef = useRef(null);

//   // ── PENDING SCROLL ref ───────────────────────────────────────────────────────
//   //
//   // THE FIX FOR THE TIMING BUG:
//   //
//   // Problem: when selectedCategoryName changes, two things happen "at the same time":
//   //   1. The scroll effect fires  → but allItems still has OLD data
//   //   2. The hook loads new data  → allItems updates AFTER the scroll already ran
//   //
//   // Fix: instead of scrolling immediately when the category changes,
//   //      we STORE what we want to scroll to in pendingScrollRef.
//   //      Then a SEPARATE effect watches allItems and executes the scroll
//   //      only once data has actually arrived.
//   //
//   // pendingScrollRef.current shapes:
//   //   null                          → no scroll pending
//   //   { type: 'top' }               → scroll to absolute top (first visit)
//   //   { type: 'item', itemId: '…' } → scroll to a specific saved item
//   //
//   const pendingScrollRef = useRef(null);

//   // ── Categories ──────────────────────────────────────────────────────────────
//   const { data, isLoading: isLoadingCategories } = useCategoryNames();
//   const categories = data?.list || [];
//   const FAVOURET_CATEGORY = { id: '6a0d5ae2ea04eb0e558dd92b', name: 'Favouret' };
//   const ALL_CATEGORY = { id: '6834c7f5632a2871571413f7', name: 'All' };

//   // const categoriesWithAll = useMemo(() => {
//   //   const allCat = { id: '6834c7f5632a2871571413f7', name: 'All' };
//   //   return [allCat, ...categories.filter(c => c.name?.toLowerCase() !== 'all')];
//   // }, [categories]);
//   const categoriesWithAll = useMemo(() => {
//     const filteredList = categories.filter(cat => {
//       const name = cat.name?.toLowerCase();
//       return name !== 'all' && name !== 'favouret';
//     });
//     return [FAVOURET_CATEGORY, ALL_CATEGORY, ...filteredList];
//   }, [categories]);

//   // const selectedCategoryName = categoriesWithAll[selectedCategoryIndex]?.name;
//   //  const selectedCategoryName = categoriesWithAll[selectedCategoryId]?.name;
//   const selectedCategoryName = categoriesWithAll.find(cat => cat.id === selectedCategoryId)?.name;

//   const prevCategoryRef = useRef(selectedCategoryName);


//   // when user selct favouret we push to favouret queue
//   useEffect(() => {
//     const prev = prevCategoryRef.current;
//     prevCategoryRef.current = selectedCategoryName;

//     if (selectedCategoryName === 'Favouret' && prev !== 'Favouret') {
//       (async () => {

//         queryClient.removeQueries({ queryKey: ['categoryPostDataFavouret'] });

//         // queue has items → flush first, then refetch
//         await flushOnScreenLeave();

//         // await flushOnScreenLeave();
//         favouretFeed.refetch();
//       })();
//     }
//   }, [selectedCategoryName])



//   // ── Feed data ────────────────────────────────────────────────────────────────
//   const isFavouret = selectedCategoryName === 'Favouret';

//   const smartFeed = useSmartFilteredFeed(
//     isFavouret ? null : selectedCategoryName,   // skip when Favouret
//     LIMIT
//   );

//   const favouretFeed = usegetPostsByCategoryFavouret(
//     isFavouret ? 'All' : null,
//     // isFavouret ? selectedCategoryName : null,   // skip when NOT Favouret
//     LIMIT
//   );


//   // ── Feed data ────────────────────────────────────────────────────────────────
//   const {
//     data: allItems,
//     isLoading,
//     error,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     fetchPreviousPage,
//     isFetchingPreviousPage,
//     refetch,
//     savedScrollPosition,
//     categoryFirstPost,

//   } = isFavouret ? favouretFeed : smartFeed;

//   const isFetchingPrevRef = useRef(false);
//   isFetchingPrevRef.current = isFetchingPreviousPage;



//   //hls prefetching
//   const { clearPrefetchCache } = useHLSPrefetch(centerItemId, allItems);

//   // ── Refetch after delete ─────────────────────────────────────────────────────
//   useEffect(() => {
//     if (deleteStatus === 'success') {
//       refetch();
//       dispatch(resetDeleteStatus());
//     }
//   }, [deleteStatus, refetch, dispatch]);

//   // ── Pause video when screen loses focus ─────────────────────────────────────
//   useEffect(() => {
//     if (!isScreenFocused) {
//       setPlayableItemId(null);
//       clearTimeout(viewportTimerRef.current);
//     }
//   }, [isScreenFocused]);

//   // ── Viewport timer ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     clearTimeout(viewportTimerRef.current);
//     if (!centerItemId || !isScreenFocused) {
//       setPlayableItemId(null);
//       return;
//     }
//     if (centerItemId !== playableItemId) setPlayableItemId(null);
//     viewportTimerRef.current = setTimeout(
//       () => setPlayableItemId(centerItemId),
//       VIEWPORT_STAY_MS,
//     );
//     return () => clearTimeout(viewportTimerRef.current);
//   }, [centerItemId, isScreenFocused]);

//   useEffect(() => { centerItemRef.current = centerItemId; }, [centerItemId]);

//   // ── SAVE scroll position when LEAVING a category ─────────────────────────────


//   const leavingCategoryRef = useRef(selectedCategoryName);

//   useEffect(() => {
//     if (!FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) return;
//     leavingCategoryRef.current = selectedCategoryName;
//     return () => {
//       const leavingCat = leavingCategoryRef.current;
//       const centreItem = centerItemRef.current;
//       if (!leavingCat || !centreItem) return;
//       // allItems is captured via closure — still holds the leaving category's data
//       const post = (allItems || []).find(p => p._id === centreItem);
//       saveScrollPosition(leavingCat, centreItem, post?.inCategoryId ?? null);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedCategoryName]);

//   // ── STEP 1: Category changes → SET the pending scroll, reset state ───────────
//   //
//   // We do NOT scroll here. We only record WHAT we want to scroll to.
//   // The actual scroll happens in Step 2 once allItems has the correct data.
//   //
//   useEffect(() => {
//     // Reset playback and fetch debounce for the new category
//     setPlayableItemId(null);
//     clearTimeout(viewportTimerRef.current);
//     isFetchingDownRef.current = false;
//     lastFetchDownRef.current = 0;
//     lastFetchUpRef.current = 0;
//     clearPrefetchCache(); // ← add here (Hls prefetching)
//     if (!FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) {
//       if (categoryFirstPost?.itemId) {
//         pendingScrollRef.current = { type: 'item', itemId: categoryFirstPost.itemId };
//       } else {
//         pendingScrollRef.current = { type: 'top' };
//       }
//     }
//     // eslint-disable-line



//     // Decide WHAT to scroll to when data arrives

//     if (FEATURE_FLAGS.USE_SAVED_SCROLL_POSITION) {
//       if (savedScrollPosition?.itemId) {
//         // User was here before → resume from where they left
//         pendingScrollRef.current = { type: 'item', itemId: savedScrollPosition.itemId };
//       } else {
//         // First visit → go to top
//         pendingScrollRef.current = { type: 'top' };
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedCategoryName]);



//   // ── History tracking ────────────────────────────────────────────────────────
//   const historyPosts = useRef([]);
//   const historyTimerRef = useRef(null);

//   useEffect(() => {
//     if (!FEATURE_FLAGS.USE_TWO_SECOND_HISTORY) return; // ← guard inside, not outside

//     clearTimeout(historyTimerRef.current);
//     if (!centerItemId || !isScreenFocused) return;

//     historyTimerRef.current = setTimeout(() => {
//       const post = (allItems || []).find(p => p._id === centerItemId);
//       if (!post) return;

//       const alreadySaved = historyPosts.current.some(h => h._id === centerItemId);
//       if (alreadySaved) return;

//       const entry = {
//         _id: post._id,
//         inCategoryId: post.inCategoryId ?? null,
//         category: selectedCategoryName ?? null,
//         watchedAt: new Date().toISOString(),
//       };

//       historyPosts.current = [...historyPosts.current, entry];
//     }, 2000);

//     return () => clearTimeout(historyTimerRef.current);
//   }, [centerItemId, isScreenFocused, allItems, selectedCategoryName]);

//   useEffect(() => {
//     if (!FEATURE_FLAGS.USE_TWO_SECOND_HISTORY) return; // ← guard inside

//     if (!isScreenFocused) {
//       setPlayableItemId(null);
//       clearTimeout(viewportTimerRef.current);
//       clearTimeout(historyTimerRef.current);
//     }
//   }, [isScreenFocused]);
//   // ── STEP 2: allItems updated → EXECUTE the pending scroll ───────────────────
//   //
//   // This effect fires every time allItems changes (new category data arrived,
//   // or a new page was fetched). We only act if there is a pending scroll.
//   //
//   // This guarantees the scroll always runs AFTER the list has real data.
//   //
//   useEffect(() => {
//     const pending = pendingScrollRef.current;
//     if (!pending || !listRef.current || !allItems?.length) return;

//     // Consume the pending scroll so it only fires once
//     pendingScrollRef.current = null;

//     setTimeout(() => {
//       try {
//         if (pending.type === 'item') {
//           const targetPost = allItems.find(p => p._id === pending.itemId);
//           if (targetPost) {
//             listRef.current?.scrollToItem({ item: targetPost, animated: false });
//             console.log(`📍 [Feed] Scroll restored: "${selectedCategoryName}" → ${pending.itemId}`);
//           } else {
//             // Saved item not in cache yet → scroll to top instead
//             listRef.current?.scrollToOffset({ offset: 0, animated: false });
//           }
//         } else {
//           // type === 'top'
//           listRef.current?.scrollToOffset({ offset: 0, animated: false });
//         }
//       } catch {
//         listRef.current?.scrollToOffset({ offset: 0, animated: false });
//       }
//     }, 50);
//     // allItems is the trigger — fires when data actually arrives
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [allItems]);

//   // ── SCROLL HANDLER ────────────────────────────────────────────────────────────
//   const handleScroll = useCallback((event) => {
//     const y = event.nativeEvent.contentOffset.y;
//     const goingUp = y < lastOffsetY.current;
//     lastOffsetY.current = y;

//     if (
//       goingUp &&
//       y < SCROLL_UP_THRESHOLD &&
//       !isFetchingPrevRef.current &&
//       Date.now() - lastFetchUpRef.current > FETCH_DEBOUNCE_MS
//     ) {
//       lastFetchUpRef.current = Date.now();
//       fetchPreviousPage();
//     }

//     externalOnScroll?.(event);
//   }, [fetchPreviousPage, externalOnScroll]);

//   // ── onEndReached ─────────────────────────────────────────────────────────────
//   const onEndReached = useCallback(() => {
//     const now = Date.now();
//     if (
//       !hasNextPage ||
//       isFetchingNextPage ||
//       isFetchingDownRef.current ||
//       refreshing ||
//       now - lastFetchDownRef.current < FETCH_DEBOUNCE_MS
//     ) return;

//     isFetchingDownRef.current = true;
//     lastFetchDownRef.current = now;
//     fetchNextPage().finally(() => { isFetchingDownRef.current = false; });
//   }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

//   // ── Pull-to-refresh ──────────────────────────────────────────────────────────
//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try { await refetch(); } finally { setRefreshing(false); }
//   }, [refetch]);

//   // ── Viewability ──────────────────────────────────────────────────────────────
//   const viewableCallbackRef = useRef(null);
//   viewableCallbackRef.current = ({ viewableItems }) => {
//     if (!viewableItems?.length) { setCenterItemId(null); return; }
//     const best = viewableItems.reduce((a, b) =>
//       (b.item?.viewablePercentage || 0) > (a.item?.viewablePercentage || 0) ? b : a,
//     );
//     if (best?.item?._id && best.item._id !== centerItemId) {
//       setCenterItemId(best.item._id);
//     }
//   };

//   const stableOnViewable = useRef((info) => viewableCallbackRef.current(info)).current;

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 50,
//     minimumViewTime: 70,
//     waitForInteraction: false,
//   }).current;

//   const viewabilityConfigCallbackPairs = useRef([
//     { viewabilityConfig, onViewableItemsChanged: stableOnViewable },
//   ]).current;

//   // ── Render helpers ───────────────────────────────────────────────────────────
//   const renderItem = useCallback(({ item }) => (
//     <Card
//       item={item}
//       isVisible={centerItemId === item._id}
//       isPlayable={playableItemId === item._id}
//       activeCategoryName={selectedCategoryName}
//     />
//   ), [centerItemId, playableItemId]);

//   const keyExtractor = useCallback((item) => item._id, []);

//   const contentContainerStyle = useMemo(() => ({
//     paddingVertical: 5,
//     paddingTop: categorySticky ? categoryHeight : 5,
//   }), [categorySticky, categoryHeight]);

//   const refreshControl = useMemo(() => (
//     <RefreshControl
//       refreshing={refreshing}
//       onRefresh={onRefresh}
//       colors={['#1FFFA5']}
//       tintColor="#1FFFA5"
//     />
//   ), [refreshing, onRefresh]);

//   const ListFooterComponent = useMemo(() => (
//     isFetchingNextPage
//       ? <View style={styles.footer}><SkeletonPost /></View>
//       : null
//   ), [isFetchingNextPage]);

//   const ListEmptyComponent = useMemo(() => {
//     if (isLoading || isLoadingCategories) {
//       return <View style={styles.center}>{[0, 1, 2].map(i => <SkeletonPost key={i} />)}</View>;
//     }
//     if (error) {
//       return <View style={styles.center}><Text style={styles.errorText}>Failed to load. Pull down to retry.</Text></View>;
//     }
//     return <View style={styles.center}><Text style={styles.emptyText}>No posts yet</Text></View>;
//   }, [isLoading, isLoadingCategories, error]);

//   if ((isLoading || isLoadingCategories) && !allItems?.length) {
//     return <View style={styles.center}>{[0, 1, 2].map(i => <SkeletonPost key={i} />)}</View>;
//   }

//   return (
//     <View style={styles.container}>
//       <FlashList
//         ref={listRef}
//         data={allItems || []}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         onScroll={handleScroll}
//         scrollEventThrottle={scrollEventThrottle}
//         onEndReached={onEndReached}
//         onEndReachedThreshold={0.5}
//         showsVerticalScrollIndicator={false}
//         // estimatedItemSize={480}
//         ListHeaderComponent={ExternalHeader}
//         ListFooterComponent={ListFooterComponent}
//         ListEmptyComponent={ListEmptyComponent}
//         contentContainerStyle={contentContainerStyle}
//         refreshControl={refreshControl}
//         viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
//         maintainVisibleContentPosition={{ disabled: false }}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   footer: { paddingHorizontal: 12, paddingBottom: 20 },
//   errorText: { fontSize: 16, color: '#ff4444', textAlign: 'center' },
//   emptyText: { fontSize: 16, color: '#666' },
// });

// export default Feed;








// ______________________________________feed very old ______________________________________


// import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// import { View, Text, StyleSheet, RefreshControl } from 'react-native';
// import { useSelector } from 'react-redux';
// import { useCategoryNames, usegetPostsByCategory } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
// import { useSmartFilteredFeed, saveScrollPosition } from '../../../ReactQuery/TanstackDB/FilterCategoury';
// import Card from './Card';
// import SkeletonPost from './feed-performance/SkeletonPost';
// import { FlashList } from '@shopify/flash-list';
// import {  useDispatch } from 'react-redux';
// import { resetDeleteStatus } from '../../../Redux/action/post';

// // const LIMIT = 20; // ✅ Updated to 20 as requested
// const LIMIT = 20; // ✅ Updated to 20 as requested
// const VIEWPORT_STAY_DURATION = 50;


// const Feed = ({
//   onScroll: externalOnScroll,
//   scrollEventThrottle = 16,
//   ListHeaderComponent: ExternalHeader,
//   categorySticky,
//   categoryHeight = 0,
//   isScreenFocused = true, // ✅ NEW: Receive screen focus state
// }) => {
//   const { selectedCategoryIndex } = useSelector(state => state.category);

//   const deleteStatus = useSelector(state => state.post.deleteStatus);
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
//   const smartQuery = useSmartFilteredFeed(selectedCategoryName, LIMIT);

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

// const dispatch = useDispatch();

// // ✅ THIS is the missing piece — add it after your other useEffects
// useEffect(() => {
//   if (deleteStatus === 'success') {
//     console.log('🗑️ Post deleted - refetching feed:', selectedCategoryName);
//     refetch();
//     dispatch(resetDeleteStatus());  // reset so it doesn't fire again
//   }
// }, [deleteStatus]);




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

//   // ✅ 1. SAVE SCROLL POSITION (Cleanup Effect)
//   // This logic runs when category changes OR component unmounts
//   useEffect(() => {
//     return () => {
//       const categoryToSave = prevCategoryRef.current;
//       const itemToSave = centerItemIdRef.current;

//       if (categoryToSave && itemToSave) {
//         console.log(`💾 [Feed] Saving Scroll on LEAVE/CHANGE: ${categoryToSave} -> ${itemToSave}`);
//         saveScrollPosition(categoryToSave, itemToSave);
//       }
//     };
//   }, [selectedCategoryName]); // Runs cleanup when this changes

//   // ✅ 2. RESTORE SCROLL POSITION (Mount/Change Effect)
//   useEffect(() => {
//     // Update ref for next save
//     prevCategoryRef.current = selectedCategoryName;

//     if (selectedCategoryName && listRef.current) {
//       console.log(`🔄 CATEGORY CHANGED: ${selectedCategoryName}`);

//       const savedId = smartQuery.initialScrollIndex;

//       if (savedId) {
//         console.log(`📍 RESTORING SCROLL to: ${savedId}`);

//         // Small timeout to allow FlashList to settle with new data
//         setTimeout(() => {
//           try {
//             listRef.current?.scrollToItem({ item: { _id: savedId }, animated: false });
//           } catch (e) {
//             console.log('⚠️ Scroll restore failed (item missing?)', e);
//             listRef.current?.scrollToOffset({ offset: 0, animated: false });
//           }
//         }, 100);
//       } else {
//         // Normal Reset
//         listRef.current.scrollToOffset({ offset: 0, animated: false });
//       }

//       isLoadingRef.current = false;
//       lastFetchTimeRef.current = 0;
//       apiCallCountRef.current = 0;

//       setPlayableItemId(null);
//       if (viewportTimerRef.current) {
//         clearTimeout(viewportTimerRef.current);
//         viewportTimerRef.current = null;
//       }
//     }
//   }, [selectedCategoryName, smartQuery.initialScrollIndex]);

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

//   // ✅ Refresh
//   const onRefresh = useCallback(async () => {
//     console.log('🔄 MANUAL REFRESH TRIGGERED');
//     setRefreshing(true);
//     apiCallCountRef.current = 0;
//     try {
//       await refetch();
//     } finally {
//       setRefreshing(false);
//     }
//   }, [refetch]);

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

