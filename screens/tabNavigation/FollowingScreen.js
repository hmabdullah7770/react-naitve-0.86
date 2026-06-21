import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import CategoryList from './components/CategouryList';
import FollowingFeed from './components/FollowingFeed';

const FollowingScreen = () => {
  return (
    <View style={styles.container}>
      <CategoryList />
      <FollowingFeed />
    </View>
  );
};

export default FollowingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
