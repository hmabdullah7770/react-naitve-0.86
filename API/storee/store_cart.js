import api from '../../services/apiservice';

// ✅ Accept single object to match how useMutation calls it
export const addtocart = ({
  userId,
  storeId,
  productId,
  quantity,
  color,
  size,
  replaceQuantity,
}) =>
  api.post(`/stores/cart/add`, {
    userId,
    storeId,
    productId,
    quantity,
    color,
    size,
    replaceQuantity,
  });

// export const addtocart = (userId, storeId, productId, quantity, color, size) =>
//   api.post(`/stores/cart/add`, {
//     userId,
//     storeId,
//     productId,
//     quantity,
//     color,
//     size,
//   });

//get all the stores for authenticated user

export const getcart = (userId, storeId) =>
  api.get(
    `/stores/cart/${encodeURIComponent(userId)}/${encodeURIComponent(storeId)}`,
  );

// ✅ Accept single object + wrap body in { data: } for axios DELETE
export const removefromcart = ({userId, storeId, productId, color, size}) =>
  api.delete(`/stores/cart/remove`, {
    data: {
      userId,
      storeId,
      productId,
      color: color ?? null,
      size: size ?? null,
    },
  });

export const clearcart = (userId, storeId) =>
  api.delete(`/stores/cart/clear`, {
    data: {
      userId,
      storeId,
    },
  });

// export const removefromcart = (storeId, userId, productId,color,size) =>
//   api.delete(`/stores/cart/remove`, {
//     userId,
//     storeId,
//     productId,
//     color,
//     size,
//   });
