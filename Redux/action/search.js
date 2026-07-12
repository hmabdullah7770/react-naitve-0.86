// payload: { search: string, filtername?: string }
export const setSearchPayload = (payload) => ({
  type: 'SET_SEARCH_PAYLOAD',
  payload,
});

export const clearSearchPayload = () => ({
  type: 'CLEAR_SEARCH_PAYLOAD',
});