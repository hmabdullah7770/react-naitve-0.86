import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import Icon from '@react-native-vector-icons/material-icons';

const Notification = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="more-horiz" size={24} color="#666" />
    </TouchableOpacity>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});