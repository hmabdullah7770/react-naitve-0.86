import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useStep } from './context/StoreSetupContext'; // ✅ import from context file, not navigator

const CATEGORIES = [
  'Fashion', 'Electronics', 'Home & Garden', 'Sports',
  'Beauty', 'Books', 'Toys', 'Food', 'Other',
];

const initialProduct = () => ({ image: null, name: '', price: '', category: '' });

const IntroProduct = ({ navigation }) => {
  const { setCurrentStep } = useStep(); // ← tell the bar we're on step 3
  const [products, setProducts] = useState([
    initialProduct(), initialProduct(), initialProduct(), initialProduct(),
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeIndex, setActiveIndex]   = useState(null);

  // ── Register this screen's step the moment it mounts ──────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCurrentStep(3);
    });
    return unsubscribe;
  }, [navigation]);

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handlePickImage = async (index) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (!result.didCancel && result.assets?.length) {
      updateProduct(index, 'image', result.assets[0].uri);
    }
  };

  const handleRemoveImage = (index) => updateProduct(index, 'image', null);

  const openCategoryModal = (index) => { setActiveIndex(index); setModalVisible(true);  };
  const selectCategory    = (cat)   => {
    if (activeIndex !== null) updateProduct(activeIndex, 'category', cat);
    setModalVisible(false);
    setActiveIndex(null);
  };

  const hasAnyProduct = products.some((p) => p.name || p.image);
  const handleContinue = () => navigation.navigate('NextScreen'); // adjust
  const handleSkip     = () => navigation.navigate('NextScreen'); // adjust

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      {/* No progress bar here — it lives persistently above the navigator */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ──────────────────────────────────────────────────── */}
        <Text style={styles.title}>Initial Products</Text>
        <Text style={styles.subtitle}>
          Add up to 4 products to get your store started. Just upload a photo,
          set a price, and choose a category.
        </Text>

        {/* ── 2 × 2 Product Grid ─────────────────────────────────────── */}
        <View style={styles.grid}>
          {products.map((product, index) => {
            const hasBlueTint = index === 0;
            return (
              <View key={index} style={styles.productCard}>
                {/* Image tile */}
                <TouchableOpacity
                  style={[
                    styles.imageTile,
                    hasBlueTint && !product.image ? styles.imageTileActive : styles.imageTileInactive,
                    product.image && styles.imageTileFilled,
                  ]}
                  onPress={() => handlePickImage(index)}
                  activeOpacity={0.8}
                >
                  {product.image ? (
                    <>
                      <Image source={{ uri: product.image }} style={styles.productImage} />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(index)}>
                        <Icon name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={[styles.plusCircle, hasBlueTint ? styles.plusCircleActive : styles.plusCircleInactive]}>
                      <Icon name="add" size={22} color={hasBlueTint ? '#2563EB' : '#9CA3AF'} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Product Name */}
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Product Name"
                    placeholderTextColor="#9CA3AF"
                    value={product.name}
                    onChangeText={(v) => updateProduct(index, 'name', v)}
                  />
                </View>

                {/* Price + Category row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputBox, styles.priceBox]}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={[styles.textInput, styles.priceInput]}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={product.price}
                      onChangeText={(v) => updateProduct(index, 'price', v)}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.inputBox, styles.categoryBox]}
                    onPress={() => openCategoryModal(index)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.categoryText, !product.category && styles.categoryPlaceholder]}
                      numberOfLines={1}
                    >
                      {product.category
                        ? product.category.substring(0, 5) + (product.category.length > 5 ? '…' : '')
                        : 'Cate…'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {hasAnyProduct ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueText}>Continue</Text>
              <Icon name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category Modal ───────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectCategory(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {activeIndex !== null && products[activeIndex]?.category === item && (
                    <Icon name="check" size={18} color="#2563EB" />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default IntroProduct;

const CARD_GAP = 12;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: { width: 36 },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 16,
  },

  // ── Title
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 24,
  },

  // ── Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  productCard: {
    width: '48%',
    gap: 8,
  },

  // ── Image tile
  imageTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageTileActive:   { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  imageTileInactive: { borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
  imageTileFilled:   { borderStyle: 'solid', borderColor: '#2563EB', borderWidth: 2 },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircleActive:   { backgroundColor: '#DBEAFE' },
  plusCircleInactive: { backgroundColor: '#E5E7EB' },

  // ── Shared input box
  inputBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 13,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 6,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  currencySymbol: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 2,
  },
  priceInput: { flex: 1 },
  categoryBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText:        { fontSize: 13, color: '#111827', flex: 1 },
  categoryPlaceholder: { color: '#9CA3AF' },

  // ── Footer
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: 50,
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 'auto',
  },

  // ── Category Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 15,
    color: '#374151',
  },
  modalClose: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});

// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   SafeAreaView,
//   ScrollView,
//   Image,
//   TextInput,
//   Modal,
//   FlatList,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { launchImageLibrary } from 'react-native-image-picker';

// const TOTAL_STEPS = 5;
// const CURRENT_STEP = 3;
// const PROGRESS_PERCENT = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100); // 60

// const CATEGORIES = [
//   'Fashion',
//   'Electronics',
//   'Home & Garden',
//   'Sports',
//   'Beauty',
//   'Books',
//   'Toys',
//   'Food',
//   'Other',
// ];

// const initialProduct = () => ({
//   image: null,
//   name: '',
//   price: '',
//   category: '',
// });

// const IntroProduct = ({ navigation }) => {
//   const [products, setProducts] = useState([
//     initialProduct(),
//     initialProduct(),
//     initialProduct(),
//     initialProduct(),
//   ]);

//   // Category modal state
//   const [modalVisible, setModalVisible] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(null);

//   const updateProduct = (index, field, value) => {
//     const updated = [...products];
//     updated[index] = { ...updated[index], [field]: value };
//     setProducts(updated);
//   };

//   const handlePickImage = async (index) => {
//     const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
//     if (!result.didCancel && result.assets?.length) {
//       updateProduct(index, 'image', result.assets[0].uri);
//     }
//   };

//   const handleRemoveImage = (index) => updateProduct(index, 'image', null);

//   const openCategoryModal = (index) => {
//     setActiveIndex(index);
//     setModalVisible(true);
//   };

//   const selectCategory = (category) => {
//     if (activeIndex !== null) updateProduct(activeIndex, 'category', category);
//     setModalVisible(false);
//     setActiveIndex(null);
//   };

//   const hasAnyProduct = products.some((p) => p.name || p.image);

//   const handleContinue = () => navigation.navigate('NextScreen'); // adjust
//   const handleSkip = () => navigation.navigate('NextScreen');     // adjust

//   return (
//     <SafeAreaView style={styles.safeArea}>

//       {/* ── Header ──────────────────────────────────── */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Icon name="chevron-left" size={28} color="#2563EB" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Store Setup</Text>
//         <View style={styles.headerSpacer} />
//       </View>

//       {/* ── Progress ────────────────────────────────── */}
//       <View style={styles.progressWrapper}>
//         <View style={styles.progressLabels}>
//           <Text style={styles.stepLabel}>STEP {CURRENT_STEP} OF {TOTAL_STEPS}</Text>
//           <Text style={styles.stepLabel}>{PROGRESS_PERCENT}% COMPLETE</Text>
//         </View>
//         <View style={styles.progressTrack}>
//           <View style={[styles.progressFill, { width: `${PROGRESS_PERCENT}%` }]} />
//         </View>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Title ───────────────────────────────────── */}
//         <Text style={styles.title}>Initial Products</Text>
//         <Text style={styles.subtitle}>
//           Add up to 4 products to get your store started. Just upload a photo,
//           set a price, and choose a category.
//         </Text>

//         {/* ── 2 × 2 Product Grid ──────────────────────── */}
//         <View style={styles.grid}>
//           {products.map((product, index) => {
//             const isActive = index === 0 && !product.image; // first slot blue tint when empty
//             const hasBlueTint = index === 0;

//             return (
//               <View key={index} style={styles.productCard}>

//                 {/* Image tile */}
//                 <TouchableOpacity
//                   style={[
//                     styles.imageTile,
//                     hasBlueTint && !product.image
//                       ? styles.imageTileActive
//                       : styles.imageTileInactive,
//                     product.image && styles.imageTileFilled,
//                   ]}
//                   onPress={() => handlePickImage(index)}
//                   activeOpacity={0.8}
//                 >
//                   {product.image ? (
//                     <>
//                       <Image source={{ uri: product.image }} style={styles.productImage} />
//                       <TouchableOpacity
//                         style={styles.removeBtn}
//                         onPress={() => handleRemoveImage(index)}
//                       >
//                         <Icon name="close" size={14} color="#fff" />
//                       </TouchableOpacity>
//                     </>
//                   ) : (
//                     <View
//                       style={[
//                         styles.plusCircle,
//                         hasBlueTint ? styles.plusCircleActive : styles.plusCircleInactive,
//                       ]}
//                     >
//                       <Icon
//                         name="add"
//                         size={22}
//                         color={hasBlueTint ? '#2563EB' : '#9CA3AF'}
//                       />
//                     </View>
//                   )}
//                 </TouchableOpacity>

//                 {/* Product Name */}
//                 <View style={styles.inputBox}>
//                   <TextInput
//                     style={styles.textInput}
//                     placeholder="Product Name"
//                     placeholderTextColor="#9CA3AF"
//                     value={product.name}
//                     onChangeText={(v) => updateProduct(index, 'name', v)}
//                   />
//                 </View>

//                 {/* Price + Category row */}
//                 <View style={styles.rowInputs}>
//                   {/* Price */}
//                   <View style={[styles.inputBox, styles.priceBox]}>
//                     <Text style={styles.currencySymbol}>$</Text>
//                     <TextInput
//                       style={[styles.textInput, styles.priceInput]}
//                       placeholder="0.00"
//                       placeholderTextColor="#9CA3AF"
//                       keyboardType="decimal-pad"
//                       value={product.price}
//                       onChangeText={(v) => updateProduct(index, 'price', v)}
//                     />
//                   </View>

//                   {/* Category picker */}
//                   <TouchableOpacity
//                     style={[styles.inputBox, styles.categoryBox]}
//                     onPress={() => openCategoryModal(index)}
//                     activeOpacity={0.8}
//                   >
//                     <Text
//                       style={[
//                         styles.categoryText,
//                         !product.category && styles.categoryPlaceholder,
//                       ]}
//                       numberOfLines={1}
//                     >
//                       {product.category ? product.category.substring(0, 5) + (product.category.length > 5 ? '…' : '') : 'Cate…'}
//                     </Text>
//                     <Icon name="keyboard-arrow-down" size={16} color="#6B7280" />
//                   </TouchableOpacity>
//                 </View>

//               </View>
//             );
//           })}
//         </View>
//       </ScrollView>

//       {/* ── Footer ──────────────────────────────────── */}
//       <View style={styles.footer}>
//         <View style={styles.footerInner}>
//           {hasAnyProduct ? (
//             <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
//               <Text style={styles.continueText}>Continue</Text>
//               <Icon name="arrow-forward" size={18} color="#fff" />
//             </TouchableOpacity>
//           ) : (
//             <View />
//           )}
//           <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//             <Text style={styles.skipText}>Skip</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* ── Category Modal ───────────────────────────── */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <TouchableOpacity
//           style={styles.modalOverlay}
//           activeOpacity={1}
//           onPress={() => setModalVisible(false)}
//         >
//           <View style={styles.modalSheet}>
//             <View style={styles.modalHandle} />
//             <Text style={styles.modalTitle}>Select Category</Text>
//             <FlatList
//               data={CATEGORIES}
//               keyExtractor={(item) => item}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.modalItem}
//                   onPress={() => selectCategory(item)}
//                 >
//                   <Text style={styles.modalItemText}>{item}</Text>
//                   {activeIndex !== null &&
//                     products[activeIndex]?.category === item && (
//                       <Icon name="check" size={18} color="#2563EB" />
//                     )}
//                 </TouchableOpacity>
//               )}
//             />
//             <TouchableOpacity
//               style={styles.modalClose}
//               onPress={() => setModalVisible(false)}
//             >
//               <Text style={styles.modalCloseText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default IntroProduct;

// const CARD_GAP = 12;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },

//   // ── Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 4,
//   },
//   backButton: {
//     width: 36,
//     justifyContent: 'center',
//     alignItems: 'flex-start',
//   },
//   headerTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#111827',
//   },
//   headerSpacer: { width: 36 },

//   // ── Progress
//   progressWrapper: {
//     paddingHorizontal: 16,
//     paddingBottom: 8,
//   },
//   progressLabels: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   stepLabel: {
//     fontSize: 11,
//     fontWeight: '600',
//     letterSpacing: 0.8,
//     color: '#6B7280',
//   },
//   progressTrack: {
//     height: 5,
//     borderRadius: 99,
//     backgroundColor: '#E5E7EB',
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 99,
//     backgroundColor: '#2563EB',
//   },

//   // ── Scroll
//   scroll: { flex: 1 },
//   scrollContent: {
//     paddingHorizontal: 16,
//     paddingTop: 22,
//     paddingBottom: 16,
//   },

//   // ── Title
//   title: {
//     fontSize: 26,
//     fontWeight: '800',
//     color: '#111827',
//     marginBottom: 10,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 21,
//     marginBottom: 24,
//   },

//   // ── Grid
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: CARD_GAP,
//   },
//   productCard: {
//     width: '48%',
//     gap: 8,
//   },

//   // ── Image tile
//   imageTile: {
//     width: '100%',
//     aspectRatio: 1,
//     borderRadius: 16,
//     borderWidth: 1.5,
//     borderStyle: 'dashed',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   imageTileActive: {
//     borderColor: '#93C5FD',
//     backgroundColor: '#EFF6FF',
//   },
//   imageTileInactive: {
//     borderColor: '#D1D5DB',
//     backgroundColor: '#F3F4F6',
//   },
//   imageTileFilled: {
//     borderStyle: 'solid',
//     borderColor: '#2563EB',
//     borderWidth: 2,
//   },
//   productImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   removeBtn: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   plusCircle: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   plusCircleActive: {
//     backgroundColor: '#DBEAFE',
//   },
//   plusCircleInactive: {
//     backgroundColor: '#E5E7EB',
//   },

//   // ── Shared input box
//   inputBox: {
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 10,
//     backgroundColor: '#F9FAFB',
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     justifyContent: 'center',
//   },
//   textInput: {
//     fontSize: 13,
//     color: '#111827',
//     padding: 0,
//     margin: 0,
//   },

//   // ── Price + Category row
//   rowInputs: {
//     flexDirection: 'row',
//     gap: 6,
//   },
//   priceBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: 2,
//   },
//   currencySymbol: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginRight: 2,
//   },
//   priceInput: {
//     flex: 1,
//   },
//   categoryBox: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   categoryText: {
//     fontSize: 13,
//     color: '#111827',
//     flex: 1,
//   },
//   categoryPlaceholder: {
//     color: '#9CA3AF',
//   },

//   // ── Footer
//   footer: {
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 18,
//     paddingVertical: 14,
//     borderTopWidth: 1,
//     borderTopColor: '#F3F4F6',
//   },
//   footerInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   continueButton: {
//     flexDirection: 'row',
//     backgroundColor: '#2563EB',
//     paddingVertical: 13,
//     paddingHorizontal: 26,
//     borderRadius: 50,
//     alignItems: 'center',
//     gap: 8,
//     elevation: 3,
//     shadowColor: '#2563EB',
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   continueText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '700',
//   },
//   skipText: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#2563EB',
//     marginLeft: 'auto',
//   },

//   // ── Category Modal
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.4)',
//   },
//   modalSheet: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//     maxHeight: '60%',
//   },
//   modalHandle: {
//     width: 40,
//     height: 4,
//     borderRadius: 99,
//     backgroundColor: '#D1D5DB',
//     alignSelf: 'center',
//     marginTop: 12,
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#111827',
//     marginBottom: 12,
//   },
//   modalItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   modalItemText: {
//     fontSize: 15,
//     color: '#374151',
//   },
//   modalClose: {
//     marginTop: 16,
//     paddingVertical: 14,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   modalCloseText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
// });