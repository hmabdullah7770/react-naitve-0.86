
//Get User State
export const userstaterequest = name => ({
  type: 'USER_STATE_REQUEST',
  name,
});

export const userstatesuccessful = data => ({
  type: 'USER_STATE_SUCCESSFUL',
  payload: data,
});

export const userstatefails = error => ({
  type: 'USER_STATE_FAILS',
  payload: error,
});


//LOCATION LIST
export const locationlistrequest = () => ({
  type: 'LOCATION_LIST_REQUEST',
});

export const locationlistsuccessful = data => ({
  type: 'LOCATION_LIST_SUCCESSFUL',
  payload: data,
});

export const locationlistfails = error => ({
  type: 'LOCATION_LIST_FAILS',
  payload: error,
});

//PARTNER LIST
export const partnerlistrequest = () => ({
  type: 'PARTNER_LIST_REQUEST',
});

export const partnerlistsuccessful = data => ({
  type: 'PARTNER_LIST_SUCCESSFUL',
  payload: data,
});

export const partnerlistfails = error => ({
  type: 'PARTNER_LIST_FAILS',
  payload: error,
});

//SET USER STATE
export const setuserstaterequest = (name, stationID, partnerKey) => {


  return {
    type: 'SET_USER_STATE_REQUEST',
    name,
    stationID,
    partnerKey,
  };
};



export const setuserstatesuccessful = (setuserstatemessege) => {

  return {
    type: 'SET_USER_STATE_SUCCESSFUL',
    payload: setuserstatemessege,
  };
};

export const setuserstatefails = error => {

  return {
    type: 'SET_USER_STATE_FAILS',
    payload: error,
  };
};


// CLEAN
export const clearerror = () => ({
  type: 'CLEAR_ERROR',
});

export const clearmessege = () => ({
  type: 'CLEAR_MESSEGE',
});

//LOADER
export const setloading = loading => ({
  type: 'LOADING',
  payload: loading,
});
