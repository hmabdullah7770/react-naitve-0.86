import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// (Image already imported above)

// ProductDropdown is now a presentational component.
// Props:
// - products: array of product objects to render
// - loading: boolean
// - error: any
// - isOpen: boolean (controls whether the dropdown list is visible)
// - onToggle: () => void to open/close the dropdown
// - onProductSelect: (product) => void
// - selectedProductId: id of selected product

const ProductDropdown = ({ products = [], loading = false, error = null, isOpen = false, onToggle, onProductSelect, selectedProductId }) => {
  const [open, setOpen] = useState(isOpen);

  // keep local open state in sync with prop
  React.useEffect(() => setOpen(isOpen), [isOpen]);

  // Handle product selection
  const handleProductSelect = (product) => {
    onProductSelect(product);
    onToggle && onToggle(false);
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    onToggle && onToggle(next);
  };

  // Defensive: ensure products is an array before using array methods
  const productList = Array.isArray(products) ? products : [];
  // Find selected product for display
  const selectedProduct = productList.find(product => product._id === selectedProductId);

  // Render individual product item
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleProductSelect(item)}
    >
      <Image
        source={{
          uri: item.productImages && item.productImages.length > 0
            ? item.productImages[0]
            : 'https://via.placeholder.com/50x50?text=No+Image',
        }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.productPrice}>
          ${item.finalPrice || item.productPrice}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
    
      {/* Dropdown Header */}
  <TouchableOpacity style={styles.dropdownHeader} onPress={handleToggle}>
        {selectedProduct ? (
          <View style={styles.selectedProductContainer}>
            <Image
              source={{
                uri: selectedProduct.productImages && selectedProduct.productImages.length > 0
                  ? selectedProduct.productImages[0]
                  : 'https://via.placeholder.com/30x30?text=No+Image',
              }}
              style={styles.selectedProductImage}
              resizeMode="cover"
            />
            <Text style={styles.selectedProductText} numberOfLines={1}>
              {selectedProduct.productName}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select a product</Text>
        )}
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

        {/* Dropdown Content - Opens Upward */}
      {open && (
        <View style={styles.dropdownContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading products</Text>
            </View>
          ) : products && products.length > 0 ? (
            <ScrollView
              style={styles.productScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {productList.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.productItem}
                  onPress={() => handleProductSelect(item)}
                >
                  <Image
                    source={{
                      uri: item.productImages && item.productImages.length > 0
                        ? item.productImages[0]
                        : 'https://via.placeholder.com/50x50?text=No+Image',
                    }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text style={styles.productPrice}>
                      ${item.finalPrice || item.productPrice}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItemsText}>No items</Text>
            </View>
          )}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    position: 'relative',
    zIndex: 1,
    
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedProductContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedProductImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  selectedProductText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
dropdownContent: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderTopWidth: 0,          // connects seamlessly below the header
  borderBottomLeftRadius: 8,
  borderBottomRightRadius: 8,
  backgroundColor: '#fff',
  maxHeight: 200,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
  },
  productScrollView: {
    maxHeight: 180,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ProductDropdown;
