import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const SharedLayout = () => {
  return (
    <View style={styles.sharedlayout}>
      <Text style={styles.text}>@Powered By BrandHub</Text>
    </View>
  );
};

export default SharedLayout;

const styles = StyleSheet.create({
  sharedlayout: {


   position:'relative',
   bottom: '0%',
  //  top: '7%',

    width: '100%',
    alignItems: 'center',

  },

});
