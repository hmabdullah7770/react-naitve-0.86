// Action Types
export const GET_STORE_PRODUCT_REQUEST = 'GET_STORE_PRODUCT_REQUEST';
export const GET_STORE_PRODUCT_SUCCESSFUL = 'GET_STORE_PRODUCT_SUCCESSFUL';
export const GET_STORE_PRODUCT_FAIL = 'GET_STORE_PRODUCT_FAIL';

export const ADD_PRODUCT_REQUEST = 'ADD_PRODUCT_REQUEST';
export const ADD_PRODUCT_SUCCESSFUL = 'ADD_PRODUCT_SUCCESSFUL';
export const ADD_PRODUCT_FAIL = 'ADD_PRODUCT_FAIL';

export const UPDATE_PRODUCT_REQUEST = 'UPDATE_PRODUCT_REQUEST';
export const UPDATE_PRODUCT_SUCCESSFUL = 'UPDATE_PRODUCT_SUCCESSFUL';
export const UPDATE_PRODUCT_FAIL = 'UPDATE_PRODUCT_FAIL';

export const DELETE_PRODUCT_REQUEST = 'DELETE_PRODUCT_REQUEST';
export const DELETE_PRODUCT_SUCCESSFUL = 'DELETE_PRODUCT_SUCCESSFUL';
export const DELETE_PRODUCT_FAIL = 'DELETE_PRODUCT_FAIL';

export const GET_PRODUCT_BY_ID_REQUEST = 'GET_PRODUCT_BY_ID_REQUEST';
export const GET_PRODUCT_BY_ID_SUCCESSFUL = 'GET_PRODUCT_BY_ID_SUCCESSFUL';
export const GET_PRODUCT_BY_ID_FAIL = 'GET_PRODUCT_BY_ID_FAIL';

export const SET_LOADING = 'SET_LOADING';
export const CLEAR_PRODUCT_ERROR = 'CLEAR_PRODUCT_ERROR';
export const CLEAR_PRODUCT_MESSAGE = 'CLEAR_PRODUCT_MESSAGE';

// Action Creators

// Get Store Products
export const getStoreProductRequest = (storeId) =>
{
 console.log('Inside getStoreProductRequest with storeId:', storeId);
  return{
  type: GET_STORE_PRODUCT_REQUEST,
   storeId,
};};









export const getStoreProductSuccessful = (data, message) => ({
  type: GET_STORE_PRODUCT_SUCCESSFUL,
  payload: { data,
    // ,message
  },
});

export const getStoreProductFail = (error) => ({
  type: GET_STORE_PRODUCT_FAIL,
  payload: { error },
});

// Add Product
export const addProductRequest = (storeId, productData) => ({
  type: ADD_PRODUCT_REQUEST,
  payload: { storeId, productData },
});

export const addProductSuccessful = (data, message) => ({
  type: ADD_PRODUCT_SUCCESSFUL,
  payload: { data, message },
});

export const addProductFail = (error) => ({
  type: ADD_PRODUCT_FAIL,
  payload: { error },
});

// Update Product
export const updateProductRequest = (storeId, productId, productData) => ({
  type: UPDATE_PRODUCT_REQUEST,
  payload: { storeId, productId, productData },
});

export const updateProductSuccessful = (data, message) => ({
  type: UPDATE_PRODUCT_SUCCESSFUL,
  payload: { data, message },
});

export const updateProductFail = (error) => ({
  type: UPDATE_PRODUCT_FAIL,
  payload: { error },
});

// Delete Product
export const deleteProductRequest = (storeId, productId) => ({
  type: DELETE_PRODUCT_REQUEST,
  payload: { storeId, productId },
});

export const deleteProductSuccessful = (productId, message) => ({
  type: DELETE_PRODUCT_SUCCESSFUL,
  payload: { productId, message },
});

export const deleteProductFail = (error) => ({
  type: DELETE_PRODUCT_FAIL,
  payload: { error },
});

// Get Product By ID
export const getProductByIdRequest = (productId) => ({
  type: GET_PRODUCT_BY_ID_REQUEST,
  payload: { productId },
});

export const getProductByIdSuccessful = (data, message) => ({
  type: GET_PRODUCT_BY_ID_SUCCESSFUL,
  payload: { data, message },
});

export const getProductByIdFail = (error) => ({
  type: GET_PRODUCT_BY_ID_FAIL,
  payload: { error },
});

// Utility Actions
export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading,
});

export const clearProductError = () => ({
  type: CLEAR_PRODUCT_ERROR,
});

export const clearProductMessage = () => ({
  type: CLEAR_PRODUCT_MESSAGE,
});
