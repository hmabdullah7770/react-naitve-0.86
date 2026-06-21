import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useGetTopStore } from '../../../ReactQuery/TanStackQueryHooks/useGetTopStore';
import TabNavigation from './components/TabNavigation';
import StoreCard from './components/StoreCard';
import SkeletonStore from './components/SkeletonStore';

const TopStores = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('topStore');
  const [refreshing, setRefreshing] = useState(false);

  // Reset tab to 'topStore' when screen comes into focus (e.g., when back button is pressed)
  useFocusEffect(
    useCallback(() => {
      setActiveTab('topStore');
    }, [])
  );

  // Fetch stores data with infinite scroll
  const {
    data: stores,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetTopStore('All', 20);

  // Handle tab press
  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId === 'mostSellProducts') {
      navigation.navigate('TopProduct');
    }
  }, [navigation]);

  // Handle store press
  const handleStorePress = useCallback((store) => {
    // Navigate to store details or handle store selection
     navigation.navigate('StoreScreen', { storeIdfromTopStore: store?._id ,source: 'topStore' }); 
    console.log('Store pressed:', store.storeName);
  }, [navigation]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle load more
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !refreshing) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

  // Render store item
  const renderItem = useCallback(({ item }) => (
    <StoreCard store={item} onPress={handleStorePress} />
  ), [handleStorePress]);

  // Key extractor
  const keyExtractor = useCallback((item) => item._id, []);

  // Get item type for FlashList optimization
  const getItemType = useCallback(() => 'store', []);

  // Refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#FF6B35']}
      tintColor="#FF6B35"
    />
  ), [refreshing, onRefresh]);

  // Footer component for loading more
  const ListFooterComponent = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerContainer}>
        {[0, 1].map((i) => (
          <SkeletonStore key={`skeleton-footer-${i}`} />
        ))}
      </View>
    );
  }, [isFetchingNextPage]);

  // Empty component
  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonStore key={`skeleton-empty-${i}`} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Failed to load stores. Pull down to retry.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No stores available</Text>
      </View>
    );
  }, [isLoading, error]);

  // Header component
  const ListHeaderComponent = useMemo(() => (
    <TabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
  ), [activeTab, handleTabPress]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
        <View style={styles.centerContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonStore key={`skeleton-loading-${i}`} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={stores || []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        estimatedItemSize={80}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        drawDistance={800}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.contentContainer}
        refreshControl={refreshControl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    paddingVertical: 20,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  footerContainer: {
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default TopStores;