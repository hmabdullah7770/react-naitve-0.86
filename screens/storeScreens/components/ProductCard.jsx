import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import {useDeleteProduct}  from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts'
import { useNavigation } from '@react-navigation/native';
import ProductDeleteLoader from './ProductDeleteLoader';

const ProductCard = ({ item, isStoreOwnerProduct }) => {
  const navigation = useNavigation();
  const [wishlisted, setWishlisted] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)

  const hasColors = item.productColors && item.productColors.length > 0

  // ✅ Active image driven by selected color's index
  const activeImageUri = hasColors
    ? item.productImages?.[item.productColors[selectedColorIndex]?.index] ?? item.productImages?.[0]
    : item.productImages?.[0]

  const visibleColors = hasColors ? item.productColors.slice(0, 3) : []
  const extraCount = hasColors ? item.productColors.length - 3 : 0

  // ✅ Price logic:
  // productDiscount = sale price, productPrice = original price
  // if productDiscount is 0 or missing, just show productPrice
  const salePrice = item.productDiscount > 0 ? item.productDiscount : item.productPrice
  const originalPrice = item.productDiscount > 0 ? item.productPrice : null


  const handlePress = () => {

    navigation.navigate('Store_ProductDetail', { productId: item._id, source: 'storeProductCard' });
   

  }

// 1. Call the hook at the top of your component
const { mutateAsync: deleteProductMutation ,isPending: isDeleting } = useDeleteProduct();


// 2. Use mutateAsync so you can chain .then/.catch
const handledeleteProduct = async () => {
  setMenuVisible(false);
  deleteProductMutation({ storeId: item.storeId, productId: item._id })
    .then(() => {
      console.log('Product deleted successfully');
    })
    .catch(error => {
      console.error('Error deleting product:', error);
    });
};

  return (
    <View style={styles.card}>


 {/* ✅ Loader overlay — shown only while deleting */}
    {isDeleting && (
      <View style={styles.loaderOverlay}>
        <ProductDeleteLoader/>
      </View>
    )}


      {/* Image */}




      <View style={styles.imageContainer}>
        <TouchableOpacity
          onPress={handlePress}
        >
          <Image
            source={{ uri: activeImageUri }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* 3-dot menu — store owner only */}
          {isStoreOwnerProduct && (
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => setMenuVisible(prev => !prev)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="more-vert" size={18} color="#333" />
            </TouchableOpacity>
          )}

          {/* Dropdown */}
          {isStoreOwnerProduct && menuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => setMenuVisible(false)}
              >
                <MaterialIcons name="edit" size={14} color="#333" />
                <Text style={styles.dropdownText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => 
                  handledeleteProduct(item._id, item.storeId)
                 }
              >
                <MaterialIcons name="delete-outline" size={14} color="#e53935" />
                <Text style={[styles.dropdownText, { color: '#e53935' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wishlist — non-owner only */}
          {!isStoreOwnerProduct && (
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => setWishlisted(!wishlisted)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={wishlisted ? 'favorite' : 'favorite-border'}
                size={18}
                color={wishlisted ? '#e53935' : '#999'}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>


      {/* Info */}
      <View style={styles.info}>
        {/* ✅ API field: category */}
        <Text style={styles.category} numberOfLines={1}>
          {item.category}
        </Text>

        {/* ✅ API field: productName */}
        <Text style={styles.name} numberOfLines={2}>
          {item.productName}
        </Text>

        {/* ✅ Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ${salePrice?.toFixed(2)}
          </Text>
          {originalPrice ? (
            <Text style={styles.originalPrice}>
              ${originalPrice?.toFixed(2)}
            </Text>
          ) : null}
        </View>

        {/* Color dots */}
        {hasColors && (
          <View style={styles.colorRow}>
            {visibleColors.map((colorObj, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => setSelectedColorIndex(idx)}
                style={[
                  styles.colorDot,
                  { backgroundColor: colorObj.color },
                  selectedColorIndex === idx && styles.colorDotSelected,
                ]}
              />
            ))}
            {extraCount > 0 && (
              <Text style={styles.moreColors}>+{extraCount}</Text>
            )}
          </View>
        )}
      </View>

    </View>
  )
}

export default ProductCard

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 170,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  info: {
    padding: 10,
  },
  category: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  originalPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: '#1a1a2e',
  },
  moreColors: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 8,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  loaderOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 99,
  borderRadius: 14,
},
})


