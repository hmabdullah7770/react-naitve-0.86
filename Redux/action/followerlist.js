
// Toggle follow status

export const togglefollowrequest = (followingId) => {
  console.log('Inside toggle follow request ');
 return {
  type: 'TOGGLE_FOLLOW_REQUEST',
  followingId,
};};

// Add success and fail actions for token check
export const toggleFollowsuccessful = (data,messege) => {
  console.log('Inside toggle follow successful');
 return {
  type: 'TOGGLE_FOLLOW_SUCCESSFUL',
   payload: { data, messege },
};};

export const toggleFollowfails = (error) => ({ type: 'TOGGLE_FOLLOW_FAIL', payload: error });


// Get user followers

export const getfollowersrequest = (userId,limit,page) => {
    console.log('Inside getfollowers request');
     return {
    type: ' GET_FOLLOWER_REQUEST',
    userId,
      limit,
       page,
};};

export const getfollowerssuccessful = (data) => {
    console.log('Inside getfollowersuccessful');
     return {
    type: 'GET_FOLLOWER_SUCCESSFUL',
    payload: data, // Pass user data if fetched
};};

export const getfollowersfails = (error) => ({ type: 'GET_FOLLOWER_FAIL', payload: error });

// Get user following

export const getfollowingrequest = (userId,limit,page) => {
    console.log('Inside getfollowing request');
     return {
    type: 'GET_FOLLOWING_REQUEST',
    userId,
    limit,
    page,
};};

export const getfollowingsuccessful = (data,messege) => {
    console.log('Inside getfollowingsuccessful');
     return {
    type: 'GET_FOLLOWING_SUCCESSFUL',
    payload: {data,messege}, // Pass user data if fetched
};};

export const getfollowingfails = (error) => ({ type: 'GET_FOLLOWING_FAIL', payload: error });



// Check if user is following another user


export const isfollowingrequest = (userId) => {
    console.log('Inside isfollowing request');
     return {
    type: 'IS_FOLLOWING_REQUEST',
    userId,
};};

export const isfollowingsuccessful = (data,messege) => {
    console.log('Inside isfollowing successful');
     return {
    type: 'IS_FOLLOWING_SUCCESSFUL',
    payload: {data,messege}, // Pass user data if fetched
};};

export const isfollowingfails = (error) => ({ type: 'IS_FOLLOWING_FAIL', payload: error });



// Get user follow stats


export const getfollowstatsrequest = (userId) => {
    console.log('Inside getfollowstats request');
     return {
    type: 'GET_FOLLOW_STATS_REQUEST',
    userId,
};};

export const getfollowstatssuccessful = (data,messege) => {
    console.log('Inside getfollowstatssuccessful');
     return {
    type: 'GET_FOLLOW_STATS_SUCCESSFUL',
    payload: {data,messege}, // Pass user data if fetched
};};

export const  getfollowstatsfails = (error) => ({ type: 'GET_FOLLOW_STATS_FAIL', payload: error });





export const setloading = loading => ({
  type: 'LOADING',
  payload: loading,
});
