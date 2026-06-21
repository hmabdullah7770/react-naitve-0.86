import {
  StyleSheet, Text, View, TouchableOpacity, Image,
  TextInput, Alert, Modal,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NextButton from './components/NextButton';

const ProfileImage2 = ({ route, navigation }) => {
  const { email, username, password, otp } = route?.params || {};
  const [image, setImage] = useState(null);
  const [bio, setBio] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Ask for camera permission
  const checkCameraPermission = async () => {
    const permission = await Camera.getCameraPermissionStatus();
    setCameraPermission(permission);
    if (permission === 'not-determined') {
      const newPermission = await Camera.requestCameraPermission();
      setCameraPermission(newPermission);
    }
  };

  // When user taps + or delete
  const handlePlusPress = () => {
    if (image) {
      Alert.alert(
        'Remove Image',
        'Are you sure you want to remove your profile picture?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => setImage(null) },
        ]
      );
    } else {
      setShowModal(true);
    }
  };

  // Pick from gallery
  const handleImagePicker = async () => {
    const options = {
      mediaType: 'photo',
      maxHeight: 1200,
      maxWidth: 1200,
      quality: 0.8,
      selectionLimit: 1,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.didCancel) {return;}
      if (result.errorCode) {
        Alert.alert('Error', 'Image selection failed. Please try again.');
        return;
      }
      if (result.assets?.length > 0) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while selecting the image.');
    }
  };

  // Camera option
  const handleCameraOption = () => {
    setShowModal(false);
    if (cameraPermission === 'authorized') {
      setShowCamera(true);
    } else {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
    }
  };

  // Capture photo
  const handleCameraCapture = async (camera) => {
    try {
      const photo = await camera.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        enableAutoRedEyeReduction: true,
      });

      const imageData = {
        uri: `file://${photo.path}`,
        fileName: `camera_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      setTempImage(imageData);
      setShowCamera(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Apply or cancel camera preview
  const handleApplyImage = () => {
    if (tempImage) {
      setIsApplying(true);
      setImage(tempImage);
      setTempImage(null);
      setIsApplying(false);
    }
  };
  const handleCancelImage = () => setTempImage(null);

  // Next button enabled only if both fields are filled
  const isButtonDisabled = !image || !bio.trim();

  // Go to next screen — pass image + bio directly
  const handleNext = () => {
    navigation.navigate('SignupScreens', {
      screen: 'SocialLink2',
      params: { email, username, password, otp, image, bio },
    });
  };

  if (showCamera && device) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          ref={(ref) => { /* ref handling if needed */ }}
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCamera(false)}>
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              const cameraRef = Camera.current;
              if (cameraRef) {handleCameraCapture(cameraRef);}
            }}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Picture</Text>

      <View style={styles.imageContainer}>
        {(tempImage || image) ? (
          <Image source={{ uri: tempImage?.uri || image?.uri }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="person" size={80} color="#dddddd" />
          </View>
        )}
        <TouchableOpacity style={styles.addButton} onPress={handlePlusPress}>
          <Icon name={image ? 'delete' : 'add'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {tempImage && (
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.applyButton]}
            onPress={handleApplyImage}
            disabled={isApplying}
          >
            <Text style={styles.actionButtonText}>
              {isApplying ? 'Applying...' : 'Apply'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelActionButton]}
            onPress={handleCancelImage}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.bioInput}
        placeholder="Write your bio..."
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={200}
      />

      <NextButton onPress={handleNext} disabled={isButtonDisabled} />

      <Modal
        animationType="slide"
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <TouchableOpacity style={styles.modalOption} onPress={handleCameraOption}>
              <Icon name="camera-alt" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleImagePicker}>
              <Icon name="photo-library" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileImage2;

const styles = StyleSheet.create({
  // 🔹 same styles as before, unchanged
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  imageContainer: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 24, position: 'relative', backgroundColor: '#f8f8f8' },
  profileImage: { width: 140, height: 140, borderRadius: 70 },
  imagePlaceholder: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  addButton: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#f9213f', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  imageActions: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  actionButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  applyButton: { backgroundColor: '#4CAF50' },
  cancelActionButton: { backgroundColor: '#f44336' },
  actionButtonText: { color: '#fff', fontWeight: 'bold' },
  bioInput: { width: '100%', minHeight: 60, borderColor: '#eee', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 24, fontSize: 16, backgroundColor: '#fafafa' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingVertical: 30 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalOptionText: { fontSize: 16, marginLeft: 15, color: '#333' },
  modalCancel: { alignItems: 'center', paddingVertical: 15, marginTop: 10 },
  modalCancelText: { fontSize: 16, color: '#f44336', fontWeight: 'bold' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 30, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  cancelButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.3)' },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  placeholder: { width: 50, height: 50 },
});








//  code in which asyn storage store the value when next button is clicked


// import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, Modal } from 'react-native';
// import React, { useState, useEffect, useRef } from 'react';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import NextButton from './components/NextButton';

// const ProfileImage2 = ({ route, navigation }) => {
//   // Get params from previous screen
//   const { email, username, password, otp } = route?.params || {};
//   const [image, setImage] = useState(null);
//   const [bio, setBio] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [showCamera, setShowCamera] = useState(false);
//   const [cameraPermission, setCameraPermission] = useState(null);
//   const [tempImage, setTempImage] = useState(null); // Only for camera preview
//   const [isApplying, setIsApplying] = useState(false);

//   const devices = useCameraDevices();
//   const device = devices.back;

//   // Storage keys
//   const PROFILE_IMAGE_KEY = `profile_image_${username || email}`;

//   useEffect(() => {
//     checkCameraPermission();
//     loadStoredData();
//   }, []);

//   // Check camera permission
//   const checkCameraPermission = async () => {
//     const permission = await Camera.getCameraPermissionStatus();
//     setCameraPermission(permission);

//     if (permission === 'not-determined') {
//       const newPermission = await Camera.requestCameraPermission();
//       setCameraPermission(newPermission);
//     }
//   };

//   // Load stored image
//   const loadStoredData = async () => {
//     try {
//       const storedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);

//       if (storedImage) {
//         setImage(JSON.parse(storedImage));
//       }
//     } catch (error) {
//       console.error('Error loading stored data:', error);
//     }
//   };

//   // Store image locally (only setItem — we'll call this on Next)
//   const storeImageLocally = async (imageData) => {
//     try {
//       // just overwrite (AsyncStorage.setItem will replace existing value)
//       await AsyncStorage.setItem(PROFILE_IMAGE_KEY, JSON.stringify(imageData));
//       console.log('Image stored successfully');
//     } catch (error) {
//       console.error('Error storing image:', error);
//       Alert.alert('Error', 'Failed to store image locally');
//       throw error;
//     }
//   };

//   // Handle plus button press (show options)
//   const handlePlusPress = () => {
//     if (image) {
//       // If image exists, show delete confirmation
//       Alert.alert(
//         'Remove Image',
//         'Are you sure you want to remove your profile picture?',
//         [
//           {
//             text: 'Cancel',
//             style: 'cancel',
//           },
//           {
//             text: 'Remove',
//             style: 'destructive',
//             onPress: handleRemoveImage,
//           },
//         ]
//       );
//     } else {
//       // If no image, show options modal
//       setShowModal(true);
//     }
//   };

//   // Handle image removal
//   const handleRemoveImage = async () => {
//     setImage(null);
//     try {
//       await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
//     } catch (error) {
//       console.error('Error removing stored image:', error);
//     }
//   };

//   // Handle camera option
//   const handleCameraOption = async () => {
//     setShowModal(false);
//     if (cameraPermission === 'authorized') {
//       setShowCamera(true);
//     } else {
//       Alert.alert('Permission Required', 'Camera permission is required to take photos');
//     }
//   };

//   // Handle gallery option - automatically replaces previous image
//   const handleGalleryOption = () => {
//     setShowModal(false);
//     handleImagePicker();
//   };

//   // Camera capture
//   const handleCameraCapture = async (camera) => {
//     try {
//       const photo = await camera.takePhoto({
//         qualityPrioritization: 'speed',
//         flash: 'off',
//         enableAutoRedEyeReduction: true,
//       });

//       const imageData = {
//         uri: `file://${photo.path}`,
//         fileName: `camera_${Date.now()}.jpg`,
//         type: 'image/jpeg',
//         fileSize: photo.fileSize || 0,
//       };

//       setTempImage(imageData);
//       setShowCamera(false);
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo');
//     }
//   };

//   // Gallery image picker - show image immediately but DO NOT store yet
//   const handleImagePicker = async () => {
//     const options = {
//       mediaType: 'photo',
//       includeBase64: false,
//       maxHeight: 1200,
//       maxWidth: 1200,
//       quality: 0.8,
//       selectionLimit: 1,
//     };

//     try {
//       const result = await launchImageLibrary(options);
//       if (result.didCancel) return;
//       if (result.errorCode) {
//         Alert.alert('Error', 'Image selection failed. Please try again.');
//         return;
//       }
//       if (result.assets && result.assets.length > 0) {
//         const selectedImage = result.assets[0];

//         // show the selected image to the user but DO NOT store it yet
//         setImage(selectedImage);
//         // Alert.alert('Selected', 'Image selected. It will be saved when you press Next.');
//         // ^-- commented out per request: do not show a modal/alert when image is picked
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Something went wrong while selecting the image.');
//     }
//   };

//   // Apply camera captured image — set image for preview, do not store
//   const handleApplyImage = async () => {
//     if (!tempImage) return;

//     setIsApplying(true);

//     try {
//       // just set the image in state (persist on Next)
//       setImage(tempImage);
//       setTempImage(null);

//       // Alert.alert('Applied', 'Image applied locally. It will be saved when you press Next.');
//       // ^-- commented out per request: do not show a modal/alert when apply is performed
//     } catch (error) {
//       console.error('Error applying image:', error);
//       Alert.alert('Error', 'Failed to apply image');
//     } finally {
//       setIsApplying(false);
//     }
//   };

//   // Cancel temp image selection
//   const handleCancelImage = () => {
//     setTempImage(null);
//   };

//   // Handle bio change
//   const handleBioChange = (text) => {
//     setBio(text);
//   };

//   // Button enabled only if image and bio are present
//   const isButtonDisabled = !image || !bio.trim();

//   // Next handler: save image to AsyncStorage then navigate
//   const handleNext = async () => {
//     try {
//       // if there's an image in state, persist it now
//       if (image) {
//         await storeImageLocally(image);
//       }
//       navigation.navigate('SignupScreens', {
//         screen: 'SocialLink2',
//         params: {
//           email,
//           username,
//           password,
//           otp,
//           // image,
//           bio,
//         },
//       });
//     } catch (error) {
//       Alert.alert('Error', 'Failed to save profile image. Please try again.');
//     }
//   };

//   if (showCamera && device) {
//     return (
//       <View style={styles.cameraContainer}>
//         <Camera
//           style={styles.camera}
//           device={device}
//           isActive={true}
//           photo={true}
//           ref={(ref) => {
//             if (ref) {
//               // Add capture button
//               setTimeout(() => {
//                 // This would be handled by a capture button in real implementation
//               }, 100);
//             }
//           }}
//         />
//         <View style={styles.cameraControls}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={() => setShowCamera(false)}
//           >
//             <Icon name="close" size={30} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.captureButton}
//             onPress={() => {
//               // Get camera ref and take photo
//               const cameraRef = Camera.current;
//               if (cameraRef) {
//                 handleCameraCapture(cameraRef);
//               }
//             }}
//           >
//             <View style={styles.captureButtonInner} />
//           </TouchableOpacity>
//           <View style={styles.placeholder} />
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Profile Picture</Text>

//       <View style={styles.imageContainer}>
//         {(tempImage || image) ? (
//           <Image
//             source={{ uri: tempImage?.uri || image?.uri }}
//             style={styles.profileImage}
//           />
//         ) : (
//           <View style={styles.imagePlaceholder}>
//             <Icon name="person" size={80} color="#dddddd" />
//           </View>
//         )}

//         <TouchableOpacity style={styles.addButton} onPress={handlePlusPress}>
//           <Icon
//             name={image ? "delete" : "add"}
//             size={24}
//             color="#fff"
//           />
//         </TouchableOpacity>
//       </View>

//       {/* Only show apply/cancel buttons for camera captures */}
//       {tempImage && (
//         <View style={styles.imageActions}>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.applyButton]}
//             onPress={handleApplyImage}
//             disabled={isApplying}
//           >
//             <Text style={styles.actionButtonText}>
//               {isApplying ? 'Applying...' : 'Apply'}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.cancelActionButton]}
//             onPress={handleCancelImage}
//           >
//             <Text style={styles.actionButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <TextInput
//         style={styles.bioInput}
//         placeholder="Write your bio..."
//         value={bio}
//         onChangeText={handleBioChange}
//         multiline
//         maxLength={200}
//       />

//       <NextButton onPress={handleNext} disabled={isButtonDisabled} />

//       {/* Options Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showModal}
//         onRequestClose={() => setShowModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Select Image Source</Text>

//             <TouchableOpacity
//               style={styles.modalOption}
//               onPress={handleCameraOption}
//             >
//               <Icon name="camera-alt" size={24} color="#333" />
//               <Text style={styles.modalOptionText}>Take Photo</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.modalOption}
//               onPress={handleGalleryOption}
//             >
//               <Icon name="photo-library" size={24} color="#333" />
//               <Text style={styles.modalOptionText}>Choose from Gallery</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.modalCancel}
//               onPress={() => setShowModal(false)}
//             >
//               <Text style={styles.modalCancelText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// export default ProfileImage2;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     padding: 24,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 32,
//   },
//   imageContainer: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//     borderWidth: 2,
//     borderColor: '#eee',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//     position: 'relative',
//     backgroundColor: '#f8f8f8',
//   },
//   profileImage: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//   },
//   imagePlaceholder: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//   },
//   addButton: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: '#f9213f',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 2,
//   },
//   imageActions: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     gap: 12,
//   },
//   actionButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   applyButton: {
//     backgroundColor: '#4CAF50',
//   },
//   cancelActionButton: {
//     backgroundColor: '#f44336',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   bioInput: {
//     width: '100%',
//     minHeight: 60,
//     borderColor: '#eee',
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 24,
//     fontSize: 16,
//     backgroundColor: '#fafafa',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 30,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   modalOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   modalOptionText: {
//     fontSize: 16,
//     marginLeft: 15,
//     color: '#333',
//   },
//   modalCancel: {
//     alignItems: 'center',
//     paddingVertical: 15,
//     marginTop: 10,
//   },
//   modalCancelText: {
//     fontSize: 16,
//     color: '#f44336',
//     fontWeight: 'bold',
//   },
//   cameraContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   camera: {
//     flex: 1,
//   },
//   cameraControls: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 30,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   cancelButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   captureButtonInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#fff',
//   },
//   placeholder: {
//     width: 50,
//     height: 50,
//   },
// });















// previous code the user save in async before next is clicker


// import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Alert, Modal } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import NextButton from './components/NextButton';

// const ProfileImage2 = ({ route, navigation }) => {
//   // Get params from previous screen
//   const { email, username, password, otp } = route?.params || {};
//   const [image, setImage] = useState(null);
//   const [bio, setBio] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [showCamera, setShowCamera] = useState(false);
//   const [cameraPermission, setCameraPermission] = useState(null);
//   const [tempImage, setTempImage] = useState(null); // Only for camera preview
//   const [isApplying, setIsApplying] = useState(false);

//   const devices = useCameraDevices();
//   const device = devices.back;

//   // Storage keys
//   const PROFILE_IMAGE_KEY = `profile_image_${username || email}`;

//   useEffect(() => {
//     checkCameraPermission();
//     loadStoredData();
//   }, []);

//   // Check camera permission
//   const checkCameraPermission = async () => {
//     const permission = await Camera.getCameraPermissionStatus();
//     setCameraPermission(permission);

//     if (permission === 'not-determined') {
//       const newPermission = await Camera.requestCameraPermission();
//       setCameraPermission(newPermission);
//     }
//   };

//   // Load stored image
//   const loadStoredData = async () => {
//     try {
//       const storedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);

//       if (storedImage) {
//         setImage(JSON.parse(storedImage));
//       }
//     } catch (error) {
//       console.error('Error loading stored data:', error);
//     }
//   };

//   // Store image locally (automatically replaces previous image)
//   const storeImageLocally = async (imageData) => {
//     try {
//       // Clear previous image first
//       await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);

//       // Store new image
//       await AsyncStorage.setItem(PROFILE_IMAGE_KEY, JSON.stringify(imageData));
//       console.log('Image stored successfully');
//     } catch (error) {
//       console.error('Error storing image:', error);
//       Alert.alert('Error', 'Failed to store image locally');
//     }
//   };

//   // Handle plus button press (show options)
//   const handlePlusPress = () => {
//     setShowModal(true);
//   };

//   // Handle camera option
//   const handleCameraOption = async () => {
//     setShowModal(false);
//     if (cameraPermission === 'authorized') {
//       setShowCamera(true);
//     } else {
//       Alert.alert('Permission Required', 'Camera permission is required to take photos');
//     }
//   };

//   // Handle gallery option - automatically replaces previous image
//   const handleGalleryOption = () => {
//     setShowModal(false);
//     handleImagePicker();
//   };

//   // Camera capture
//   const handleCameraCapture = async (camera) => {
//     try {
//       const photo = await camera.takePhoto({
//         qualityPrioritization: 'speed',
//         flash: 'off',
//         enableAutoRedEyeReduction: true,
//       });

//       const imageData = {
//         uri: `file://${photo.path}`,
//         fileName: `camera_${Date.now()}.jpg`,
//         type: 'image/jpeg',
//         fileSize: photo.fileSize || 0,
//       };

//       setTempImage(imageData);
//       setShowCamera(false);
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo');
//     }
//   };

//   // Gallery image picker - automatically replaces previous image
//   const handleImagePicker = async () => {
//     const options = {
//       mediaType: 'photo',
//       includeBase64: false,
//       maxHeight: 1200,
//       maxWidth: 1200,
//       quality: 0.8,
//       selectionLimit: 1,
//     };

//     try {
//       const result = await launchImageLibrary(options);
//       if (result.didCancel) return;
//       if (result.errorCode) {
//         Alert.alert('Error', 'Image selection failed. Please try again.');
//         return;
//       }
//       if (result.assets && result.assets.length > 0) {
//         const selectedImage = result.assets[0];

//         // Automatically store the new image (replaces previous)
//         await storeImageLocally(selectedImage);
//         setImage(selectedImage);

//         Alert.alert('Success', 'Image updated successfully');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Something went wrong while selecting the image.');
//     }
//   };

//   // Apply camera captured image
//   const handleApplyImage = async () => {
//     if (!tempImage) return;

//     setIsApplying(true);

//     try {
//       // Store new image (automatically replaces previous)
//       await storeImageLocally(tempImage);
//       setImage(tempImage);
//       setTempImage(null);

//       Alert.alert('Success', 'Image applied successfully');
//     } catch (error) {
//       console.error('Error applying image:', error);
//       Alert.alert('Error', 'Failed to apply image');
//     } finally {
//       setIsApplying(false);
//     }
//   };

//   // Cancel temp image selection
//   const handleCancelImage = () => {
//     setTempImage(null);
//   };

//   // Handle bio change
//   const handleBioChange = (text) => {
//     setBio(text);
//   };

//   // Button enabled only if image and bio are present
//   const isButtonDisabled = !image || !bio.trim();

//   // Next handler: pass all data to SocialLink2
//   const handleNext = () => {
//     navigation.navigate('SignupScreens', {
//       screen: 'SocialLink2',
//       params: {
//         email,
//         username,
//         password,
//         otp,
//         image,
//         bio,
//       },
//     });
//   };

//   if (showCamera && device) {
//     return (
//       <View style={styles.cameraContainer}>
//         <Camera
//           style={styles.camera}
//           device={device}
//           isActive={true}
//           photo={true}
//           ref={(ref) => {
//             if (ref) {
//               // Add capture button
//               setTimeout(() => {
//                 // This would be handled by a capture button in real implementation
//               }, 100);
//             }
//           }}
//         />
//         <View style={styles.cameraControls}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={() => setShowCamera(false)}
//           >
//             <Icon name="close" size={30} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.captureButton}
//             onPress={() => {
//               // Get camera ref and take photo
//               const cameraRef = Camera.current;
//               if (cameraRef) {
//                 handleCameraCapture(cameraRef);
//               }
//             }}
//           >
//             <View style={styles.captureButtonInner} />
//           </TouchableOpacity>
//           <View style={styles.placeholder} />
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Profile Picture</Text>

//       <View style={styles.imageContainer}>
//         {(tempImage || image) ? (
//           <Image
//             source={{ uri: tempImage?.uri || image?.uri }}
//             style={styles.profileImage}
//           />
//         ) : (
//           <View style={styles.imagePlaceholder}>
//             <Icon name="person" size={80} color="#dddddd" />
//           </View>
//         )}

//         <TouchableOpacity style={styles.addButton} onPress={handlePlusPress}>
//           <Icon name="add" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Only show apply/cancel buttons for camera captures */}
//       {tempImage && (
//         <View style={styles.imageActions}>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.applyButton]}
//             onPress={handleApplyImage}
//             disabled={isApplying}
//           >
//             <Text style={styles.actionButtonText}>
//               {isApplying ? 'Applying...' : 'Apply'}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.actionButton, styles.cancelActionButton]}
//             onPress={handleCancelImage}
//           >
//             <Text style={styles.actionButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       <TextInput
//         style={styles.bioInput}
//         placeholder="Write your bio..."
//         value={bio}
//         onChangeText={handleBioChange}
//         multiline
//         maxLength={200}
//       />

//       <NextButton onPress={handleNext} disabled={isButtonDisabled} />

//       {/* Options Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showModal}
//         onRequestClose={() => setShowModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Select Image Source</Text>

//             <TouchableOpacity
//               style={styles.modalOption}
//               onPress={handleCameraOption}
//             >
//               <Icon name="camera-alt" size={24} color="#333" />
//               <Text style={styles.modalOptionText}>Take Photo</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.modalOption}
//               onPress={handleGalleryOption}
//             >
//               <Icon name="photo-library" size={24} color="#333" />
//               <Text style={styles.modalOptionText}>Choose from Gallery</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.modalCancel}
//               onPress={() => setShowModal(false)}
//             >
//               <Text style={styles.modalCancelText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// export default ProfileImage2;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     padding: 24,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 32,
//   },
//   imageContainer: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//     borderWidth: 2,
//     borderColor: '#eee',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//     position: 'relative',
//     backgroundColor: '#f8f8f8',
//   },
//   profileImage: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//   },
//   imagePlaceholder: {
//     width: 140,
//     height: 140,
//     borderRadius: 70,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//   },
//   addButton: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: '#f9213f',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 2,
//   },
//   imageActions: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     gap: 12,
//   },
//   actionButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   applyButton: {
//     backgroundColor: '#4CAF50',
//   },
//   cancelActionButton: {
//     backgroundColor: '#f44336',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   bioInput: {
//     width: '100%',
//     minHeight: 60,
//     borderColor: '#eee',
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 24,
//     fontSize: 16,
//     backgroundColor: '#fafafa',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 30,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   modalOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   modalOptionText: {
//     fontSize: 16,
//     marginLeft: 15,
//     color: '#333',
//   },
//   modalCancel: {
//     alignItems: 'center',
//     paddingVertical: 15,
//     marginTop: 10,
//   },
//   modalCancelText: {
//     fontSize: 16,
//     color: '#f44336',
//     fontWeight: 'bold',
//   },
//   cameraContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   camera: {
//     flex: 1,
//   },
//   cameraControls: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 30,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   cancelButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   captureButtonInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#fff',
//   },
//   placeholder: {
//     width: 50,
//     height: 50,
//   },
// });

