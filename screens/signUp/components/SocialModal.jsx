import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';

const SocialModal = ({ visible, platform, platformLabel, initialValue, onSave, onClose }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue(initialValue || '');
    }
  }, [visible, initialValue]);

  const getPlaceholder = () => {
    switch (platform) {
      case 'whatsapp':
        return 'Enter your WhatsApp number';
      case 'facebook':
        return 'Enter your Facebook profile link';
      case 'instagram':
        return 'Enter your Instagram profile link';
      case 'website':
        return 'Enter your store website link';
      default:
        return 'Enter value';
    }
  };

  const getKeyboardType = () => {
    return platform === 'whatsapp' ? 'phone-pad' : 'default';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{platformLabel}</Text>

          <TextInput
            style={styles.input}
            placeholder={getPlaceholder()}
            placeholderTextColor="#999"
            value={value}
            onChangeText={setValue}
            keyboardType={getKeyboardType()}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
            >
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={() => onSave(value)}
            >
              <Text style={styles.buttonSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SocialModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  buttonSave: {
    backgroundColor: '#1FFFA5',
  },
  buttonSaveText: {
    color: 'white',
    fontWeight: '600',
  },
});