// import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
// import React, { useState } from 'react'
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

// const ProductCard = ({ item, isStoreOwnerProduct }) => {
//   const [wishlisted, setWishlisted] = useState(false)
//   const [menuVisible, setMenuVisible] = useState(false)
//   const [selectedColorIndex, setSelectedColorIndex] = useState(0)

//   const hasColors = item.productColors && item.productColors.length > 0

//   // Active image driven by selected color's index
//   const activeImageUri = hasColors
//     ? item.productImages?.[item.productColors[selectedColorIndex]?.index] ?? item.productImages?.[0]
//     : item.productImages?.[0]

//   const visibleColors = hasColors ? item.productColors.slice(0, 3) : []
//   const extraCount = hasColors ? item.productColors.length - 3 : 0

//   return (
//     <View style={styles.card}>

//       {/* ── Image ── */}
//       <View style={styles.imageContainer}>
//         <Image
//           source={{ uri: activeImageUri }}
//           style={styles.image}
//           resizeMode="cover"
//         />

//         {/* 3-dot menu — store owner only */}
//         {isStoreOwnerProduct && (
//           <TouchableOpacity
//             style={styles.heartBtn}
//             onPress={() => setMenuVisible(prev => !prev)}
//             activeOpacity={0.8}
//           >
//             <MaterialIcons name="more-vert" size={18} color="#333" />
//           </TouchableOpacity>
//         )}

//         {/* Dropdown */}
//         {isStoreOwnerProduct && menuVisible && (
//           <View style={styles.dropdown}>
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={() => setMenuVisible(false)}
//             >
//               <MaterialIcons name="edit" size={14} color="#333" />
//               <Text style={styles.dropdownText}>Edit</Text>
//             </TouchableOpacity>
//             <View style={styles.divider} />
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={() => setMenuVisible(false)}
//             >
//               <MaterialIcons name="delete-outline" size={14} color="#e53935" />
//               <Text style={[styles.dropdownText, { color: '#e53935' }]}>Delete</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Wishlist — non-owner only */}
//         {!isStoreOwnerProduct && (
//           <TouchableOpacity
//             style={styles.heartBtn}
//             onPress={() => setWishlisted(!wishlisted)}
//             activeOpacity={0.8}
//           >
//             <MaterialIcons
//               name={wishlisted ? 'favorite' : 'favorite-border'}
//               size={18}
//               color={wishlisted ? '#e53935' : '#999'}
//             />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* ── Info ── */}
//       <View style={styles.info}>
//         <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
//         <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

//         <View style={styles.priceRow}>
//           <Text style={styles.price}>${item.price.toFixed(2)}</Text>
//           {item.originalPrice ? (
//             <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
//           ) : null}
//         </View>

//         {/* ── Color radio circles ── */}
//         {hasColors && (
//           <View style={styles.colorRow}>
//             {visibleColors.map((colorObj, idx) => (
//               <TouchableOpacity
//                 key={idx}
//                 activeOpacity={0.8}
//                 onPress={() => setSelectedColorIndex(idx)}
//                 style={[
//                   styles.colorDot,
//                   { backgroundColor: colorObj.color },
//                   selectedColorIndex === idx && styles.colorDotSelected,
//                 ]}
//               />
//             ))}
//             {extraCount > 0 && (
//               <Text style={styles.moreColors}>+{extraCount}</Text>
//             )}
//           </View>
//         )}
//       </View>

//     </View>
//   )
// }

// export default ProductCard

