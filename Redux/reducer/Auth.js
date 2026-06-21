import * as Keychain from 'react-native-keychain';
import { matchotp } from '../../API/auth';

const initialState = {

  //  accessToken: null,
   user: null,
    error: null,
    screen: null,
    isAuthenticated: false,
    // userstate: null,
    loading: false,
    messege: null,
    // userstate: null,
    // locationlist: null,
    // partnerlist: null,
    // setuserstate: null,
    cleanUsername: null,

    usernameerror:null,
    emailerror:null,
    usernamemessege:null,
    emailmessege:null,
    matchotperror: null,
    matchotpmessege: null,
  };


  // const accessToken = await Keychain.getGenericPassword('accessToken', user.data.accessToken);

  const auth = (state = initialState, action) => {

    // if (accessToken!== null){

    //   console.log('accessToken: ', accessToken);
    //   return {
    //     ...state,

    //     isAuthenticated: true,

    //   };

    // }


    switch (action.type) {


      // case 'REFRESH_TOKEN_SUCCESSFUL':
      //   console.log('REFRESH_TOKEN_SUCCESSFUL : ', action.payload);
      //   return {
      //     ...state,
      //     user: action.payload.data,
      //     isAuthenticated: true,
      //     error: null,
      //   };
      // case 'REFRESH_TOKEN_FAIL':
      //   console.log('REFRESH_TOKEN_FAIL : ', action.payload.error);
      //   return {
      //     ...state,
      //     user: null,
      //     isAuthenticated: false,
      //     error: action.payload.error,
      //   };




         case  'CLEAR_STORE':
          return{

           ...initialState,
          };



    case 'TOKEN_CHECK':

    return{
     ...state,
      isAuthenticated:true,
      };




      case 'MATCH_OTP_SUCCESSFUL':
        console.log('MATCH_OTP_SUCCESSFUL : ', action.payload);
        return {
          ...state,
          user: action.payload.data,

          // isAuthenticated: true,
          error: null,
          matchotperror: null,

          matchotpmessege: action.payload.matchotpmessege,
        };



case 'CLEAR_MATCH_OTP':
  console.log('CLEAR_MATCH_OTP in reducer');
  return {
    ...state,
     matchotpmessege: null,

  };


  case 'MATCH_OTP_FAIL':
  console.log('MATCH_OTP_FAIL : ', action.payload.matchotperror);
  return {
    ...state,
    user: null,
    screen: null,
    isAuthenticated: false,
    matchotperror: action.payload.matchotperror,
    messege: null,
    matchotpmessege:null,
  };


case 'MATCH_USERNAME_SUCCESSFUL':
  console.log('MATCH_USERNAM_SUCCESSFUL : ', action.payload);
  return {
    ...state,
    user: action.payload.data,
    usernamemessege: action.payload.usernamemessege,

    // isAuthenticated: true,
    // error: null,

  };

  case 'MATCH_USERNAME_FAIL':
  console.log('MATCH_USERNAME_FAIL in reduer : ', action.payload);
  return {
    ...state,
    user: null,
    screen: null,
    isAuthenticated: false,
    usernameerror: action.payload.usernameerror,
    messege: null,
  };

    case 'VERIFY_EMAIL_SUCCESSFUL':
        console.log('VERIFY_EMAIL_SUCCESSFUL : ', action.payload);
        return {
          ...state,
          user: action.payload.data,

          // isAuthenticated: true,
          // error: null,

          emailmessege: action.payload.emailmessege,
        };

     case 'VERIFY_EMAIL_FAIL':
        console.log('VERIFY_EMAIL_FAIL : ', action.payload.error);
        return {
          ...state,
          user: null,

          // isAuthenticated: false,
          emailerror: action.payload.emailerror,
          messege: null,
        };


        case 'CLEAR_EMAIL_DATA':
          console.log('CLEAR_EMAIL_DATA in reducer');
          return {
            ...state,
             user: null,

          };

      case 'SIGNUP_SUCCESSFUL':
        console.log('SIGNUP_SUCCESSFUL : ', action.payload);
        return {
          ...state,
          user: action.payload.data,
          // username: action.payload.data,
          // email: action.payload.data,
          // password: action.payload.data,
          // email: action.payload.data,
          // avatar: action.payload.data,
          // opt:action.payload.data,
          // storelink:action.payload.data,
          //  whatsapp:action.payload.data,
          //  facebook:action.payload.data,
          //  instagram:action.payload.data,
          // isAuthenticated: true,
          error: null,

          messege: action.payload.messege,
        };



      case 'SIGNUP_FAIL':
        console.log('SIGNUP_FAIL : ', action.payload.error);
        return {
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };


      case 'LOGIN_SUCCESSFUL':
        console.log('LOGIN_SUCCESSFUL : ', action.payload.data);
                console.log('LOGIN_SUCCESSFUL  messege: ', action.payload.messege);
        return {
          ...state,
          // screen: action.payload.data.buttons,
          user: action.payload,
          isAuthenticated: true,
          error: null,

          messege: action.payload.messege,
        };

      case 'LOGIN_FAIL':
        return {
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };


       case 'CLEAR_USERNAME_ERROR': return {
         ...state,
         usernameerror:null,
         matchotperror:null,

       };

       case 'CLEAR_EMAIL_ERROR': return{
            ...state,
            emailerror:null,

       };

       case 'CLEAR_EMAIL_MESSEGE': return{
          ...state,
          emailmessege:null,
       };

case 'CLEAR_USERNAME_MESSEGE':
console.log('inside clearusernamemessege');
return{
          ...state,
          usernamemessege:null,
          matchotpmessege:null,
        };

      case 'CLEAR_ERROR':
        return {
          ...state,
          error: null,

        };

      case 'CLEAR_MESSEGE':
        return {
          ...state,
          messege: null,

        };

      case 'LOADING':
        return {
          ...state,

          loading: action.payload,
        };

      case 'CHANGE_PASSWORD_SUCCESSFUL':
        console.log('Change Pin Failed: ', action.payload.data);
        return {
          ...state,
          data: action.payload.data,
          messege: action.payload.messege,
        };

      case 'CHANGE_PASSWORD_FAIL':
        console.log('Change Pin Failed: ', action.payload.error);
        return {
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };

      case 'LOG_OUT_SUCCESSFUL':
        console.log('Logout Successful ', action.payload.messege);
        return {
          ...state,
          user: null,
          screen: null,
          error: null,
          isAuthenticated: false,
          messege: action.payload.messege,
        };

      case 'LOG_OUT_FAIL': {
        console.log('Logout Fails ', action.payload);
        return {
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
        };
      }


      case 'FORGET_PASSWORD_SUCCESSFUL':{
        console.log('FORGET_PASSWORD_SUCCESSFUL : ', action.payload);
        return{
          ...state,
          user: action.payload.data,
          isAuthenticated: false,
          messege: action.payload.messege,
        };

      }


      case 'FORGET_PASSWORD_FAIL':{
        console.log('FORGET_PASSWORD_FAIL : ', action.payload.error);
        return{
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };
      }



      case 'CLEAR_USER':{



        console.log('CLEAR_USER in reducer');

        return{

          ...state,
          user: null,

        };
    }
      case 'RESET_PASSWORD_SUCCESSFUL':{
        console.log('RESET_PASSWORD_SUCCESSFUL : ', action.payload);
        return{
          ...state,
          user: action.payload.data,
          isAuthenticated: false,
          messege: action.payload.messege,
        };

      }

      case 'RESET_PASSWORD_FAIL':{
        console.log('RESET_PASSWORD_FAIL : ', action.payload.error);
        return{
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };
      }

      case 'RESEND_OTP_SUCCESSFUL':{
        console.log('RESEND_OTP_SUCCESSFUL : ', action.payload);
        return{
          ...state,
          user: action.payload.data,
          isAuthenticated: false,
        };

      }

      case 'RESEND_OTP_FAIL':{
        console.log('RESEND_OTP_FAIL : ', action.payload.error);
        return{
          ...state,
          user: null,
          screen: null,
          isAuthenticated: false,
          error: action.payload.error,
          messege: null,
        };
      }


      case 'CHANGE_AVATAR_SUCCESSFUL':
        console.log('Change Avatar Successful : ', action.payload.data);
        return {
          ...state,
           isAuthenticated: true,
          user: action.payload.data,
          messege: action.payload.messege,
        };

        case 'CHANGE_AVATAR_FAIL':
        console.log('Change Avatar Failed: ', action.payload.error);
        return {
          ...state,
          user: null,
          screen: null,
          isAuthenticated: true,
          error: action.payload.error,
          messege: null,
        };



      case 'SET_CLEAN_USERNAME':
        console.log('Reducer - Previous state cleanUsername:', state.cleanUsername);
        console.log('Reducer - Setting new cleanUsername:', action.payload);
        return {
          ...state,
          cleanUsername: action.payload,
        };







      // case 'USER_STATE_SUCCESSFUL':
      //   console.log('UserStateStationid Successful : ', action.payload.stationid);

      //   console.log('UserStateSuccessful : ', action.payload);
      //   return {
      //     ...state,
      //     userstate: action.payload,

      //   };

      // case 'USER_STATE_FAILS':
      //   console.log('UserState error : ', action.payload.error);

      //   return {
      //     ...state,
      //     userstate: action.payload.error,
      //   };

      // case 'LOCATION_LIST_SUCCESSFUL':
      //   console.log('LOCATION_LIST_SUCCESSFUL : ', action.payload);
      //   return {
      //     ...state,
      //     locationlist: action.payload,
      //   };

      // case 'LOCATION_LIST_FAILS':
      //   console.log('LOCATION_LIST_FAILS error : ', action.payload.error);
      //   return {
      //     ...state,
      //     locationlist: action.payload.error,
      //   };

      // case 'PARTNER_LIST_SUCCESSFUL':
      //   console.log('PARTNER_LIST_SUCCESSFUL : ', action.payload);
      //   return {
      //     ...state,
      //     partnerlist: action.payload,
      //   };

      // case 'PARTNER_LIST_FAILS':
      //   console.log('PARTNER_LIST_FAILS error : ', action.payload.error);
      //   return {
      //     ...state,
      //     partnerlist: action.payload.error,
      //   };

      // case 'SET_USER_STATE_SUCCESSFUL':
      //   console.log('SET_USER_STATE_SUCCESSFUL  : ', action.payload.setuserstatemessege);
      //   return {
      //     ...state,
      //     setuserstate: action.payload,
      //     error: null
      //   };

      // case 'SET_USER_STATE_FAILS':
      //   console.log('SET_USER_STATE_FAILS error : ', action.payload.error);
      //   return {
      //     ...state,
      //     setuserstate: action.payload.error,
      //   };




      default:
        return state;
    }
  };

  export default auth;
