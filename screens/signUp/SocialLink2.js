import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signuprequest } from '../../Redux/action/auth';
import SocialModal from './SocialModal';
import SocialBox from './SocialBox';

const SocialLink2 = ({ route, navigation }) => {
  // Get all params from previous screen
  const { email, password, username, otp, bio, image } = route?.params || {};

  const dispatch = useDispatch();
  const { error, isLoading } = useSelector(state => state.auth);

  // Social platform state
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
  const [platformErrors, setPlatformErrors] = useState({
    whatsapp: '',
    facebook: '',
    instagram: '',
    storelink: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);

  // Validation for each platform
  const validatePlatform = (platform, value) => {
    switch (platform) {
      case 'facebook':
        return /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.-]+$/.test(value)
          ? ''
          : 'Please enter a valid Facebook profile link';
      case 'instagram':
        return /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.-]+$/.test(value)
          ? ''
          : 'Please enter a valid Instagram profile link';
      case 'whatsapp':
        return /^\d{10,15}$/.test(value)
          ? ''
          : 'Please enter a valid WhatsApp number (digits only)';
      case 'storelink':
        return /^https?:\/\/.+\..+/.test(value)
          ? ''
          : 'Please enter a valid store link';
      default:
        return '';
    }
  };

  // Handle box press
  const handleBoxPress = (platform) => {
    setCurrentPlatform(platform);
    setModalVisible(true);
  };

  // Save data from modal
  const handleSaveData = (platform, value) => {
    const errorMsg = validatePlatform(platform, value);
    setPlatformErrors(prev => ({ ...prev, [platform]: errorMsg }));
    setPlatformData(prev => ({ ...prev, [platform]: value }));
    setSelectedPlatforms(prev => ({ ...prev, [platform]: value.trim() !== '' }));
    setModalVisible(false);
  };

  // Show backend error under the relevant box
  React.useEffect(() => {
    if (error && typeof error === 'object') {
      // Assume error is { platform: 'error message' }
      setPlatformErrors(prev => ({ ...prev, ...error }));
    }
  }, [error]);

  // Next button enabled if at least one platform is selected and all selected are valid
  const isNextEnabled =
    Object.values(selectedPlatforms).some(Boolean) &&
    Object.entries(selectedPlatforms).every(
      ([platform, selected]) =>
        !selected || (selected && !platformErrors[platform] && platformData[platform])
    );

  // Handle Next: dispatch signup
  const handleNext = () => {
    // Prepare data for signup
    const socialLinks = {};
    Object.keys(selectedPlatforms).forEach(platform => {
      if (selectedPlatforms[platform]) {
        socialLinks[platform] = platformData[platform];
      }
    });

    // Dispatch signup action
    dispatch(
      signuprequest(
        username,
        password,
        email,
        image, // you may need to extract uri/fileName/type as per your backend
        otp,
        // null, // phone (if any)
        socialLinks.whatsapp,
        socialLinks.facebook,
        socialLinks.instagram,
        socialLinks.storelink,
        bio
      )
    );

    // On success, navigate to login (handle this in a useEffect watching for success in Redux)
  };



  const platformLabels = {
    whatsapp: 'WhatsApp Number',
    facebook: 'Facebook Profile',
    instagram: 'Instagram Profile',
    storelink: 'Store Website',
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connect Your Socials</Text>
        <View style={styles.boxesContainer}>
          {Object.keys(platformLabels).map((platform) => (
            <View key={platform} style={{ width: '48%' }}>
              <SocialBox
                platform={platform}
                label={platformLabels[platform]}
                value={platformData[platform]}
                isSelected={selectedPlatforms[platform]}
                onPress={() => handleBoxPress(platform)}
              />
              {platformErrors[platform] ? (
                <Text style={styles.errorText}>{platformErrors[platform]}</Text>
              ) : null}
            </View>
          ))}
        </View>
        <Text style={styles.instructionText}>
          Choose at least one. I recommend you select all, as people interact with you using different platforms.
        </Text>
        <TouchableOpacity
          style={[styles.nextButton, !isNextEnabled && styles.disabledButton]}
          disabled={!isNextEnabled || isLoading}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>{isLoading ? 'Signing Up...' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
      <SocialModal
        visible={modalVisible}
        platform={currentPlatform}
        platformLabel={currentPlatform ? platformLabels[currentPlatform] : ''}
        initialValue={currentPlatform ? platformData[currentPlatform] : ''}
        onSave={(value) => handleSaveData(currentPlatform, value)}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

export default SocialLink2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',   // centers vertically
    alignItems: 'center',

  },
  content: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  boxesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#555',
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'left',
  },
});
