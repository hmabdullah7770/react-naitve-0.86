import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

// ✅ FlatList from RNGH so PanGestureHandler → FlatList handoff works on Android.
import { FlatList } from 'react-native-gesture-handler';

import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import { useSmartFilteredFeed } from '../../ReactQuery/TanstackDB/FilterCategoury';
import ReelCard from '../tabNavigation/components/ReelCard';

// Width is safe to capture at module level; height is NOT (status bar changes it on Android).
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LIMIT             = 20;
const VIEWPORT_STAY_MS  = 50;
const FETCH_PREV_DEBOUNCE = 2000;

const PostReelScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const isFocused  = useIsFocused();
  const { postId, categoryName } = route.params;

  const listRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1 — MEASURE REAL HEIGHT BEFORE RENDERING ANY ITEMS
  //
  // Problem: Dimensions.get('window').height is evaluated once when the JS
  // bundle loads, BEFORE StatusBar hidden takes effect. On Android, hiding
  // the status bar adds ~24-28 px to the window. The stale value makes every
  // getItemLayout offset wrong, so pagingEnabled snaps to positions between
  // posts instead of to post boundaries — causing visible skips.
  //
  // Fix: render the FlatList with NO data on the first pass. onLayout fires
  // immediately after the first real layout (with StatusBar applied), giving
  // us the correct height. Only then do we hand data to the FlatList.
  // We also keep the stale value as a seed so getItemLayout is never 0.
  // ─────────────────────────────────────────────────────────────────────────
  const [itemHeight,   setItemHeight]   = useState(Dimensions.get('window').height);
  const [layoutReady,  setLayoutReady]  = useState(false);

  const onListLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      setItemHeight(h);
      setLayoutReady(true);   // ← unlock FlatList data
    }
  }, []);

  // Memoised on itemHeight so getItemLayout stays in sync after layout fires.
  const getItemLayout = useCallback(
    (_, index) => ({ length: itemHeight, offset: itemHeight * index, index }),
    [itemHeight],
  );

  const [centerItemId,   setCenterItemId]   = useState(null);
  const [playableItemId, setPlayableItemId] = useState(null);
  const viewportTimerRef = useRef(null);

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

  // ── Scroll to the tapped post once layout is ready AND data has arrived ──
  const hasScrolled = useRef(false);
  useEffect(() => {
    // Wait for layout so getItemLayout uses the correct height.
    if (!layoutReady || !allItems?.length || !postId || hasScrolled.current) return;
    const index = allItems.findIndex(p => p._id === postId);
    if (index > 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index, animated: false });
      }, 80);
    }
    hasScrolled.current = true;
  }, [layoutReady, allItems, postId]);

  // ── Viewport timer ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(viewportTimerRef.current);
    if (!centerItemId || !isFocused) { setPlayableItemId(null); return; }
    if (centerItemId !== playableItemId) setPlayableItemId(null);
    viewportTimerRef.current = setTimeout(
      () => setPlayableItemId(centerItemId),
      VIEWPORT_STAY_MS,
    );
    return () => clearTimeout(viewportTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerItemId, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      setPlayableItemId(null);
      clearTimeout(viewportTimerRef.current);
    }
  }, [isFocused]);

  useEffect(() => {
    return () => {
      setPlayableItemId(null);
      clearTimeout(viewportTimerRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 2 — MID-LIST FORWARD PAGINATION
  //
  // Old code used a ref (currentIndexRef) inside a useEffect that depended on
  // allItems state — so it could fire with a stale index value and trigger
  // double-fetches. Replaced with a proper state-based currentIndex so the
  // effect always runs with the correct value.
  // ─────────────────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const total   = allItems?.length || 0;
    const halfway = Math.floor(total / 2);
    if (total > 0 && currentIndex >= halfway && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, allItems, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 3 — PREVENT POST-SKIP WHEN PREPENDING
  //
  // Problem: fetchPreviousPage prepends N posts to the list. The FlatList
  // stays at the same pixel offset, which now points to a completely different
  // post (everything shifted down by N * itemHeight). This is why Image 2 in
  // your screenshot shows a random wrong post.
  //
  // Fix: maintainVisibleContentPosition tells FlatList to adjust its scroll
  // offset automatically when items are inserted before the current position.
  // minIndexForVisible:1 means "keep the first visible item stable".
  //
  // We also restrict fetchPreviousPage to only trigger when truly at the top
  // (y < itemHeight) rather than the old 2-screen threshold — in reel mode
  // this is the first post, not posts 1–3.
  // ─────────────────────────────────────────────────────────────────────────
  const lastOffsetY = useRef(0);
  const handleScroll = useCallback((event) => {
    const y       = event.nativeEvent.contentOffset.y;
    const goingUp = y < lastOffsetY.current;
    lastOffsetY.current = y;

    // Only fetch previous when the user is genuinely at the top post.
    if (
      goingUp &&
      y < itemHeight &&          // ← within the first post, not 2 screens
      !isFetchingPrevRef.current &&
      Date.now() - lastFetchPrevRef.current > FETCH_PREV_DEBOUNCE
    ) {
      lastFetchPrevRef.current = Date.now();
      fetchPreviousPage();
    }
  }, [fetchPreviousPage, itemHeight]);

  const handleScrollToIndexFailed = useCallback((info) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 300);
  }, []);

  // ── Viewability ────────────────────────────────────────────────────────────
  const stableOnViewable = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) { setCenterItemId(null); return; }
    const visible = viewableItems[0]?.item;
    if (!visible?._id) return;
    setCenterItemId(prev => prev === visible._id ? prev : visible._id);

    // Update currentIndex (state, not ref) for mid-list pagination.
    const idx = allItemsRef.current.findIndex(p => p._id === visible._id);
    if (idx !== -1) setCurrentIndex(idx);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 50,
    waitForInteraction: false,
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: stableOnViewable },
  ]).current;

  // ── Render ──────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => (
      <ReelCard
        item={item}
        isVisible={centerItemId    === item._id}
        isPlayable={isFocused && playableItemId === item._id}
        itemHeight={itemHeight}
      />
    ),
    [centerItemId, playableItemId, itemHeight, isFocused],
  );

  const keyExtractor = useCallback((item) => String(item._id), []);

  return (
    <View style={styles.container} onLayout={onListLayout}>
      <StatusBar hidden />

      {/* <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Icon name="close" size={26} color="#fff" />
      </TouchableOpacity> */}

      <FlatList
        ref={listRef}
        // FIX 1: pass empty array until layout has been measured so that
        // getItemLayout is correct before any item renders or scrolls occur.
        data={layoutReady ? (allItems || []) : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}

        onScroll={handleScroll}
        scrollEventThrottle={16}

        pagingEnabled
        disableIntervalMomentum={true}

        getItemLayout={getItemLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}

        showsVerticalScrollIndicator={false}
        decelerationRate="fast"

        windowSize={5}
        maxToRenderPerBatch={2}
        initialNumToRender={3}

        // FIX 3: auto-adjusts scroll offset when items are prepended so the
        // currently visible post doesn't jump to a different one.
        maintainVisibleContentPosition={{ minIndexForVisible: 1 }}

        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}

        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostReelScreen;
