import { StyleSheet, Text, View, Image, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const ProfileImage = () => {
    const navigation = useNavigation();
    
    // 1. Get the avatar from Redux immediately
     const { loading, user, error, messege, usernameerror, emailerror } =
       useSelector(state => state.auth);
    const reduxAvatar = user?.data?.data?.user?.avatar // Adjust based on your API response structure
    

    console.log('🔍 ProfileImage component rendered, Redux avatar:', reduxAvatar);
    
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        // 2. Load from AsyncStorage on mount (for fresh app starts)
        const loadProfileImage = async () => {
            try {
                const storedAvatar = await AsyncStorage.getItem('avatar');
                if (storedAvatar) {
                    setProfileImage(storedAvatar);
                }
            } catch (error) {
                console.error('Error loading profile image:', error);
            }
        };

        loadProfileImage();

        // 3. Listen for the event (for when background storage finishes)
        const subscription = DeviceEventEmitter.addListener('userDataStored', (data) => {
            if (data.avatar) {
                console.log('📢 Avatar updated via Event');
                setProfileImage(data.avatar);
            }
        });

        return () => subscription.remove();
    }, []);

    // 4. Critical: If Redux has a new image but state doesn't, sync them
    // This handles the "Login" transition perfectly
    useEffect(() => {
        if (reduxAvatar) {
            setProfileImage(reduxAvatar);
        } else if (user === null) {
            // Handle Logout: clear local state when Redux user is null
            setProfileImage(null);
        }
    }, [reduxAvatar, user]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => navigation.navigate('ProfileStack', { screen: 'ProfileScreen' })}
            >
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        style={styles.profileImage}
                        key={profileImage} // Force re-render when URI changes
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>?</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default ProfileImage;



const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f2ef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
});


// import { StyleSheet, Text, View, Image ,TouchableOpacity} from 'react-native';
// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native'; // ✅ Import this
// // add event emitter for async storage as it is slow to store 
// import { DeviceEventEmitter } from 'react-native'; // ✅ Add this



// const ProfileImage = () => {
//     const navigation = useNavigation();
//     console.log('🔍 ProfileImage component rendered');
//     // ✅ Get navigation here
//   // const user = useSelector(state => state.auth); // Get from Redux
//   // const profileImageFromRedux = user?.data?.data?.profileImage;

//   const [profileImage, setProfileImage] = useState(null);

//   // ✅ FIXED - Wrap async function inside useEffect
//   useEffect(() => {
//     const loadProfileImage = async () => {
//       try {
//         const profileImage = await AsyncStorage.getItem('avatar');
//         setProfileImage(profileImage);
//       } catch (error) {
//         console.error('Error loading profile image:', error);
//       }
//     };

//     loadProfileImage();


// // as async stoage is slow we use tik to keep data sync 

//   // ✅ 2. Listen for storage completion event
//     const subscription = DeviceEventEmitter.addListener('userDataStored', (data) => {
//       console.log('📢 userDataStored event received in ProfileImage:', data);
//       if (data.avatar) {
//         setProfileImage(data.avatar); // ✅ Update with fresh avatar
//       }
//     });

//     // ✅ 3. Cleanup
//     return () => {
//       subscription.remove();
//       console.log('🧹 ProfileImage: Event listener cleaned up');
//     };

//   }, []);







  
//   return (
//     <View style={styles.container}>
//     <TouchableOpacity
    
//       onPress={() =>  navigation.navigate('ProfileStack', { screen: 'ProfileScreen' })}
//     >
//     {profileImage ? (
//         <Image
//           source={{ uri: profileImage }}
//           style={styles.profileImage}
//         />
//       ) : (
//         <View style={styles.placeholderImage}>
//           <Text style={styles.placeholderText}>?</Text>
//         </View>
//       )}
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default ProfileImage;

// const styles = StyleSheet.create({
//   container: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profileImage: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#e1e5e9',
//   },
//   placeholderImage: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f3f2ef',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e1e5e9',
//   },
//   placeholderText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#666',
//   },
// });