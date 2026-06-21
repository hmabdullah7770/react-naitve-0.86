const initialState = {
  // loading: false,
  posts: [],
  error: null,
  messege: null,
  deleteStatus: null, // 'success' or 'failure' after a delete attempt
  deletingPostId: null,  // ✅ track WHICH post is being deleted
};

const post = (state = initialState, action) => {
  switch (action.type) {
    // case 'GET_ALL_POST_REQUEST':
    // case 'ADD_POST_REQUEST':
    // case 'DELETE_POST_REQUEST':
    //   return {
    //     ...state,
    //     loading: true,
    //     error: null,
    //     messege: null,
    //   };

    case 'GET_ALL_POST_SUCCESSFUL':
      return {
        ...state,
        // loading: false,
        posts: Array.isArray(action.payload.data) ? action.payload.data : [],
        messege: action.payload.messege || null,
        error: null,
      };

    case 'ADD_POST_SUCCESSFUL':
      return {
        ...state,
        // loading: false,
        // Prepend newly created post if returned, otherwise keep state
        posts: action.payload?.data
          ? [action.payload.data, ...state.posts]
          : state.posts,
        messege: action.payload.messege || null,
        error: null,
      };

      case 'DELETE_POST_REQUEST':
  return {
    ...state,
    deletingPostId: action.postId,
    // ✅ filter here directly since we already have the id
    posts: state.posts.filter(p => p._id !== action.postId),
  };

    case 'DELETE_POST_SUCCESSFUL':
     console.log('Reducer received DELETE_POST_SUCCESSFUL action with payload:', action.payload);  
    return {
        ...state,
        // loading: false,
        posts: state.posts.filter(p => p.id !== action.payload?.data?.id && p._id !== action.payload?.data?._id && p.id !== action.payload?.id && p._id !== action.payload?._id),
        messege: action.payload.messege || null,
        deleteStatus: 'success',
        error: null,
      };

    case 'GET_ALL_POST_FAIL':
    case 'ADD_POST_FAIL':
    case 'DELETE_POST_FAIL':
     
    console.log('Reducer received failure action with payload:', action.payload);
    return {
        ...state,
        // loading: false,
        error: action.payload,
        deleteStatus: null
      };

      case 'RESET_DELETE_STATUS':
  return {
    ...state,
   deleteStatus: null,
  };


  // case 'LOADING':
  //       return {
  //         ...state,

  //         loading: action.payload,
  //       };

    default:
      return state;
  }
};

export default post;

