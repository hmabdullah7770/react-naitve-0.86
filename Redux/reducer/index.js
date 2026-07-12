import {combineReducers} from 'redux';
import auth from './Auth';
import states from './states';
import category from './Categoury';
import search from './Search'; 

import storeproduct from './storee/Store_Product';
import post from './Post';
import createStore from './storee/Store_CreateStore';

const rootReducer = combineReducers({
  auth: auth,
  States: states,
  category: category,
  storeproduct: storeproduct,
  post: post,
  createStore: createStore,
  search: search, // 🆕 add the search reducer
});

export default rootReducer;