// // PostReelScreen.js
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   Dimensions,
//   TouchableOpacity,
//   StatusBar,
// } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { FlashList } from '@shopify/flash-list';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { useSmartFilteredFeed } from '../../ReactQuery/TanstackDB/FilterCategoury';
// import ReelCard from '../tabNavigation/components/ReelCard';
// const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// const LIMIT = 20;
// const VIEWPORT_STAY_MS = 50;
// const FETCH_DEBOUNCE_MS = 2000;

// const PostReelScreen = () => {
//   const navigation = useNavigation();
//   const route      = useRoute();
//   const { postId, categoryName } = route.params;

//   const listRef = useRef(null);

//   // ── Video playback state ───────────────────────────────────────────────────
//   const [centerItemId,    setCenterItemId]    = useState(null);
//   const [playableItemId,  setPlayableItemId]  = useState(null);
//   const viewportTimerRef = useRef(null);

//   // ── Fetch debounce refs ────────────────────────────────────────────────────
//   const lastFetchDownRef  = useRef(0);
//   const isFetchingDownRef = useRef(false);

//   // ── Same hook as Feed — hits TanStack cache, no extra API call ────────────
//   const {
//     data: allItems,
//     isLoading,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useSmartFilteredFeed(categoryName, LIMIT);

//   // ── Scroll to tapped post once data loads ─────────────────────────────────
//   const hasScrolled = useRef(false);
//   useEffect(() => {
//     if (!allItems?.length || !postId || hasScrolled.current) return;
//     const index = allItems.findIndex(p => p._id === postId);
//     if (index > 0) {
//       setTimeout(() => {
//         listRef.current?.scrollToIndex({ index, animated: false });
//       }, 100);
//     }
//     hasScrolled.current = true;
//   }, [allItems, postId]);

