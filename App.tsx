import 'react-native-gesture-handler';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  AppScreens   from  './Stack/AppScreens';
import AuthScreens from './Stack/AuthScreens';
import {createNavigationContainerRef} from '@react-navigation/native'; // remove this line
import { navigationRef } from './utils/rootNavigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {Provider as ReduxProvider, useSelector} from 'react-redux';
import store from './Redux/store/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SnackProvider} from './context/Snackbar';
import * as Keychain from 'react-native-keychain';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PaperSnackbar from './components/PaperSnackbar';
import { useContext } from 'react';
import {SnackbarContext} from './context/Snackbar';
  import {QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {ThemeProvider} from './theme/ThemeContext';
import {OwnerProvider} from './context/IsOwner';
import { DatabaseProvider } from '@nozbe/watermelondb/react'
import database from './db'
import { tokencheck } from './Redux/action/auth';
import { BottomSheetProvider } from '@swmansion/react-native-bottom-sheet';


// Add this to your App.js

// import { tokencheckrequest } from './Redux/action/auth';







if (__DEV__) {
  require('./ReactotronConfig');
}

// Define a type for your Redux state (replace with your actual RootState)
interface RootState {
  auth: {
    isAuthenticated: boolean;
    user:Object | null;
    error: string | null; // Replace with your actual error type
    // messege: string | null; // Replace with your actual message type
    // Replace with your actual user type
    // Add other properties of your auth state here
  };
  // Add other slices of your state here
}

export const queryClient = new QueryClient();


const Stack = createNativeStackNavigator();

// ✅ Correct linking config with nested navigators
const linking = {
  prefixes: [
    'myapp://',
    'https://myapp.com',
  ],
  config: {
    screens: {
      AppScreens: {
        screens: {
             Tabnavigation: {
            screens: {
              Home: 'home',         // myapp://
              Following: 'following',
            },
          },
        },
      },
      AuthScreens: {
        screens: {
          Login: 'login',
        },
      },
    },
  },
};

const App = () => {

    // const {show, setShow, messege, explain,type} = useContext(SnackbarContext)
    // (Provide context null error)








  const dispatch = useDispatch();

//   const getToken = async () => {

//     const accessToken = await Keychain.getGenericPassword('accessToken');
//     console.log('Access Token:', accessToken);
//     return accessToken
//     // const  refreshToken = await Keychain.setGenericPassword('refreshToken', user.data.refreshToken);
//  };

// if(getToken!== null){
//  useEffect(()=>{
//  dispatch(
// tokencheck());
// },[])

//  }
 // useEffect to check token validity on app mount
  useEffect(() => {
    const checkAndDispatchToken = async () => {
      try {
        // Attempt to retrieve the access token from Keychain
      // // console.log('Clearing all stored tokens...');

        // await Keychain.resetGenericPassword({service:'accessToken'});
        // await Keychain.resetGenericPassword({service:'refreshToken'});
        // console.log('Tokens cleared successfully');


        // Keychain.getGenericPassword returns credentials object if found, or false if not
        const credentials = await Keychain.getGenericPassword({ service: 'accessToken' }); // Assuming 'accessToken' is the service name you used for the access token

        // If credentials exist (meaning a token was found)
        if (credentials) {
          console.log('Token found in Keychain. Dispatching tokencheck.');
          // Dispatch the tokencheck action to validate the token
          // dispatch(tokencheck());
          dispatch(tokencheck());
        } else {
          console.log('No token found in Keychain. Skipping tokencheck.');
          // No token found, isAuthenticated should remain false,
          // leading to rendering AuthScreens.
        }
      } catch (error) {
        console.error('Error retrieving token from Keychain:', error);
        // Handle errors during Keychain access, e.g., dispatch an error action
        // or ensure isAuthenticated is false.
      }
    };

    // Call the async function to perform the check and dispatch
    checkAndDispatchToken();

    // Optional: Add a cleanup function if needed
    // return () => {
    //   // Cleanup logic
    // };
  }, [dispatch]); // Dependency array includes dispatch

  // This state and console log seem unused based on the current logic.
  // If you're not using this state, you can remove it.








const {isAuthenticated,user, error} = useSelector((state: RootState) => state.auth);
console.log('Is authenticated:',isAuthenticated);


console.log('User in App.tsx :', user);


// const getToken = async () => {

//   const accessToken = await Keychain.setGenericPassword('accessToken', user.data.accessToken);
//   const  refreshToken = await Keychain.setGenericPassword('refreshToken', user.data.refreshToken);
// };

  // const [token,setToken] = useState<string | null>(null)
  // console.log('Current token:', token);


  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer ref={navigationRef} linking={linking}>
    {isAuthenticated ?  (
      <AppScreens />
    ) : (
      <AuthScreens/>
    )}


<PaperSnackbar/>

 {/* {(Array.isArray(messege) && messege.length > 0) ||
         (Array.isArray(error) && error.length > 0)
          ? <PaperSnackbar />
          : null} */}


</NavigationContainer>
  </GestureHandlerRootView>
);
};



const Root = () => {
  return (
       <QueryClientProvider  client={queryClient}>
           <ReduxProvider store={store}>
            <SafeAreaProvider>
              <ThemeProvider>
              <SnackProvider>
               <BottomSheetProvider>
             <OwnerProvider>  
                 <DatabaseProvider database={database} >    
                  <App />
              </DatabaseProvider>
              
             </OwnerProvider> 
             </BottomSheetProvider>
              </SnackProvider>
              </ThemeProvider>
            </SafeAreaProvider>
          </ReduxProvider>
         </QueryClientProvider>
  );
};

export default Root; // Export Root as default

const styles = StyleSheet.create({});
