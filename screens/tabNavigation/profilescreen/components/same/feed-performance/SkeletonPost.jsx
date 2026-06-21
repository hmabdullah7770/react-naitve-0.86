import React from 'react';
import {View, StyleSheet} from 'react-native';

const SkeletonPost = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header} />
      <View style={styles.media} />
      <View style={styles.footer} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 12,
  },
  header: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: '35%',
    marginBottom: 12,
  },
  media: {
    height: 300,
    backgroundColor: '#ececec',
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '60%',
  },
});

export default React.memo(SkeletonPost);
