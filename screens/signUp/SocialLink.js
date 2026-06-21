import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { verifyemailrequest, matchusenamerequest, matchotpreques, signuprequest } from '../../Redux/action/auth';
import SocialModal from './components/SocialModal';

const SocialLink = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    whatsapp: false,
    facebook: false,
    instagram: false,
    website: false,
  });

  const [platformData, setPlatformData] = useState({
    whatsapp: '',
    facebook: '',
    instagram: '',
    website: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);

  const handleBoxPress = (platform) => {
    setCurrentPlatform(platform);
    setModalVisible(true);
  };

  const handleSaveData = (platform, value) => {
    setPlatformData({
      ...platformData,
      [platform]: value,
    });

    setSelectedPlatforms({
      ...selectedPlatforms,
      [platform]: value.trim() !== '',
    });

    setModalVisible(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const isNextEnabled = Object.values(selectedPlatforms).some(value => value === true);

  const platformLabels = {
    whatsapp: 'WhatsApp Number',
    facebook: 'Facebook Profile',
    instagram: 'Instagram Profile',
    website: 'Store Website',
  };

  const handleNext = () => {
    // Here you would handle the submission of the social links data
    console.log('Submitted data:', platformData);
    // Continue to the next screen or submit to backend
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Socials</Text>

      <View style={styles.boxesContainer}>
        {Object.keys(platformLabels).map((platform) => (
          <TouchableOpacity
            key={platform}
            style={[
              styles.box,
              selectedPlatforms[platform] && styles.selectedBox,
            ]}
            onPress={() => handleBoxPress(platform)}
          >
            <Text style={styles.boxTitle}>{platformLabels[platform]}</Text>
            {platformData[platform] ? (
              <Text style={styles.boxValue} numberOfLines={1}>
                {platformData[platform]}
              </Text>
            ) : (
              <Text style={styles.boxPlaceholder}>Tap to add</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.instructionText}>
        Choose at least one of them. I recommend you select all, as people interact with you using different platforms.
      </Text>

      <TouchableOpacity
        style={[styles.nextButton, !isNextEnabled && styles.disabledButton]}
        disabled={!isNextEnabled}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      <SocialModal
        visible={modalVisible}
        platform={currentPlatform}
        platformLabel={currentPlatform ? platformLabels[currentPlatform] : ''}
        initialValue={currentPlatform ? platformData[currentPlatform] : ''}
        onSave={(value) => handleSaveData(currentPlatform, value)}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default SocialLink;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
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
  },
  box: {
    width: '48%',
    aspectRatio: 1.5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  boxValue: {
    fontSize: 14,
    color: '#333',
  },
  boxPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
});
