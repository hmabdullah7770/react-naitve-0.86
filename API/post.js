import api from '../services/apiservice';

export const getallPost = (limit,cursor,userId,category,sortBy,sortType,includeCount) =>
  api.get('/post/getall', {
    params:{
      limit,
      cursor,
      userId,
      category,
      sortBy,
      sortType,
      includeCount
    }

  });

// Create post with multipart/form-data
export const uploadPost = (formData) => {
  console.log('=== API UPLOAD POST CALLED ===');
  console.log('FormData received in API:', formData);
  console.log('Making POST request to /post/create');

  return api.post('/post/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Delete a post by id
export const DeletePost = (postId) =>
  api.delete(`/post/${encodeURIComponent(postId)}`, {

  });
