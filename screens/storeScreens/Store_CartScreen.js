import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import {
  useAddToCart,
  useRemoveFromCart,
  useGetCart,
} from '../../ReactQuery/TanStackQueryHooks/storee/useCart';
import {OwnerContext} from '../../context/IsOwner';
import {useNavigation} from '@react-navigation/native';

const Store_CartScreen = ({GetStoreById, StoreByIdLoading, StoreByIderror}) => {
  const storeId = GetStoreById?.data?.data?._id;
  const {ownerId} = useContext(OwnerContext);
  const userId = ownerId;
  const navigation = useNavigation();

  // ── Server State ─────────────────────────────────────────────────────
  const {
    data: cartResponse,
    isLoading,
    isFetching,
  } = useGetCart(userId, storeId);
  const cart = cartResponse?.data?.data;
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();

  // ── Local State ──────────────────────────────────────────────────────
  const [quantities, setQuantities] = useState({});
  const [dirtyKeys, setDirtyKeys] = useState(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // ── Refs to hold latest values without re-registering cleanup ────────
  const quantitiesRef = useRef({});
  const dirtyKeysRef = useRef(new Set());
  const cartRef = useRef(null);

  // ── Keep refs in sync with state/data ────────────────────────────────
  useEffect(() => {
    quantitiesRef.current = quantities;
  }, [quantities]);

  useEffect(() => {
    dirtyKeysRef.current = dirtyKeys;
  }, [dirtyKeys]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // ── Key helper ───────────────────────────────────────────────────────
  // const getKey = item =>
  //   `${item.productId}_${item.color ?? 'nocolor'}_${item.size ?? 'nosize'}`;

  const getKey = item => {
  const colorKey = item.color?.color ?? item.color ?? 'nocolor'; // e.g. '#ff0000'
  const sizeKey = item.size ?? 'nosize';
  return `${item.productId}_${colorKey}_${sizeKey}`;
};

  // ── Sync local quantities when cart loads ────────────────────────────
  useEffect(() => {
    if (cart?.items) {
      const initial = {};
      cart.items.forEach(item => {
        initial[getKey(item)] = item.quantity;
      });
      setQuantities(initial);
    }
  }, [cart]);

  // ── + / - handlers (local only, no API) ─────────────────────────────
  const handleIncrease = item => {
    const key = getKey(item);
    setQuantities(prev => ({...prev, [key]: (prev[key] ?? item.quantity) + 1}));
    setDirtyKeys(prev => new Set(prev).add(key));
  };

  const handleDecrease = item => {
    const key = getKey(item);
    const current = quantitiesRef.current[key] ?? item.quantity;
    if (current <= 1) return;
    setQuantities(prev => ({...prev, [key]: current - 1}));
    setDirtyKeys(prev => new Set(prev).add(key));
  };

  // ── Flush dirty items on screen leave — runs ONCE, reads from refs ───
  useFocusEffect(
    useCallback(() => {
      return () => {
        // ✅ Read from refs — no stale closures, no re-registration
        const currentDirtyKeys = dirtyKeysRef.current;
        const currentQuantities = quantitiesRef.current;
        const currentCart = cartRef.current;

        if (currentDirtyKeys.size === 0 || !currentCart?.items) return;

        currentCart.items.forEach(item => {
          const key = getKey(item);
          if (!currentDirtyKeys.has(key)) return;
          addToCart.mutate({
            userId,
            storeId,
            productId: item.productId,
             productName: item.productName,
             productImages: item.productImages?.[item?.color?.index ?? 0],
            quantity: currentQuantities[key],
            color: item.color,
            size: item.size,
            replaceQuantity: true,
          });
        });

        setDirtyKeys(new Set()); // ✅ reset after flush
      };
    }, []), // ✅ empty deps — registers ONCE, never re-registers
  );

  // ── Remove item ──────────────────────────────────────────────────────
  const handleRemove = item => {
    removeFromCart.mutate({
      userId,
      storeId,
      productId: item.productId,
      color: item.color ?? null,
      size: item.size ?? null,
    });
  };

  // ── Coupon ───────────────────────────────────────────────────────────
  const handleApplyCoupon = () => {
    if (couponCode.trim()) setCouponApplied(true);
  };
  const handleClearCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
  };

  // ── FlatList renderItem ──────────────────────────────────────────────
  const renderItem = useCallback(
    ({item}) => {
      const key = getKey(item);
      const qty = quantities[key] ?? item.quantity;
      const hasDiscount = item.productDiscount > 0;

      return (
        <View style={styles.cartItem}>
          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => handleRemove(item)}
            style={styles.removeBtn}>
            <Icon name="close" size={14} color="#888" />
          </TouchableOpacity>

          {/* Product Image */}
          <Image
            // source={{uri: item.productImages?.[0]}}
            source={{uri: item.productImages?.[item?.color?.index ?? 0]}}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.productName}
            </Text>

            {/* Color / Size */}
            {/* {(item.color || item.size) && (
              <Text style={styles.variantText}>
                {item.color ? `Color: ${item.color}` : ''}
                {item.color && item.size ? '  •  ' : ''}
                {item.size ? `Size: ${item.size}` : ''}
              </Text>
            )} */}

            {(item.color || item.size) && (
              <View style={styles.variantRow}>
                {item.color?.color && (
                  <View
                    style={[
                      styles.colorDot,
                      {backgroundColor: item.color.color},
                    ]}
                  />
                )}
                {item.size && (
                  <Text style={styles.variantText}>
                    {item.color?.color ? '  •  ' : ''}
                    {`Size: ${item.size}`}
                  </Text>
                )}
              </View>
            )}

            {/* Price Row */}
            <View style={styles.priceRow}>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  ৳ {item.productPrice.toFixed(0)}
                </Text>
              )}
              <Text style={styles.qtyMultiplier}>× {qty}</Text>
            </View>

            {/* Qty Controls + Final Price */}
            <View style={styles.bottomRow}>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  onPress={() => handleDecrease(item)}
                  style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>

                {isFetching ? (
                  <Text
                    style={[
                      styles.qtyValue,
                      {color: '#bbb', letterSpacing: 2},
                    ]}>
                    {'...'}
                  </Text>
                ) : (
                  <Text style={styles.qtyValue}>{qty}</Text>
                )}

                <TouchableOpacity
                  onPress={() => handleIncrease(item)}
                  style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.finalPrice}>
                ৳ {(item.finalPrice * qty).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [quantities, isFetching],
  );

  // ── FlatList keyExtractor ────────────────────────────────────────────
  const keyExtractor = useCallback(item => getKey(item), []);

  // ── FlatList footer (savings only) ──────────────────────────────────
  const ListFooter = (
    <View>
      {cart?.totalSavings > 0 && (
        <View style={styles.savingsRow}>
          <Icon name="pricetag-outline" size={14} color="#2E7D32" />
          <Text style={styles.savingsText}>
            You save ৳ {cart.totalSavings.toFixed(2)} on this order!
          </Text>
        </View>
      )}
      <View style={{height: 180}} />
    </View>
  );

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{width: 36}} />
      </View>

      {/* FlatList */}
      <FlatList
        data={cart?.items ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom Bar */}
      {cart?.items?.length > 0 && (
        <View style={styles.bottomBar}>
          {/* Coupon Pill — full width on top */}
          <View style={styles.couponPill}>
            <Icon
              name="pricetag-outline"
              size={16}
              color="#888"
              style={{marginRight: 6}}
            />
            <TextInput
              style={styles.couponPillInput}
              placeholder="Enter coupon code..."
              placeholderTextColor="#bbb"
              value={couponCode}
              onChangeText={text => {
                setCouponCode(text);
                if (couponApplied) setCouponApplied(false);
              }}
              autoCapitalize="characters"
            />
            {couponApplied ? (
              <TouchableOpacity onPress={handleClearCoupon}>
                <Icon name="close-circle" size={18} color="#7B5CFA" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleApplyCoupon}>
                <Text style={styles.couponApplyText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Checkout Button — full width below */}
          <TouchableOpacity
            style={styles.checkoutBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Store_CheckoutScreen', {userId,storeId})}>
            <Icon
              name="bag-handle-outline"
              size={20}
              color="#fff"
              style={{marginRight: 8}}
            />
            <Text style={styles.checkoutText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Store_CartScreen;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#f5f5f5'},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    gap: 12,
  },
  loadingText: {fontSize: 14, color: '#888', marginTop: 8},

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },

  listContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },

  // ── Cart Item ──
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 24,
    letterSpacing: -0.2,
  },
  variantText: {fontSize: 11, color: '#888', marginTop: 2},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  qtyMultiplier: {fontSize: 12, color: '#888'},
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  qtyBtnText: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    minWidth: 28,
    textAlign: 'center',
  },
  finalPrice: {fontSize: 16, fontWeight: '800', color: '#7B5CFA'},

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
  shopBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
  },
  shopBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

  // ── Savings ──
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savingsText: {fontSize: 12, color: '#2E7D32', fontWeight: '600'},

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 108 : 106,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },

  // ── Coupon Pill ──
  couponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f7f7f7',
    width: '100%',
    height: 52,
  },
  couponPillInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1,
    paddingVertical: 0,
  },
  couponApplyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7B5CFA',
  },

  // ── Checkout Button ──
  checkoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: '#1a1a1a',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
});