// const styles = StyleSheet.create({
//   card: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.07,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   imageContainer: {
//     width: '100%',
//     height: 170,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//   },
//   heartBtn: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: 32,
//     height: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   info: {
//     padding: 10,
//   },
//   category: {
//     fontSize: 11,
//     color: '#999',
//     fontWeight: '500',
//     marginBottom: 3,
//     textTransform: 'uppercase',
//     letterSpacing: 0.3,
//   },
//   name: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#1a1a2e',
//     lineHeight: 18,
//     marginBottom: 6,
//   },
//   priceRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 8,
//   },
//   price: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#1a1a2e',
//   },
//   originalPrice: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#bbb',
//     textDecorationLine: 'line-through',
//   },
//   colorRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   colorDot: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     borderWidth: 1.5,
//     borderColor: '#e0e0e0',
//   },
//   colorDotSelected: {
//     borderWidth: 2.5,
//     borderColor: '#1a1a2e',
//   },
//   moreColors: {
//     fontSize: 10,
//     fontWeight: '600',
//     color: '#888',
//   },
//   dropdown: {
//     position: 'absolute',
//     top: 42,
//     left: 8,
//     zIndex: 20,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     paddingVertical: 4,
//     minWidth: 110,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   dropdownText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#333',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//     marginHorizontal: 8,
//   },
// })




















// import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
// import React, { useState } from 'react'
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

// const ProductCard = ({ item, isStoreOwnerProduct }) => {
//   const [wishlisted, setWishlisted] = useState(false)

//   return (
//     <View style={styles.card}>
//       <View style={styles.imageContainer}>
//         <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />



//         {/* ── 3-dot button — top LEFT, owner only ── */}
//         {isStoreOwnerProduct && (
//           <TouchableOpacity
//             // style={styles.menuBtn}
//             style={styles.heartBtn}
//             onPress={() => setMenuVisible(prev => !prev)}
//             activeOpacity={0.8}>
//             <MaterialIcons name="more-vert" size={18} color="#333" />
//           </TouchableOpacity>
//         )}




//         {/* ── Dropdown ── */}
//         {isStoreOwnerProduct && menuVisible && (
//           <View style={styles.dropdown}>
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={() => setMenuVisible(false)}>
//               <MaterialIcons name="edit" size={14} color="#333" />
//               <Text style={styles.dropdownText}>Edit</Text>
//             </TouchableOpacity>
//             <View style={styles.divider} />
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={() => setMenuVisible(false)}>
//               <MaterialIcons name="delete-outline" size={14} color="#e53935" />
//               <Text style={[styles.dropdownText, { color: '#e53935' }]}>Delete</Text>
//             </TouchableOpacity>
//           </View>
//         )}




//         {!isStoreOwnerProduct && (<TouchableOpacity
//           style={styles.heartBtn}
//           onPress={() => setWishlisted(!wishlisted)}
//           activeOpacity={0.8}
//         >
//           <MaterialIcons
//             name={wishlisted ? 'favorite' : 'favorite-border'}
//             size={18}
//             color={wishlisted ? '#e53935' : '#999'}
//           />
//         </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.info}>
//         <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
//         <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
//         <View style={styles.priceRow}>
//           <Text style={styles.price}>${item.price.toFixed(2)}</Text>
//           {item.originalPrice && (
//             <Text style={styles.originalPrice}>${item.originalPrice.toFixed(2)}</Text>
//           )}
//         </View>
//       </View>
//     </View>
//   )
// }

// export default ProductCard   // ✅ correct export

// const styles = StyleSheet.create({
//   card: {
//     flex: 1,
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.07,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   imageContainer: {
//     width: '100%',
//     height: 170,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//   },
//   heartBtn: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: 32,
//     height: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   info: {
//     padding: 10,
//   },
//   category: {
//     fontSize: 11,
//     color: '#999',
//     fontWeight: '500',
//     marginBottom: 3,
//     textTransform: 'uppercase',
//     letterSpacing: 0.3,
//   },
//   name: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#1a1a2e',
//     lineHeight: 18,
//     marginBottom: 6,
//   },
//   priceRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   price: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#1a1a2e',
//   },
//   originalPrice: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#bbb',
//     textDecorationLine: 'line-through',
//   },




//   dropdown: {
//     position: 'absolute',
//     top: 42,
//     left: 8,
//     zIndex: 20,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     paddingVertical: 4,
//     minWidth: 110,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   dropdownText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#333',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//     marginHorizontal: 8,
//   },


// })