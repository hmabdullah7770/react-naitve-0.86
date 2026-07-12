import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFilter, FILTER_OPTIONS } from '../../tabNavigation/context/FilterContext'; // adjust path

const FilterBadges = () => {
  const { selectedFilters, removeFilter, getLabel } = useFilter();

  if (selectedFilters.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {selectedFilters.map((key) => (
        <View key={key} style={styles.badge}>
          <Text style={styles.badgeText}>{getLabel(key)}</Text>
          <TouchableOpacity
            onPress={() => removeFilter(key)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.closeBtn}
          >
            <Icon name="close" size={14} color="#070707" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default FilterBadges;

const styles = StyleSheet.create({
  scrollView: {
    minHeight: 36,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
     paddingHorizontal: 16, // ← match NavBar content's horizontal padding
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1FFFA5',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#0c0c0c',
    fontWeight: '800',
    marginRight: 6,
  },
  closeBtn: {
    marginLeft: 2,
   
  },
});// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';


// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useFilter, FILTER_OPTIONS } from '../../tabNavigation/context/FilterContext'; // adjust path

// const FilterBadges = () => {
//   const { selectedFilters, removeFilter, getLabel } = useFilter();
//    console.log('FilterBadges selectedFilters:', selectedFilters); // temp debug

//   if (selectedFilters.length === 0) return null;

//   return (
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       contentContainerStyle={styles.container}
//     >
//       {selectedFilters.map((key) => (
//         <View key={key} style={styles.badge}>
//           <Text style={styles.badgeText}>{getLabel(key)}</Text>
//           <TouchableOpacity
//             onPress={() => removeFilter(key)}
//             hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
//             style={styles.closeBtn}
//           >
//             <Icon name="close" size={14} color="#0a66c2" />
//           </TouchableOpacity>
//         </View>
//       ))}
//     </ScrollView>
//   );
// };

// export default FilterBadges;

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     paddingVertical: 8,
//     paddingHorizontal: 4,
//   },
//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e8f0fe',
//     borderRadius: 14,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     marginRight: 8,
//   },
//   badgeText: {
//     fontSize: 12,
//     color: '#0a66c2',
//     fontWeight: '500',
//     marginRight: 6,
//   },
//   closeBtn: {
//     marginLeft: 2,
//   },
// });