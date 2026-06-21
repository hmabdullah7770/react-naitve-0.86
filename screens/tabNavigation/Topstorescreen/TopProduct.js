import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTopSellProducts } from '../../../ReactQuery/TanStackQueryHooks/useTopSellProducts';
import TabNavigation from './components/TabNavigation';
import ProductCard from './components/ProductCard';
import SkeletonProduct from './components/SkeletonProduct';

const TopProduct = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('mostSellProducts');
  const [refreshing, setRefreshing] = useState(false);

  // Reset tab to 'mostSellProducts' when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('mostSellProducts');
    }, [])
  );

  // Fetch products data with infinite scroll
  const {
    data: products,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useTopSellProducts('All', 20);

  // Handle tab press
  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId === 'topStore') {
      navigation.navigate('TopStores');
    }
  }, [navigation]);

  // Handle product press
  const handleProductPress = useCallback((product) => {
    // Navigate to product details or handle product selection
      console.log('storeId raw value:', product?.storeId);
  console.log('storeId._id:', product?.storeId?._id);
  console.log('full product:', JSON.stringify(product, null, 2));

   navigation.navigate('StoreScreen', {      // ← root app stack name for StoreScreens
  screen: 'StoreTabs',                     // ← inside StoreNavigator stack
  params: {
    storeId: product?.storeId?._id,             // ← StoreTabs needs this
    source: 'TopProduct',
    storeId: product?.storeId?._id,
    screen: 'Store_ProductDetail',         // ← tab inside StoreTabs
    params: {
      productIdfromTopProduct: product?._id,
      storeId: product?.storeId?._id,
      source: 'TopProduct',
    },
  },
});

    console.log('Product pressed:', product.productName);
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

  // Render product item - 2 products per row
  const renderItem = useCallback(({ item, index }) => {
    // Check if this is a pair of products or a single product
    if (Array.isArray(item)) {
      return (
        <View style={styles.rowContainer}>
          {item.map((product, productIndex) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onPress={handleProductPress} 
            />
          ))}
        </View>
      );
    }
    
    // Single product (fallback)
    return (
      <View style={styles.rowContainer}>
        <ProductCard product={item} onPress={handleProductPress} />
        <View style={styles.emptySlot} />
      </View>
    );
  }, [handleProductPress]);

  // Transform products into pairs for 2-column layout
  const pairedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const pairs = [];
    for (let i = 0; i < products.length; i += 2) {
      if (i + 1 < products.length) {
        // Pair of products
        pairs.push([products[i], products[i + 1]]);
      } else {
        // Single product (odd number)
        pairs.push([products[i]]);
      }
    }
    return pairs;
  }, [products]);

  // Key extractor
  const keyExtractor = useCallback((item, index) => {
    if (Array.isArray(item)) {
      return item.map(p => p._id).join('-');
    }
    return item._id || index.toString();
  }, []);

  // Get item type for FlashList optimization
  const getItemType = useCallback(() => 'productRow', []);

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
        <View style={styles.rowContainer}>
          <SkeletonProduct />
          <SkeletonProduct />
        </View>
        <View style={styles.rowContainer}>
          <SkeletonProduct />
          <SkeletonProduct />
        </View>
      </View>
    );
  }, [isFetchingNextPage]);

  // Empty component
  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          {[0, 1, 2].map((i) => (
            <View key={`skeleton-row-${i}`} style={styles.rowContainer}>
              <SkeletonProduct />
              <SkeletonProduct />
            </View>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Failed to load products. Pull down to retry.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No products available</Text>
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
          {[0, 1, 2].map((i) => (
            <View key={`skeleton-loading-${i}`} style={styles.rowContainer}>
              <SkeletonProduct />
              <SkeletonProduct />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={pairedProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        estimatedItemSize={200}
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
    paddingHorizontal: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptySlot: {
    flex: 1,
    marginHorizontal: 6,
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

export default TopProduct;