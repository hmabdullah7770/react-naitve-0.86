export const createstorerequest = ({category, storeName, storeLogo}) => {
  console.log(
    'Inside createstorerequest with category:',
    category,
    'storeName:',
    storeName,
    'storeLogo:',
    storeLogo,
  );
  return {
    type: 'CREATE_STORE_REQUEST',
    category,
    storeName,
    storeLogo,
  };
};

//clear Store

export const createstoresuccessful = data => ({
  type: 'CREATE_STORE_SUCCESSFUL',
  payload: data,
});

// export const createstorefail = () => ({
//   type: 'CREATE_STORE_FAIL',
// });

export const createstorefail = error => ({
  type: 'CREATE_STORE_FAIL',
  error,
});
