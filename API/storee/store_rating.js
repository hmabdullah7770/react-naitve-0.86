import api from '../../services/apiservice';






//create product by store owner


// export const addproduct = (storeId, productData) =>
//   api.post(`/stores/${encodeURIComponent(storeId)}/products`, productData);


export const getstoreRating = (storeId) =>
  api.get(
    `/stores/rating/summary/${encodeURIComponent(storeId)}`,

  );
//get product of the stores
export const getuselist  = (storeId) =>{

  console.log('Inside Api call with storeId:', storeId);

return api.get(`/stores/rating/list/${encodeURIComponent(storeId)}`);
};

//get product by id
export const addStoreRating = (rating,storeId,review) =>
  api.post(`/stores/rating/addrate`,{
rating,storeId,review
  });




export const deletestorerating = (storeId) =>
  api.post(`/stores/rating/${encodeURIComponent(storeId)}`);

