import api from '../services/apiservice';

// Get category names list
export const getComments = (page,limit,contentId,contentType) =>
  api.get(`/:contentType/:contentId${encodeURIComponent(contentId)}${encodeURIComponent(contentType)}`, {

     params: {
        page,
         limit,
         //sortedby
         //dec,


    },


    // params: {
    //   adminpassword: "(Bunny)tota#34#"
    // }
  });



// Get category names list
export const addComment = (contentType,content,contentId) =>
  api.post(`/:contentId${encodeURIComponent(contentId)}`, {

      content,
      contentType,


    // params: {
    //   adminpassword: "(Bunny)tota#34#"
    // }
  });


export const updateComment = ()=>
  api.patch('/:commentId', {

    // params: {
    //   adminpassword: "(
  });


  export const deleteComment = (contentType,contentId,commentId) =>
  api.delete(`/:commentId${encodeURIComponent(commentId)}` , {


         contentType,
         contentId,
    //contentType,
    // params: {
      //   commentId
      // }
  });


export const  addReply = (commentId,content) =>
  api.post(`/:commentId/reply/${encodeURIComponent(commentId)}`  , {

    content,

    // params:{
    // commentId
    // }




    // params: {
    //   adminpassword:

});

export const getReplies = (commentId,page,limit) =>
  api.get(`/:commentId/replies/${encodeURIComponent(commentId)}`, {

 params: {
    // commentId,
    page,
    limit ,
    // sortBy
    //sortType

  },



//  const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;




});



//conmments with ratings

export const getCommentsWithRatings = () =>
  api.get('/:contentType/:contentId/with-ratings', {

    // params: {
    //   adminpassword:
    });



    // export const addComment

