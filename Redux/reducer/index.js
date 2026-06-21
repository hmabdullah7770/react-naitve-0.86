import {combineReducers} from 'redux';
import auth from './Auth';
import states from './states';
import category from './Categoury';
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
});

export default rootReducer;
