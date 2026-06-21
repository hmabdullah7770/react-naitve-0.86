// import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiservice';
import Keychain from 'react-native-keychain';
import { signuprequest } from '../Redux/action/auth';





// const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' }); // Assuming 'accessToken' is the service name you used for the access token
// const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });









export const verifyemail = (email) =>
  api.post('/users/verify-email', {
   email,
  });

// export const matchusername = (username) =>
//   api.get('/users/match-username', {

//      params: {
//       username,
//     },
//   });



  export const  matchusername  = (username) =>
    api.get(`/users/match-username/${encodeURIComponent(username)}`
);

export const matchotp = (email, otp) =>
  api.post('/users/match-otp', {
    email,
    otp,
  });






// auth.js - API function
export const signup = (signupData) => {
  const {
    username,
    password,
    email,
    otp,
    avatar,
    bio,
    storelink,
    whatsapp,
    facebook,
    instagram,
  } = signupData;

  // Create FormData for file upload
  const formData = new FormData();

  // Add text fields
  formData.append('username', username);
  formData.append('password', password);
  formData.append('email', email);
  formData.append('otp', otp);
  formData.append('bio', bio);

  // Add social links only if they have values (not null/undefined/empty)
  if (storelink && storelink.trim() !== '') {
    formData.append('storelink', storelink);
  }
  if (whatsapp && whatsapp.trim() !== '') {
    formData.append('whatsapp', whatsapp);
  }
  if (facebook && facebook.trim() !== '') {
    formData.append('facebook', facebook);
  }
  if (instagram && instagram.trim() !== '') {
    formData.append('instagram', instagram);
  }

  // Add avatar file if it exists and has proper structure
  if (avatar && avatar.uri) {
    formData.append('avatar', {
      uri: avatar.uri,
      type: avatar.type || 'image/jpeg',
      name: avatar.fileName || 'avatar.jpg',
    });
  }

  // Log what's actually being sent (without null values)
  console.log('FormData being sent ===>', {
    username,
    password,
    email,
    otp,
    bio,
    avatar: avatar && avatar.uri ? 'File attached' : 'No file',
    storelink: storelink && storelink.trim() !== '' ? storelink : 'Not sent',
    whatsapp: whatsapp && whatsapp.trim() !== '' ? whatsapp : 'Not sent',
    facebook: facebook && facebook.trim() !== '' ? facebook : 'Not sent',
    instagram: instagram && instagram.trim() !== '' ? instagram : 'Not sent',
  });

  return api.post('/users/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};






// // export const signup =(username, password, email, otp, avatar, storelink, whatsapp, facebook, instagram, bio) =>{


// // // console.log('signuprequest()',signuprequest())

// //   console.log("data in api is ===>",{

// //     username:username,
// //     password:password,
// //     email:email,
// //     otp:otp,
// //     avatar:avatar,
// //     storelink:storelink,
// //     whatsapp:whatsapp,
// //     facebook: facebook,
// //     instagram:instagram,
// //     bio:bio
// //   }
// //   )
// //   return api.post('/users/register', {
// //      username:username,
// //     password:password,
// //     email:email,
// //     otp:otp,
// //     avatar:avatar,
// //     storelink:storelink,
// //     whatsapp:whatsapp,
// //     facebook: facebook,
// //     instagram:instagram,
// //     bio:bio
// //   });
// // }



// // auth.js - API function
// export const signup = (signupData) => {
//   const {
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     bio,
//     storelink = null,
//     whatsapp = null,
//     facebook = null,
//     instagram = null
//   } = signupData;

//   // Create FormData for file upload
//   const formData = new FormData();

//   // Add text fields
//   formData.append('username', username);
//   formData.append('password', password);
//   formData.append('email', email);
//   formData.append('otp', otp);
//   formData.append('bio', bio);
//   formData.append('avatar', avatar);



//   // Add social links only if they have values
//   if (storelink) formData.append('storelink', storelink);
//   if (whatsapp) formData.append('whatsapp', whatsapp);
//   if (facebook) formData.append('facebook', facebook);
//   if (instagram) formData.append('instagram', instagram);

//   // // Add avatar file if it exists
//   // if (avatar && avatar.uri) {
//   //   formData.append('avatar', {
//   //     uri: avatar.uri,
//   //     type: avatar.type || 'image/jpeg',
//   //     name: avatar.fileName || 'avatar.jpg'
//   //   });
//   // }

//   console.log("FormData in api is ===>", {
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     // avatar: avatar ? 'File attached' : 'No file',
//     storelink,
//     whatsapp,
//     facebook,
//     instagram,
//     bio
//   });

//   return api.post('/users/register', formData, {
//     // headers: {
//     //   'Content-Type': 'multipart/form-data',
//     // },
//   });
// };




// comment out


// export const signup =(username, password, email, otp, avatar, storelink, whatsapp, facebook, instagram, bio) =>{


// // console.log('signuprequest()',signuprequest())

//   console.log("data in api is ===>",{

//     username:username,
//     password:password,
//     email:email,
//     otp:otp,
//     avatar:avatar,
//     storelink:storelink,
//     whatsapp:whatsapp,
//     facebook: facebook,
//     instagram:instagram,
//     bio:bio
//   }
//   )
//   return api.post('/users/register', {
//      username:username,
//     password:password,
//     email:email,
//     otp:otp,
//     avatar:avatar,
//     storelink:storelink,
//     whatsapp:whatsapp,
//     facebook: facebook,
//     instagram:instagram,
//     bio:bio
//   });
// }



// // auth.js - API function
// export const signup = (signupData) => {
//   const {
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     bio,
//     storelink = null,
//     whatsapp = null,
//     facebook = null,
//     instagram = null
//   } = signupData;

//   console.log("data in api is ===>", {
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     storelink,
//     whatsapp,
//     facebook,
//     instagram,
//     bio
//   });

//   return api.post('/users/register', {
//     username,
//     password,
//     email,
//     otp,
//     avatar,
//     storelink,
//     whatsapp,
//     facebook,
//     instagram,
//     bio
//   });
// }










export const login = (username, password,email) =>{
  console.log('Making login request to:', '/users/login');
  return api.post('/users/login', {
     email,
    username,
    password,
    // azureUserName: 'ayesha.zahid'
  });
};


export const azurelogin = (username) =>
  api.post('mobile/Login', {
    username,

  });



export const changepassword = (oldpassword, newpassword) =>
  api.post('/users/change-password', {

    newpassword,
    oldpassword,

  });

export const logout = ()=>

    // const credentials = await Keychain.getGenericPassword({service:'accessToken'});
    // console.log("access token in api ")
    // console.log("access token in api ", credentials)
    // const accessToken = credentials ? credentials.password : null;
  api.post('/users/logout',


  );


// export const refreshToken = async () => {
//   // Get the refresh token from secure storage or your state
//   const credentials = await Keychain.getGenericPassword({ service: 'refreshToken' });
//   const refreshtoken =  credentials.password

//   return api.post(
//     '/users/refresh-token',
//     {},
//     {
//       headers: {
//         Authorization: `Bearer ${refreshtoken}`,
//       },
//     }
//   );
// };







  export const forgetpassword = (email)=>
    api.post('/users/forget-password', {
      email,

    });


export const resetpassword = (email, otp, newpassword)=>
  api.post('/users/reset-password', {
    email,
    otp,
    newpassword,
  });


  export const resendotp = (email)=>
    api.post('/users/re-send-otp', {
      email,
    });


export const changeavatar = (avatar) =>
  api.patch('/users/avatar', {
    avatar,
  });



export const userstate = username =>
  api.get('mobile/GetUserState', {
    params: {
      username,
    },
  });

export const locationlist = () =>
  api.get('mobile/Locationlist', {

  });

export const partnerlist = () =>
  api.get('mobile/Partnerlist', {

  });

export const setuserstate = (username, stationID, partnerKey) =>
  api.post('mobile/SetDispEnv', {
    username,
    stationID,
    partnerKey,
    azureUserName: 'ayesha.zahid',
  });



  export  const getuser =()=>
    api.get('/users/current-user')   


  export  const getuserbyid =(userId)=>
    api.get(`/users/user-id/${encodeURIComponent(userId)}`)