// import React, {useState, useEffect, useCallback, useContext} from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   TextInput,
//   StatusBar,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import {useFocusEffect} from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import {
//   useAddToCart,
//   useRemoveFromCart,
//   useGetCart,
// } from '../../ReactQuery/TanStackQueryHooks/storee/useCart';
// import {OwnerContext} from '../../context/IsOwner';
// import {useNavigation} from '@react-navigation/native'; // ✅ add this import

// const Store_CartScreen = ({
//   // navigation,
//   // route,
//   GetStoreById,
//   StoreByIdLoading,
//   StoreByIderror,
// }) => {
//   const storeId = GetStoreById?.data?.data?._id;
//   const {ownerId} = useContext(OwnerContext);
//   const userId = ownerId;

//   const navigation = useNavigation(); // ✅ get navigation from hook, not prop

//   // ── Server State ─────────────────────────────────────────────────────
//   const {data: cartResponse, isLoading} = useGetCart(userId, storeId);
//   const cart = cartResponse?.data?.data;
//   const addToCart = useAddToCart();
//   const removeFromCart = useRemoveFromCart();

//   // ── Local State ──────────────────────────────────────────────────────
//   const [quantities, setQuantities] = useState({});
//   const [dirtyKeys, setDirtyKeys] = useState(new Set());
//   const [couponCode, setCouponCode] = useState('');
//   const [couponApplied, setCouponApplied] = useState(false);

