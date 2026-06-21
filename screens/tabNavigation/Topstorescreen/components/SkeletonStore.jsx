import React from 'react';
import { View, StyleSheet } from 'react-native';

const SkeletonStore = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logo} />
      <View style={styles.content}>
        <View style={styles.storeName} />
        <View style={styles.rating} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeName: {
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '60%',
  },
  rating: {
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '25%',
  },
});

export default React.memo(SkeletonStore);