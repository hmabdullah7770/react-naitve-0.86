import api from '../../services/apiservice';

//create order by customer

// export const createstoreorder = (
//       storeId,items,customerName,customerEmail,customerPhone,customerAddress,paymentMethod,notes,
//     //prductId,quantity
//         //totalAmount,
//         //shippingCost,
//         //finalAmount,
//     ) =>
//   api.post('/stores/orders/create', {

// storeId,items,customerName,customerEmail,customerPhone,customerAddress,paymentMethod,notes,

//     });

export const createstoreorder = payload =>
  api.post('/stores/orders/create', payload);

//get all the stores for authenticated user

//costumer see his order from every store

export const getstorecustomerorder = ( page = 1,
  limit = 10,
  status) =>{
     const params = {page, limit};
  // if (storeId) params.storeId = storeId;
  if (status) params.status = status;
  api.get('/stores/orders/my-orders', {params});
  }
//costumer see his order from one store

//  export const getstorecustomerorderbyid = (storeId) =>
//   api.get(`/orders/my-orders/:storeId/${encodeURIComponent(storeId)}`);

// ✅ New

// CORRECT ✅
export const getstorecustomerorderbystoreid = (storeId, page = 1, limit = 10, status) => {
  const params = { page, limit };
  if (status) params.status = status;
  return api.get(`/stores/orders/my-orders/${encodeURIComponent(storeId)}`, { params });
};
// export const getstorecustomerorderbystoreid = (
//   storeId,
//   page = 1,
//   limit = 10,
//   status,
// ) => {
//   const params = {page, limit};
//   // if (storeId) params.storeId = storeId;
//   if (status) params.status = status;

//   return api.get(`/orders/my-orders/${encodeURIComponent(storeId)}`, {params});
// };

//delete order by customers
export const deleteOrderbycustomer = orderId =>
  api.delete(`/stores/orders/order/${encodeURIComponent(orderId)}`);

//get order by id
export const getstoreorderbyid = (
  storeId,
  bannerId,
  title,
  description,
  product,
  bannerImage,
) => {
  api.put(
    `/stores/:orderId/:storeId/${encodeURIComponent(
      storeId,
    )}/${encodeURIComponent(orderId)}`,
    {
      bannerId,
      title,
      description,
      product,
      bannerImage,
    },
  );
};

//get order by owner

export const getstoreorders = storeId =>
  api.get(`/stores/orders/store/:storeId${encodeURIComponent(storeId)}`, {});

//update order by owner
export const updateOrderStatus = (orderId, status) =>
  api.patch(`/stores/orders/:orderId/${encodeURIComponent(orderId)}/status`, {
    status,
  });

//delete order by owner
export const deleteOrderByOwner = (orderId, storeId) =>
  api.delete(
    `/stores/orders/:orderId/:storeId/${encodeURIComponent(
      orderId,
    )}/${encodeURIComponent(storeId)}`,
  );
