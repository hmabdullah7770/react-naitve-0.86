// StoreSetupContext.js
// Keep context in its own file so screens never import from the navigator.
// This prevents React Fast Refresh from losing track of hook order on hot reload.

import { createContext, useContext } from 'react';

export const StepContext = createContext(null);

export const useStep = () => {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useStep must be used inside CreateStoreScreens');
  }
  return context;
};








