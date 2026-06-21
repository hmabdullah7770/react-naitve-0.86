import * as Keychain from 'react-native-keychain';
// import {matchotp} from '../../API/auth';
// import {create} from 'react-test-renderer';
// import { createStore } from '../../../API/storee/store_createstore';

const initialState = {
  //  accessToken: null,
  store: null,
  error: null,

  // isAuthenticated: false,
  // userstate: null,
  loading: false,
  messege: null,
  // userstate: null,
  // locationlist: null,
  // partnerlist: null,
  // setuserstate: null,
  //   cleanUsername: null,

  //   usernameerror: null,
  //   emailerror: null,
  //   usernamemessege: null,
  //   emailmessege: null,
  //   matchotperror: null,
  //   matchotpmessege: null,
};

// const accessToken = await Keychain.getGenericPassword('accessToken', user.data.accessToken);

const createStore = (state = initialState, action) => {
  // if (accessToken!== null){

  //   console.log('accessToken: ', accessToken);
  //   return {
  //     ...state,

  //     isAuthenticated: true,

  //   };

  // }

  switch (action.type) {
    case 'CREATE_STORE_SUCCESSFUL':
      console.log('CREATE_STORE_SUCCESSFUL : ', action.payload);
      return {
        ...state,
        store: action.payload.data,
        // messege: action.payload.messege,

        // isAuthenticated: true,
        // error: null,
      };

    case 'CREATE_STORE_FAIL':
      console.log('CREATE_STORE_FAIL in reducer : ', action.payload);
      return {
        ...state,
        store: null,
        error: action.payload?.error  || ['Reducer: An error occurred while creating the store. Please try again.'],
      };

    default:
      return state;
  }
};

export default createStore;
