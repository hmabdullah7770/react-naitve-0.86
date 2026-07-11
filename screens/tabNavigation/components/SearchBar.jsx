import { StyleSheet, View, TextInput, Text, Pressable, Keyboard, Platform } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import FilterModal from './FilterModal';

const SearchBar = ({ placeholder = "Search", onSubmit, isPremium = true }) => {
  const navigation = useNavigation();
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [committedText, setCommittedText] = useState('');
  const didSubmitRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isPremium) return; // no inline keyboard flow for premium users

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      if (!didSubmitRef.current) {
        setDraftText((prev) => (prev !== committedText ? committedText : prev));
      }
      didSubmitRef.current = false;
    });

    return () => hideSub.remove();
  }, [committedText, isPremium]);

  const handleChangeText = (text) => {
    setDraftText(text);
  };

  const handleSubmit = () => {
    didSubmitRef.current = true;
    setCommittedText(draftText);
    onSubmit?.(draftText);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setDraftText('');
    setCommittedText('');
    onSubmit?.('');
  };

  const handlePremiumPress = () => {
    navigation.navigate('SearchScreen');
  };

  return (
    <View style={styles.wrapper}>
      {isPremium ? (
        <Pressable
          style={({ pressed }) => [
            styles.container,
            pressed && styles.containerPressed,
          ]}
          onPress={handlePremiumPress}
          android_ripple={{ color: '#e0e0e0', borderless: false }}
          hitSlop={{ top: 4, bottom: 4 }}
        >
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </Pressable>
      ) : (
        <View style={styles.container}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#666"
            value={draftText}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {draftText.length > 0 && (
            <Pressable
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              android_ripple={{ color: '#ddd', borderless: true, radius: 16 }}
              style={({ pressed }) => [
                styles.clearBtn,
                Platform.OS === 'ios' && pressed && { opacity: 0.5 },
              ]}
            >
              <Icon name="close" size={18} color="#999" />
            </Pressable>
          )}
        </View>
      )}

      {!isPremium && (
        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            pressed && styles.filterButtonPressed,
          ]}
          onPress={() => setFilterVisible(true)}
          android_ripple={{ color: '#ddd', borderless: false }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Icon name="tune" size={20} color="#666" />
        </Pressable>
      )}

      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
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
    overflow: 'hidden', // keeps Android ripple contained within rounded corners
  },
  containerPressed: {
    ...Platform.select({
      ios: { opacity: 0.7 },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    padding: 0,
  },
  clearBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f2ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    overflow: 'hidden',
  },
  filterButtonPressed: {
    ...Platform.select({
      ios: { opacity: 0.7 },
    }),
  },
});

// ok code 
// import { StyleSheet, View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
// import React, { useState, useRef, useEffect } from 'react';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import FilterModal from './FilterModal';

// const SearchBar = ({ placeholder = "Search", onSubmit }) => {
//   const [filterVisible, setFilterVisible] = useState(false);
//   const [draftText, setDraftText] = useState('');
//   const [committedText, setCommittedText] = useState('');
//   const didSubmitRef = useRef(false);
//   const inputRef = useRef(null);

//   useEffect(() => {
//     const hideSub = Keyboard.addListener('keyboardDidHide', () => {
//       if (!didSubmitRef.current) {
//         // Keyboard closed without an explicit search submit → revert
//         setDraftText((prev) => (prev !== committedText ? committedText : prev));
//       }
//       didSubmitRef.current = false;
//     });

//     return () => hideSub.remove();
//   }, [committedText]);

//   const handleChangeText = (text) => {
//     setDraftText(text);
//   };

//   const handleSubmit = () => {
//     didSubmitRef.current = true;
//     setCommittedText(draftText);
//     onSubmit?.(draftText);
//     Keyboard.dismiss();
//   };

//   const handleClear = () => {
//     setDraftText('');
//     setCommittedText('');
//     onSubmit?.('');
//   };

//   return (
//     <View style={styles.wrapper}>
//       <View style={styles.container}>
//         <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
//         <TextInput
//           ref={inputRef}
//           style={styles.input}
//           placeholder={placeholder}
//           placeholderTextColor="#666"
//           value={draftText}
//           onChangeText={handleChangeText}
//           onSubmitEditing={handleSubmit}
//           returnKeyType="search"
//           autoCorrect={false}
//         />
//         {draftText.length > 0 && (
//           <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//             <Icon name="close" size={18} color="#999" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <TouchableOpacity
//         style={styles.filterButton}
//         onPress={() => setFilterVisible(true)}
//         activeOpacity={0.7}
//       >
//         <Icon name="tune" size={20} color="#666" />
//       </TouchableOpacity>

//       <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
//     </View>
//   );
// };

// export default SearchBar;

// const styles = StyleSheet.create({
//   wrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
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
// });



// import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
// import React from 'react';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useNavigation } from '@react-navigation/native';
// import { useSearchPost } from '../../../ReactQuery/TanStackQueryHooks/usePost'


// const SearchBar = ({ placeholder = "Search", onPress, onFilterPress }) => {
//   return (
//     <View style={styles.wrapper}>
//       <TouchableOpacity
//         style={styles.container}
//         onPress={onPress}
//         activeOpacity={0.7}
//       >
//         <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
//         <Text style={styles.placeholderText}>{placeholder}</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.filterButton}
//         onPress={onFilterPress}
//         activeOpacity={0.7}
//       >
//         <Icon name="tune" size={20} color="#666" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default SearchBar;

// const styles = StyleSheet.create({
//   wrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
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
//   placeholderText: {
//     fontSize: 14,
//     color: '#666',
//     flex: 1,
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
// });
