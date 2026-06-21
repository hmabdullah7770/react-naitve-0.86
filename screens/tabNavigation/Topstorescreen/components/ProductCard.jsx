import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImageOrImage from '../../components/feed-performance/FastImageOrImage';

const ProductCard = ({ product, onPress }) => {
  const {
    _id,
    productName,
    productImages,
    productPrice,
    productDiscount,
    finalPrice,
  } = product;

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    }
  };

  // Calculate discount percentage
  const discountPercentage = productDiscount > 0 ? Math.round((productDiscount / productPrice) * 100) : 0;
  
  // Get the first product image
  const productImage = productImages && productImages.length > 0 ? productImages[0] : null;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {productImage ? (
          <FastImageOrImage
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>
            ${finalPrice || productPrice}
          </Text>
          {discountPercentage > 0 && (
            <Text style={styles.originalPrice}>
              ${productPrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 22,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
});

export default React.memo(ProductCard);