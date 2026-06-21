import api from '../services/apiservice';
import FEATURE_FLAGS from '../config/featureFlags';

// Get category names list
export const getCategoryNamesList = () =>
  api.get('/categouries/allcategoury', {
    params: {
      adminpassword: '(Bunny)tota#34#',
    },
  });

// Get category data with pagination
export const getCategoryData = (categoury, limit, page) =>
  api.get('/categouries/getcategoury', {
    params: {
      categoury,
      adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });


export const getPostsByCategory = (categoury, limit, page) =>

  api.get('/categouries/getpostsbycategory', {


    params: {
      categoury,
      adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });




export const getFollowingUsersPosts = (categoury, limit, page) =>


  api.get('/categouries/getfollowingusersposts', {

    params: {
      categoury,
      adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });








export const getPostFeed = (categoury, limit, page) =>

  api.get('/categouries/getonlyimagefeedbycategory', {


    params: {
      categoury,
      adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });




export const getVideoFeed = (categoury, limit, page) =>


  api.get('/categouries/gethasvideofeedbycategory', {

    params: {
      categoury,
      adminpassword: '(Bunny)tota#34#',
      limit,
      page,
    },
  });

// new way with feature flag 

// Define conditionally — no export inside the if
export const filtercategouryposts = (categoury, limit, cursor, direction,favouret) =>
  api.get(
    FEATURE_FLAGS.USE_REDIS_INFINTE_SCROLL
      ? '/categouries/getpostsbycategorycursor/redis'
      : '/categouries/getpostsbycategorycursor',
    {
      params: {
        categoury,
        adminpassword: '(Bunny)tota#34#',
        limit,
        cursor,
        direction,
        favouret,
      },
    }
  );





  // (old way for feature flag )
// if(FEATURE_FLAGS.USE_REDIS_INFINTE_SCROLL){

// export const filtercategouryposts = (categoury, limit, cursor, direction) =>

//   api.get('/categouries/getpostsbycategorycursor/redis', {
//     params: {
//       categoury,

//       adminpassword: '(Bunny)tota#34#',
//       limit,
//       cursor,
//       direction,
//     },
//   });
// }


// if(!FEATURE_FLAGS.USE_REDIS_INFINTE_SCROLL){

// export const filtercategouryposts = (categoury, limit, cursor, direction) =>

//   api.get('/categouries/getpostsbycategorycursor', {
//     params: {
//       categoury,

//       adminpassword: '(Bunny)tota#34#',
//       limit,
//       cursor,
//       direction,
//     },
//   });
// }







//   // Get category data with pagination
// export const getfollowingCategoryData = (categoury, limit, page) =>
//   api.get('/categouries/getfollowinguserscategoury', {
//     params: {
//       categoury,
//       limit,
//       page,
//     }
//   });



// //new api for unified feed



// // Get category data with pagination
// export const getunifiedfeed = (categoury, limit, page) =>
//   api.get('/categouries/unified-feed', {
//     params: {
//       categoury,
//       adminpassword: "(Bunny)tota#34#",
//       limit,
//       page,
//     }
//   });




//   // Get category data with pagination
// export const getunifiedfollowingfeed = (categoury, limit, page) =>
//   api.get('/categouries/following-unified-feed', {
//     params: {
//       categoury,
//       limit,
//       page,
//     }
//   });







// Legacy function names for backward compatibility
export const getcategourynameslist = getCategoryNamesList;
export const getcategourydata = getCategoryData;
// export const getfollowingcategourydata = getfollowingCategoryData;
