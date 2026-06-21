// import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiservice'





// const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' }); // Assuming 'accessToken' is the service name you used for the access token
// const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });





// export const profile = username =>
//   api.get('/users/f/:username', {
//     params: {
//       username,
//     },
//   });

export const addrating = (posts) =>
  api.post(`/ratings/add`, { posts });
