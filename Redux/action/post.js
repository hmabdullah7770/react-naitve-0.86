// Posts - Actions

export const getallpostrequest = () => ({
  type: 'GET_ALL_POST_REQUEST',
});

export const getallsuccessful = (data, messege) => ({
  type: 'GET_ALL_POST_SUCCESSFUL',
  payload: {data, messege},
});

export const getallpostfail = error => ({
  type: 'GET_ALL_POST_FAIL',
  payload: error,
});

export const uploadpostrequest = formData => {
  console.log('Inside uploadpostrequest with FormData:', formData);

  return {
    type: 'ADD_POST_REQUEST',
    payload: {
      formData,
    },
  };
};

export const uploadpostsuccessful = (data, messege) => ({
  type: 'ADD_POST_SUCCESSFUL',
  payload: {data, messege},
});

export const uploadpostfail = error => ({
  type: 'ADD_POST_FAIL',
  payload: error,
});

export const deletepostrequest = postId => {
    console.log('Inside deletepostrequest action with postId:', postId);
  return {
    type: 'DELETE_POST_REQUEST',
   
     postId ,
   
  };
};

export const deletepostsuccessful = (data, messege) => ({
  type: 'DELETE_POST_SUCCESSFUL',
  payload: {data, messege},
});

export const deletepostfail = error => ({
  type: 'DELETE_POST_FAIL',
  payload: error,
});


export const resetDeleteStatus = () => ({
  type: 'RESET_DELETE_STATUS',  
});


//LOADER
// export const setloading = loading => ({
//   type: 'LOADING',
//   payload: loading,
// });