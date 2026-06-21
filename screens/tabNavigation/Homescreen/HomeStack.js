import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const HomeStack = () => {
  return (
    <View>
      <Text>HomeStack</Text>
    </View>
  )
}

export default HomeStack

const styles = StyleSheet.create({})

// import React, { useEffect, useState } from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// // import Loader from '../components/Loader';
// import Tabnavigation from '../screens/tabNavigation/Tabnavigation';
// import ProfileStack from '../screens/ProfileScreens/ProfileStack';
// import NotificationStack from '../screens/NotificationScreens/NotificationStack';
// import MessageStack from '../screens/MessageScreens/MessageStack'

// // import api from '../services/apiservice'; //
// const HomeStack = () => {
//   const HomeStack = createStackNavigator();




//   return (
//     <>
//       {/* Show loader if loading state is true */}
//       {loading && <Loader />}
//       {/* Set up the navigation stack */}
//       <App.Navigator>
//         {/* Define your screens */}
//         <App.Screen
//           name="Tabnavigation"
//           component={Tabnavigation}
//           options={{ headerShown: false }}
//         />
//         {/* <App.Screen name="TestingScreen" component={TestingScreen} /> */}


//         <App.Screen name="ProfileStack" component={ProfileStack} />
//         <App.Screen name="NotificationStack" component={NotificationStack} />


//         <App.Screen name="MessageStack" component={MessageStack} />









//         {/* Add other screens here, e.g.: */}
//         {/* <App.Screen name="Home" component={HomeScreen} /> */}
//         {/* <App.Screen name="Dispatch" component={DispatchScreen} /> */}
//         {/* ... other screens */}
//       </App.Navigator>
//     </>
//   );
// };

// export default HomeStack;

// // import React, { useEffect, useState } from 'react';
// // import { createStackNavigator } from '@react-navigation/stack';
// // import Loader from '../components/Loader';
// // import { useSelector } from 'react-redux';
// // import * as Keychain from 'react-native-keychain';
// // import TestingScreen from '../screens/TestingScreen'; // Assuming this is the initial screen

// // const AppScreens = () => {
// //   const App = createStackNavigator();

// //   const { loading, user } = useSelector(state => state.auth); // Access the whole user object

// //   // Use state to track if tokens have been stored to prevent repeated calls
// //   const [tokensStored, setTokensStored] = useState(false);

// //   useEffect(() => {
// //     const storeTokens = async () => {
// //       if (user?.data?.accessToken && user?.data?.refreshToken && !tokensStored) {
// //         try {
// //           await Keychain.setGenericPassword('accessToken', user.data.accessToken);
// //           await Keychain.setGenericPassword('refreshToken', user.data.refreshToken);
// //           console.log('Tokens stored successfully!');
// //           setTokensStored(true); // Mark tokens as stored
// //         } catch (error) {
// //           console.error('Error storing tokens:', error);
// //           // Handle the error appropriately
// //         }
// //       }
// //     };

// //     storeTokens();

// //     // You might also want a cleanup effect to clear tokens on logout
// //     // return () => {
// //     //   // Logic to clear tokens on component unmount or logout
// //     // };

// //   }, [user, tokensStored]); // Depend on user and tokensStored state

// //   return (
// //     <>
// //       {loading && <Loader />}
// //       <App.Navigator>
// //         <App.Screen name="TestingScreen" component={TestingScreen} />
// //         {/* Add other screens here */}
// //       </App.Navigator>
// //     </>
// //   );
// // };

// // export default AppScreens;
