import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

const BackButton = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Don't show back button on HomeScreen
  if (route.name === 'Home') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
    >
    <FontAwesome name="arrow-left" style={styles.backButtonIcon} />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    left: 22,
    top: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 100,
    zIndex: 1,
  },
  backButtonIcon: {
    fontSize: 20,
    color: 'black',
  },
});
