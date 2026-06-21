import {call, put, takeLatest} from 'redux-saga/effects';
import * as actions from '../../action/storee/store_product';
import * as api from '../../../API/storee/store_product';

// Get Store Products Saga
function* GetStoreProductSaga(payload) {
  try {
    console.log('GetStoreProductSaga started with payload:', payload);
    yield put(actions.setLoading(true));
    const response = yield call(api.getstoreproduct, payload.storeId);

    console.log('Making API call for store products...');
    if (response.status === 200) {
      console.log('Store products response data:', response.data);
      if (!response.data || typeof response.data !== 'object') {
        yield put(
          actions.getStoreProductFail([
            'Unexpected error occurred',
            'Response format is invalid or empty.',
          ]),
        );
      } else if (response.data.error) {
        console.log(
          'Get store products failed with message:',
          response.data.error,
        );
        yield put(actions.getStoreProductFail([response.data.error]));
      } else {
        console.log('Get store products successful, data:', response.data);
        // Pass the products array directly so reducer receives an array in action.payload.data
        yield put(
          actions.getStoreProductSuccessful(
            response.data.data,
            [
              'Get Products successful',
              'Products loaded successfully',
            ],
          ),
        );
      }
    } else {
      console.log(
        'Unexpected status code:',
        response.status,
        'error:',
        response.data?.error,
      );
      yield put(
        actions.getStoreProductFail([
          `Unexpected response status: ${response.status}`,
          `${response.data?.error || 'Please try again'}`,
        ]),
      );
    }
    yield put(actions.setLoading(false));
  } catch (error) {
    console.log('GetStoreProductSaga error:', error);
    yield put(actions.setLoading(false));
    yield put(
      actions.getStoreProductFail([
        'An error occurred',
        error.message || 'Unknown error',
      ]),
    );
  }
}

// Add Product Saga
function* AddProductSaga(payload) {
  try {
    console.log('AddProductSaga started with payload:', payload);
    yield put(actions.setLoading(true));
    const {storeId, productData} = payload;
    const response = yield call(api.addproduct, storeId, productData);

    console.log('Making API call to add product...');
    if (response.status === 200 || response.status === 201) {
      console.log('Add product response data:', response.data);
      if (response.data.error) {
        yield put(actions.addProductFail([response.data.error]));
      } else {
        console.log('Add product successful, data:', response.data);
        yield put(
          actions.addProductSuccessful(response.data, [
            'Product added successfully',
            'New product created',
          ]),
        );
      }
    } else {
      yield put(
        actions.addProductFail([
          `Unexpected response status: ${response.status}`,
          `${response.data?.error || 'Please try again'}`,
        ]),
      );
    }
    yield put(actions.setLoading(false));
  } catch (error) {
    console.log('AddProductSaga error:', error);
    yield put(actions.setLoading(false));
    yield put(
      actions.addProductFail([
        'An error occurred',
        error.message || 'Unknown error',
      ]),
    );
  }
}

// Update Product Saga
function* UpdateProductSaga(payload) {
  try {
    console.log('UpdateProductSaga started with payload:', payload);
    yield put(actions.setLoading(true));
    const {storeId, productId, productData} = payload;
    const response = yield call(
      api.updateProduct,
      storeId,
      productId,
      productData,
    );

    console.log('Making API call to update product...');
    if (response.status === 200) {
      console.log('Update product response data:', response.data);
      if (response.data.error) {
        yield put(actions.updateProductFail([response.data.error]));
      } else {
        console.log('Update product successful, data:', response.data);
        yield put(
          actions.updateProductSuccessful(response.data, [
            'Product updated successfully',
            'Changes saved',
          ]),
        );
      }
    } else {
      yield put(
        actions.updateProductFail([
          `Unexpected response status: ${response.status}`,
          `${response.data?.error || 'Please try again'}`,
        ]),
      );
    }
    yield put(actions.setLoading(false));
  } catch (error) {
    console.log('UpdateProductSaga error:', error);
    yield put(actions.setLoading(false));
    yield put(
      actions.updateProductFail([
        'An error occurred',
        error.message || 'Unknown error',
      ]),
    );
  }
}

// Delete Product Saga
function* DeleteProductSaga(payload) {
  try {
    console.log('DeleteProductSaga started with payload:', payload);
    yield put(actions.setLoading(true));
    const {storeId, productId} = payload;
    const response = yield call(api.deleteProduct, storeId, productId);

    console.log('Making API call to delete product...');
    if (response.status === 200) {
      console.log('Delete product response data:', response.data);
      if (response.data.error) {
        yield put(actions.deleteProductFail([response.data.error]));
      } else {
        console.log('Delete product successful');
        yield put(
          actions.deleteProductSuccessful(productId, [
            'Product deleted successfully',
            'Product removed from catalog',
          ]),
        );
      }
    } else {
      yield put(
        actions.deleteProductFail([
          `Unexpected response status: ${response.status}`,
          `${response.data?.error || 'Please try again'}`,
        ]),
      );
    }
    yield put(actions.setLoading(false));
  } catch (error) {
    console.log('DeleteProductSaga error:', error);
    yield put(actions.setLoading(false));
    yield put(
      actions.deleteProductFail([
        'An error occurred',
        error.message || 'Unknown error',
      ]),
    );
  }
}

// Get Product By ID Saga
function* GetProductByIdSaga(payload) {
  try {
    console.log('GetProductByIdSaga started with payload:', payload);
    yield put(actions.setLoading(true));
    const response = yield call(api.getproductbyId, payload.productId);

    console.log('Making API call to get product by ID...');
    if (response.status === 200) {
      console.log('Get product by ID response data:', response.data);
      if (response.data.error) {
        yield put(actions.getProductByIdFail([response.data.error]));
      } else {
        console.log('Get product by ID successful, data:', response.data);
        yield put(
          actions.getProductByIdSuccessful(response.data, [
            'Product details loaded',
            'Product found successfully',
          ]),
        );
      }
    } else {
      yield put(
        actions.getProductByIdFail([
          `Unexpected response status: ${response.status}`,
          `${response.data?.error || 'Please try again'}`,
        ]),
      );
    }
    yield put(actions.setLoading(false));
  } catch (error) {
    console.log('GetProductByIdSaga error:', error);
    yield put(actions.setLoading(false));
    yield put(
      actions.getProductByIdFail([
        'An error occurred',
        error.message || 'Unknown error',
      ]),
    );
  }
}

export function* watchProductSaga() {
  yield takeLatest('GET_STORE_PRODUCT_REQUEST', GetStoreProductSaga);
  yield takeLatest('ADD_PRODUCT_REQUEST', AddProductSaga);
  yield takeLatest('UPDATE_PRODUCT_REQUEST', UpdateProductSaga);
  yield takeLatest('DELETE_PRODUCT_REQUEST', DeleteProductSaga);
  yield takeLatest('GET_PRODUCT_BY_ID_REQUEST', GetProductByIdSaga);
}

export default function* productrootSaga() {
  yield watchProductSaga();
}
