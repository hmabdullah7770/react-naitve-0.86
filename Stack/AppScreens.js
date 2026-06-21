import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import Loader from '../components/Loader';
import {useSelector} from 'react-redux';

import * as Keychain from 'react-native-keychain';
import {useContext} from 'react';
import {SnackbarContext} from '../context/Snackbar';
import TestingScreen from '../screens/TestingScreen'; // Assuming this is the initial screen
import Tabnavigation from '../screens/tabNavigation/Tabnavigation';
import {clearerror, clearmessege} from '../Redux/action/auth';
import {useDispatch} from 'react-redux';
import ProfileStack from '../screens/tabNavigation/profilescreen/ProfileStack';
import CreateStoreScreens from '../screens/storeScreens/BeforeStore/BeforeStoreStack'; // ✅ Import
import StoreScreen from '../screens/storeScreens/StoreScreens';
import NotificationStack from '../screens/NotificationScreens/NotificationStack';
import MessageStack from '../screens/MessageScreens/MessageStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoFeedStack from '../screens/tabNavigation/VideoFeedscreen/VideoFeedStack';
import {DeviceEventEmitter} from 'react-native';
import PostReelScreen from '../screens/PostRealScreen/PostReelScreen';
// import {OwnerProvider} from '../context/IsOwner';
// import { useContext } from 'react';
import { OwnerContext } from '../context/IsOwner';




// import api from '../services/apiservice'; //

