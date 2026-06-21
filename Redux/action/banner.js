export const addbannerrequest = (bannerImage) => {
  console.log('Inside addbanner request ');
 return {
  type: 'ADD_BANNER_REQUEST',
  bannerImage,
};};

// Add success and fail actions for token check
export const addbannersuccessful = (data,messege) => {
  console.log('Inside tokenchecksuccessful');
 return {
  type: 'ADD_BANNER_SUCCESSFUL',
   payload: { data, messege },
};};

export const addbannerfails = (error) => ({ type: 'ADD_BANNER_FAIL', payload: error });


export const getbannerrequest = () => {
    console.log('Inside getbanner request');
     return {
    type: 'GET_BANNER_REQUEST',
};};

export const getbannersuccessful = (data) => {
    console.log('Inside getbannersuccessful');
     return {
    type: 'GET_BANNER_SUCCESSFUL',
    payload: data, // Pass user data if fetched
};};

export const getbannerfails = (error) => ({ type: 'GET_BANNER_FAIL', payload: error });


export const deletebannerrequest = (id) => {
    console.log('Inside deletebanner request');
     return {
    type: 'DELETE_BANNER_REQUEST',
    payload: id,
};};

export const deletebannersuccessful = (data,messege) => {
    console.log('Inside deletebannersuccessful');
     return {
    type: 'DELETE_BANNER_SUCCESSFUL',
    payload: {data,messege}, // Pass user data if fetched
};};

export const deletebannerfails = (error) => ({ type: 'DELETE_BANNER_FAIL', payload: error });

export const setloading = loading => ({
  type: 'LOADING',
  payload: loading,
});
