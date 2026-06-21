import {createContext, useState, useEffect} from 'react';
import * as Keychain from 'react-native-keychain';

export const StoreOwnerContext = createContext();

export const StoreOwnerProvider = ({children}) => {
  const [isStoreOwner, setIsStoreOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getStoreOwnerFromKeychain = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({
          service: 'storeId',
        });

        if (credentials) {
          // credentials.username = 'storeId'  ← just a label
          // credentials.password = '68490d86cdf84d6b25d1a121' ← actual storeId
          setIsStoreOwner(credentials.password);
          console.log('✅ storeOwner loaded from keychain:', credentials.password);
        } else {
          // Not a store owner — no keychain entry found
          setIsStoreOwner(null);
          console.log('ℹ️ No storeId found in keychain');
        }
      } catch (error) {
        console.error('❌ Keychain error:', error);
        setIsStoreOwner(null);
      } finally {
        setIsLoading(false);
      }
    };

    getStoreOwnerFromKeychain();
  }, []);

  return (
    <StoreOwnerContext.Provider
      value={{isStoreOwner, setIsStoreOwner, isLoading}}>
      {children}
    </StoreOwnerContext.Provider>
  );
};


// import {createContext, useContext, useState, useEffect} from 'react';
// import * as Keychain from 'react-native-keychain';

// export const StoreOwnerContext = createContext();

// export const StoreOwnerProvider = ({children}) => {
//   const [isStoreOwner, setIsStoreOwner] = useState(null);
//   const [isLoading, setIsLoading] = useState(true); // important!

//   useEffect(() => {
//     const getStoreOwnerFromKeychain = async () => {
//       try {
//         const credentials = await Keychain.getGenericPassword();
//         if (credentials) {
//           setIsStoreOwner(credentials.username === 'storeId'); // your logic here
//         }
//       } catch (error) {
//         console.error('Keychain error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     getStoreOwnerFromKeychain(); // runs ONCE on mount
//   }, []);

//   return (
//     <StoreOwnerContext.Provider
//       value={{isStoreOwner, setIsStoreOwner, isLoading}}>
//       {children}
//     </StoreOwnerContext.Provider>
//   );
// };
