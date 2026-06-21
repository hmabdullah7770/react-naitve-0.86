import api from '../services/apiservice';






// Toggle follow status

export const togglefollow = followingId =>  api.post(`/followlist/toggle/${encodeURIComponent(followingId)}`);


// Get user followers
export const getfollowers = userId => api.get(`/followlist/followers/${encodeURIComponent(userId)}`,{params:{
    page,
    limit,
  }});



// Get user following

export const getfollowing = userId => api.get(`/followlist/following/${encodeURIComponent(userId)}`,{params:{
    page,
    limit,
  }});


// Check if user is following another user

export const isfollowing = userId => api.get(`/followlist/is-following/${encodeURIComponent(userId)}`);



// Get user follow stats

export const getfollowstats = userId => api.get(`/followlist/stats/${encodeURIComponent(userId)}`);

