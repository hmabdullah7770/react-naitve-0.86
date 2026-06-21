// Redux Reducer (reducers/categoryReducer.js)
import { categoryActionTypes } from '../action/categoury';

const initialState = {
  // selectedCategoryIndex: 0,
  selectedCategoryId: '6834c7f5632a2871571413f7',  // 'All' selected by default
  lastSelectedCategory: null,
};

const category = (state = initialState, action) => {
  switch (action.type) {
    case categoryActionTypes.SET_SELECTED_CATEGORY:
      return {
        ...state,
        selectedCategoryId: action.payload,
        lastSelectedCategory: state.selectedCategoryId,
      };

    case categoryActionTypes.RESET_CATEGORY_STATE:
      return initialState;

    default:
      return state;
  }
};

export default category;




// import * as Keychain from 'react-native-keychain'

// const initialState = {

//   //  accessToken: null,
//    categourydata: null,
//   //  categourycountdata: null,
//    error: null,
//    categourylist: null,
//     loading: false,

//   };


//   // const accessToken = await Keychain.getGenericPassword('accessToken', user.data.accessToken);

//   const categoury = (state = initialState, action) => {

//     switch (action.type) {



//          case  'CATEGOURY_SUCCESSFUL':
//          console.log("CATEGOURY_SUCCESSFUL:",action.payload)
//          return{
//             ...state,
//             categourydata:action.payload,
//               loading: false,
//         error: null
//           }



//     case 'CATEGOURY_FAILS':
//       console.log("CATEGOURY_FAILS:",action.payload)
//     return{
//      ...state,
//        error:action.payload
//       }


//     //   case 'CATEGOURY_COUNT_SUCCESSFUL':
//     // console.log("CATEGOURY_COUNT_SUCCESSFUL:",action.payload)
//     //   return{
//     //      ...state,
//     //     categourycountdata: action.payload,
//     //     loading: false,
//     //     error: null
//     //   }



//     //     case 'CATEGOURY_COUNT_FAILS':
//     // console.log("CATEGOURY_COUNT_FAILS:",action.payload)
//     //   return{
//     //     ...state,
//     //     error:action.payload
//     //   }



//       case 'CATEGOURY_NAME_SUCCESSFUL':
//     console.log("CATEGOURY_NAME_SUCCESSFUL:",action.payload)
//       return{
//          ...state,
//         categourylist: action.payload,
//         loading: false,
//         error: null
//       }

//         case 'LOADING':
//         return {
//           ...state,

//           loading: action.payload,
//         };


//       case 'CATEGOURY_NAME_FAILS':
//     console.log("CATEGOURY_NAME_FAILS:",action.payload)
//       return{
//         ...state,
//         error:action.payload
//       }



//       default:
//         return state;
//     }
//   };

//   export default categoury;

