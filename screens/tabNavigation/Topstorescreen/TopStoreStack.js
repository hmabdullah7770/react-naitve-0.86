import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import TopStores from './TopStores' 
import TopProduct from './TopProduct';

const Stack = createStackNavigator();

const TopStoreStack = () => {
  return (
    
    <Stack.Navigator>
      <Stack.Screen name="TopStores" component={TopStores} options={{headerShown:false}}/>
      <Stack.Screen name="TopProduct" component={TopProduct} options={{headerShown:false}}/>
    </Stack.Navigator>
  )
}

export default TopStoreStack

const styles = StyleSheet.create({})