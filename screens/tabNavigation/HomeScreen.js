import {StyleSheet, View, Animated, AccessibilityInfo} from 'react-native';
import React, {useEffect, useState, useCallback, useRef} from 'react';
import sseService from '../../services/SSEprogressbar';
import ProgressBar from './components/ProgressBar';
import {useFocusEffect} from '@react-navigation/native';
import { useSelector } from 'react-redux';

import NavBar from './components/NavBar';
import CategoryList from './components/CategouryList';
import Feed from './components/Feed';
import Banner from './components/Banner';

const HomeScreen = () => {
  const { selectedCategoryId } = useSelector(state => state.category); // ← add this
  // Existing SSE progress state
  const [progressState, setProgressState] = useState({
    progress: 0,
    message: '',
    indeterminate: false,
    visible: false,
  });

  // Animation and scroll state
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [navBarVisible, setNavBarVisible] = useState(true);
  const [categorySticky, setCategorySticky] = useState(false);
  const [layoutMeasurements, setLayoutMeasurements] = useState({
    navBarHeight: 0,
    bannerHeight: 0,
    categoryHeight: 0,
  });


    // ✅ NEW: Screen focus state to control video playback
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // Animation values
  const navBarOpacity = useRef(new Animated.Value(1)).current;
  const navBarTranslateY = useRef(new Animated.Value(0)).current;

  // Performance and accessibility
  const [reduceMotion, setReduceMotion] = useState(false);



   // ✅ CRITICAL: Handle screen focus/blur to pause videos
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 HomeScreen FOCUSED - Videos can play');
      setIsScreenFocused(true);

      return () => {
        console.log('🚫 HomeScreen BLURRED - Pausing all videos');
        setIsScreenFocused(false);
      };
    }, [])
  );

  const handleOpen = useCallback(() => {
    if (__DEV__) console.log('🟢 [HomeScreen] SSE Connection opened');
    setProgressState({
      progress: 0,
      message: 'Connecting...',
      indeterminate: true,
      visible: true,
    });
  }, []);

  const handleProgress = useCallback(data => {
    if (__DEV__) console.log('📊 [HomeScreen] Progress received:', data);

    if (!data || typeof data.progress !== 'number') {
      console.warn('⚠️ [HomeScreen] Invalid progress data:', data);
      return;
    }

    setProgressState({
      progress: data.progress,
      message: data.message || '',
      indeterminate: false,
      visible: true,
    });

    if (data.progress >= 100) {
      if (__DEV__) console.log('✅ [HomeScreen] Upload complete!');
      setTimeout(() => {
        setProgressState(prev => ({...prev, visible: false}));
      }, 2000);
    }
  }, []);

  const handleError = useCallback(error => {
    console.error('❌ [HomeScreen] SSE Error:', error);
    setProgressState({
      progress: 0,
      message: error.error || 'Connection error',
      indeterminate: false,
      visible: false,
    });
  }, []);

  const handleClose = useCallback(() => {
    if (__DEV__) console.log('🔴 [HomeScreen] SSE Connection closed');
    const latest = sseService.getLatestProgress?.();

    if (latest && latest.progress >= 100) {
      setProgressState({
        progress: 100,
        message: latest.message || 'Completed',
        indeterminate: false,
        visible: true,
      });

      setTimeout(() => {
        setProgressState(prev => ({...prev, visible: false}));
      }, 1500);
    } else {
      setProgressState(prev => ({...prev, visible: false}));
    }
  }, []);

  // ✅ CRITICAL FIX: Scroll handler that will be called by Feed component
  const handleScroll = useCallback(
    event => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDirection =
        currentScrollY > lastScrollY.current ? 'down' : 'up';
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // Only update if scroll delta is significant (debouncing)
      if (scrollDelta > 5) {
        // NavBar visibility logic
        const shouldHideNavBar =
          scrollDirection === 'down' && currentScrollY > 50;
        const shouldShowNavBar =
          scrollDirection === 'up' || currentScrollY <= 50;

        if (shouldHideNavBar && navBarVisible) {
          setNavBarVisible(false);
          animateNavBarVisibility(false);
        } else if (shouldShowNavBar && !navBarVisible) {
          setNavBarVisible(true);
          animateNavBarVisibility(true);
        }

        // CategoryList sticky logic
        const bannerScrollThreshold = Math.max(
          layoutMeasurements.bannerHeight - 50,
          0,
        );
        const shouldStickCategory = currentScrollY > bannerScrollThreshold;

        if (shouldStickCategory !== categorySticky) {
          setCategorySticky(shouldStickCategory);
        }

        lastScrollY.current = currentScrollY;
      }
    },
    [navBarVisible, categorySticky, layoutMeasurements],
  );

  // NavBar animation with reduced motion support
  const animateNavBarVisibility = useCallback(
    visible => {
      const toOpacity = visible ? 1 : 0;
      const toTranslateY = visible ? 0 : -layoutMeasurements.navBarHeight;
      const duration = reduceMotion ? 0 : 300;

      Animated.parallel([
        Animated.timing(navBarOpacity, {
          toValue: toOpacity,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(navBarTranslateY, {
          toValue: toTranslateY,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [layoutMeasurements.navBarHeight, reduceMotion],
  );

  // Layout measurement handlers
  const handleNavBarLayout = useCallback(event => {
    const {height} = event.nativeEvent.layout;
    setLayoutMeasurements(prev => ({...prev, navBarHeight: height}));
  }, []);

  const handleBannerLayout = useCallback(event => {
    const {height} = event.nativeEvent.layout;
    setLayoutMeasurements(prev => ({...prev, bannerHeight: height}));
  }, []);

  const handleCategoryLayout = useCallback(event => {
    const {height} = event.nativeEvent.layout;
    setLayoutMeasurements(prev => ({...prev, categoryHeight: height}));
  }, []);

  useEffect(() => {
    console.log('🏠 [HomeScreen] Mounted, subscribing to SSE events');

    sseService.addEventListener('open', handleOpen);
    sseService.addEventListener('progress', handleProgress);
    sseService.addEventListener('error', handleError);
    sseService.addEventListener('close', handleClose);

    if (sseService.isActive()) {
      const latest = sseService.getLatestProgress();
      if (latest && latest.progress > 0) {
        handleProgress(latest);
      }
    }

    return () => {
      console.log('🏠 [HomeScreen] Unmounting, unsubscribing from SSE events');
      sseService.removeEventListener('open', handleOpen);
      sseService.removeEventListener('progress', handleProgress);
      sseService.removeEventListener('error', handleError);
      sseService.removeEventListener('close', handleClose);
    };
  }, [handleOpen, handleProgress, handleError, handleClose]);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReduceMotion = async () => {
      try {
        const isReduceMotionEnabled =
          await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(isReduceMotionEnabled);
      } catch (error) {
        console.log('Could not check reduce motion preference:', error);
      }
    };

    checkReduceMotion();
  }, []);

  const showProgress =
    progressState.visible &&
    (progressState.indeterminate || progressState.progress >= 0) &&
    progressState.progress <= 100;

  // ✅ Create header component for FlatList
  const renderListHeader = useCallback(() => (
    <>
      <View onLayout={handleBannerLayout}>
        <Banner />
      </View>

      {!categorySticky && (
        <View onLayout={handleCategoryLayout}>
          <CategoryList />
        </View>
      )}
    </>
  ), [categorySticky, handleBannerLayout, handleCategoryLayout]);

  return (
    <View style={styles.container}>
      {/* NavBar with animation support */}
      <NavBar
        visible={navBarVisible}
        animatedOpacity={navBarOpacity}
        animatedTranslateY={navBarTranslateY}
        onLayout={handleNavBarLayout}
      />

      {/* Sticky CategoryList - positioned outside when sticky */}
      {categorySticky && (
        <Animated.View
          style={[
            styles.stickyCategory,
            {
              top: navBarVisible ? layoutMeasurements.navBarHeight : 0,
            },
          ]}>
          <CategoryList />
        </Animated.View>
      )}

      {/* ✅ CRITICAL FIX: Feed handles its own scrolling via FlatList */}
      <View style={styles.feedWrapper}>
        <Feed 
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderListHeader}
          contentInsetAdjustmentBehavior="automatic"
          categorySticky={categorySticky}
          categoryHeight={layoutMeasurements.categoryHeight}
             isScreenFocused={isScreenFocused} // ✅ Pas
             selectedCategoryId={selectedCategoryId}  // ← pass it as prop
        />
      </View>

      {/* Progress bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progressState.progress}
            message={progressState.message}
            visible={true}
            variant="minimal"
            showPercentage={true}
            showMessage={true}
            indeterminate={progressState.indeterminate}
          />
        </View>
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
    zIndex: 999,
  },
  feedWrapper: {
    flex: 1,
  },
  stickyCategory: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
});



// import {StyleSheet, View, Animated, AccessibilityInfo} from 'react-native';
// import React, {useEffect, useState, useCallback, useRef} from 'react';
// import sseService from '../../services/SSEprogressbar';
// import ProgressBar from './components/ProgressBar';
// import NavBar from './components/NavBar';
// import CategoryList from './components/CategouryList';
// import Feed from './components/Feed';
// import Banner from './components/Banner';

// const HomeScreen = () => {
//   // Existing SSE progress state
//   const [progressState, setProgressState] = useState({
//     progress: 0,
//     message: '',
//     indeterminate: false,
//     visible: false,
//   });

//   // Animation and scroll state
//   const scrollY = useRef(new Animated.Value(0)).current;
//   const lastScrollY = useRef(0);
//   const [navBarVisible, setNavBarVisible] = useState(true);
//   const [categorySticky, setCategorySticky] = useState(false);
//   const [layoutMeasurements, setLayoutMeasurements] = useState({
//     navBarHeight: 0,
//     bannerHeight: 0,
//     categoryHeight: 0,
//   });

//   // Animation values
//   const navBarOpacity = useRef(new Animated.Value(1)).current;
//   const navBarTranslateY = useRef(new Animated.Value(0)).current;
//   const categoryTop = useRef(new Animated.Value(0)).current;

//   // Performance and accessibility
//   const [reduceMotion, setReduceMotion] = useState(false);

//   const handleOpen = useCallback(() => {
//     if (__DEV__) console.log('🟢 [HomeScreen] SSE Connection opened');
//     setProgressState({
//       progress: 0,
//       message: 'Connecting...',
//       indeterminate: true,
//       visible: true,
//     });
//   }, []);

//   const handleProgress = useCallback(data => {
//     if (__DEV__) console.log('📊 [HomeScreen] Progress received:', data);

//     if (!data || typeof data.progress !== 'number') {
//       console.warn('⚠️ [HomeScreen] Invalid progress data:', data);
//       return;
//     }

//     setProgressState({
//       progress: data.progress,
//       message: data.message || '',
//       indeterminate: false,
//       visible: true,
//     });

//     if (data.progress >= 100) {
//       if (__DEV__) console.log('✅ [HomeScreen] Upload complete!');
//       // Show 100% for 2 seconds before hiding
//       setTimeout(() => {
//         setProgressState(prev => ({...prev, visible: false}));
//       }, 2000);
//     }
//   }, []);

//   const handleError = useCallback(error => {
//     console.error('❌ [HomeScreen] SSE Error:', error);
//     // Hide progress bar on error
//     setProgressState({
//       progress: 0,
//       message: error.error || 'Connection error',
//       indeterminate: false,
//       visible: false,
//     });
//   }, []);

//   const handleClose = useCallback(() => {
//     if (__DEV__) console.log('🔴 [HomeScreen] SSE Connection closed');
//     const latest = sseService.getLatestProgress?.();

//     if (latest && latest.progress >= 100) {
//       // Show completed state briefly
//       setProgressState({
//         progress: 100,
//         message: latest.message || 'Completed',
//         indeterminate: false,
//         visible: true,
//       });

//       // Hide after 1.5 seconds
//       setTimeout(() => {
//         setProgressState(prev => ({...prev, visible: false}));
//       }, 1500);
//     } else {
//       // Connection closed before completion
//       setProgressState(prev => ({...prev, visible: false}));
//     }
//   }, []);

//   // Scroll detection and NavBar visibility logic
//   const handleScroll = useCallback(
//     event => {
//       const currentScrollY = event.nativeEvent.contentOffset.y;
//       const scrollDirection =
//         currentScrollY > lastScrollY.current ? 'down' : 'up';
//       const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

//       // Only update if scroll delta is significant (debouncing)
//       if (scrollDelta > 5) {
//         // NavBar visibility logic
//         const shouldHideNavBar =
//           scrollDirection === 'down' && currentScrollY > 50;
//         const shouldShowNavBar =
//           scrollDirection === 'up' || currentScrollY <= 50;

//         if (shouldHideNavBar && navBarVisible) {
//           setNavBarVisible(false);
//           animateNavBarVisibility(false);
//         } else if (shouldShowNavBar && !navBarVisible) {
//           setNavBarVisible(true);
//           animateNavBarVisibility(true);
//         }

//         // CategoryList sticky logic - stick when banner is mostly scrolled out
//         const bannerScrollThreshold = Math.max(
//           layoutMeasurements.bannerHeight - 50,
//           0,
//         );
//         const shouldStickCategory = currentScrollY > bannerScrollThreshold;

//         if (shouldStickCategory !== categorySticky) {
//           console.log(
//             `🔄 CategoryList sticky change: ${shouldStickCategory}, scrollY: ${currentScrollY}, threshold: ${bannerScrollThreshold}`,
//           );
//           setCategorySticky(shouldStickCategory);
//           animateCategoryPosition(shouldStickCategory);
//         }

//         lastScrollY.current = currentScrollY;
//       }
//     },
//     [navBarVisible, categorySticky, layoutMeasurements],
//   );

//   // NavBar animation with reduced motion support
//   const animateNavBarVisibility = useCallback(
//     visible => {
//       const toOpacity = visible ? 1 : 0;
//       const toTranslateY = visible ? 0 : -layoutMeasurements.navBarHeight;
//       const duration = reduceMotion ? 0 : 300;

//       Animated.parallel([
//         Animated.timing(navBarOpacity, {
//           toValue: toOpacity,
//           duration,
//           useNativeDriver: true,
//         }),
//         Animated.timing(navBarTranslateY, {
//           toValue: toTranslateY,
//           duration,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     },
//     [layoutMeasurements.navBarHeight, reduceMotion],
//   );

//   // CategoryList position animation with reduced motion support
//   const animateCategoryPosition = useCallback(
//     sticky => {
//       // No animation needed since we're using conditional rendering
//       // The sticky positioning is handled by the layout itself
//       console.log(`CategoryList sticky: ${sticky}`);
//     },
//     [navBarVisible, layoutMeasurements.navBarHeight, reduceMotion],
//   );

//   // Layout measurement handlers
//   const handleNavBarLayout = useCallback(event => {
//     const {height} = event.nativeEvent.layout;
//     setLayoutMeasurements(prev => ({...prev, navBarHeight: height}));
//   }, []);

//   const handleBannerLayout = useCallback(event => {
//     const {height} = event.nativeEvent.layout;
//     setLayoutMeasurements(prev => ({...prev, bannerHeight: height}));
//   }, []);

//   const handleCategoryLayout = useCallback(event => {
//     const {height} = event.nativeEvent.layout;
//     setLayoutMeasurements(prev => ({...prev, categoryHeight: height}));
//   }, []);

//   useEffect(() => {
//     console.log('🏠 [HomeScreen] Mounted, subscribing to SSE events');

//     // Subscribe to SSE events
//     sseService.addEventListener('open', handleOpen);
//     sseService.addEventListener('progress', handleProgress);
//     sseService.addEventListener('error', handleError);
//     sseService.addEventListener('close', handleClose);

//     // Check if there's already a connection with progress
//     if (sseService.isActive()) {
//       console.log(
//         '🔄 [HomeScreen] SSE already active, checking for cached progress',
//       );
//       const latest = sseService.getLatestProgress();
//       if (latest && latest.progress > 0) {
//         handleProgress(latest);
//       }
//     }

//     return () => {
//       console.log('🏠 [HomeScreen] Unmounting, unsubscribing from SSE events');
//       sseService.removeEventListener('open', handleOpen);
//       sseService.removeEventListener('progress', handleProgress);
//       sseService.removeEventListener('error', handleError);
//       sseService.removeEventListener('close', handleClose);
//     };
//   }, [handleOpen, handleProgress, handleError, handleClose]);

//   // Check for reduced motion preference
//   useEffect(() => {
//     const checkReduceMotion = async () => {
//       try {
//         const isReduceMotionEnabled =
//           await AccessibilityInfo.isReduceMotionEnabled();
//         setReduceMotion(isReduceMotionEnabled);
//       } catch (error) {
//         console.log('Could not check reduce motion preference:', error);
//       }
//     };

//     checkReduceMotion();
//   }, []);

//   // Handle layout changes and recalculate positions
//   useEffect(() => {
//     if (categorySticky) {
//       animateCategoryPosition(true);
//     }
//   }, [
//     layoutMeasurements,
//     categorySticky,
//     navBarVisible,
//     animateCategoryPosition,
//   ]);

//   // Show progress bar if visible and progress is between 0-100
//   const showProgress =
//     progressState.visible &&
//     (progressState.indeterminate || progressState.progress >= 0) &&
//     progressState.progress <= 100;

//   return (
//     <View style={styles.container}>
//       {/* NavBar with animation support */}
//       <NavBar
//         visible={navBarVisible}
//         animatedOpacity={navBarOpacity}
//         animatedTranslateY={navBarTranslateY}
//         onLayout={handleNavBarLayout}
//       />

//       {/* Sticky CategoryList - positioned outside ScrollView when sticky */}
//       {categorySticky && (
//         <Animated.View
//           style={[
//             styles.stickyCategory,
//             {
//               top: navBarVisible ? layoutMeasurements.navBarHeight : 0,
//             },
//           ]}>
//           <CategoryList />
//         </Animated.View>
//       )}

//       {/* Main scrollable content */}
//       <Animated.ScrollView
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         scrollEventThrottle={16}
//         onScroll={Animated.event(
//           [{nativeEvent: {contentOffset: {y: scrollY}}}],
//           {
//             useNativeDriver: false,
//             listener: handleScroll,
//           },
//         )}>
//         {/* Banner section */}
//         <View onLayout={handleBannerLayout}>
//           <Banner />
//         </View>

//         {/* CategoryList - only shown when not sticky */}
//         {!categorySticky && (
//           <View onLayout={handleCategoryLayout}>
//             <CategoryList />
//           </View>
//         )}

//         {/* Feed content with proper spacing when category is sticky */}
//         <View
//           style={[
//             styles.feedContainer,
//             categorySticky && {
//               marginTop: layoutMeasurements.categoryHeight,
//             },
//           ]}>
//           <Feed />
//         </View>
//       </Animated.ScrollView>

//       {/* Progress bar */}
//       {showProgress && (
//         <View style={styles.progressContainer}>
//           <ProgressBar
//             progress={progressState.progress}
//             message={progressState.message}
//             visible={true}
//             variant="minimal"
//             showPercentage={true}
//             showMessage={true}
//             indeterminate={progressState.indeterminate}
//           />
//         </View>
//       )}
//     </View>
//   );
// };

// export default HomeScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   progressContainer: {
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 4,
//     backgroundColor: '#fff',
//     zIndex: 999,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   stickyCategory: {
//     position: 'absolute',
//     // top : 60,
//     left: 0,
//     right: 0,

//     zIndex: 100,
//     backgroundColor: '#fff',
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#e1e5e9',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   feedContainer: {
//     flex: 1,
//     minHeight: 1000, // Ensure enough content for scrolling
//   },
// });
// import { StyleSheet, View } from 'react-native'
// import React from 'react'
// import CategouryList from './components/CategouryList'
// import Feed from './components/Feed'

// const HomeScreen = () => {
//   return (
//     <View style={styles.container}>
//       <View style={styles.categoryContainer}>
//         <CategouryList/>
//       </View>
//       <View style={styles.feedContainer}>
//         <Feed/>
//       </View>
//     </View>
//   )
// }

// export default HomeScreen

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff'
//   },
//   categoryContainer: {
//     zIndex: 1
//   },
//   feedContainer: {
//     flex: 1
//   }
// })
