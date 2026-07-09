import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSearchPost } from '../../../ReactQuery/TanStackQueryHooks/usePost'


const SearchBar = ({ placeholder = "Search", onPress, onFilterPress }) => {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <Text style={styles.placeholderText}>{placeholder}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
        activeOpacity={0.7}
      >
        <Icon name="tune" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f2ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});


// import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
// import React from 'react';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useNavigation } from '@react-navigation/native';
// import { useSearchPost } from '../../../ReactQuery/TanStackQueryHooks/usePost'


// const SearchBar = ({ placeholder = "Search", onPress }) => {
//   return (
//     <TouchableOpacity
//       style={styles.container}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
//       <Text style={styles.placeholderText}>{placeholder}</Text>
//     </TouchableOpacity>
//   );
// };

// export default SearchBar;

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     height: 36,
//     backgroundColor: '#f3f2ef',
//     borderRadius: 18,
//     paddingHorizontal: 16,
//     flex: 1,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   placeholderText: {
//     fontSize: 14,
//     color: '#666',
//     flex: 1,
//   },
// });
