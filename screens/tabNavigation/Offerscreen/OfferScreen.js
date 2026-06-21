import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Flatlist100 from './components/Flatlist100';
import Flatlist80 from './components/Flatlist80';
import Flatlist50 from './components/Flatlist50';
import FlatlistLess100 from './components/Flatlistless100';
import { 
  use100DiscountProducts, 
  use80DiscountProducts,
  use50to80DiscountProducts, 
  useLessThan100Products 
} from '../../../ReactQuery/TanStackQueryHooks/useDiscountProduct';
import { useNavigation } from '@react-navigation/native';

const OfferScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Get refetch functions from all hooks
  const { refetch: refetch100 } = use100DiscountProducts('All', 10, 1);
  const { refetch: refetch80 } = use80DiscountProducts('All', 10, 1);
  const { refetch: refetch50to80 } = use50to80DiscountProducts('All', 10, 1);
  const { refetch: refetchLess100 } = useLessThan100Products('All', 10, 1);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch100(),
        refetch80(),
        refetch50to80(),
        refetchLess100(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch100, refetch80, refetch50to80, refetchLess100]);

  // Handle product card press
  const handleProductPress = useCallback((product) => {
    

   navigation.navigate('StoreScreen', {      // ← root app stack name for StoreScreens
  screen: 'StoreTabs',                     // ← inside StoreNavigator stack
  params: {
    storeIdfromoffer: product?.storeId,             // ← StoreTabs needs this
    source: 'offer',
    storeIdfromoffer: product?.storeId._id,
    screen: 'Store_ProductDetail',         // ← tab inside StoreTabs
    params: {
      productIdfromoffer: product?._id,
      storeIdfromoffer: product?.storeId._id,
      source: 'offer',
    },
  },
});

    console.log('Product pressed:', product.productName);
    // TODO: Navigate to product detail screen
  }, [navigation]);

  // Handle "See all" press
  const handleSeeAllPress = useCallback((section) => {
    console.log('See all pressed for:', section);
    // TODO: Navigate to category screen
  }, []);

  // Handle search press
  const handleSearchPress = useCallback(() => {
    console.log('Search pressed');
    // TODO: Navigate to search screen or show search modal
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="local-offer" size={24} color="#000" />
        <Text style={styles.headerTitle}>Offers & Deals</Text>
        <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.7}>
          <Icon name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Explore Deals & Offers</Text>

        {/* 100% Free Section */}
        <Flatlist100 
          onProductPress={handleProductPress}
          onSeeAllPress={() => handleSeeAllPress('100% Free')}
        />

        {/* 80% Off Section */}
        <Flatlist80 
          onProductPress={handleProductPress}
          onSeeAllPress={() => handleSeeAllPress('80% Off')}
        />

        {/* 50% Off Section */}
        <Flatlist50 
          onProductPress={handleProductPress}
          onSeeAllPress={() => handleSeeAllPress('50% Off')}
        />

        {/* Under $100 Section */}
        <FlatlistLess100 
          onProductPress={handleProductPress}
          onSeeAllPress={() => handleSeeAllPress('Under $100')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
});

export default OfferScreen;
