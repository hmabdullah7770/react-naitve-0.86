import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
// import {Camera, useCameraDevices} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import {signuprequest} from '../../Redux/action/auth';
import SocialModal from './components/SocialModal';
import SocialBox from './components/SocialBox';

const ProfileSocial = ({route, navigation}) => {
  const {email, username, password, otp} = route?.params || {};
  const dispatch = useDispatch();
  const {isLoading} = useSelector(state => state.auth);

  // Profile states
  const [image, setImage] = useState(null);
  const [bio, setBio] = useState('');

  // Camera states
  const [showModal, setShowModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [tempImage, setTempImage] = useState(null);

  const devices = useCameraDevices();
  const device = devices.back;

  // Social states
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    whatsapp: false,
    facebook: false,
    instagram: false,
    storelink: false,
  });
  const [platformData, setPlatformData] = useState({
    whatsapp: '',
    facebook: '',
    instagram: '',
    storelink: '',
  });
  const [platformErrors, setPlatformErrors] = useState({});
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const permission = await Camera.getCameraPermissionStatus();
    setCameraPermission(permission);
    if (permission === 'not-determined') {
      const newPermission = await Camera.requestCameraPermission();
      setCameraPermission(newPermission);
    }
  };

  const handlePlusPress = () => {
    if (image) {
      Alert.alert('Remove Image', 'Do you want to remove this picture?', [
        {text: 'Cancel'},
        {text: 'Remove', onPress: () => setImage(null)},
      ]);
    } else {
      setShowModal(true);
    }
  };

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.assets?.length > 0) {
      setImage(result.assets[0]);
      setShowModal(false); // Close the modal after selecting image
    }
  };

  const handleCameraOption = () => {
    setShowModal(false);
    if (cameraPermission === 'authorized') {setShowCamera(true);}
    else {Alert.alert('Permission Required', 'Camera permission is required');}
  };

  const handleCameraCapture = async camera => {
    const photo = await camera.takePhoto({qualityPrioritization: 'speed'});
    const imageData = {
      uri: `file://${photo.path}`,
      fileName: `camera_${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
    setTempImage(imageData);
    setShowCamera(false);
  };

  const handleApplyImage = () => {
    setImage(tempImage);
    setTempImage(null);
  };

  // Social handling
  const platformLabels = {
    whatsapp: 'WhatsApp Number',
    facebook: 'Facebook Profile',
    instagram: 'Instagram Profile',
    storelink: 'Store Website',
  };

  const validatePlatform = (platform, value) => {
    switch (platform) {
      case 'facebook':
        return /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.-]+$/.test(value)
          ? ''
          : 'Invalid Facebook link';
      case 'instagram':
        return /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.-]+$/.test(
          value,
        )
          ? ''
          : 'Invalid Instagram link';
      case 'whatsapp':
        return /^\d{10,15}$/.test(value) ? '' : 'Invalid WhatsApp number';
      case 'storelink':
        return /^https?:\/\/.+\..+/.test(value) ? '' : 'Invalid store link';
      default:
        return '';
    }
  };

  const handleBoxPress = platform => {
    setCurrentPlatform(platform);
    setSocialModalVisible(true);
  };

  const handleSaveData = (platform, value) => {
    const errorMsg = validatePlatform(platform, value);
    setPlatformErrors(prev => ({...prev, [platform]: errorMsg}));
    setPlatformData(prev => ({...prev, [platform]: value}));
    setSelectedPlatforms(prev => ({...prev, [platform]: value.trim() !== ''}));
    setSocialModalVisible(false);
  };

  const handleDeletePlatform = (platform) => {
    setPlatformData(prev => ({...prev, [platform]: ''}));
    setSelectedPlatforms(prev => ({...prev, [platform]: false}));
    setPlatformErrors(prev => ({...prev, [platform]: ''}));
  };

  // Enable final submit
  const isSubmitEnabled =
    image &&
    bio.trim() &&
    Object.values(selectedPlatforms).some(Boolean) &&
    Object.entries(selectedPlatforms).every(
      ([p, selected]) =>
        !selected || (selected && !platformErrors[p] && platformData[p]),
    );

  const handleSignup = () => {
    const socialLinks = {};
    Object.keys(selectedPlatforms).forEach(p => {
      if (selectedPlatforms[p]) {socialLinks[p] = platformData[p];}
    });

  const signupData = {
      username,
      password,
      email,
      avatar: image,
      otp,
      bio,
    };

    // Only add social links if they have values
    if (socialLinks.whatsapp) {signupData.whatsapp = socialLinks.whatsapp;}
    if (socialLinks.facebook) {signupData.facebook = socialLinks.facebook;}
    if (socialLinks.instagram) {signupData.instagram = socialLinks.instagram;}
    if (socialLinks.storelink) {signupData.storelink = socialLinks.storelink;}

    console.log('signupData ??????',signupData);
    dispatch(signuprequest(signupData));
  };

  // Camera UI
  if (showCamera && device) {
    return (
      <View style={{flex: 1, backgroundColor: '#000'}}>
        <Camera style={{flex: 1}} device={device} isActive photo />
        <TouchableOpacity
          onPress={() => setShowCamera(false)}
          style={styles.captureButton}>
          <Text style={{color: '#fff'}}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>

      {/* Profile Image */}
      <View style={styles.imageContainer}>
        {tempImage || image ? (
          <Image
            source={{uri: tempImage?.uri || image?.uri}}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="person" size={80} color="#ccc" />
          </View>
        )}
        <TouchableOpacity style={styles.addButton} onPress={handlePlusPress}>
          <Icon name={image ? 'delete' : 'add'} size={24} color="black" />
        </TouchableOpacity>
      </View>
      {tempImage && (
        <TouchableOpacity onPress={handleApplyImage} style={styles.applyButton}>
          <Text style={{color: '#fff'}}>Apply</Text>
        </TouchableOpacity>
      )}

      {/* Bio */}
      <TextInput
        style={styles.bioInput}
        placeholder="Write your bio..."
        value={bio}
        onChangeText={setBio}
        multiline
      />

      {/* Social Links */}
      <View style={styles.boxesContainer}>
        {Object.keys(platformLabels).map(p => (
          <View key={p} style={styles.socialBoxWrapper}>
            <SocialBox
              platform={p}
              label={platformLabels[p]}
              value={platformData[p]}
              isSelected={selectedPlatforms[p]}
              onPress={() => handleBoxPress(p)}
              onDelete={handleDeletePlatform}
            />
            {platformErrors[p] ? (
              <Text style={styles.errorText}>{platformErrors[p]}</Text>
            ) : null}
          </View>
        ))}
      </View>

{/* <TouchableOpacity onPress={() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'SigninScreen',
          params: { screen: 'EmailPassword' }
        }
      ]
    });
  }}>
<Text> Nav t0 email password</Text>
</TouchableOpacity> */}


      {/* Submit */}
      <TouchableOpacity
        style={[styles.nextButton, !isSubmitEnabled && styles.disabledButton]}
        disabled={!isSubmitEnabled || isLoading}
        onPress={handleSignup}>
        <Text style={styles.nextButtonText}>
          {isLoading ? 'Signing Up...' : 'Finish Signup'}
        </Text>
      </TouchableOpacity>

      {/* Fixed Modal - Bottom Drawer Style */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            {/* <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCameraOption}>
              <Icon name="camera-alt" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleImagePicker}>
              <Icon name="photo-library" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SocialModal
        visible={socialModalVisible}
        platform={currentPlatform}
        platformLabel={currentPlatform ? platformLabels[currentPlatform] : ''}
        initialValue={currentPlatform ? platformData[currentPlatform] : ''}
        onSave={val => handleSaveData(currentPlatform, val)}
        onClose={() => setSocialModalVisible(false)}
      />
    </View>
  );
};

export default ProfileSocial;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    backgroundColor: '#f8f8f8',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1FFFA5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  applyButton: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  bioInput: {
    width: '100%',
    minHeight: 60,
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  boxesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  socialBoxWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  nextButton: {
    backgroundColor: '#1FFFA5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  // Fixed Modal Styles - Bottom Drawer
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#1FFFA5',
    fontWeight: 'bold',
  },
});
