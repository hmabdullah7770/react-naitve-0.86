import * as Keychain from 'react-native-keychain';
import { getfollowers } from '../../API/followerlist';

const initialState = {


    // userstate: null,
    loading: false,

   error:null,
    getfollowersdata: null,
    getfollowingdata: null,
    togglefollowdata: null,
    isfollowingdata: null,
    getfollowstatsdata: null,
  };


  // const accessToken = await Keychain.getGenericPassword('accessToken', user.data.accessToken);

  const followerlist = (state = initialState, action) => {


    switch (action.type) {


         case  'TOGGLE_FOLLOW_SUCCESSFUL':
            console.log('TOGGLE_FOLLOW_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                togglefollowdata:action.payload,
                error: null,
                loading: false,
            };

        case 'TOGGLE_FOLLOW_FAIL':
            console.log('ADD_BANNER_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

            case 'GET_FOLLOWER_SUCCESSFUL':
            console.log('GET_FOLLOWER__SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                getfollowersdata: action.payload,
                error: null,
                loading: false,
            };
        case 'GET_FOLLOWER_FAIL':
            console.log('GET_FOLLOWER_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };


            case 'GET_FOLLOWING_SUCCESSFUL':
            console.log('GET_FOLLOWING_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                getfollowingdata: action.payload,
                error: null,
                loading: false,
            };
        case 'GET_FOLLOWING_FAIL':
            console.log('GET_FOLLOWING_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

            case 'IS_FOLLOWING_SUCCESSFUL':
            console.log('IS_FOLLOWING_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                isfollowingdata: action.payload,
                error: null,
                loading: false,
            };

        case 'IS_FOLLOWING_FAIL':
            console.log('IS_FOLLOWING_FAIL for:', action.payload);
            return {
                ...state,
                error: action.payload,
                loading: false,
            };


            case 'GET_FOLLOW_STATS_SUCCESSFUL':
            console.log('GET_FOLLOW_STATS_SUCCESSFUL:', action.payload || 'Unknown');
            return {
                ...state,
                getfollowstatsdata: action.payload,
                error: null,
                loading: false,
            };
        case 'GET_FOLLOW_STATS_FAIL':
            console.log('GET_FOLLOW_STATS_FAIL for:', action.payload);
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

  export default  followerlist;