const App = createStackNavigator();
const AppScreens = () => {
  const { setOwnerId } = useContext(OwnerContext);
  // Access the loading state and the user object from Redux
  const {loading, user, error, messege, usernameerror, emailerror} =
    useSelector(state => state.auth);
  const dispatch = useDispatch();

  const {handleSnackbar} = useContext(SnackbarContext);

  // useEffect(() => {
  //   if (error) {
  //     handleSnackbar({error});
  //     dispatch(clearerror());
  //   } else if (messege) {
  //     handleSnackbar({messege});
  //     dispatch(clearmessege());
  //   }
  // }, [error, messege]);



  // ✅ AFTER (fixed)
useEffect(() => {
    const run = async () => {
      if (error) {
        await handleSnackbar({error});   // ✅ wait for snackbar to finish
        dispatch(clearerror());          // ✅ THEN clear the error
      } else if (messege) {
        await handleSnackbar({messege}); // ✅ wait for snackbar to finish
        dispatch(clearmessege());        // ✅ THEN clear the message
      }
    };
    run();
}, [error, messege]);

  console.log('error in AppScreens', error);

  console.log('user whatsapp with .user ', user?.data?.data?.user?.whatsapp);
  console.log('user instagram with .user ', user?.data?.data?.user?.instagram);

  console.log('user facebook  ', user?.data?.data?.facebook);
  console.log('user instagram  ', user?.data?.data?.instagram);
  console.log('user whatsapp  ', user?.data?.data?.whatsapp);
  console.log('user  storelink  ', user?.data?.data?.storeLink);

  console.log('user tokenin: ', user?.data?.data?.accessToken);

  console.log('user id :', user?.data?.data?.user?._id);

  //verfiy the user have store or not
  const stores = user?.data?.data?.user?.stores || [];
  const storeId = stores.length > 0 ? stores[0].storeId : null;

  const userId = user?.data?.data?.user?._id || null;

  // //verfiy the user have facebook or not
  // const facebook = user?.data?.data?.user?.facebook || [];
  // const facebookId = facebook.length > 0 ? facebook[0].facebookId : null;

  // //verfiy the user have whatsapp or not
  // const whatsapp = user?.data?.data?.user?.whatsapp || [];
  // const whatsappId = whatsapp.length > 0 ? whatsapp[0].whatsappId : null;

  // //verfiy the user have instagram or not
  // const instagram= user?.data?.data?.user?.instagram || [];
  // const instagramId = instagram.length > 0 ? instagram[0].instagramId : null;

  // //verfiy the user have whatsapp or not
  // const storeLink = user?.data?.data?.user?.storeLink || [];
  // const storeLinkUrl = storeLink.length > 0 ? storeLink[0].storeLinkUrl : null;

  // State to track if tokens have been stored to prevent repeated storage attempts
  const [tokensStored, setTokensStored] = useState(false);

  // useEffect to handle token storage when user data is available
  useEffect(() => {
    const storeTokens = async () => {
      // Check if user data and tokens exist, and if tokens haven't been stored yet
      if (
        user?.data?.data?.accessToken &&
        user?.data?.data?.refreshToken &&
        !tokensStored
      ) {
        try {
          // Clear all previous common headers
          // api.defaults.headers.common = {};

          // console.log("header are:" ,api.defaults.headers.common)
          // Store the access token using a generic password
          // await Keychain.resetGenericPassword({service:'accessToken'});
          // await Keychain.resetGenericPassword({service:'refreshToken'});

          console.log('in app stack in use effect');
          await Keychain.setGenericPassword(
            'accessToken',
            user?.data?.data?.accessToken,
            {service: 'accessToken'},
          );
          // Store the refresh token using a generic password
          await Keychain.setGenericPassword(
            'refreshToken',
            user?.data?.data?.refreshToken,
            {service: 'refreshToken'},
          );

          console.log('Tokens stored successfully!');

          //verfiy the user have store or not

          if (userId) {
            await Keychain.setGenericPassword('userId', userId, {
              service: 'userId',
            });
            console.log('UserId stored successfully!');
            console.log('userId stored in  after success Keychain:', userId);
            setOwnerId(userId);
          } else {
            console.log('No userId to store.');
          }

          if (storeId) {
            await Keychain.setGenericPassword('storeId', storeId, {
              service: 'storeId',
            });
            console.log('StoreId stored successfully!');
          } else {
            console.log('No storeId to store.');
          }

          //verfiy the user have store or not

          // if (facebookId) {
          //   await Keychain.setGenericPassword('facebookId', facebookId, { service: 'facebookId' });
          //   console.log('StoreId stored successfully!');
          // } else {
          //   console.log('No storeId to store.');
          // }

          // Store facebook if it exists (it's a string, not an array)
          if (user?.data?.data?.user?.facebook) {
            try {
              await AsyncStorage.setItem(
                'facebookId',
                user?.data?.data?.user?.facebook,
              );
              console.log('Facebook ID stored successfully!');
            } catch (error) {
              console.error('Error storing Facebook ID:', error);
            }
          } else {
            console.log('No Facebook ID to store.');
          }

          // Store whatsapp if it exists (it's a string, not an array)
          if (user?.data?.data?.user?.whatsapp) {
            try {
              await AsyncStorage.setItem(
                'whatsappId',
                user?.data?.data?.user?.whatsapp,
              );
              console.log('Whatsapp ID stored successfully!');
            } catch (error) {
              console.error('Error storing Whatsapp ID:', error);
            }
          } else {
            console.log('No Whatsapp ID to store.');
          }

          // Store instagram if it exists (it's a string, not an array)
          if (user?.data?.data?.user?.instagram) {
            try {
              await AsyncStorage.setItem(
                'instagramId',
                user?.data?.data?.user?.instagram,
              );
              console.log('Instagram ID stored successfully!');
            } catch (error) {
              console.error('Error storing Instagram ID:', error);
            }
          } else {
            console.log('No Instagram ID to store.');
          }

          // Store storeLink if it exists (it's a string, not an array)
          if (user?.data?.data?.user?.storeLink) {
            try {
              await AsyncStorage.setItem(
                'storeLinkUrl',
                user?.data?.data?.user?.storeLink,
              );
              console.log('StoreLink URL stored successfully!');
            } catch (error) {
              console.error('Error storing StoreLink URL:', error);
            }
          } else {
            console.log('No StoreLink URL to store.');
          }

          // Store facebook if it exists (it's a string, not an array)
          if (user?.data?.data?.user?.avatar) {
            try {
              await AsyncStorage.setItem(
                'avatar',
                user?.data?.data?.user?.avatar,
              );
              console.log('Avatar URL stored successfully!');
            } catch (error) {
              console.error('Error storing Avatar URL:', error);
            }
          } else {
            console.log('No Avatar URL to store.');
          }

          // ✅ Emit ONLY after everything succeeds
          DeviceEventEmitter.emit('userIdStored', userId);

          // Mark tokens as stored to prevent re-storing on subsequent state changes
          // api.defaults.headers.common['Authorization'] = `Bearer ${user?.data?.data?.accessToken}`;
          setTokensStored(true);
        } catch (error) {
          console.error('Error storing tokens:', error);
          // Implement appropriate error handling here, e.g., show a user message
        }
      }
    };

    // Call the storeTokens function
    storeTokens();

    // Optional: Add a cleanup function to clear tokens on component unmount or logout
    // return () => {
    //   // Logic to clear tokens, e.g., call a clearTokens function
    // };
  }, [user, tokensStored]); // Dependencies: Re-run effect if user or tokensStored state changes

  // // ✅ Add this before the return
  // if (!tokensStored) {
  //   return <Loader />;
  // }

  return (
    <>
      {/* <OwnerProvider> */}
        {/* Show loader if loading state is true */}
        {loading && <Loader />}
        {/* Set up the navigation stack */}
        <App.Navigator>
          {/* Define your screens */}
          <App.Screen
            name="Tabnavigation"
            component={Tabnavigation}
            options={{headerShown: false}}
          />
          {/* <App.Screen name="TestingScreen" component={TestingScreen} /> */}

          <App.Screen
            name="ProfileStack"
            component={ProfileStack}
            options={{headerShown: false}}
          />

          <App.Screen
            name="CreateStoreScreens"
            component={CreateStoreScreens}
            options={{headerShown: false}}
          />

        
            <App.Screen
              name="StoreScreen"
              component={StoreScreen}
              options={{headerShown: false}}
            />
          
          <App.Screen name="NotificationStack" component={NotificationStack} />

          <App.Screen name="MessageStack" component={MessageStack} />


          <App.Screen
  name="PostReel"
  component={PostReelScreen}
  options={{
    headerShown: false,
    presentation: 'modal',        // ← slides up from bottom
    animation: 'slide_from_bottom',
    gestureEnabled: true,         // ← swipe down to close
  }}
/>

          <App.Screen name="VideoFeedStack" component={VideoFeedStack} />

          {/* Add other screens here, e.g.: */}
          {/* <App.Screen name="Home" component={HomeScreen} /> */}
          {/* <App.Screen name="Dispatch" component={DispatchScreen} /> */}
          {/* ... other screens */}
        </App.Navigator>
      {/* </OwnerProvider> */}
    </>
  );
};

