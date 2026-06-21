// filepath: c:\rn\ecom\utils\apiConfig.js
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import { BASE_URL, PRODUCTION_URL} from '@env';

import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';

import {useSelector} from 'react-redux';

// const accessToken = useSelector((state) => state.auth.user.data.accessToken);
// const refreshToken = useSelector((state) => state.auth.user.data.refreshToken);

export const Producturl = () => Config.PRODUCTION_URL;
export const Baseurl = () => Config.BASE_URL;
export const PostgrsBaseurl = () => Config.POSTGRS_BASE_URL;

console.log('🔴 BASE_URL:', Config.BASE_URL);
console.log('🔴 All Config:', JSON.stringify(Config, null, 2));

console.warn('🔴 POSTGRS_BASE_URL:', Config.POSTGRS_BASE_URL);

if (!Config.BASE_URL) {
  console.error(
    '❌ BASE_URL is undefined! Check your .env file and gradle config',
  );
}

// export const Header = async () => {
//   try {

//     await Keychain.setGenericPassword('accessToken', accessToken);
//     await Keychain.setGenericPassword('refreshToken', refreshToken);

//     console.log('Token stored successfully')
//     // const token = await AsyncStorage.getItem('userToken');
//     if (accessToken) {
//       return `{Bearer ${accessToken}}`
//     }

//     return {}; // Return empty object if no token
//   } catch (error) {
//     console.log('Error getting token:', error);
//     return {}; // Return empty object on error
//   }
// };

// import base64 from 'react-native-base64';

// import {BASE_URL, AUTH_USERNAME, AUTH_PASSWORD, AZURE_USERNAME} from '@env';

// export const Baseurl = () => BASE_URL;

// export const Header = () => {

//   const authUsername = AUTH_USERNAME;

//   const authPassword = AUTH_PASSWORD;

//   const base64Auth = base64.encode(`${authUsername}:${authPassword}`);

//   return `Basic ${base64Auth}`;
// };

// export const AzureName = AZURE_USERNAME;
