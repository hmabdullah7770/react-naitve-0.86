import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImageOrImage from '../../components/feed-performance/FastImageOrImage';

const GRADIENT_PRESETS = [
  ['#667eea', '#764ba2'], // Purple-Pink
  ['#f093fb', '#f5576c'], // Pink-Red
  ['#4facfe', '#00f2fe'], // Blue-Cyan
  ['#43e97b', '#38f9d7'], // Green-Teal
  ['#fa709a', '#fee140'], // Pink-Yellow
  ['#30cfd0', '#330867'], // Cyan-Purple
  ['#a8edea', '#fed6e3'], // Mint-Pink
  ['#ff9a9e', '#fecfef'], // Coral-Pink
];

const ProductCard = ({ product, onPress, index = 0 }) => {
  const {
    productName,
    description,
    productImages,
    storeId,
  } = product;

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    }
  };

  // Select gradient based on index for variety
  const gradientColors = GRADIENT_PRESETS[index % GRADIENT_PRESETS.length];

  // Get the first product image
  const productImage = productImages && productImages.length > 0 ? productImages[0] : null;
  const storeName = storeId?.storeName || '';

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {productImage && (
          <FastImageOrImage
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}
      </LinearGradient>

      <View style={styles.contentContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        <Text style={styles.productDescription} numberOfLines={1}>
          {storeName || description || 'Special Offer'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientContainer: {
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  contentContainer: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default React.memo(ProductCard);