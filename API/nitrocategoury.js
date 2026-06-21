import { apiFetch } from '../services/nitroservice';

const adminpassword = '(Bunny)tota#34#';

export const getCategoryNamesList = () =>
  apiFetch('/categouries/allcategoury', {
    params: { adminpassword },
  });

export const getCategoryData = (categoury, limit, page) =>
  apiFetch('/categouries/getcategoury', {
    params: { categoury, limit, page, adminpassword },
  });

export const getPostsByCategory = (categoury, limit, page) =>
  apiFetch('/categouries/getpostsbycategory', {
    params: { categoury, limit, page, adminpassword },
  });

export const getFollowingUsersPosts = (categoury, limit, page) =>
  apiFetch('/categouries/getfollowingusersposts', {
    params: { categoury, limit, page, adminpassword },
  });
