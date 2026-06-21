import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import ProductCard from './ProductCard'
import AddProductCard from './AddProductCard'        // ← import
import { StoreOwnerContext } from '../../../context/IsStoreOwner'

const chunkArray = (arr, size) =>
  arr.reduce((rows, item, i) => {
    if (i % size === 0) rows.push([])
    rows[rows.length - 1].push(item)
    return rows
  }, [])

const ProductCardGrid = ({ storeProductsData, isLoadingProducts, productsError,GetStoreById }) => {
  const { isStoreOwner } = useContext(StoreOwnerContext)

  const products = storeProductsData?.data?.data ?? []
  // const storeId = products?.[0]?.storeId
  const isStoreOwnerProduct = isStoreOwner === GetStoreById?.data?.data?._id

  // ── inject a sentinel as the first item when owner ──
  const displayItems = isStoreOwnerProduct
    ? [{ _id: '__add__', __isAddCard: true }, ...products]
    : products

  const rows = chunkArray(displayItems, 2)

  if (isLoadingProducts) return null
  if (productsError || (products.length === 0 && !isStoreOwnerProduct)) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Special For You</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => (
            <View key={item._id} style={styles.cardWrapper}>
              {item.__isAddCard
                ? <AddProductCard />                          // ← first slot
                : <ProductCard item={item} isStoreOwnerProduct={isStoreOwnerProduct} />
              }
            </View>
          ))}
          {row.length < 2 && <View style={styles.cardWrapper} />}
        </View>
      ))}
    </View>
  )
}

export default ProductCardGrid

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  cardWrapper: {
    flex: 1,
  },
})


// import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
// import React, { useContext } from 'react'
// import ProductCard from './ProductCard'
// import { StoreOwnerContext } from '../../../context/IsStoreOwner';

// const chunkArray = (arr, size) =>
//   arr.reduce((rows, item, i) => {
//     if (i % size === 0) rows.push([])
//     rows[rows.length - 1].push(item)
//     return rows
//   }, [])

// const ProductCardGrid = ({ storeProductsData, isLoadingProducts, productsError }) => {
//   const { isStoreOwner } = useContext(StoreOwnerContext);

//   // ✅ Correct path — same double data pattern as carousel
//   const products = storeProductsData?.data?.data ?? [];

//   // ✅ storeId lives on each product, grab from first one
//   const storeId = products?.[0]?.storeId;
//   const isStoreOwnerProduct = isStoreOwner === storeId;

//   const rows = chunkArray(products, 2);

//   if (isLoadingProducts) return null; // or a skeleton
//   if (productsError || products.length === 0) return null;

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Special For You</Text>
//         <TouchableOpacity>
//           <Text style={styles.seeAll}>See All</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Grid rows */}
//       {rows.map((row, rowIndex) => (
//         <View key={rowIndex} style={styles.row}>
//           {row.map((item) => (
//             <View key={item._id} style={styles.cardWrapper}>
//               <ProductCard item={item} isStoreOwnerProduct={isStoreOwnerProduct} />
//             </View>
//           ))}
//           {/* Fill empty slot if odd */}
//           {row.length < 2 && <View style={styles.cardWrapper} />}
//         </View>
//       ))}
//     </View>
//   )
// }

// export default ProductCardGrid

// const styles = StyleSheet.create({
//   container: {
//     marginTop: 20,
//     paddingHorizontal: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 14,
//   },
//   headerTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#1a1a2e',
//   },
//   seeAll: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#4CAF50',
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 14,
//   },
//   cardWrapper: {
//     flex: 1,
//   },
// })



