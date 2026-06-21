// src/config/featureFlags.js

const FEATURE_FLAGS = {
  USE_WATERMELON_DB: true,  // ✅ change to false to disable WatermelonDB
  USE_SAVED_SCROLL_POSITION: true, // ✅ toggle scroll position saving/restoring
  USE_SAVE_FIRST_SCROLL_POSITION: true,
  USE_HISTORY : true,
  USE_REDIS_INFINTE_SCROLL: false,
  
  History:{
  USE_TWO_SECOND_HISTORY:true,
  USE_POST_OPEN_HISTORY:true,
  USE_VIDEO_OPEN_ONLY_HOSTORY:true,
  USE_VIDEO_SEE_AND_OPEN_HISTORY:true,
  USER_LIKE_POST: true,
  USER_FAVOURT_POST: true,
  USER_FAVOURT_VIDEO: true,
  }
};

export default FEATURE_FLAGS;