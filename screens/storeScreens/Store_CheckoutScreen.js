import React, {useState, useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useCreateOrder} from '../../ReactQuery/TanStackQueryHooks/storee/useOrder';
import {
  useGetCart,
  useClearCart,
} from '../../ReactQuery/TanStackQueryHooks/storee/useCart'; // ← import your hook
import {OwnerContext} from '../../context/IsOwner';

const PAYMENT_OPTIONS = [
  {
    id: 'easypaisa',
    label: 'EasyPaisa',
    subtitle: 'Instant mobile wallet transfer',
    icon: 'wallet-outline',
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    subtitle: 'Secure mobile payment',
    icon: 'card-outline',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    subtitle: 'Processing takes 24–48 hours',
    icon: 'business-outline',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    subtitle: 'Pay when you receive items',
    icon: 'car-outline',
  },
];

const Store_CheckoutScreen = ({navigation, route}) => {
  console.log('🟡 CheckoutScreen mounted'); // ← ADD THIS AS VERY FIRST LINE
  const {storeId, userId} = route.params; // ← only storeId, no cart snapshot
  const {ownerId} = useContext(OwnerContext);
  const {mutate: clearCart} = useClearCart();

  // ── Fresh cart from server ───────────────────────────────────────────
  const {data: cartResponse, isFetching: cartLoading} = useGetCart(
    userId,
    storeId,
  );
  const cart = cartResponse?.data?.data;
  console.log('Fetched cart in checkout:', cart);

  // ── Form State ───────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCountry, setCustomerCountry] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('easypaisa');

  const {mutate: placeOrder, isPending} = useCreateOrder();

  // ── Order Summary Calculations ───────────────────────────────────────
  const subtotal = cart?.total ?? 0;
  const shippingFee = 0;
  const taxes = 0;
  const totalAmount = subtotal + shippingFee + taxes;

  // ── Place Order Handler ──────────────────────────────────────────────
  const handlePlaceOrder = () => {
    if (!customerName.trim())
      return Alert.alert('Missing Field', 'Please enter your full name');
    if (!customerEmail.trim())
      return Alert.alert('Missing Field', 'Please enter your email address');
    if (!customerPhone.trim())
      return Alert.alert('Missing Field', 'Please enter your phone number');
    if (!customerAddress.trim())
      return Alert.alert('Missing Field', 'Please enter your shipping address');
    if (!customerCountry.trim())
      return Alert.alert('Missing Field', 'Please enter your country');
    if (!customerCity.trim())
      return Alert.alert('Missing Field', 'Please enter your city');
    if (!customerPostalCode.trim())
      return Alert.alert('Missing Field', 'Please enter your postal code');

    const items = cart?.items?.map(item => ({
      productId: item.productId,
      quantity: item.quantity,

      productImages: item.productImages?.[item?.color?.index ?? 0],
      productName: item.productName,
      ...(item.color ? {color: item.color?.color} : {}),
      ...(item.size ? {size: item.size} : {}),
    }));

    const payload = {
      storeId,
      items,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerCountry: customerCountry.trim(),
      customerCity: customerCity.trim(),
      customerPostalCode: customerPostalCode.trim(),
      paymentMethod: selectedPayment,
    };

    placeOrder(payload, {
      onSuccess: () => {
        navigation.navigate('Store_OrderSuccessScreen');
        clearCart({userId, storeId});
      },
      onError: error =>
        Alert.alert(
          'Order Failed',
          error?.response?.data?.message ?? 'Something went wrong',
        ),
    });
  };

  // ── Order Summary Section ────────────────────────────────────────────
  const renderOrderSummary = () => {
    if (cartLoading) {
      return (
        <View style={styles.summaryCard}>
          {/* Skeleton rows */}
          {['Subtotal', 'Shipping Fee', 'Taxes (GST)'].map(label => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <View style={styles.skeletonValue} />
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <View style={styles.skeletonTotal} />
          </View>
          {/* Spinner in center */}
          <View style={styles.summaryLoadingRow}>
            <ActivityIndicator size="small" color="#888" />
            <Text style={styles.summaryLoadingText}>
              Fetching latest prices...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            Rs {subtotal.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping Fee</Text>
          <Text style={styles.summaryValue}>
            {shippingFee === 0 ? 'Free' : `Rs ${shippingFee}`}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Taxes (GST)</Text>
          <Text style={styles.summaryValue}>
            {taxes === 0 ? 'Rs 0' : `Rs ${taxes}`}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            Rs {totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerLock}>
          <Icon name="lock-closed" size={18} color="#7dfe3d" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Step Indicator */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepTitle}>Checkout</Text>
            <Text style={styles.stepPercent}>66% Complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Shipping Details */}
        <Text style={styles.sectionTitle}>Shipping Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#bbb"
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#bbb"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Shipping Address</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Enter address"
            placeholderTextColor="#bbb"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Country</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pakistan"
            placeholderTextColor="#bbb"
            value={customerCountry}
            onChangeText={setCustomerCountry}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lahore"
            placeholderTextColor="#bbb"
            value={customerCity}
            onChangeText={setCustomerCity}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Postal Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 54000"
            placeholderTextColor="#bbb"
            value={customerPostalCode}
            onChangeText={setCustomerPostalCode}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+92 300 1234567"
            placeholderTextColor="#bbb"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.paymentOption,
              selectedPayment === option.id && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment(option.id)}
            activeOpacity={0.8}>
            <View
              style={[
                styles.radio,
                selectedPayment === option.id && styles.radioSelected,
              ]}>
              {selectedPayment === option.id && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <Text
                style={[
                  styles.paymentLabel,
                  selectedPayment === option.id && styles.paymentLabelSelected,
                ]}>
                {option.label}
              </Text>
              <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
            </View>
            <Icon
              name={option.icon}
              size={22}
              color={selectedPayment === option.id ? '#49f32f' : '#ccc'}
            />
          </TouchableOpacity>
        ))}

        {/* ── Order Summary ── */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {renderOrderSummary()}

        {/* SSL Badge */}
        <View style={styles.sslRow}>
          <Icon name="shield-checkmark-outline" size={14} color="#888" />
          <Text style={styles.sslText}>SSL SECURED & ENCRYPTED</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            (isPending || cartLoading) && {opacity: 0.7},
          ]}
          onPress={handlePlaceOrder}
          disabled={isPending || cartLoading} // ← also disable while cart is loading
          activeOpacity={0.85}>
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Icon
                name="arrow-forward"
                size={20}
                color="#fff"
                style={{marginLeft: 8}}
              />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By placing an order, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
};