//   // ── Key helper ───────────────────────────────────────────────────────
//   const getKey = item =>
//     `${item.productId}_${item.color ?? 'nocolor'}_${item.size ?? 'nosize'}`;

//   // ── Sync local quantities when cart loads ────────────────────────────
//   useEffect(() => {
//     if (cart?.items) {
//       const initial = {};
//       cart.items.forEach(item => {
//         initial[getKey(item)] = item.quantity;
//       });
//       setQuantities(initial);
//     }
//   }, [cart]);

//   // ── + / - handlers (local only, no API) ─────────────────────────────
//   const handleIncrease = item => {
//     const key = getKey(item);
//     setQuantities(prev => ({...prev, [key]: (prev[key] ?? item.quantity) + 1}));
//     setDirtyKeys(prev => new Set(prev).add(key));
//   };

//   const handleDecrease = item => {
//     const key = getKey(item);
//     const current = quantities[key] ?? item.quantity;
//     if (current <= 1) return;
//     setQuantities(prev => ({...prev, [key]: current - 1}));
//     setDirtyKeys(prev => new Set(prev).add(key));
//   };

//   // ── Flush dirty items on screen leave ───────────────────────────────
//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         if (dirtyKeys.size === 0 || !cart?.items) return;
//         cart.items.forEach(item => {
//           const key = getKey(item);
//           if (!dirtyKeys.has(key)) return;
//           addToCart.mutate({
//             userId,
//             storeId,
//             productId: item.productId,
//             quantity: quantities[key],
//             color: item.color,
//             size: item.size,
//             replaceQuantity: true,
//           });
//         });
//         setDirtyKeys(new Set());
//       };
//     }, [quantities, dirtyKeys, cart]),
//   );

//   // ── Remove item ──────────────────────────────────────────────────────
//   const handleRemove = item => {
//     removeFromCart.mutate({
//       userId,
//       storeId,
//       productId: item.productId,
//       color: item.color,
//       size: item.size,
//     });
//   };

//   // ── Coupon ───────────────────────────────────────────────────────────
//   const handleApplyCoupon = () => {
//     if (couponCode.trim()) setCouponApplied(true);
//   };
//   const handleClearCoupon = () => {
//     setCouponCode('');
//     setCouponApplied(false);
//   };

