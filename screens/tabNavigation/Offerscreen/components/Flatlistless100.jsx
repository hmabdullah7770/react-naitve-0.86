import React, { useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLessThan100Products } from '../../../../ReactQuery/TanStackQueryHooks/useDiscountProduct';
import SectionHeader from './SectionHeader';
import ProductCard from './ProductOfferCard';

const FlatlistLess100 = ({ onProductPress, onSeeAllPress }) => {
  const { data: products, isLoading, error } = useLessThan100Products('All', 10, 1);

  const renderItem = useCallback(({ item, index }) => (
    <ProductCard 
      product={item} 
      onPress={onProductPress}
      index={index}
    />
  ), [onProductPress]);

  const keyExtractor = useCallback((item) => item._id, []);

  // Hide section if no products (including 404 errors)
  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  // Hide section on 404 errors (no products found)
  if (error && error.response?.status === 404) {
    return null;
  }

  // Show error for other types of errors
  if (error) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Under $100" onSeeAllPress={onSeeAllPress} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Under $100" onSeeAllPress={onSeeAllPress} />
      <FlashList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={160}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        drawDistance={400}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
  },
});

export default FlatlistLess100;