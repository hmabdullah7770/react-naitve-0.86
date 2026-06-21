import api from '../services/apiservice';





export const createstorebanner = ( title, description, product ,addbutton,buttontextcolor,buttontexthover,buttoncolor,buttoncolorhover,bannerImage,storeId) =>
  api.post(`/stores/:storeId/banners${encodeURIComponent(storeId)}`, {
       title,
        description,
         product ,
         addbutton,
         buttontextcolor,
         buttontexthover,
         buttoncolor,
         buttoncolorhover,
         bannerImage,
    });


//get all the stores for authenticated user

export const getstorebanner = (storeId) =>
  api.get(`/stores/:storeId/banners${encodeURIComponent(storeId)}`, {


  });


 //get store by id specific user
export const updatestorebanner = (storeId,bannerId,title, description, product,bannerImage ) =>{
  api.put(`/stores/:storeId/banners/:bannerId${encodeURIComponent(storeId)}/${encodeURIComponent(storeId)}`,{
 bannerId,title, description, product,bannerImage,

  });



};







export const deletestorebanner = (storeId,bannerId) =>
  api.delete(`/stores/:storeId/banners/:bannerId/${encodeURIComponent(storeId)}/${encodeURIComponent(bannerId)}`);