//   // ── FlatList renderItem ──────────────────────────────────────────────
//   const renderItem = useCallback(
//     ({item}) => {
//       const key = getKey(item);
//       const qty = quantities[key] ?? item.quantity;
//       const hasDiscount = item.productDiscount > 0;

//       return (
//         <View style={styles.cartItem}>
//           {/* Remove Button */}
//           <TouchableOpacity
//             onPress={() => handleRemove(item)}
//             style={styles.removeBtn}>
//             <Icon name="close" size={14} color="#888" />
//           </TouchableOpacity>

//           {/* Product Image */}
//           <Image
//             source={{uri: item.productImages?.[0]}}
//             style={styles.productImage}
//             resizeMode="cover"
//           />

//           {/* Product Info */}
//           <View style={styles.productInfo}>
//             <Text style={styles.productName} numberOfLines={2}>
//               {item.productName}
//             </Text>

//             {/* Color / Size */}
//             {(item.color || item.size) && (
//               <Text style={styles.variantText}>
//                 {item.color ? `Color: ${item.color}` : ''}
//                 {item.color && item.size ? '  •  ' : ''}
//                 {item.size ? `Size: ${item.size}` : ''}
//               </Text>
//             )}

//             {/* Price Row */}
//             <View style={styles.priceRow}>
//               {hasDiscount && (
//                 <Text style={styles.originalPrice}>
//                   ৳ {item.productPrice.toFixed(0)}
//                 </Text>
//               )}
//               <Text style={styles.qtyMultiplier}>× {qty}</Text>
//             </View>

//             {/* Qty Controls + Final Price */}
//             <View style={styles.bottomRow}>
//               <View style={styles.qtyControl}>
//                 <TouchableOpacity
//                   onPress={() => handleDecrease(item)}
//                   style={styles.qtyBtn}>
//                   <Text style={styles.qtyBtnText}>−</Text>
//                 </TouchableOpacity>
//                 <Text style={styles.qtyValue}>{qty}</Text>
//                 <TouchableOpacity
//                   onPress={() => handleIncrease(item)}
//                   style={styles.qtyBtn}>
//                   <Text style={styles.qtyBtnText}>+</Text>
//                 </TouchableOpacity>
//               </View>
//               <Text style={styles.finalPrice}>
//                 ৳ {(item.finalPrice * qty).toFixed(0)}
//               </Text>
//             </View>
//           </View>
//         </View>
//       );
//     },
//     [quantities],
//   );

//   // ── FlatList keyExtractor ────────────────────────────────────────────
//   const keyExtractor = useCallback(item => getKey(item), []);

//   // ── FlatList footer (savings only) ──────────────────────────────────
//   const ListFooter = (
//     <View>
//       {cart?.totalSavings > 0 && (
//         <View style={styles.savingsRow}>
//           <Icon name="pricetag-outline" size={14} color="#2E7D32" />
//           <Text style={styles.savingsText}>
//             You save ৳ {cart.totalSavings.toFixed(2)} on this order!
//           </Text>
//         </View>
//       )}
//       <View style={{height: 180}} />
//     </View>
//   );

//   // ── Loading ──────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#1a1a1a" />
//         <Text style={styles.loadingText}>Loading cart...</Text>
//       </View>
//     );
//   }

//   // ── Render ───────────────────────────────────────────────────────────
//   return (
//     <View style={styles.safe}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={styles.backBtn}>
//           <Icon name="chevron-back" size={22} color="#1a1a1a" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Cart</Text>
//         <View style={{width: 36}} />
//       </View>

//       {/* FlatList */}
//       <FlatList
//         data={cart?.items ?? []}
//         renderItem={renderItem}
//         keyExtractor={keyExtractor}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         ListFooterComponent={ListFooter}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Icon name="cart-outline" size={64} color="#ccc" />
//             <Text style={styles.emptyText}>Your cart is empty</Text>
//             <TouchableOpacity
//               onPress={() => navigation.goBack()}
//               style={styles.shopBtn}>
//               <Text style={styles.shopBtnText}>Continue Shopping</Text>
//             </TouchableOpacity>
//           </View>
//         }
//       />

