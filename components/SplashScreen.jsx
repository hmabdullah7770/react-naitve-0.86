// SplashScreen.js
import React from 'react';
import { View, Image, Text } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('../assets/1.jpg')} // replace with your splash screen image
        style={{ width: '100%', height: '100%' }}
      />
      <View style={{ position: 'absolute', bottom: 0, right: 0, marginRight: 20, marginBottom: 20 }}>
        <Text style={{ color: '#FFFFFF' }}>@Powered by brandHub</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
