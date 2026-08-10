// import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiservice'

import { compressData } from '../services/gzipService';

 

api.post(`/ratings/add`, { posts });

// export const addrating = (posts) =>{

//    // 1. Use the separate gzip service to compress the data
//   const compressedData = compressData({ posts });

//   return api.post(`/ratings/add`,  compressedData,{

//     headers: {
//       'Content-Encoding': 'gzip', // Tells Node.js to trigger your middleware
//     },

//     // 3. Tell Axios to NOT turn the binary data into a JSON string
//     transformRequest: [(data, headers) => {
//       // We must delete 'Content-Type' because this is now binary data, 
//       // not 'application/json'
//       delete headers['Content-Type']; 
//       return data; 
//     }]
//   });
// }