import {StyleSheet, ScrollView, View} from 'react-native';
import React from 'react';
import NavBar from './components/NavBar';
import Carousel from './components/Carousel';
import Categoury from './components/Categoury';
import ProductCardGrid from './components/ProductCardGrid';
import {useGetStoreCarousel} from '../../ReactQuery/TanStackQueryHooks/storee/useStoreCarousel';
import {useGetStoreProducts} from '../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';




const Store_HomeScreen = ({GetStoreById, StoreByIdLoading, StoreByIderror}) => {

console.log("in home screen getStore data",GetStoreById)

  const {
    data: storeCarouselData,
    isLoading: isLoadingCarousel,
    error: carouselError,
  } = useGetStoreCarousel(GetStoreById?.data?.data?._id);

  const {
    data: storeProductsData,
    isLoading: isLoadingProducts,
    error: productsError,
    
  } = useGetStoreProducts(GetStoreById?.data?.data?._id);

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <View style={{marginTop: 15}}>
        <NavBar
          GetStoreById={GetStoreById}
          StoreByIdLoading={StoreByIdLoading}
          StoreByIderror={StoreByIderror}
        />
      </View>

      <View style={{marginTop: 7}}>
        <Carousel
          storeCarouselData={storeCarouselData}
          isLoadingCarousel={isLoadingCarousel}
          carouselError={carouselError}
          GetStoreById = {GetStoreById}
        />
      </View>

      <View style={{marginTop: 7}}>
        <Categoury />
      </View>

      <ProductCardGrid
        storeProductsData={storeProductsData}
        isLoadingProducts={isLoadingProducts}
        productsError={productsError}
        GetStoreById = {GetStoreById}

      />
    </ScrollView>
  );
};

export default Store_HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    paddingBottom: 40,
  },
});

// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import NavBar from './components/NavBar'
// import Carousel from  './components/Carousel'
// import Categoury from './components/Categoury'
// // import ProductCard from './components/productcard'
// import ProductCardsGrid from './components/ProductCardGrid'

// const Store_HomeScreen = () => {
//   return (
//     <View>
//         <View style={{marginTop: 15}}>
//         <NavBar />
//       </View>
//         <View style={{marginTop: 7}}>
//         <Carousel />
//       </View>
//        <View style={{marginTop: 7}}>
//         <Categoury/>
//       </View>

//    <ProductCardsGrid />

//       {/* <Text>Store_HomeScreen</Text> */}
//     </View>
//   )
// }

// export default Store_HomeScreen

// const styles = StyleSheet.create({})