export default AppScreens;

// import React, { useEffect, useState } from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import Loader from '../components/Loader';
// import { useSelector } from 'react-redux';
// import * as Keychain from 'react-native-keychain';
// import TestingScreen from '../screens/TestingScreen'; // Assuming this is the initial screen

// const AppScreens = () => {
//   const App = createStackNavigator();

//   const { loading, user } = useSelector(state => state.auth); // Access the whole user object

//   // Use state to track if tokens have been stored to prevent repeated calls
//   const [tokensStored, setTokensStored] = useState(false);

//   useEffect(() => {
//     const storeTokens = async () => {
//       if (user?.data?.accessToken && user?.data?.refreshToken && !tokensStored) {
//         try {
//           await Keychain.setGenericPassword('accessToken', user.data.accessToken);
//           await Keychain.setGenericPassword('refreshToken', user.data.refreshToken);
//           console.log('Tokens stored successfully!');
//           setTokensStored(true); // Mark tokens as stored
//         } catch (error) {
//           console.error('Error storing tokens:', error);
//           // Handle the error appropriately
//         }
//       }
//     };

//     storeTokens();

//     // You might also want a cleanup effect to clear tokens on logout
//     // return () => {
//     //   // Logic to clear tokens on component unmount or logout
//     // };

//   }, [user, tokensStored]); // Depend on user and tokensStored state

//   return (
//     <>
//       {loading && <Loader />}
//       <App.Navigator>
//         <App.Screen name="TestingScreen" component={TestingScreen} />
//         {/* Add other screens here */}
//       </App.Navigator>
//     </>
//   );
// };

// export default AppScreens;
