import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import HomeScreen from './HomeScreen';
import OfferScreen from './Offerscreen/OfferScreen';
import CreatepostScreen from './CreatePost/CreatepostScreen';
import FollowingScreen from './FollowingScreen';
import ProfileStack from './profilescreen/ProfileStack';
import TopStoreStack  from './Topstorescreen/TopStoreStack';

const Tab = createBottomTabNavigator();

const Tabnavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'rgb(2, 222, 134)',
        tabBarInactiveTintColor: 'gray',

        tabBarIcon: ({ focused, color, size }) => {
          // ✅ Use FontAwesome6 only for Profile tab
          if (route.name === 'TopStoreStack') {
            return (
              <FontAwesome6
                name="chart-simple"
                size={size}
                color={color}
                solid={focused}   // 👈 solid when selected
                regular={!focused} // 👈 regular when not selected
              />
            );
          }

          // ✅ Use Ionicons for all other tabs
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Following':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Offers':
              iconName = focused ? 'gift' : 'gift-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Following"
        component={FollowingScreen}
        options={{ tabBarLabel: 'Following' }}
      />
      <Tab.Screen
        name="Create"
        component={CreatepostScreen}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen
        name="Offers"
        component={OfferScreen}
        options={{ tabBarLabel: 'Offers' }}
      />
      <Tab.Screen
        name="TopStoreStack"
        component={TopStoreStack}
        options={{ tabBarLabel: 'TopStoreStack' }}
      />
    </Tab.Navigator>
  );
};

export default Tabnavigation;






// import { StyleSheet } from 'react-native';
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/Ionicons'; // You'll need to install this
// import HomeScreen from './HomeScreen';
// import OfferScreen from './OfferScreen';
// import CreatepostScreen from './CreatePost/CreatepostScreen';
// // import Hoc from '../hoc/Hoc';
// import SettingScreen from './SettingScreen';
// import ProfileScreen from './profilescreen/ProfileScreen';
// import FollowingScreen from './FollowingScreen';
// import ProfileStack from './profilescreen/ProfileStack';

// const Tab = createBottomTabNavigator();

// const Tabnavigation = () => {
//   return (
//     <Tab.Navigator
      
    
//     screenOptions={({ route }) => ({
       
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           switch (route.name) {
//             case 'Home':
//               iconName = focused ? 'home' : 'home-outline';
//               break;
//             case 'Following':
//               iconName = focused ? 'people' : 'people-outline';
//               break;
//             case 'Create':
//               iconName = focused ? 'add-circle' : 'add-circle-outline';
//               break;
//             case 'Offers':
//               iconName = focused ? 'gift' : 'gift-outline';
//               break;
//             case 'Profile':
//               iconName = focused ? 'person' : 'person-outline';
//               break;
//           }

//           return <Icon name={iconName} size={size} color={color} />;
//         },
//          tabBarActiveTintColor: 'rgb(2, 222, 134)',
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false, // If you don't want headers
//       })}
//     >
//       {/* apply hoc */}
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{ tabBarLabel: 'Home' }}
//       />
//         {/* apply hoc */}
//       <Tab.Screen
//         name="Following"
//         component={FollowingScreen}
//         options={{ tabBarLabel: 'Following' }}
//       />
//       <Tab.Screen
//         name="Create"
//         component={CreatepostScreen}
//         options={{ tabBarLabel: 'Create' }}
//       />
//       <Tab.Screen
//         name="Offers"
//         component={OfferScreen}
//         options={{ tabBarLabel: 'Offers' }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileStack}
//         options={{ tabBarLabel: 'Profile' }}
//       />
//     </Tab.Navigator>
//   );
// };

// export default Tabnavigation;
















// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import HomeScreen from './HomeScreen';
// import OfferScreen from './OfferScreen';
// import CreatepostScreen from './CreatepostScreen';
// import SettingScreen from './SettingScreen';
// import ProfileScreen from './ProfileScreen';
// import FollowingScreen from './FollowingScreen';


// const Tab = createBottomTabNavigator();

// const Tabnavigation = () => {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="HomeScreen" component={HomeScreen} />
//         <Tab.Screen name="FollowingScreen" component={FollowingScreen} />
//        <Tab.Screen name="CreatepostScreen" component={CreatepostScreen} />
//        <Tab.Screen name="OfferScreen" component={OfferScreen} />
//         {/* <Tab.Screen name="SettingScreen" component={SettingScreen} /> */}
//          <Tab.Screen name="ProfileScreen" component={ProfileScreen} />

//     </Tab.Navigator>
//   )
// }

// export default Tabnavigation

// const styles = StyleSheet.create({})
