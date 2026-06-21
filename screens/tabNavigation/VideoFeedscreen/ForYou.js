import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FullScreenCard from './components/FullScreenCard';
import {
  usegetPostsByCategory,
  useVideoFeed,
  usePostFeed,
  useCategoryNames
} from '../../../ReactQuery/TanStackQueryHooks/useCategories';

const { height, width } = Dimensions.get('window');

const TABS = [
  { id: 'foryou', label: 'For You' },
  { id: 'videos', label: 'Videos' },
  { id: 'posts', label: 'Posts' },
];

const ForYou = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('foryou');
  const [centerItemId, setCenterItemId] = useState(null);
  const listRef = useRef(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // Data Fetching based on Tab
  const {
    data: forYouData,
    fetchNextPage: fetchNextForYou,
    hasNextPage: hasNextForYou,
    isFetchingNextPage: isFetchingNextForYou,
    isLoading: isLoadingForYou
  } = usegetPostsByCategory('All', 5); // Default category 'All'

  const {
    data: videoData,
    fetchNextPage: fetchNextVideo,
    hasNextPage: hasNextVideo,
    isFetchingNextPage: isFetchingNextVideo,
    isLoading: isLoadingVideo
  } = useVideoFeed('All', 5);

  const {
    data: postData,
    fetchNextPage: fetchNextPost,
    hasNextPage: hasNextPost,
    isFetchingNextPage: isFetchingNextPost,
    isLoading: isLoadingPost
  } = usePostFeed('All', 5);

  // Select active data
  const activeData = useMemo(() => {
    switch (activeTab) {
      case 'videos': return videoData || [];
      case 'posts': return postData || [];
      default: return forYouData || [];
    }
  }, [activeTab, forYouData, videoData, postData]);

  const isLoading = activeTab === 'videos' ? isLoadingVideo : activeTab === 'posts' ? isLoadingPost : isLoadingForYou;

  // Reset list when tab changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [activeTab]);

  // Viewability Config
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      // In pagingEnabled list, usually only one item is fully visible
      const visibleItem = viewableItems[0];
      if (visibleItem && visibleItem.item?._id) {
        setCenterItemId(visibleItem.item._id);
      }
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // High threshold for full screen
  }).current;

  // Load More
  const onEndReached = useCallback(() => {
    if (activeTab === 'foryou' && hasNextForYou && !isFetchingNextForYou) fetchNextForYou();
    else if (activeTab === 'videos' && hasNextVideo && !isFetchingNextVideo) fetchNextVideo();
    else if (activeTab === 'posts' && hasNextPost && !isFetchingNextPost) fetchNextPost();
  }, [activeTab, hasNextForYou, isFetchingNextForYou, hasNextVideo, isFetchingNextVideo, hasNextPost, isFetchingNextPost]);

  // Render Item
  const renderItem = useCallback(({ item }) => {
    const isPlayable = isFocused && item._id === centerItemId;

    return (
      <FullScreenCard
        item={item}
        isVisible={item._id === centerItemId}
        isPlayable={isPlayable}
        onStorePress={() => console.log('Store pressed', item._id)}
        onCartPress={() => console.log('Cart pressed', item._id)}
      />
    );
  }, [centerItemId, isFocused]);

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Tabs Overlay */}
      <View style={[styles.topTabsContainer, { top: insets.top + 10 }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabButton}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
        {/* Category Dropdown Placeholder */}
        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryText}>Category v</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        ref={listRef}
        data={activeData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        estimatedItemSize={height}
        drawDistance={height} // Preload next screen
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topTabsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeIndicator: {
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    marginTop: 4,
    borderRadius: 1,
  },
  categoryButton: {
    position: 'absolute',
    right: 20,
  },
  categoryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  }
});

export default ForYou;