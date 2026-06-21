import api from '../../services/apiservice';

export const createStore = (category, storeName, storeLogo
  ,
  //storeType, productName 

) => {
  console.log('API call to create store with category:', category, 'storeName:', storeName, 'storeLogo:', storeLogo);
  
    // Create FormData for file upload
  const formData = new FormData();

  // Add text fields
  formData.append('category', category);
  formData.append('storeName', storeName);
  
// if (storeLogo && storeLogo.uri) {
//     formData.append('storeLogo', {
//       uri: storeLogo.uri,
//       type: storeLogo.type || 'image/jpeg',
//       name: storeLogo.fileName || 'storeLogo.jpg',
//     });
//   }

formData.append('storeLogo', {
  uri: storeLogo,        // the file:/// URI
  type: 'image/jpeg',
  name: 'storeLogo.jpg',
});

  
  
  return api.post('/stores/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

//get all the stores for authenticated user

export const getuserStores = () => api.get('/stores/user-stores', {});

//get store by id specific user
export const getStoreById = storeId => {
  return api.get(`/stores/${encodeURIComponent(storeId)}`);
};


export const getStoreByIds = (storeIds) =>
  api.post(`/stores/storebyids`, { storeIds });



 

export const updateStore = (
  storeId,
  category,
  storeType,
  storeName,
  productName,
  storeLogo,
) =>
  api.patch(`/stores/${encodeURIComponent(storeId)}`, {
    category,
    storeType,
    storeName,
    productName,
    storeLogo,
  });

export const deleteStore = storeId =>
  api.delete(`/stores/${encodeURIComponent(storeId)}`);

export const GetTopStores = (categoury, limit, page) => {
  return api.get('/stores/top-store/alltime', {
    params: {
      categoury,
      // adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });
};