//       {/* Bottom Bar */}
//       {cart?.items?.length > 0 && (
//         <View style={styles.bottomBar}>
//           {/* Coupon Pill — full width on top */}
//           <View style={styles.couponPill}>
//             <Icon
//               name="pricetag-outline"
//               size={16}
//               color="#888"
//               style={{marginRight: 6}}
//             />
//             <TextInput
//               style={styles.couponPillInput}
//               placeholder="Enter coupon code..."
//               placeholderTextColor="#bbb"
//               value={couponCode}
//               onChangeText={text => {
//                 setCouponCode(text);
//                 if (couponApplied) setCouponApplied(false);
//               }}
//               autoCapitalize="characters"
//             />
//             {couponApplied ? (
//               <TouchableOpacity onPress={handleClearCoupon}>
//                 <Icon name="close-circle" size={18} color="#7B5CFA" />
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity onPress={handleApplyCoupon}>
//                 <Text style={styles.couponApplyText}>Apply</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Checkout Button — full width below */}
//           <TouchableOpacity
//             style={styles.checkoutBtn}
//             activeOpacity={0.85}
//             onPress={() =>
//               navigation.navigate('Store_CheckoutScreen', {cart})
//             }>
//             <Icon
//               name="bag-handle-outline"
//               size={20}
//               color="#fff"
//               style={{marginRight: 8}}
//             />
//             <Text style={styles.checkoutText}>Check Out</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// export default Store_CartScreen;

// const styles = StyleSheet.create({
//   safe: {flex: 1, backgroundColor: '#f5f5f5'},
//   centered: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f5f5f5',
//     gap: 12,
//   },
//   loadingText: {fontSize: 14, color: '#888', marginTop: 8},

//   // ── Header ──
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'android' ? 12 : 8,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   backBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#f5f5f5',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#1a1a1a',
//     letterSpacing: -0.3,
//   },

//   listContent: {
//     paddingTop: 12,
//     paddingHorizontal: 16,
//   },

//   // ── Cart Item ──
//   cartItem: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 12,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     position: 'relative',
//   },
//   removeBtn: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     backgroundColor: '#f5f5f5',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 1,
//   },
//   productImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     backgroundColor: '#f5f5f5',
//   },
//   productInfo: {
//     flex: 1,
//     marginLeft: 12,
//     justifyContent: 'space-between',
//   },
//   productName: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginRight: 24,
//     letterSpacing: -0.2,
//   },
//   variantText: {fontSize: 11, color: '#888', marginTop: 2},
//   priceRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginTop: 4,
//   },
//   originalPrice: {
//     fontSize: 12,
//     color: '#aaa',
//     textDecorationLine: 'line-through',
//   },
//   qtyMultiplier: {fontSize: 12, color: '#888'},
//   bottomRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginTop: 6,
//   },
//   qtyControl: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#e8e8e8',
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   qtyBtn: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f5f5f5',
//   },
//   qtyBtnText: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
//   qtyValue: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#1a1a1a',
//     minWidth: 28,
//     textAlign: 'center',
//   },
//   finalPrice: {fontSize: 16, fontWeight: '800', color: '#7B5CFA'},

//   // ── Empty ──
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: 80,
//     gap: 12,
//   },
//   emptyText: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
//   shopBtn: {
//     marginTop: 8,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     backgroundColor: '#1a1a1a',
//     borderRadius: 14,
//   },
//   shopBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

//   // ── Savings ──
//   savingsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginTop: 10,
//     backgroundColor: '#E8F5E9',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   savingsText: {fontSize: 12, color: '#2E7D32', fontWeight: '600'},

//   // ── Bottom Bar ──
//   bottomBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     flexDirection: 'column', // ✅ vertical stack
//     gap: 10,
//     paddingHorizontal: 20,
//     paddingTop: 14,
//     paddingBottom: Platform.OS === 'ios' ? 108 : 106,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -4},
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 10,
//   },

//   // ── Coupon Pill ──
//   couponPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: '#e8e8e8',
//     borderRadius: 18,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     backgroundColor: '#f7f7f7',
//     width: '100%',
//     height: 52,
//   },
//   couponPillInput: {
//     flex: 1,
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     letterSpacing: 1,
//     paddingVertical: 0,
//   },
//   couponApplyText: {
//     fontSize: 12,
//     fontWeight: '800',
//     color: '#7B5CFA',
//   },

//   // ── Checkout Button ──
//   checkoutBtn: {
//     width: '100%',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#1a1a1a',
//     borderRadius: 20,
//     paddingVertical: 16,
//     shadowColor: '#1a1a1a',
//     shadowOffset: {width: 0, height: 6},
//     shadowOpacity: 0.35,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   checkoutText: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#fff',
//     letterSpacing: 0.5,
//   },
// });
