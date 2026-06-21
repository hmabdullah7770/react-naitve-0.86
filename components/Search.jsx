import React from 'react';

import {StyleSheet, TextInput, View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

const Search = ({placeholder, onChangeText, value}) => {
  return (
    <View style={styles.searchContainer}>
      <FontAwesome
        name="search"
        size={15}
        color="#666"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 10,

    borderWidth: 1,
    borderColor: 'gray',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginHorizontal: 7,
  },
  searchInput: {
    flex: 1,
    padding: 3,
    fontSize: 16,
  },
});

export default Search;
