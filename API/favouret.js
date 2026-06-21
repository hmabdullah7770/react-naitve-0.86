import api from '../services/apiservice';






// Get user followers
export const addtofavouret = postIds => api.post(`/favourets/add`, {
    postIds
});


// export const removefromfavouret = ({ postIds }) => api.delete(`/favourets/remove`, {
//     data: { postIds }
// });

export const removefromfavouret = ({ postIds }) => {
    console.log('[removefromfavouret] sending:', JSON.stringify({ postIds }));
    return api.delete(`/favourets/remove`, {
        data: { postIds }
    });
};