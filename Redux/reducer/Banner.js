import * as Keychain from 'react-native-keychain';

const initialState = {


    // userstate: null,
    loading: false,

   error:null,
addbannerdata: null,
getbannerdata: null,
deletebannerdata: null,
  };


  // const accessToken = await Keychain.getGenericPassword('accessToken', user.data.accessToken);

  const banner = (state = initialState, action) => {


    switch (action.type) {


         case  'ADD_BANNER_SUCCESSFUL':
            console.log('ADD_BANNER_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                addbannerdata: action.payload,
                error: null,
                loading: false,
            };

        case 'ADD_BANNER_FAIL':
            console.log('ADD_BANNER_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

            case 'GET_BANNER_SUCCESSFUL':
            console.log('GET_BANNER_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                getbannerdata: action.payload,
                error: null,
                loading: false,
            };
        case 'GET_BANNER_FAIL':
            console.log('GET_BANNER_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };


            case 'DELETE_BANNER_SUCCESSFUL':
            console.log('DELETE_BANNER_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                deletebannerdata: action.payload,
                error: null,
                loading: false,
            };
        case 'DELETE_BANNER_FAIL':
            console.log('DELETE_BANNER_FAIL for:', action.payload);
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

    }};

  export default banner;
