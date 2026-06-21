export const getprofilerequest = (username) => {
  console.log('Inside getprofilerequest');
  console.log('Username:', username);
 return {
  type: 'GET_PROFILE_REQUEST',
  username,
};};

// Add success and fail actions for token check
export const getprofilesuccessful = (data) => {
  console.log('Inside tokenchecksuccessful');
 return {
  type: 'GET_PROFILE_SUCCESSFUL',
  payload: data, // Pass user data if fetched
};};

export const getprofilefail = (error) => ({ type: 'GET_PROFILE_FAIL', payload: error });


export const setloading = loading => ({
  type: 'LOADING',
  payload: loading,
});



