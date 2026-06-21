import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';

const ProfileTabs = ({ activeTab, onTabPress }) => {
  const tabs = ['Network', 'Posts (120)', 'Shop', 'Reviews'];

  const handlePress = (item) => {
    console.log('🎯 TAB PRESS:', item);
    // Call immediately - don't wait for onPress callback
    onTabPress(item);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          scrollEnabled={true}
          bounces={false}
        >
          {tabs.map((item) => {
            const isActive = activeTab === item;
            
            return (
              <TouchableOpacity
                key={item}
                style={styles.tabItem}
                onPressIn={() => handlePress(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 20, bottom: 20, left: 15, right: 15 }}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {item}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileTabs;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000000',
  },
});
// import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
// import React from 'react';

// const ProfileTabs = ({ activeTab, onTabPress }) => {
//   const tabs = ['Network', 'Posts (120)', 'Shop', 'Reviews'];

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.tabsContent}
//         nestedScrollEnabled={true}
//       >
//         {tabs.map((item) => (
//           <TouchableOpacity
//             key={item}
//             style={[styles.tabItem, activeTab === item && styles.activeTabItem]}
//             onPress={() => onTabPress(item)}
//           >
//             <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
//               {item}
//             </Text>
//             {activeTab === item && <View style={styles.activeIndicator} />}
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// export default ProfileTabs;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   tabsContent: {
//     paddingHorizontal: 20,
//   },
//   tabItem: {
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     position: 'relative',
//   },
//   activeTabItem: {
//     // Active state styling
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#999999',
//   },
//   activeTabText: {
//     color: '#000000',
//   },
//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#000000',
//   },
// });



// import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
// import React from 'react';

// const ProfileTabs = ({ activeTab, onTabPress }) => {
//   const tabs = ['Network', 'Posts (120)', 'Shop', 'Reviews'];

//   const renderTabItem = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.tabItem, activeTab === item && styles.activeTabItem]}
//       onPress={() => onTabPress(item)}
//     >
//       <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
//         {item}
//       </Text>
//       {activeTab === item && <View style={styles.activeIndicator} />}
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={tabs}
//         renderItem={renderTabItem}
//         keyExtractor={(item) => item}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.tabsContent}
//       />
//     </View>
//   );
// };

// export default ProfileTabs;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   tabsContent: {
//     paddingHorizontal: 20,
//   },
//   tabItem: {
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     position: 'relative',
//   },
//   activeTabItem: {
//     // Active state styling
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#999999',
//   },
//   activeTabText: {
//     color: '#000000',
//   },
//   activeIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 2,
//     backgroundColor: '#000000',
//   },
// });