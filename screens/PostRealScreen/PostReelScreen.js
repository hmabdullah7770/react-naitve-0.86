import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { useSmartFilteredFeed } from '../../ReactQuery/TanstackDB/FilterCategoury';
import ReelCard from '../tabNavigation/components/ReelCard';

const LIMIT              = 20;
const VIEWPORT_STAY_MS   = 50;
const FETCH_PREV_DEBOUNCE = 2000;

// How many pages to keep MOUNTED around the active one.
// 2 means: active ± 2 = up to 5 real ReelCards mounted at once.
const MOUNT_WINDOW = 2;

const PostReelScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const isFocused  = useIsFocused();
  const { postId, categoryName } = route.params;

  const pagerRef = useRef(null);

  const {
    data: allItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    isFetchingPreviousPage,
  } = useSmartFilteredFeed(categoryName, LIMIT);

  const allItemsRef       = useRef([]);
  const isFetchingPrevRef = useRef(false);
  const lastFetchPrevRef  = useRef(0);

  useEffect(() => { allItemsRef.current       = allItems || []; },         [allItems]);
  useEffect(() => { isFetchingPrevRef.current = isFetchingPreviousPage; }, [isFetchingPreviousPage]);

  // ── Active page / playback state ───────────────────────────────────────
  const [activeIndex,    setActiveIndex]    = useState(0);
  const [playableItemId, setPlayableItemId] = useState(null);
  const viewportTimerRef = useRef(null);

  const activeItemId = allItems?.[activeIndex]?._id ?? null;

  // Viewport-stay timer: same debounce you had, driven by page index now
  // instead of a FlatList viewability callback.
  useEffect(() => {
    clearTimeout(viewportTimerRef.current);
    if (!activeItemId || !isFocused) { setPlayableItemId(null); return; }
    if (activeItemId !== playableItemId) setPlayableItemId(null);
    viewportTimerRef.current = setTimeout(
      () => setPlayableItemId(activeItemId),
      VIEWPORT_STAY_MS,
    );
    return () => clearTimeout(viewportTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setPlayableItemId(null);
      clearTimeout(viewportTimerRef.current);
    }
  }, [isFocused]);

  useEffect(() => () => {
    setPlayableItemId(null);
    clearTimeout(viewportTimerRef.current);
  }, []);

  // ── Initial scroll-to-tapped-post ──────────────────────────────────────
  // PagerView takes `initialPage` on mount, so we compute it once, before
  // first render of the Pager, instead of scrolling after the fact.
  const [initialPage, setInitialPage] = useState(null);
  useEffect(() => {
    if (initialPage !== null || !allItems?.length) return;
    const index = postId ? allItems.findIndex(p => p._id === postId) : 0;
    const safeIndex = index > -1 ? index : 0;
    setInitialPage(safeIndex);
    setActiveIndex(safeIndex);
  }, [allItems, postId, initialPage]);

  // ── Forward pagination (fetch next when past halfway) ──────────────────
  useEffect(() => {
    const total   = allItems?.length || 0;
    const halfway = Math.floor(total / 2);
    if (total > 0 && activeIndex >= halfway && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeIndex, allItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Backward pagination (fetch previous when near the top) ─────────────
  useEffect(() => {
    if (
      activeIndex <= 1 &&
      !isFetchingPrevRef.current &&
      Date.now() - lastFetchPrevRef.current > FETCH_PREV_DEBOUNCE
    ) {
      lastFetchPrevRef.current = Date.now();
      fetchPreviousPage();
    }
  }, [activeIndex, fetchPreviousPage]);

  // ─────────────────────────────────────────────────────────────────────
  // PREPEND CORRECTION
  //
  // Unlike FlatList's maintainVisibleContentPosition, PagerView identifies
  // pages purely by index. If fetchPreviousPage prepends N items, the post
  // that used to be at `activeIndex` is now at `activeIndex + N` — the
  // Pager will keep showing whatever page number it was on, which is now
  // the WRONG post. We detect the prepend by diffing the id that used to
  // sit at index 0, then jump the pager forward by the same delta with no
  // animation so the user never sees it happen.
  // ─────────────────────────────────────────────────────────────────────
  const prevFirstIdRef = useRef(null);
  useEffect(() => {
    const newFirstId = allItems?.[0]?._id ?? null;
    const oldFirstId = prevFirstIdRef.current;

    if (oldFirstId && newFirstId && oldFirstId !== newFirstId) {
      const delta = allItems.findIndex(p => p._id === oldFirstId);
      if (delta > 0) {
        const correctedIndex = activeIndex + delta;
        setActiveIndex(correctedIndex);
        pagerRef.current?.setPageWithoutAnimation(correctedIndex);
      }
    }
    prevFirstIdRef.current = newFirstId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems]);

  const handlePageSelected = useCallback((e) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  const pages = useMemo(() => {
    if (!allItems?.length) return [];
    return allItems.map((item, index) => {
      const inWindow = Math.abs(index - activeIndex) <= MOUNT_WINDOW;
      return (
        <View key={String(item._id)} style={styles.page} collapsable={false}>
          {inWindow ? (
            <ReelCard
              item={item}
              isVisible={index === activeIndex}
              isPlayable={isFocused && playableItemId === item._id}
            />
          ) : (
            // Cheap placeholder — keeps the page slot without mounting
            // the video player / heavy card for far-away items.
            <View style={styles.placeholder} />
          )}
        </View>
      );
    });
  }, [allItems, activeIndex, isFocused, playableItemId]);

  if (initialPage === null) {
    // Wait for the target index to be resolved before mounting the Pager,
    // so it opens on the correct post instead of always page 0.
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        orientation="vertical"
        initialPage={initialPage}
        offscreenPageLimit={MOUNT_WINDOW}
        onPageSelected={handlePageSelected}
      >
        {pages}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default PostReelScreen;

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   Dimensions,
//   TouchableOpacity,
//   StatusBar,
// } from 'react-native';

// // ✅ FlatList from RNGH so PanGestureHandler → FlatList handoff works on Android.
// import { FlatList } from 'react-native-gesture-handler';

// import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
// import Icon from '@react-native-vector-icons/ionicons';
// import { useSmartFilteredFeed } from '../../ReactQuery/TanstackDB/FilterCategoury';
// import ReelCard from '../tabNavigation/components/ReelCard';

// // Width is safe to capture at module level; height is NOT (status bar changes it on Android).
// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// const LIMIT             = 20;
// const VIEWPORT_STAY_MS  = 50;
// const FETCH_PREV_DEBOUNCE = 2000;

// const PostReelScreen = () => {
//   const navigation = useNavigation();
//   const route      = useRoute();
//   const isFocused  = useIsFocused();
//   const { postId, categoryName } = route.params;

//   const listRef = useRef(null);

//   // ─────────────────────────────────────────────────────────────────────────
//   // FIX 1 — MEASURE REAL HEIGHT BEFORE RENDERING ANY ITEMS
//   //
//   // Problem: Dimensions.get('window').height is evaluated once when the JS
//   // bundle loads, BEFORE StatusBar hidden takes effect. On Android, hiding
//   // the status bar adds ~24-28 px to the window. The stale value makes every
//   // getItemLayout offset wrong, so pagingEnabled snaps to positions between
//   // posts instead of to post boundaries — causing visible skips.
//   //
//   // Fix: render the FlatList with NO data on the first pass. onLayout fires
//   // immediately after the first real layout (with StatusBar applied), giving
//   // us the correct height. Only then do we hand data to the FlatList.
//   // We also keep the stale value as a seed so getItemLayout is never 0.
//   // ─────────────────────────────────────────────────────────────────────────
//   const [itemHeight,   setItemHeight]   = useState(Dimensions.get('window').height);
//   const [layoutReady,  setLayoutReady]  = useState(false);

//   const onListLayout = useCallback((e) => {
//     const h = e.nativeEvent.layout.height;
//     if (h > 0) {
//       setItemHeight(h);
//       setLayoutReady(true);   // ← unlock FlatList data
//     }
//   }, []);

//   // Memoised on itemHeight so getItemLayout stays in sync after layout fires.
//   const getItemLayout = useCallback(
//     (_, index) => ({ length: itemHeight, offset: itemHeight * index, index }),
//     [itemHeight],
//   );

//   const [centerItemId,   setCenterItemId]   = useState(null);
//   const [playableItemId, setPlayableItemId] = useState(null);
//   const viewportTimerRef = useRef(null);

//   const {
//     data: allItems,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     fetchPreviousPage,
//     isFetchingPreviousPage,
//   } = useSmartFilteredFeed(categoryName, LIMIT);

//   const allItemsRef       = useRef([]);
//   const isFetchingPrevRef = useRef(false);
//   const lastFetchPrevRef  = useRef(0);

//   useEffect(() => { allItemsRef.current       = allItems || []; },         [allItems]);
//   useEffect(() => { isFetchingPrevRef.current = isFetchingPreviousPage; }, [isFetchingPreviousPage]);

//   // ── Scroll to the tapped post once layout is ready AND data has arrived ──
//   const hasScrolled = useRef(false);
//   useEffect(() => {
//     // Wait for layout so getItemLayout uses the correct height.
//     if (!layoutReady || !allItems?.length || !postId || hasScrolled.current) return;
//     const index = allItems.findIndex(p => p._id === postId);
//     if (index > 0) {
//       setTimeout(() => {
//         listRef.current?.scrollToIndex({ index, animated: false });
//       }, 80);
//     }
//     hasScrolled.current = true;
//   }, [layoutReady, allItems, postId]);

//   // ── Viewport timer ────────────────────────────────────────────────────────
//   useEffect(() => {
//     clearTimeout(viewportTimerRef.current);
//     if (!centerItemId || !isFocused) { setPlayableItemId(null); return; }
//     if (centerItemId !== playableItemId) setPlayableItemId(null);
//     viewportTimerRef.current = setTimeout(
//       () => setPlayableItemId(centerItemId),
//       VIEWPORT_STAY_MS,
//     );
//     return () => clearTimeout(viewportTimerRef.current);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [centerItemId, isFocused]);

//   useEffect(() => {
//     if (!isFocused) {
//       setPlayableItemId(null);
//       clearTimeout(viewportTimerRef.current);
//     }
//   }, [isFocused]);

//   useEffect(() => {
//     return () => {
//       setPlayableItemId(null);
//       clearTimeout(viewportTimerRef.current);
//     };
//   }, []);

//   // ─────────────────────────────────────────────────────────────────────────
//   // FIX 2 — MID-LIST FORWARD PAGINATION
//   //
//   // Old code used a ref (currentIndexRef) inside a useEffect that depended on
//   // allItems state — so it could fire with a stale index value and trigger
//   // double-fetches. Replaced with a proper state-based currentIndex so the
//   // effect always runs with the correct value.
//   // ─────────────────────────────────────────────────────────────────────────
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     const total   = allItems?.length || 0;
//     const halfway = Math.floor(total / 2);
//     if (total > 0 && currentIndex >= halfway && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   }, [currentIndex, allItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

//   // ─────────────────────────────────────────────────────────────────────────
//   // FIX 3 — PREVENT POST-SKIP WHEN PREPENDING
//   //
//   // Problem: fetchPreviousPage prepends N posts to the list. The FlatList
//   // stays at the same pixel offset, which now points to a completely different
//   // post (everything shifted down by N * itemHeight). This is why Image 2 in
//   // your screenshot shows a random wrong post.
//   //
//   // Fix: maintainVisibleContentPosition tells FlatList to adjust its scroll
//   // offset automatically when items are inserted before the current position.
//   // minIndexForVisible:1 means "keep the first visible item stable".
//   //
//   // We also restrict fetchPreviousPage to only trigger when truly at the top
//   // (y < itemHeight) rather than the old 2-screen threshold — in reel mode
//   // this is the first post, not posts 1–3.
//   // ─────────────────────────────────────────────────────────────────────────
//   const lastOffsetY = useRef(0);
//   const handleScroll = useCallback((event) => {
//     const y       = event.nativeEvent.contentOffset.y;
//     const goingUp = y < lastOffsetY.current;
//     lastOffsetY.current = y;

//     // Only fetch previous when the user is genuinely at the top post.
//     if (
//       goingUp &&
//       y < itemHeight &&          // ← within the first post, not 2 screens
//       !isFetchingPrevRef.current &&
//       Date.now() - lastFetchPrevRef.current > FETCH_PREV_DEBOUNCE
//     ) {
//       lastFetchPrevRef.current = Date.now();
//       fetchPreviousPage();
//     }
//   }, [fetchPreviousPage, itemHeight]);

//   const handleScrollToIndexFailed = useCallback((info) => {
//     setTimeout(() => {
//       listRef.current?.scrollToIndex({ index: info.index, animated: false });
//     }, 300);
//   }, []);

//   // ── Viewability ────────────────────────────────────────────────────────────
//   const stableOnViewable = useRef(({ viewableItems }) => {
//     if (!viewableItems?.length) { setCenterItemId(null); return; }
//     const visible = viewableItems[0]?.item;
//     if (!visible?._id) return;
//     setCenterItemId(prev => prev === visible._id ? prev : visible._id);

//     // Update currentIndex (state, not ref) for mid-list pagination.
//     const idx = allItemsRef.current.findIndex(p => p._id === visible._id);
//     if (idx !== -1) setCurrentIndex(idx);
//   }).current;

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 60,
//     minimumViewTime: 50,
//     waitForInteraction: false,
//   }).current;

//   const viewabilityConfigCallbackPairs = useRef([
//     { viewabilityConfig, onViewableItemsChanged: stableOnViewable },
//   ]).current;

//   // ── Render ──────────────────────────────────────────────────────────────
//   const renderItem = useCallback(
//     ({ item }) => (
//       <ReelCard
//         item={item}
//         isVisible={centerItemId    === item._id}
//         isPlayable={isFocused && playableItemId === item._id}
//         itemHeight={itemHeight}
//       />
//     ),
//     [centerItemId, playableItemId, itemHeight, isFocused],
//   );

//   const keyExtractor = useCallback((item) => String(item._id), []);

//   return (
//     <View style={styles.container} onLayout={onListLayout}>
//       <StatusBar hidden />

//       {/* <TouchableOpacity
//         style={styles.closeBtn}
//         onPress={() => navigation.goBack()}
//         activeOpacity={0.8}
//       >
//         <Icon name="close" size={26} color="#fff" />
//       </TouchableOpacity> */}

//       <FlatList
//         ref={listRef}
//         // FIX 1: pass empty array until layout has been measured so that
//         // getItemLayout is correct before any item renders or scrolls occur.
//         data={layoutReady ? (allItems || []) : []}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}

//         onScroll={handleScroll}
//         scrollEventThrottle={16}

//         pagingEnabled
//         disableIntervalMomentum={true}

//         getItemLayout={getItemLayout}
//         onScrollToIndexFailed={handleScrollToIndexFailed}

//         showsVerticalScrollIndicator={false}
//         decelerationRate="fast"

//         windowSize={5}
//         maxToRenderPerBatch={2}
//         initialNumToRender={3}

//         // FIX 3: auto-adjusts scroll offset when items are prepended so the
//         // currently visible post doesn't jump to a different one.
//         maintainVisibleContentPosition={{ minIndexForVisible: 1 }}

//         onEndReached={() => {
//           if (hasNextPage && !isFetchingNextPage) fetchNextPage();
//         }}
//         onEndReachedThreshold={0.5}

//         viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     overflow: 'hidden',
//   },
//   closeBtn: {
//     position: 'absolute',
//     top: 50,
//     left: 16,
//     zIndex: 100,
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default PostReelScreen;
