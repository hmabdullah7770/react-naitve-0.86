// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> verson 3 code <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useGetProductsIds} from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';
import {useGetStoreIds} from '../../../ReactQuery/TanStackQueryHooks/storee/useStore';

const MoreItemModal = ({
  visible,
  onRequestClose,
  sheetTitle,
  sheetSubtitle,
  ids = [],              // ✅ array of ProductId or storeId strings
  isProductEnabled = false,
  isStoreEnabled = false,
  handleSelectItem,
}) => {

  // ✅ Only give IDs to the hook that should actually use them
const productIds = isProductEnabled ? ids : [];
const storeIds   = isStoreEnabled   ? ids : [];
  
  // ✅ Only fetch when modal is open and IDs exist
  const shouldFetch = visible && ids.length > 0;



  const {
    data: productData,
    isLoading: productLoading,
    isError: productError,
  } = useGetProductsIds(productIds, {
    enabled: shouldFetch && isProductEnabled,
  });

  const {
    data: storeData,
    isLoading: storeLoading,
    isError: storeError,
  } = useGetStoreIds(storeIds, {
    enabled: shouldFetch && isStoreEnabled,
  });

  // ✅ Pick the right data + loading/error state
  const isLoading = isProductEnabled ? productLoading : storeLoading;
  const isError   = isProductEnabled ? productError   : storeError;

  // ✅ Map API response to a flat list, normalizing image + title per type
  const listItems = React.useMemo(() => {
    if (isProductEnabled) {
      const products = productData?.data?.data?.products ?? [];
      return products.map((p) => ({
        _id:   p._id,
        image: p.productImages?.[0] ?? null,   // first image in array
        title: p.productName ?? 'Unnamed',
        raw:   p,                               // full object for navigation
      }));
    }

    if (isStoreEnabled) {
      const stores = storeData?.data?.data?.stores ?? [];
      return stores.map((s) => ({
        _id:   s._id,
        image: s.storeLogo ?? null,
        title: s.storeName ?? 'Unnamed',
        raw:   s,
      }));
    }

    return [];
  }, [isProductEnabled, isStoreEnabled, productData, storeData]);

  // ✅ Render one row
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storeItem}
      activeOpacity={0.7}
      onPress={() => handleSelectItem?.(item.raw)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/48' }}
        style={styles.storeLogo}
      />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
    </TouchableOpacity>
  );

  // ✅ Body: loading / error / list
  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Failed to load. Please try again.</Text>
        </View>
      );
    }
    if (listItems.length === 0) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>No items found.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={listItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.storeList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onRequestClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onRequestClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>{sheetTitle}</Text>
        <Text style={styles.sheetSubtitle}>{sheetSubtitle}</Text>

        {renderBody()}

        <TouchableOpacity style={styles.cancelButton} onPress={onRequestClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default MoreItemModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 20,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  storeList: { paddingBottom: 8 },
  separator: { height: 1, backgroundColor: '#F3F3F3', marginVertical: 4 },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 3,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444444',
  },
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> new code <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// import React from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   Modal,
//   FlatList,
//   Pressable,
//   TouchableOpacity,
//   Image,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';


// import useGetProductsIds from "../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts";
// import useGetStoreIds    from "../../../ReactQuery/TanStackQueryHooks/storee/useStore"




// const MoreItemModal = ({
//   visible,
//   onRequestClose,
//   sheetTitle,
//   sheetSubtitle,
//   items = [],
//   idKey = 'id',
//   imageKey = 'image',
//   titleKey = 'name',
//   handleSelectItem,
// }) => {
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       onRequestClose={onRequestClose}
//     >
//       {/* Backdrop */}
//       <Pressable style={styles.backdrop} onPress={onRequestClose} />

//       {/* Sheet */}
//       <View style={styles.sheet}>
//         <View style={styles.sheetHandle} />

//         <Text style={styles.sheetTitle}>{sheetTitle}</Text>
//         <Text style={styles.sheetSubtitle}>{sheetSubtitle}</Text>

//         <FlatList
//           data={items}
//           keyExtractor={(item) => String(item[idKey])}
//           contentContainerStyle={styles.storeList}
//           ItemSeparatorComponent={() => <View style={styles.separator} />}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               style={styles.storeItem}
//               activeOpacity={0.7}
//               onPress={() => handleSelectItem?.(item)}
//             >
//               <Image
//                 source={{ uri: item[imageKey] || 'https://via.placeholder.com/48' }}
//                 style={styles.storeLogo}
//               />
//               <View style={styles.storeInfo}>
//                 <Text style={styles.storeName} numberOfLines={1}>
//                   {item[titleKey] || 'Unnamed'}
//                 </Text>
//               </View>
//               <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
//             </TouchableOpacity>
//           )}
//         />

//         <TouchableOpacity style={styles.cancelButton} onPress={onRequestClose}>
//           <Text style={styles.cancelButtonText}>Cancel</Text>
//         </TouchableOpacity>
//       </View>
//     </Modal>
//   );
// };

// export default MoreItemModal;

// const styles = StyleSheet.create({
//   backdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//   },
//   sheet: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingTop: 12,
//     paddingBottom: 32,
//     paddingHorizontal: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     elevation: 16,
//   },
//   sheetHandle: {
//     alignSelf: 'center',
//     width: 40,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#E0E0E0',
//     marginBottom: 16,
//   },
//   sheetTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#000000',
//     marginBottom: 4,
//   },
//   sheetSubtitle: {
//     fontSize: 13,
//     color: '#999999',
//     marginBottom: 20,
//   },
//   storeList: { paddingBottom: 8 },
//   separator: { height: 1, backgroundColor: '#F3F3F3', marginVertical: 4 },
//   storeItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 4,
//   },
//   storeLogo: {
//     width: 48,
//     height: 48,
//     borderRadius: 10,
//     backgroundColor: '#F0F0F0',
//   },
//   storeInfo: {
//     flex: 1,
//     marginLeft: 14,
//   },
//   storeName: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#111111',
//     marginBottom: 3,
//   },
//   cancelButton: {
//     marginTop: 16,
//     paddingVertical: 14,
//     borderRadius: 10,
//     backgroundColor: '#F5F5F5',
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#444444',
//   },
// });



// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> old code <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'

// const MoreItemModal = ({visible,onRequestClose,sheetTitle,sheetSubtitle}) => {
//   return (
//     <View>
      
//       {/* ── Store Picker Modal ── */}
//             <Modal
//               visible={visible}
//               transparent
//               animationType="slide"
//               onRequestClose={onRequestClose}
//             >
//               {/* Backdrop */}
//               <Pressable
//                 style={styles.backdrop}
//                 onPress={() => setStoreModalVisible(false)}
//               />
      
//               {/* Sheet */}
//               <View style={styles.sheet}>
//                 {/* Handle bar */}
//                 <View style={styles.sheetHandle} />
      
//                 <Text style={styles.sheetTitle}>{sheetTitle}</Text>
//                 <Text style={styles.sheetSubtitle}>
//                     {sheetSubtitle}
//                 </Text>
      
//                 <FlatList
//                   data={stores}
//                   keyExtractor={(item) => item.storeId}
//                   contentContainerStyle={styles.storeList}
//                   ItemSeparatorComponent={() => <View style={styles.separator} />}
//                   renderItem={({ item }) => (
//                     <TouchableOpacity
//                       style={styles.storeItem}
//                       activeOpacity={0.7}
//                       onPress={() => handleSelectStore(item.storeId)}
//                     >
//                       {/* Store Logo */}
//                       <Image
//                         source={{
//                           uri:
//                             item.storeLogo ||
//                             'https://via.placeholder.com/48',
//                         }}
//                         style={styles.storeLogo}
//                       />
      
//                       {/* Store Info */}
//                       <View style={styles.storeInfo}>
//                         <Text style={styles.storeName} numberOfLines={1}>
//                           {item.storeName}
//                         </Text>
//                         {/* <Text style={styles.storeId} numberOfLines={1}>
//                           ID: {item.storeId}
//                         </Text> */}
//                       </View>
      
//                       {/* Chevron */}
//                       <Ionicons
//                         name="chevron-forward"
//                         size={20}
//                         color="#CCCCCC"
//                       />
//                     </TouchableOpacity>
//                   )}
//                 />
      
//                 {/* Cancel */}
//                 <TouchableOpacity
//                   style={styles.cancelButton}
//                   onPress={() => setStoreModalVisible(false)}
//                 >
//                   <Text style={styles.cancelButtonText}>Cancel</Text>
//                 </TouchableOpacity>
//               </View>
//             </Modal>
//     </View>
//   )
// }

// export default MoreItemModal

// const styles = StyleSheet.create({



//     storeList: { paddingBottom: 8 },
//       separator: { height: 1, backgroundColor: '#F3F3F3', marginVertical: 4 },
//       storeItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 12,
//         paddingHorizontal: 4,
//       },
//       storeLogo: {
//         width: 48,
//         height: 48,
//         borderRadius: 10,
//         backgroundColor: '#F0F0F0',
//       },
//       storeInfo: {
//         flex: 1,
//         marginLeft: 14,
//       },
//       storeName: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#111111',
//         marginBottom: 3,
//       },
//       storeId: {
//         fontSize: 12,
//         color: '#AAAAAA',
//       },
    
//       /* Cancel button */
//       cancelButton: {
//         marginTop: 16,
//         paddingVertical: 14,
//         borderRadius: 10,
//         backgroundColor: '#F5F5F5',
//         alignItems: 'center',
//       },
//       cancelButtonText: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#444444',
//       },

// })