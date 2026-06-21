import api from '../services/apiservice';



//create order by customer


export const get100Discountroduct = (
  category,
  //   adminpassword: '(Bunny)tota#34#',
  limit,
  page,

) => {
  const params = {
    //   adminpassword: '(Bunny)tota#34#',
    limit,
    page,
  };

  // Only include category if it's defined and not 'All'
  if (category && category !== 'All') {
    params.category = category;
  }

  return api.get('/stores/100-products/alltime', { params });
};


//get all the stores for authenticated user

//costumer see his order from every store

export const get80Discountroduct = (
  category,
  //   adminpassword: '(Bunny)tota#34#',
  limit,
  page,


) => {
  const params = {
    //   adminpassword: '(Bunny)tota#34#',
    limit,
    page,
  };

  // Only include category if it's defined and not 'All'
  if (category && category !== 'All') {
    params.category = category;
  }

  return api.get('/stores/80-products/alltime', { params });
};




//costumer see his order from one store

export const get50to80Discountproduct = (
  category,
  //   adminpassword: '(Bunny)tota#34#',
  limit,
  page,

) => {
  const params = {
    //   adminpassword: '(Bunny)tota#34#',
    limit,
    page,
  };

  // Only include category if it's defined and not 'All'
  if (category && category !== 'All') {
    params.category = category;
  }

  return api.get('/stores/50to80-products/alltime', { params });
};




//delete order by customers
export const getlessthan100product = (category, limit, page) => {
  const params = {
    //   adminpassword: '(Bunny)tota#34#',
    limit,
    page,
  };

  // Only include category if it's defined and not 'All'
  if (category && category !== 'All') {
    params.category = category;
  }

  return api.get('/stores/lessthan100-products/alltime', { params });
};



