import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';

const Store_OrderViewMore = () => {
  const route = useRoute(); // ✅ always works regardless of how screen is rendered
  const {order, orderId} = route.params;

  console.log('🟢 Store_OrderViewMore — received params:', order);
  console.log('🟢 Store_OrderViewMore — received orderId:', orderId);

  const navigation = useNavigation();

  return (
    <View>
      <Text>Store_OrderViewMore</Text>
      <Text>Order ID: {orderId}</Text>
    </View>
  );
};

export default Store_OrderViewMore;

const styles = StyleSheet.create({});
