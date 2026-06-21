import React, {createContext, useContext, useState} from 'react';

// largeSelectedBy: 'store' | 'product'
const CreatePostContext = createContext(null);

export const CreatePostProvider = ({children}) => {
  // appliedLargeBy tracks which sheet has applied Large; null means none applied yet
  const [appliedLargeBy, setAppliedLargeBy] = useState(null);

  // applySize only sets the applied lock when user confirms with Apply
  const applySize = (which, size) => {
    try {
      // Validation: ensure valid inputs
      if (!['store', 'product'].includes(which)) {
        console.error('Invalid which parameter in applySize:', which);
        return;
      }
      if (!['large', 'small'].includes(size)) {
        console.error('Invalid size parameter in applySize:', size);
        return;
      }

      if (size === 'large') {
        setAppliedLargeBy(which);
      } else {
        // choosing small implies the other becomes large
        setAppliedLargeBy(which === 'store' ? 'product' : 'store');
      }

      // Log for debugging
      console.log(`Applied ${size} size to ${which}, appliedLargeBy will be:`,
        size === 'large' ? which : (which === 'store' ? 'product' : 'store'));

      // Debug state after apply
      setTimeout(() => debugState('AFTER_APPLY', which, size), 0);
    } catch (error) {
      console.warn('Error in applySize:', error);
      // Fallback: don't change state on error
    }
  };

  // clearApplied removes the applied lock if it belongs to `which` (used when user removes a store/product)
  const clearApplied = (which) => {
    try {
      // Validation: ensure valid input
      if (!['store', 'product'].includes(which)) {
        console.error('Invalid which parameter in clearApplied:', which);
        return;
      }

      setAppliedLargeBy((current) => {
        // Clear if the component being removed has the large applied
        if (current === which) {
          console.log(`Cleared applied state for ${which} (had large)`);
          return null;
        }
        // Also clear if the component being removed caused the other to have large
        // This happens when Store selects "small" -> appliedLargeBy becomes "product"
        // So when Store is removed, we should clear the state even though appliedLargeBy is "product"
        const other = which === 'store' ? 'product' : 'store';
        if (current === other) {
          console.log(`Cleared applied state for ${which} (caused ${other} to have large)`);
          return null;
        }
        console.log(`No need to clear ${which}, current appliedLargeBy is:`, current);
        return current;
      });
    } catch (error) {
      console.warn('Error in clearApplied:', error);
      // Force clear on error to prevent stuck state
      try {
        setAppliedLargeBy(null);
        console.log('Force cleared all applied state due to error');
      } catch (fallbackError) {
        console.error('Critical error in clearApplied fallback:', fallbackError);
      }
    }
  };

  // resetApplied forces clearing any applied lock
  const resetApplied = () => {
    try {
      setAppliedLargeBy(null);
    } catch (error) {
      console.warn('Error in resetApplied:', error);
    }
  };

  // get the effective size considering applied locks; before any apply, use defaults
  const getAppliedSizeFor = (which) => {
    try {
      // Validation: ensure valid input
      if (!['store', 'product'].includes(which)) {
        console.error('Invalid which parameter in getAppliedSizeFor:', which);
        return 'large'; // Safe fallback
      }

      if (appliedLargeBy) {
        const result = appliedLargeBy === which ? 'large' : 'small';
        console.log(`getAppliedSizeFor(${which}): appliedLargeBy=${appliedLargeBy}, returning ${result}`);
        return result;
      }
      // defaults before any apply: store large, product small
      const defaultSize = which === 'store' ? 'large' : 'small';
      console.log(`getAppliedSizeFor(${which}): no applied state, returning default ${defaultSize}`);
      return defaultSize;
    } catch (error) {
      console.warn('Error in getAppliedSizeFor:', error);
      // Return safe defaults on error
      return which === 'store' ? 'large' : 'small';
    }
  };

  const isLargeDisabled = (which) => {
    try {
      // large is disabled for `which` if the other side already has an applied large
      const other = which === 'store' ? 'product' : 'store';
      return appliedLargeBy === other;
    } catch (error) {
      console.warn('Error in isLargeDisabled:', error);
      // Return false (not disabled) on error to prevent stuck UI
      return false;
    }
  };

  const isSmallDisabled = (which) => {
    try {
      // Small is disabled for `which` if this component currently has large applied
      // OR if the other component has small applied (mutual exclusivity)

      if (!appliedLargeBy) {
        // No constraints exist, small is not disabled
        return false;
      }

      // If this component has large applied, then small is disabled for this component
      if (appliedLargeBy === which) {
        return true;
      }

      // If the other component has large applied, then this component must be small, so small is NOT disabled
      const other = which === 'store' ? 'product' : 'store';
      if (appliedLargeBy === other) {
        return false;
      }

      return false;
    } catch (error) {
      console.warn('Error in isSmallDisabled:', error);
      return false;
    }
  };

  // Helper function to get the opposite component
  const getOppositeComponent = (which) => {
    return which === 'store' ? 'product' : 'store';
  };

  // Debug function to log current state
  const debugState = (action, which, size) => {
    console.log(`=== DEBUG ${action} ===`);
    console.log(`Component: ${which}, Size: ${size}`);
    console.log(`appliedLargeBy: ${appliedLargeBy}`);
    console.log(`Store size: ${getAppliedSizeFor('store')}`);
    console.log(`Product size: ${getAppliedSizeFor('product')}`);
    console.log(`Store large disabled: ${isLargeDisabled('store')}`);
    console.log(`Product large disabled: ${isLargeDisabled('product')}`);
    console.log(`Store small disabled: ${isSmallDisabled('store')}`);
    console.log(`Product small disabled: ${isSmallDisabled('product')}`);
    console.log('=================');
  };

  return (
    <CreatePostContext.Provider value={{appliedLargeBy, applySize, getAppliedSizeFor, isLargeDisabled, isSmallDisabled, clearApplied, resetApplied, debugState}}>
      {children}
    </CreatePostContext.Provider>
  );
};

export const useCreatePostContext = () => {
  try {
    const ctx = useContext(CreatePostContext);
    if (!ctx) {
      console.error('useCreatePostContext must be used within CreatePostProvider');
      throw new Error('useCreatePostContext must be used within CreatePostProvider');
    }
    return ctx;
  } catch (error) {
    console.error('Critical error in useCreatePostContext:', error);
    // Return a fallback context to prevent app crashes
    return {
      appliedLargeBy: null,
      applySize: () => console.warn('Context unavailable: applySize called'),
      getAppliedSizeFor: (which) => which === 'store' ? 'large' : 'small',
      isLargeDisabled: () => false,
      isSmallDisabled: () => false,
      clearApplied: () => console.warn('Context unavailable: clearApplied called'),
      resetApplied: () => console.warn('Context unavailable: resetApplied called'),
      debugState: () => console.warn('Context unavailable: debugState called'),
    };
  }
};

export default CreatePostContext;