export default Store_CheckoutScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 37 : 12,
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
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a1a1a'},
  headerLock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {paddingHorizontal: 16, paddingTop: 16},
  stepContainer: {marginBottom: 24},
  stepLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  stepTitle: {fontSize: 22, fontWeight: '900', color: '#1a1a1a'},
  stepPercent: {fontSize: 13, fontWeight: '700', color: '#36e350'},
  progressBarBg: {height: 6, backgroundColor: '#eee', borderRadius: 4},
  progressBarFill: {
    width: '66%',
    height: 6,
    backgroundColor: '#2bea25',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 14,
    marginTop: 8,
  },
  inputGroup: {marginBottom: 14},
  inputLabel: {fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 6},
  input: {
    borderWidth: 1.5,
    borderColor: '#ebebeb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputMultiline: {height: 80, paddingTop: 12},
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#ebebeb',
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  paymentOptionSelected: {borderColor: '#35f44f', backgroundColor: '#f1ffee'},
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {borderColor: '#000000', backgroundColor: '#70e639'},
  radioInner: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff'},
  paymentInfo: {flex: 1},
  paymentLabel: {fontSize: 14, fontWeight: '700', color: '#1a1a1a'},
  paymentLabelSelected: {color: '#000000'},
  paymentSubtitle: {fontSize: 12, color: '#888', marginTop: 2},

  // ── Summary ──
  summaryCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {fontSize: 13, color: '#666'},
  summaryValue: {fontSize: 13, fontWeight: '700', color: '#1a1a1a'},
  divider: {height: 1, backgroundColor: '#e0e0e0', marginVertical: 10},
  totalLabel: {fontSize: 15, fontWeight: '800', color: '#1a1a1a'},
  totalValue: {fontSize: 18, fontWeight: '900', color: '#000000'},

  // ── Skeleton ──
  skeletonValue: {
    width: 70,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  skeletonTotal: {
    width: 90,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  summaryLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  summaryLoadingText: {fontSize: 12, color: '#888'},

  // ── SSL ──
  sslRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sslText: {fontSize: 11, color: '#aaa', fontWeight: '600', letterSpacing: 0.8},

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  placeOrderText: {fontSize: 16, fontWeight: '800', color: '#fff'},
  termsText: {textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 8},
  termsLink: {color: '#000000', fontWeight: '600'},
});

// import React, {useState, useContext} from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import {useCreateOrder} from '../../ReactQuery/TanStackQueryHooks/storee/useOrder';
// import {OwnerContext} from '../../context/IsOwner';

// // ── Payment Options ──────────────────────────────────────────────────────────
// const PAYMENT_OPTIONS = [
//   {
//     id: 'easypaisa',
//     label: 'EasyPaisa',
//     subtitle: 'Instant mobile wallet transfer',
//     icon: 'wallet-outline',
//   },
//   {
//     id: 'jazzcash',
//     label: 'JazzCash',
//     subtitle: 'Secure mobile payment',
//     icon: 'card-outline',
//   },
//   {
//     id: 'bank_transfer',
//     label: 'Bank Transfer',
//     subtitle: 'Processing takes 24–48 hours',
//     icon: 'business-outline',
//   },
//   {
//     id: 'cod',
//     label: 'Cash on Delivery',
//     subtitle: 'Pay when you receive items',
//     icon: 'car-outline',
//   },
// ];

// const Store_CheckoutScreen = ({navigation, route}) => {
//   // const {cart} = route.params;
//   // const storeId = route.params.storeId
//   const { cart, storeId } = route.params
//   const {ownerId} = useContext(OwnerContext);

//   console.log('cart in checkout', cart);

//   console.log('storeId in checkout', storeId);
//   console.log('userId in checkout', ownerId);
//   console.log('cart items in checkout', cart?.items);
//   console.log('cart.products:', cart?.products)  // should show array
//   console.log('first item:', cart?.items?.[0])
//   console.log('first product:', cart?.total)
//   // ── Form State ───────────────────────────────────────────────────────────
//   const [customerName, setCustomerName] = useState('');
//   const [customerEmail, setCustomerEmail] = useState('');
//   const [customerPhone, setCustomerPhone] = useState('');
//   const [customerAddress, setCustomerAddress] = useState('');
//   const [customerCountry, setCustomerCountry] = useState('');
//   const [customerCity, setCustomerCity] = useState('');
//   const [customerPostalCode, setCustomerPostalCode] = useState('');
//   const [selectedPayment, setSelectedPayment] = useState('easypaisa');

//   const {mutate: placeOrder, isPending} = useCreateOrder();

//   // ── Order Summary Calculations ───────────────────────────────────────────
//   const subtotal = cart?.total ?? 0;
//   const shippingFee = 0;
//   const taxes = 0;
//   const totalAmount = subtotal + shippingFee + taxes;

//   // ── Place Order Handler ──────────────────────────────────────────────────
//   const handlePlaceOrder = () => {
//     if (!customerName.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your full name');
//     }
//     if (!customerEmail.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your email address');
//     }
//     if (!customerPhone.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your phone number');
//     }
//     if (!customerAddress.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your shipping address');
//     }
//     if (!customerCountry.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your country');
//     }
//     if (!customerCity.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your city');
//     }
//     if (!customerPostalCode.trim()) {
//       return Alert.alert('Missing Field', 'Please enter your postal code');
//     }

//     // Build items array — only what backend schema needs
//     const items = cart?.items?.map(item => ({
//       productId: item.productId,
//       quantity: item.quantity,
//       ...(item.color ? {color: item.color} : {}),
//       ...(item.size ? {size: item.size} : {}),
//     }));

//     const payload = {
//       storeId: storeId,
//       items,
//       customerName: customerName.trim(),
//       customerEmail: customerEmail.trim(),
//       customerPhone: customerPhone.trim(),
//       customerAddress: customerAddress.trim(),
//       customerCountry: customerCountry.trim(),
//       customerCity: customerCity.trim(),
//       customerPostalCode: customerPostalCode.trim(),
//       paymentMethod: selectedPayment,
//     };

//     console.log('📦 Order Payload:', payload);

//     placeOrder(payload, {
//       onSuccess: data => {
//         console.log('✅ Order placed successfully:', data);
//         navigation.navigate('Store_OrderSuccessScreen');
//       },
//       onError: error => {
//         console.log('❌ Order failed:', error);
//         Alert.alert(
//           'Order Failed',
//           error?.response?.data?.message ?? 'Something went wrong',
//         );
//       },
//     });
//   };

//   // ── Render ───────────────────────────────────────────────────────────────
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={styles.backBtn}>
//           <Icon name="chevron-back" size={22} color="#1a1a1a" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Checkout</Text>
//         <View style={styles.headerLock}>
//           <Icon name="lock-closed" size={18} color="#7dfe3d" />
//         </View>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}>
//         {/* ── Step Indicator ── */}
//         <View style={styles.stepContainer}>
//           <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
//           <View style={styles.stepRow}>
//             <Text style={styles.stepTitle}>Checkout</Text>
//             <Text style={styles.stepPercent}>66% Complete</Text>
//           </View>
//           <View style={styles.progressBarBg}>
//             <View style={styles.progressBarFill} />
//           </View>
//         </View>

//         {/* ── Shipping Details ── */}
//         <Text style={styles.sectionTitle}>Shipping Details</Text>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Full Name</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter your full name"
//             placeholderTextColor="#bbb"
//             value={customerName}
//             onChangeText={setCustomerName}
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Email Address</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="name@example.com"
//             placeholderTextColor="#bbb"
//             value={customerEmail}
//             onChangeText={setCustomerEmail}
//             keyboardType="email-address"
//             autoCapitalize="none"
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Shipping Address</Text>
//           <TextInput
//             style={[styles.input, styles.inputMultiline]}
//             placeholder="Enter address"
//             placeholderTextColor="#bbb"
//             value={customerAddress}
//             onChangeText={setCustomerAddress}
//             multiline
//             numberOfLines={3}
//             textAlignVertical="top"
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Country</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g. Pakistan"
//             placeholderTextColor="#bbb"
//             value={customerCountry}
//             onChangeText={setCustomerCountry}
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>City</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g. Lahore"
//             placeholderTextColor="#bbb"
//             value={customerCity}
//             onChangeText={setCustomerCity}
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Postal Code</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g. 54000"
//             placeholderTextColor="#bbb"
//             value={customerPostalCode}
//             onChangeText={setCustomerPostalCode}
//             keyboardType="numeric"
//           />
//         </View>

//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Phone Number</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="+92 300 1234567"
//             placeholderTextColor="#bbb"
//             value={customerPhone}
//             onChangeText={setCustomerPhone}
//             keyboardType="phone-pad"
//           />
//         </View>

//         {/* ── Payment Method ── */}
//         <Text style={styles.sectionTitle}>Payment Method</Text>

//         {PAYMENT_OPTIONS.map(option => (
//           <TouchableOpacity
//             key={option.id}
//             style={[
//               styles.paymentOption,
//               selectedPayment === option.id && styles.paymentOptionSelected,
//             ]}
//             onPress={() => setSelectedPayment(option.id)}
//             activeOpacity={0.8}>
//             {/* Radio */}
//             <View
//               style={[
//                 styles.radio,
//                 selectedPayment === option.id && styles.radioSelected,
//               ]}>
//               {selectedPayment === option.id && (
//                 <View style={styles.radioInner} />
//               )}
//             </View>

//             {/* Label */}
//             <View style={styles.paymentInfo}>
//               <Text
//                 style={[
//                   styles.paymentLabel,
//                   selectedPayment === option.id && styles.paymentLabelSelected,
//                 ]}>
//                 {option.label}
//               </Text>
//               <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
//             </View>

//             {/* Icon */}
//             <Icon
//               name={option.icon}
//               size={22}
//               color={selectedPayment === option.id ? '#49f32f' : '#ccc'}
//             />
//           </TouchableOpacity>
//         ))}

//         {/* ── SSL Badge ── */}
//         <View style={styles.sslRow}>
//           <Icon name="shield-checkmark-outline" size={14} color="#888" />
//           <Text style={styles.sslText}>SSL SECURED & ENCRYPTED</Text>
//         </View>

//         <View style={{height: 120}} />
//       </ScrollView>

//       {/* ── Place Order Button ── */}
//       <View style={styles.bottomBar}>
//         <TouchableOpacity
//           style={[styles.placeOrderBtn, isPending && {opacity: 0.7}]}
//           onPress={handlePlaceOrder}
//           disabled={isPending}
//           activeOpacity={0.85}>
//           {isPending ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <>
//               <Text style={styles.placeOrderText}>Place Order</Text>
//               <Icon
//                 name="arrow-forward"
//                 size={20}
//                 color="#fff"
//                 style={{marginLeft: 8}}
//               />
//             </>
//           )}
//         </TouchableOpacity>
//         <Text style={styles.termsText}>
//           By placing an order, you agree to our{' '}
//           <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
//           <Text style={styles.termsLink}>Privacy Policy</Text>.
//         </Text>
//       </View>
//     </View>
//   );
// };

// export default Store_CheckoutScreen;

// const styles = StyleSheet.create({
//   container: {flex: 1, backgroundColor: '#fff'},

//   // ── Header ──
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'android' ? 37 : 12,
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
//   headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a1a1a'},
//   headerLock: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#EEF1FF',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   scrollContent: {paddingHorizontal: 16, paddingTop: 16},

//   // ── Step ──
//   stepContainer: {marginBottom: 24},
//   stepLabel: {
//     fontSize: 11,
//     color: '#888',
//     fontWeight: '600',
//     letterSpacing: 0.5,
//   },
//   stepRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 4,
//     marginBottom: 8,
//   },
//   stepTitle: {fontSize: 22, fontWeight: '900', color: '#1a1a1a'},
//   stepPercent: {fontSize: 13, fontWeight: '700', color: '#36e350'},
//   progressBarBg: {height: 6, backgroundColor: '#eee', borderRadius: 4},
//   progressBarFill: {
//     width: '66%',
//     height: 6,
//     backgroundColor: '#2bea25',
//     borderRadius: 4,
//   },

//   // ── Section Title ──
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#1a1a1a',
//     marginBottom: 14,
//     marginTop: 8,
//   },

//   // ── Inputs ──
//   inputGroup: {marginBottom: 14},
//   inputLabel: {fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 6},
//   input: {
//     borderWidth: 1.5,
//     borderColor: '#ebebeb',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//     color: '#1a1a1a',
//     backgroundColor: '#fafafa',
//   },
//   inputMultiline: {height: 80, paddingTop: 12},

//   // ── Payment ──
//   paymentOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 14,
//     borderWidth: 1.5,
//     borderColor: '#ebebeb',
//     borderRadius: 14,
//     marginBottom: 10,
//     backgroundColor: '#fafafa',
//   },
//   paymentOptionSelected: {
//     borderColor: '#35f44f',
//     backgroundColor: '#f1ffee',
//   },
//   radio: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     borderWidth: 2,
//     borderColor: '#ccc',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   radioSelected: {borderColor: '#000000', backgroundColor: '#70e639'},
//   radioInner: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff'},
//   paymentInfo: {flex: 1},
//   paymentLabel: {fontSize: 14, fontWeight: '700', color: '#1a1a1a'},
//   paymentLabelSelected: {color: '#000000'},
//   paymentSubtitle: {fontSize: 12, color: '#888', marginTop: 2},

//   // ── Summary ──
//   summaryCard: {
//     backgroundColor: '#f7f7f7',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   summaryLabel: {fontSize: 13, color: '#666'},
//   summaryValue: {fontSize: 13, fontWeight: '700', color: '#1a1a1a'},
//   divider: {height: 1, backgroundColor: '#e0e0e0', marginVertical: 10},
//   totalLabel: {fontSize: 15, fontWeight: '800', color: '#1a1a1a'},
//   totalValue: {fontSize: 18, fontWeight: '900', color: '#000000'},

//   // ── SSL ──
//   sslRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 6,
//     marginBottom: 8,
//   },
//   sslText: {fontSize: 11, color: '#aaa', fontWeight: '600', letterSpacing: 0.8},

//   // ── Bottom Bar ──
//   bottomBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: Platform.OS === 'ios' ? 32 : 16,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//   },
//   placeOrderBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#000000',
//     paddingVertical: 16,
//     borderRadius: 16,
//     shadowColor: '#000000',
//     shadowOffset: {width: 0, height: 6},
//     shadowOpacity: 0.35,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   placeOrderText: {fontSize: 16, fontWeight: '800', color: '#fff'},
//   termsText: {textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 8},
//   termsLink: {color: '#000000', fontWeight: '600'},
// });
