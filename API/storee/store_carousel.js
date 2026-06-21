import api from '../../services/apiservice';





// export const createstorecarousel = (  images,carouselname,title,description,buttonText,buttonTextColor,buttonHoverTextColor,buttonBackground,buttonHoverBackground,buttonShadow,buttonShadowColor,
//         buttonBorder,buttonBorderColor,titleColor,tileBackground,descriptionColor,discriptionBackgroundColor,fontFamily,
//         category,storeId) =>
//   api.post(`/stores/carousels/:storeId/create${encodeURIComponent(storeId)}`, {
//       images,
//       carouselname,
//         title,
//         description,
//         buttonText,
//         buttonTextColor,
//         buttonHoverTextColor,
//         buttonBackground,
//         buttonHoverBackground,
//         buttonShadow,
//         buttonShadowColor,
//         buttonBorder,
//         buttonBorderColor,
//         titleColor,
//         tileBackground,
//         descriptionColor,
//         discriptionBackgroundColor,
//         fontFamily,
//         category,
//     });


export const createstorecarousel = (storeId, formData) =>
  api.post(`/stores/carousels/${encodeURIComponent(storeId)}/create`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

//get all the stores for authenticated user

export const getstorecarousel = (storeId) =>
  api.get(`/stores/carousels/store/${encodeURIComponent(storeId)}`, {


  });


 //get store by id specific user
// export const updatestorebanner = (storeId,bannerId,title, description, product,bannerImage ) =>{
//   api.put(`/stores/:storeId/banners/:bannerId${encodeURIComponent(storeId)}/${encodeURIComponent(storeId)}`,{
//  bannerId,title, description, product,bannerImage

//   });



// }











// export const deletestorecarousel = (storeId,carouselId) =>
//   api.delete(`/stores/carousels/:carouselId/store/:storeId"${encodeURIComponent(storeId)}/${encodeURIComponent(carouselId)}`);



// ✅ FIXED
export const deletestorecarousel = (storeId, carouselId) =>
  api.delete(`/stores/carousels/${encodeURIComponent(carouselId)}/store/${encodeURIComponent(storeId)}`);
