import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import FilterModal from '../tabNavigation/components/FilterModal';
import FilterBadges from '../tabNavigation/components/FilterBadges';
import { useFilter } from '../tabNavigation/context/FilterContext';
import { useDispatch } from 'react-redux';
import { setSearchPayload, clearSearchPayload } from '../../Redux/action/search';

const SearchScreen = () => {
  const navigation = useNavigation();
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const { selectedFilters, resetFilters } = useFilter();

  const filtername = selectedFilters[0] ?? undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    setSearchText('');
    dispatch(clearSearchPayload());
  };

  const handleSubmit = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    dispatch(setSearchPayload({ search: trimmed, filtername }));
    navigation.goBack();
  };

  const handleBack = () => {
    resetFilters();
    dispatch(clearSearchPayload());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-back" size={24} color="#333" style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.container}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search"
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)} activeOpacity={0.7}>
          <Icon name="tune" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {selectedFilters.length > 0 && (
        <View style={styles.badgesRow}>
          <FilterBadges />
        </View>
      )}

      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backIcon: { marginRight: 12 },
  container: {
    flexDirection: 'row', alignItems: 'center', height: 36,
    backgroundColor: '#f3f2ef', borderRadius: 18, paddingHorizontal: 16, flex: 1,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: '#000', padding: 0 },
  filterButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f2ef',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  badgesRow: { borderBottomWidth: 0.5, borderBottomColor: '#e1e5e9' },
});
// import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
// import React, { useState, useRef, useEffect } from 'react';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useNavigation } from '@react-navigation/native';
// import FilterModal from '../tabNavigation/components/FilterModal';
// import FilterBadges from '../tabNavigation/components/FilterBadges';
// import { useFilter } from '../tabNavigation/context/FilterContext';

// const SearchScreen = () => {
//   const navigation = useNavigation();
//   const inputRef = useRef(null);
//   const [searchText, setSearchText] = useState('');
//   const [filterVisible, setFilterVisible] = useState(false);
//   const { selectedFilters, resetFilters } = useFilter();

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       inputRef.current?.focus();
//     }, 100);

//     return () => clearTimeout(timer);
//   }, []);

//   const handleClear = () => {
//     setSearchText('');
//   };

//   const handleSubmit = () => {
//     console.log('Searching for:', searchText);
//   };

//   const handleBack = () => {
//     resetFilters(); // discard filters since the user didn't complete a search
//     navigation.goBack();
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//           <Icon name="arrow-back" size={24} color="#333" style={styles.backIcon} />
//         </TouchableOpacity>

//         <View style={styles.container}>
//           <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
//           <TextInput
//             ref={inputRef}
//             style={styles.input}
//             placeholder="Search"
//             placeholderTextColor="#666"
//             value={searchText}
//             onChangeText={setSearchText}
//             onSubmitEditing={handleSubmit}
//             returnKeyType="search"
//             autoCorrect={false}
//           />
//           {searchText.length > 0 && (
//             <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//               <Icon name="close" size={18} color="#999" />
//             </TouchableOpacity>
//           )}
//         </View>

//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setFilterVisible(true)}
//           activeOpacity={0.7}
//         >
//           <Icon name="tune" size={20} color="#666" />
//         </TouchableOpacity>
//       </View>

//       {selectedFilters.length > 0 && (
//         <View style={styles.badgesRow}>
//           <FilterBadges />
//         </View>
//       )}

//       <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />

//       {/* Search results go below — FlatList, suggestions, recent searches, etc. */}
//       <View style={styles.resultsPlaceholder} />
//     </SafeAreaView>
//   );
// };

// export default SearchScreen;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   backIcon: {
//     marginRight: 12,
//   },
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
//   input: {
//     flex: 1,
//     fontSize: 14,
//     color: '#000',
//     padding: 0,
//   },
//   filterButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#f3f2ef',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   badgesRow: {
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#e1e5e9',
//   },
//   resultsPlaceholder: {
//     flex: 1,
//   },
// });