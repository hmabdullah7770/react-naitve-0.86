import React from 'react';
import { View, StyleSheet } from 'react-native';

const SkeletonProduct = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.productImage} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.productName} />
        <View style={styles.productNameSecond} />
        <View style={styles.priceContainer}>
          <View style={styles.price} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 8,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 12,
  },
  productName: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '80%',
    marginBottom: 6,
  },
  productNameSecond: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '60%',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '40%',
  },
});

export default React.memo(SkeletonProduct);