import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SearchBar = ({ placeholder = "Search", onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
      <Text style={styles.placeholderText}>{placeholder}</Text>
    </TouchableOpacity>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: '#f3f2ef',
    borderRadius: 18,
    paddingHorizontal: 16,
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});
