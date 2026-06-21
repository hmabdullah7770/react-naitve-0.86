const initialState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  message: null,
  totalProducts: 0,
};

const storeProduct = (state = initialState, action) => {
  switch (action.type) {
    // Get Store Products
    case 'GET_STORE_PRODUCT_SUCCESSFUL':
      console.log('GET_STORE_PRODUCT_SUCCESSFUL:', action.payload);
      return {
        ...state,
        products: action.payload.data || [],
        totalProducts: action.payload.data ? action.payload.data.length : 0,
        error: null,
        // message: action.payload.message,
      };

    case 'GET_STORE_PRODUCT_FAIL':
      console.log('GET_STORE_PRODUCT_FAIL:', action.payload.error);
      return {
        ...state,
        products: [],
        totalProducts: 0,
        error: action.payload.error,
        message: null,
      };

    // Add Product
    case 'ADD_PRODUCT_SUCCESSFUL':
      console.log('ADD_PRODUCT_SUCCESSFUL:', action.payload);
      return {
        ...state,
        products: [...state.products, action.payload.data],
        totalProducts: state.totalProducts + 1,
        error: null,
        message: action.payload.message,
      };

    case 'ADD_PRODUCT_FAIL':
      console.log('ADD_PRODUCT_FAIL:', action.payload.error);
      return {
        ...state,
        error: action.payload.error,
        message: null,
      };

    // Update Product
    case 'UPDATE_PRODUCT_SUCCESSFUL':
      console.log('UPDATE_PRODUCT_SUCCESSFUL:', action.payload);
      return {
        ...state,
        products: state.products.map(product =>
          product._id === action.payload.data._id
            ? { ...product, ...action.payload.data }
            : product
        ),
        currentProduct: action.payload.data,
        error: null,
        message: action.payload.message,
      };

    case 'UPDATE_PRODUCT_FAIL':
      console.log('UPDATE_PRODUCT_FAIL:', action.payload.error);
      return {
        ...state,
        error: action.payload.error,
        message: null,
      };

    // Delete Product
    case 'DELETE_PRODUCT_SUCCESSFUL':
      console.log('DELETE_PRODUCT_SUCCESSFUL:', action.payload);
      return {
        ...state,
        products: state.products.filter(product => product._id !== action.payload.productId),
        totalProducts: state.totalProducts - 1,
        currentProduct: state.currentProduct && state.currentProduct._id === action.payload.productId
          ? null
          : state.currentProduct,
        error: null,
        message: action.payload.message,
      };

    case 'DELETE_PRODUCT_FAIL':
      console.log('DELETE_PRODUCT_FAIL:', action.payload.error);
      return {
        ...state,
        error: action.payload.error,
        message: null,
      };

    // Get Product By ID
    case 'GET_PRODUCT_BY_ID_SUCCESSFUL':
      console.log('GET_PRODUCT_BY_ID_SUCCESSFUL:', action.payload);
      return {
        ...state,
        currentProduct: action.payload.data,
        error: null,
        message: action.payload.message,
      };

    case 'GET_PRODUCT_BY_ID_FAIL':
      console.log('GET_PRODUCT_BY_ID_FAIL:', action.payload.error);
      return {
        ...state,
        currentProduct: null,
        error: action.payload.error,
        message: null,
      };

    // Loading State
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    // Clear Error
    case 'CLEAR_PRODUCT_ERROR':
      return {
        ...state,
        error: null,
      };

    // Clear Message
    case 'CLEAR_PRODUCT_MESSAGE':
      return {
        ...state,
        message: null,
      };

    default:
      return state;
  }
};

export default storeProduct;
