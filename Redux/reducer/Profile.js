// Redux/reducer/Categoury.js (Optimized Version)
import * as Keychain from 'react-native-keychain';

const initialState = {
  profiledata: null,
  loading: false,


};



const profile = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_PROFILE_SUCCESSFUL':
      console.log('GET_PROFILE_SUCCESSFUL:', action.payload || 'Unknown');
        return {
            ...state,
            profiledata: action.payload,
            error: null,
            loading: false,
        };

    case 'GET_PROFILE_FAIL':
      console.log('GET_PROFILE_FAIL for:', action.payload);
      return {
        ...state,
        error: action.payload,
        loading: false,
      };


      case 'LOADING':
        return {
          ...state,

          loading: action.payload,
        };

    default:
      return state;
  }
};

export default profile;
