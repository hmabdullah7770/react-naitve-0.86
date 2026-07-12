// import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiservice';





// const accessToken = await Keychain.getGenericPassword({ service: 'accessToken' }); // Assuming 'accessToken' is the service name you used for the access token
// const refreshToken = await Keychain.getGenericPassword({ service: 'refreshToken' });





// export const profile = username =>
//   api.get('/users/f/:username', {
//     params: {
//       username,
//     },
//   });


// export const addbanner = (bannerImage,bannerbutton) =>
//   api.post('/banner/createbanner',


//     {

//         bannerImage,
//         bannerbutton,

//   });



export const addbanner = (selectedImage, bannerbutton) => {
  const formData = new FormData();

  formData.append('bannerImage', {
    uri: selectedImage.uri,
    type: selectedImage.type || 'image/jpeg',
    name: selectedImage.fileName || 'banner.jpg',
  });

  formData.append('bannerbutton', bannerbutton);

  return api.post('/banner/createbanner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};


export const deletebanner = (bannerId) =>
  api.delete('/banner/deletebanner',


    {
  params:{
    bannerId,
  },

    });



export const getallbanner = () =>
  api.get('/banner/getbanner',


    {
params:{
    adminpassword:'(Bunny)tota#34#',
    },
  });



