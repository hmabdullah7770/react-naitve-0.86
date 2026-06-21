import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSelector } from 'react-redux';
import { useCategoryNames, useFollowingCategoryDataInfinite } from '../../../ReactQuery/TanStackQueryHooks/useCategories';
import Card from './Card';

const LIMIT = 5;
const PRELOAD_THRESHOLD = 2;

const FollowingFeed = () => {
  const { selectedCategoryIndex } = useSelector(state => state.category);
  const flashListRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: categoryResponse } = useCategoryNames();

  // Calculate selected category name
  const selectedCategoryName = useMemo(() => {
    if (!categoryResponse?.data?.messege) {return null;}

    const rawCategories = categoryResponse.data.messege;
    const filteredCategories = rawCategories.filter(cat => {
      const categoryName = cat.categoryname || cat.categouryname;
      return categoryName?.toLowerCase() !== 'all';
    });

    const categoriesWithAll = [
      { _id: '6834c7f5632a2871571413f7', categoryname: 'All' },
      ...filteredCategories,
    ];

    const selectedCategory = categoriesWithAll[selectedCategoryIndex];
    return selectedCategory?.categoryname || selectedCategory?.categouryname;
  }, [categoryResponse, selectedCategoryIndex]);

  // Infinite query for following users data
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFollowingCategoryDataInfinite(selectedCategoryName, LIMIT);

  // Extract all items from paginated data
  const allItems = useMemo(() => {
    if (!data?.pages) {return [];}

    return data.pages.reduce((acc, page) => {
      let cards = [];

      // Handle different response structures
      if (page?.data?.messege?.cards) {
        cards = page.data.messege.cards;
      } else if (page?.messege?.cards) {
        cards = page.messege.cards;
      } else if (page?.cards) {
        cards = page.cards;
      }

      return [...acc, ...(cards || [])];
    }, []);
  }, [data]);

  // Reset scroll position when category changes
  useEffect(() => {
    if (selectedCategoryName && flashListRef.current) {
      flashListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [selectedCategoryName]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Load more data function
  const loadMoreData = useCallback(async () => {
    if (!hasNextPage || isLoadingMore || isFetchingNextPage || refreshing) {
      return;
    }

    setIsLoadingMore(true);
    try {
      await fetchNextPage();
    } catch (error) {
      console.error('Error fetching next page:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNextPage, isLoadingMore, isFetchingNextPage, refreshing, fetchNextPage]);

  // Handle scroll-based preloading
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!hasNextPage || isLoadingMore || isFetchingNextPage || refreshing || !viewableItems?.length) {
      return;
    }

    const lastVisibleIndex = Math.max(...viewableItems.map(item => item.index || 0));
    const totalItems = allItems.length;

    if (totalItems > 0 && lastVisibleIndex >= totalItems - PRELOAD_THRESHOLD) {
      loadMoreData();
    }
  }, [hasNextPage, isLoadingMore, isFetchingNextPage, refreshing, allItems.length, loadMoreData]);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 30,
    minimumViewTime: 50,
  }), []);

  const renderItem = useCallback(({ item, index }) => (
    <Card item={item} index={index} />
  ), []);

  const getItemType = useCallback(() => 'card', []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isLoadingMore && !isFetchingNextPage && !refreshing) {
      loadMoreData();
    }
  }, [hasNextPage, isLoadingMore, isFetchingNextPage, refreshing, loadMoreData]);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#1FFFA5']}
      tintColor="#1FFFA5"
      title="Pull to refresh"
      titleColor="#1FFFA5"
    />
  ), [refreshing, onRefresh]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading following feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Error loading following feed: {error.message}
        </Text>
      </View>
    );
  }

  // Show empty state if no following users have posts
  if (allItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No posts from following users</Text>
        <Text style={styles.emptySubText}>
          Follow some users to see their posts here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={allItems}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        estimatedItemSize={280}
        getItemType={getItemType}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={LIMIT}
        windowSize={10}
        initialNumToRender={LIMIT}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
      />

      {(isFetchingNextPage || isLoadingMore) && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingVertical: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
});

export default FollowingFeed;