//   // ── Viewport timer — same as Feed ─────────────────────────────────────────
//   useEffect(() => {
//     clearTimeout(viewportTimerRef.current);
//     if (!centerItemId) {
//       setPlayableItemId(null);
//       return;
//     }
//     if (centerItemId !== playableItemId) setPlayableItemId(null);
//     viewportTimerRef.current = setTimeout(
//       () => setPlayableItemId(centerItemId),
//       VIEWPORT_STAY_MS,
//     );
//     return () => clearTimeout(viewportTimerRef.current);
//   }, [centerItemId]);

//   // ── Pause videos on unmount ────────────────────────────────────────────────
//   useEffect(() => {
//     return () => {
//       setPlayableItemId(null);
//       clearTimeout(viewportTimerRef.current);
//     };
//   }, []);

//   // ── Keep latest values accessible inside stable viewability callback ───────
//   const reelStateRef = useRef({});
//   reelStateRef.current = {
//     allItems,
//     hasNextPage,
//     isFetchingNextPage,
//     fetchNextPage,
//     centerItemId,
//   };

//   // ── Viewability — drives both video playback AND cursor pagination ─────────
//   //
//   // In reel mode exactly 1 item is visible at a time (full screen + pagingEnabled).
//   // So viewableItems[0] is always the current reel the user is watching.
//   //
//   // Pagination logic:
//   //   - Find the index of the visible item in allItems
//   //   - If it is the LAST item → fire fetchNextPage()
//   //   - TanStack uses the last cursor stored in its cache for this category
//   //   - Next 20 items are appended automatically
//   //
//   const stableOnViewable = useRef(({ viewableItems }) => {
//     const {
//       allItems,
//       hasNextPage,
//       isFetchingNextPage,
//       fetchNextPage,
//       centerItemId,
//     } = reelStateRef.current;

//     if (!viewableItems?.length) {
//       setCenterItemId(null);
//       return;
//     }

//     // Only 1 item visible in full-screen reel mode
//     const visibleItem = viewableItems[0]?.item;
//     if (!visibleItem?._id) return;

//     // ── Update center item for video playback ────────────────────────────────
//     if (visibleItem._id !== centerItemId) {
//       setCenterItemId(visibleItem._id);
//     }

//     // ── Cursor-based fetch: fire when last item enters viewport ──────────────
//     const allPosts     = allItems || [];
//     const totalItems   = allPosts.length;
//     const currentIndex = allPosts.findIndex(p => p._id === visibleItem._id);
//     const isLastItem   = currentIndex === totalItems - 1;

//     if (
//       isLastItem &&
//       hasNextPage &&
//       !isFetchingNextPage &&
//       !isFetchingDownRef.current &&
//       Date.now() - lastFetchDownRef.current > FETCH_DEBOUNCE_MS
//     ) {
//       console.log(
//         `📄 [ReelScreen] Last item visible (${currentIndex + 1}/${totalItems})`,
//         `→ fetching next 20 | cursor: ${visibleItem.inCategoryId}`,
//       );
//       isFetchingDownRef.current = true;
//       lastFetchDownRef.current  = Date.now();
//       fetchNextPage().finally(() => {
//         isFetchingDownRef.current = false;
//       });
//     }
//   }).current;

//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 80, // item must be 80% visible (full screen)
//     minimumViewTime: 100,
//     waitForInteraction: false,
//   }).current;

//   const viewabilityConfigCallbackPairs = useRef([
//     { viewabilityConfig, onViewableItemsChanged: stableOnViewable },
//   ]).current;

//   // ── Render ─────────────────────────────────────────────────────────────────
//   const renderItem = useCallback(({ item }) => (
//     <ReelCard
//       item={item}
//       isVisible={centerItemId   === item._id}
//       isPlayable={playableItemId === item._id}
//     />
//   ), [centerItemId, playableItemId]);

//   const keyExtractor = useCallback((item) => item._id, []);

//   return (
//     <View style={styles.container}>
//       <StatusBar hidden />

//       {/* Close button */}
//       <TouchableOpacity
//         style={styles.closeBtn}
//         onPress={() => navigation.goBack()}
//         activeOpacity={0.8}
//       >
//         <Icon name="close" size={26} color="#fff" />
//       </TouchableOpacity>


//       <FlashList
//         ref={listRef}
//         data={allItems || []}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         pagingEnabled                        // ← snaps one full-screen item at a time
//         decelerationRate="fast"
//         showsVerticalScrollIndicator={false}
//           directionalLockEnabled={true}       // ← add this
//         estimatedItemSize={SCREEN_HEIGHT}
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
//       overflow: 'hidden',
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