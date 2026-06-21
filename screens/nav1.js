import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import {
    createStaticNavigation,
    useNavigation,
  } from '@react-navigation/native';

  import { Button } from '@react-navigation/elements';

const nav1 = () => {
    const navigation = useNavigation();
  return (
    <View>
      <Text>nav1</Text>
      <Button onPress={() => navigation.navigate('Details')}>
        Go to nav2
      </Button>
    </View>
  );
};

export default nav1;

const styles = StyleSheet.create({});
