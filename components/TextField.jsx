import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/material-icons';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate responsive sizes based on screen dimensions
const scale = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) / 375; // 375 is baseline width (iPhone X)

// Responsive size calculation function
const responsiveSize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  }
  return Math.round(newSize);
};

const Textfield = ({
  value,
  onChangeText,
  onBlur,
  placeholder,
  iconName,
  error,
  secureTextEntry,
  isPassword,
  onEyePress,
  containerStyle = {}, // Allow custom styling via props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  });

  // Handle screen rotation and dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setScreenDimensions({
        width,
        height,
        isLandscape: width > height,
      });
    };

    // Listen for dimension changes (rotation)
    const dimensionsSubscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      // Clean up subscription
      dimensionsSubscription.remove();
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  // Calculate dynamic styles based on screen orientation
  const dynamicStyles = {
    inputContainer: {
      height: screenDimensions.isLandscape ? responsiveSize(46) : responsiveSize(48),
      width: screenDimensions.isLandscape ? '75%' : '85%',
      borderRadius: responsiveSize(11),
    },
    inputIcon: {
      height: screenDimensions.isLandscape ? responsiveSize(30) : responsiveSize(33),
      width: screenDimensions.isLandscape ? responsiveSize(30) : responsiveSize(33),
      borderRadius: responsiveSize(10),
      marginLeft: responsiveSize(10),
    },
    iconSize: screenDimensions.isLandscape ? responsiveSize(28) : responsiveSize(30),
    eyeIconSize: screenDimensions.isLandscape ? responsiveSize(20) : responsiveSize(23),
    padding: screenDimensions.isLandscape ? responsiveSize(8) : responsiveSize(10),
  };

  return (
    <View
      style={[
        styles.inputContainer,
        dynamicStyles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        containerStyle,
      ]}
    >
      <View style={[styles.inputIcon, dynamicStyles.inputIcon]}>
        <Icon name={iconName} size={dynamicStyles.iconSize} color="#666666" />
     </View>
      <TextInput
        placeholder={placeholder}
        style={[styles.input, { marginLeft: dynamicStyles.padding }]}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        secureTextEntry={secureTextEntry}
      />
      {isPassword && (
        <TouchableOpacity onPress={onEyePress} style={styles.eyeIcon}>
          <Icon
            name={secureTextEntry ? 'visibility-off' : 'visibility'}
            size={dynamicStyles.eyeIconSize}
            color="grey"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize(17),
    backgroundColor: '#e7e7e7',
    // #f5e8e0
    border: '1px solidrgb(67, 64, 64)',
    borderWidth: 1, // Default no border
    alignSelf: 'center',
  },
  inputIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: '#1FFFA5',
    borderWidth: 2,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: responsiveSize(7),
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingRight: responsiveSize(37), // Make space for eye icon
  },
});

export default Textfield;
