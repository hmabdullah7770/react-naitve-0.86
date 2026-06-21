// Action types for category management
export const categoryActionTypes = {
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  RESET_CATEGORY_STATE: 'RESET_CATEGORY_STATE',
};

// export const setSelectedCategory = (categoryIndex) => {
//   console.log('🎯 setSelectedCategory called with:', categoryIndex);
//   return {
//     type: categoryActionTypes.SET_SELECTED_CATEGORY,
//     payload: categoryIndex,
//   };
// };


export const setSelectedCategory = (categoryId) => {
  console.log('🎯 setSelectedCategory called with:', categoryId);
  return {
    type: categoryActionTypes.SET_SELECTED_CATEGORY,
    payload: categoryId,  // now a string ID instead of a number index
  };
};

export const resetCategoryState = () => {
  console.log('🔄 resetCategoryState called');
  return {
    type: categoryActionTypes.RESET_CATEGORY_STATE,
  };
};
