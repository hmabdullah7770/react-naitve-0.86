import api from '../../services/apiservice';





export const togglegetstornotfication = (storeId) =>
  api.post(
    `/stores/get-store-notification/${encodeURIComponent(storeId)}`

    

  );

export const getstoresubscriberlist = (storeId) =>{

  console.log('Inside Api call with of subscriber storeId:', storeId);

return api.get(`/stores/get-store-subscribers/${encodeURIComponent(storeId)}`);
};



