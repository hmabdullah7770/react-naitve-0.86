import {createContext, useState, useEffect} from 'react';
import * as Keychain from 'react-native-keychain';

export const OwnerContext = createContext();

export const OwnerProvider = ({children}) => {
  const [ownerId, setOwnerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getOwnerFromKeychain = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({
          service: 'userId', // ✅ service name added
        });

        if (credentials) {
          setOwnerId(credentials.password); // ✅ actual userId is in password field
          console.log('✅ userId loaded from keychain:', credentials.password);
        } else {
          setOwnerId(null);
          console.log('ℹ️ No userId found in keychain');
        }
      } catch (error) {
        console.error('❌ Keychain error:', error);
        setOwnerId(null);
      } finally {
        setIsLoading(false);
      }
    };

    getOwnerFromKeychain();
  }, []);

  return (
    <OwnerContext.Provider value={{ownerId, setOwnerId, isLoading}}>
      {children}
    </OwnerContext.Provider>
  );
};
// import {createContext, useContext, useState, useEffect} from 'react';
// import * as Keychain from 'react-native-keychain';

// export const OwnerContext = createContext();

// export const OwnerProvider = ({children}) => {
//   const [isOwner, setIsOwner] = useState(false);
//   const [isLoading, setIsLoading] = useState(true); // important!

//   useEffect(() => {
//     const getOwnerFromKeychain = async () => {
//       try {
//         const credentials = await Keychain.getGenericPassword();
//         if (credentials) {
//           setIsOwner(credentials.username === 'userId'); // your logic here
//         }
//       } catch (error) {
//         console.error('Keychain error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     getOwnerFromKeychain(); // runs ONCE on mount
//   }, []);

//   return (
//     <OwnerContext.Provider value={{isOwner, setIsOwner, isLoading}}>
//       {children}
//     </OwnerContext.Provider>
//   );
// };
