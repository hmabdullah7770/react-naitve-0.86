import api from '../../services/apiservice';






//create product by store owner


// export const addproduct = (storeId, productData) =>
//   api.post(`/stores/${encodeURIComponent(storeId)}/products`, productData);


export const addproduct = (storeId, productData) =>
  api.post(
    `/stores/${encodeURIComponent(storeId)}/products`,
    productData,
    {
      headers: {
        'Content-Type': 'multipart/form-data', // ← override per-request
      },
    }
  );
//get product of the stores
export const getstoreproduct = (storeId) =>{

  console.log('Inside Api call with storeId:', storeId);

return api.get(`/stores/${encodeURIComponent(storeId)}/products`);
};

//get product by id
export const getproductbyId = (productId) =>
  api.get(`/stores/products/${encodeURIComponent(productId)}`);


export const getproductbyIds = (productIds) =>
  api.post(`/stores/products/ids`, { productIds });




//delete product by store owner
export const deleteProduct = (storeId, productId) =>
  api.delete(`/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`);


//update product by owner
export const updateProduct = (storeId, productId, productData) =>
  api.put(`/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`, productData);




export const GetTopProducts = (categoury, limit, page) => {
  return api.get('/stores/top-products/alltime', {
    params: {
      categoury,
      // adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });
};
 

