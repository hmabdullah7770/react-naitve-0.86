import { StyleSheet, TouchableOpacity,View, Text } from 'react-native';
import React from 'react';
import Icon from '@react-native-vector-icons/material-icons';

const Notification = ({ onPress }) => {
  const showBadge = 4;
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="notifications" size={24} color="#666" />


        {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>4</Text>
        </View>
      )}
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

   badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});