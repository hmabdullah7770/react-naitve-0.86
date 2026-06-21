import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import TextInput from '../../../components/TextField';
import { useDispatch } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStep } from './context/StoreSetupContext';
import {createstorerequest} from '../../../Redux/action/storee/store_createstore'
import keychain from 'react-native-keychain';

// ✅ import from context file, not navigator
// import { createStore } from '../../../../redux/actions/storeActions';

const validationSchema = Yup.object().shape({
  storeName: Yup.string().required('Store name is required'),
  category:  Yup.string().required('Category is required'),
});

const categories = [
  { label: 'FASHION',  icon: 'checkroom'   },
  { label: 'TECH',     icon: 'devices'     },
  { label: 'FOOD',     icon: 'restaurant'  },
  { label: 'BEAUTY',   icon: 'content-cut' },
  { label: 'HOME',     icon: 'home'        },
  { label: 'OTHER',    icon: 'apps'        },
];

const Name_Store = ({ navigation }) => {
  const dispatch = useDispatch();
  const { setCurrentStep } = useStep();
  const [storeLogo, setStoreLogo] = useState(null);




  useEffect(() => {
    // 'focus' fires on mount AND when navigating back — useEffect with []
    // only fires on mount, so back-navigation would leave the bar stuck on step 2
    const unsubscribe = navigation.addListener('focus', () => {
      setCurrentStep(1);
    });
    return unsubscribe;
  }, [navigation]);

  const formik = useFormik({
    initialValues: { storeName: '', category: '' },
    validationSchema,
    onSubmit: (values) => {
      // dispatch(createStore({ ...values, storeLogo }));
      dispatch(createstorerequest({ ...values, storeLogo }));
      // navigation.navigate('IntroCarousel');
    },
  });

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (!result.didCancel && result.assets?.length) {
      setStoreLogo(result.assets[0].uri);
    }
  };

  return (
    // KeyboardAvoidingView so keyboard doesn't cover inputs
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ──────────────────────────────────────────────────
        <Text style={styles.title}>Create Your Store</Text>
        <Text style={styles.subtitle}>
          Fill in the details to set up your digital storefront.
        </Text> */}

        {/* ── Store Logo ───────────────────────────────────────────── */}
        <View style={styles.logoWrapper}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={handleImagePicker}
            activeOpacity={0.85}
          >
            {storeLogo ? (
              <Image source={{ uri: storeLogo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon name="store" size={36} color="#b2b4b5" />
                {/* <Text style={styles.logoPlaceholderText}>LoremIpsum</Text> */}
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraBadge} onPress={handleImagePicker}>
            <Icon name="photo-camera" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Store Name ───────────────────────────────────────────── */}
        <Text style={styles.fieldLabel}>STORE NAME</Text>
        <TextInput
          placeholder="e.g. Blue Ribbon Bakery"
          value={formik.values.storeName}
          onChangeText={formik.handleChange('storeName')}
          onBlur={formik.handleBlur('storeName')}
          error={formik.touched.storeName && formik.errors.storeName}
          style={styles.textInput}
          placeholderTextColor="#AAAAAA"
        />
        {formik.touched.storeName && formik.errors.storeName ? (
          <Text style={styles.errorText}>{formik.errors.storeName}</Text>
        ) : null}

        {/* ── Business Category ────────────────────────────────────── */}
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>BUSINESS CATEGORY</Text>
        {formik.touched.category && formik.errors.category ? (
          <Text style={styles.errorText}>{formik.errors.category}</Text>
        ) : null}

        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = formik.values.category === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryTile, isSelected && styles.categoryTileSelected]}
                onPress={() => formik.setFieldValue('category', cat.label)}
                activeOpacity={0.8}
              >
                <Icon
                  name={cat.icon}
                  size={24}
                  color={isSelected ? '#2563EB' : '#4B5563'}
                />
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Continue Button ──────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={formik.handleSubmit}
          activeOpacity={0.9}

        >
          <Text style={styles.continueText}>Create store</Text>
          <Icon name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Name_Store;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,   // tighter — content fits without scrolling
    paddingBottom: 16,
  },

  // ── Title — slightly smaller to save vertical space
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
    lineHeight: 19,
  },

  // ── Logo — smaller so categories are visible without scrolling
  logoWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#8DA9B8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6B8FA0',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    color: '#fff',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F7F8FA',
  },

  // ── Field labels
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    paddingVertical: 13,
    fontSize: 14,
    color: '#111827',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 3,
    marginLeft: 4,
  },

  // ── Category Grid — smaller tiles to fit all 6 on screen
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  categoryTile: {
    width: '30%',
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryTileSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#4B5563',
  },
  categoryLabelSelected: {
    color: '#2563EB',
  },

  // ── Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F7F8FA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Image,
//   SafeAreaView,
//   ScrollView,
// } from 'react-native';
// import React, { useState } from 'react';
// import { useFormik } from 'formik';
// import * as Yup from 'yup';
// import TextInput from '../../../components/TextField'
// import { useDispatch } from 'react-redux';
// import { launchImageLibrary } from 'react-native-image-picker';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// // import { createStore } from '../../../../redux/actions/storeActions'; // adjust path as needed

// // Validation Schema
// const validationSchema = Yup.object().shape({
//   storeName: Yup.string().required('Store name is required'),
//   category: Yup.string().required('Category is required'),
// });

// // Categories with icon names (MaterialIcons)
// const categories = [
//   { label: 'FASHION',  icon: 'checkroom'   },
//   { label: 'TECH',     icon: 'devices'     },
//   { label: 'FOOD',     icon: 'restaurant'  },
//   { label: 'BEAUTY',   icon: 'content-cut' },
//   { label: 'HOME',     icon: 'home'        },
//   { label: 'OTHER',    icon: 'apps'        },
// ];

// // Total steps shown in the progress bar
// const TOTAL_STEPS = 3;
// const CURRENT_STEP = 1;

// const Name_Store = ({ navigation }) => {
//   const dispatch = useDispatch();

//   const [storeLogo, setStoreLogo] = useState(null);

//   const formik = useFormik({
//     initialValues: {
//       storeName: '',
//       category: '',
//     },
//     validationSchema,
//     onSubmit: (values) => {
//       dispatch(createStore({ ...values, storeLogo }));
//       navigation.navigate('StoreType'); // go to next screen
//     },
//   });

//   const handleImagePicker = async () => {
//     const result = await launchImageLibrary({
//       mediaType: 'photo',
//       quality: 1,
//     });
//     if (!result.didCancel && result.assets?.length) {
//       setStoreLogo(result.assets[0].uri);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* ── Header ─────────────────────────────────────── */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Icon name="chevron-left" size={26} color="#1A1A2E" />
//         </TouchableOpacity>

//         {/* Progress bar */}
//         <View style={styles.progressContainer}>
//           {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
//             <View
//               key={i}
//               style={[
//                 styles.progressSegment,
//                 i < CURRENT_STEP && styles.progressSegmentActive,
//               ]}
//             />
//           ))}
//         </View>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Title ──────────────────────────────────────── */}
//         <Text style={styles.title}>Create Your Store</Text>
//         <Text style={styles.subtitle}>
//           Fill in the details to set up your digital storefront.
//         </Text>

//         {/* ── Store Logo ─────────────────────────────────── */}
//         <View style={styles.logoWrapper}>
//           <TouchableOpacity
//             style={styles.logoContainer}
//             onPress={handleImagePicker}
//             activeOpacity={0.85}
//           >
//             {storeLogo ? (
//               <Image source={{ uri: storeLogo }} style={styles.logo} />
//             ) : (
//               <View style={styles.logoPlaceholder}>
//                 <Icon name="storefront" size={44} color="#8DA9B8" />
//                 <Text style={styles.logoPlaceholderText}>LoremIpsum</Text>
//               </View>
//             )}
//           </TouchableOpacity>

//           {/* Camera badge */}
//           <TouchableOpacity
//             style={styles.cameraBadge}
//             onPress={handleImagePicker}
//           >
//             <Icon name="photo-camera" size={18} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         {/* ── Store Name ─────────────────────────────────── */}
//         <Text style={styles.fieldLabel}>STORE NAME</Text>
//         <TextInput
//           placeholder="e.g. Blue Ribbon Bakery"
//           value={formik.values.storeName}
//           onChangeText={formik.handleChange('storeName')}
//           onBlur={formik.handleBlur('storeName')}
//           error={formik.touched.storeName && formik.errors.storeName}
//           style={styles.textInput}
//           placeholderTextColor="#AAAAAA"
//         />
//         {formik.touched.storeName && formik.errors.storeName ? (
//           <Text style={styles.errorText}>{formik.errors.storeName}</Text>
//         ) : null}

//         {/* ── Business Category ──────────────────────────── */}
//         <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
//           BUSINESS CATEGORY
//         </Text>
//         {formik.touched.category && formik.errors.category ? (
//           <Text style={styles.errorText}>{formik.errors.category}</Text>
//         ) : null}

//         <View style={styles.categoryGrid}>
//           {categories.map((cat) => {
//             const isSelected = formik.values.category === cat.label;
//             return (
//               <TouchableOpacity
//                 key={cat.label}
//                 style={[
//                   styles.categoryTile,
//                   isSelected && styles.categoryTileSelected,
//                 ]}
//                 onPress={() => formik.setFieldValue('category', cat.label)}
//                 activeOpacity={0.8}
//               >
//                 <Icon
//                   name={cat.icon}
//                   size={28}
//                   color={isSelected ? '#2563EB' : '#4B5563'}
//                 />
//                 <Text
//                   style={[
//                     styles.categoryLabel,
//                     isSelected && styles.categoryLabelSelected,
//                   ]}
//                 >
//                   {cat.label}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </ScrollView>

//       {/* ── Continue Button ────────────────────────────── */}
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={styles.continueButton}
//           onPress={formik.handleSubmit}
//           activeOpacity={0.9}
//         >
//           <Text style={styles.continueText}>Continue</Text>
//           <Icon name="arrow-forward" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Name_Store;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#F7F8FA',
//   },

//   // ── Header
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 8,
//     gap: 16,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 1 },
//   },
//   progressContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   progressSegment: {
//     flex: 1,
//     height: 5,
//     borderRadius: 99,
//     backgroundColor: '#D1D5DB',
//   },
//   progressSegmentActive: {
//     backgroundColor: '#2563EB',
//   },

//   // ── Scroll
//   scroll: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },

//   // ── Title
//   title: {
//     fontSize: 26,
//     fontWeight: '800',
//     color: '#111827',
//     marginTop: 20,
//     marginBottom: 6,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 28,
//     lineHeight: 20,
//   },

//   // ── Logo
//   logoWrapper: {
//     alignSelf: 'center',
//     marginBottom: 32,
//   },
//   logoContainer: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     overflow: 'hidden',
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//   },
//   logoPlaceholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#8DA9B8',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#6B8FA0',
//     borderStyle: 'dashed',
//   },
//   logoPlaceholderText: {
//     color: '#fff',
//     fontSize: 10,
//     marginTop: 4,
//     fontWeight: '500',
//   },
//   cameraBadge: {
//     position: 'absolute',
//     bottom: 4,
//     right: 4,
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     backgroundColor: '#2563EB',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#F7F8FA',
//   },

//   // ── Field labels
//   fieldLabel: {
//     fontSize: 12,
//     fontWeight: '700',
//     letterSpacing: 1.2,
//     color: '#374151',
//     marginBottom: 10,
//   },

//   // ── Text input override
//   textInput: {
//     backgroundColor: '#fff',
//     borderRadius: 50,
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     fontSize: 15,
//     color: '#111827',
//   },
//   errorText: {
//     color: '#EF4444',
//     fontSize: 12,
//     marginTop: 4,
//     marginLeft: 4,
//   },

//   // ── Category Grid
//   categoryGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginTop: 4,
//   },
//   categoryTile: {
//     width: '30%',
//     aspectRatio: 1,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'transparent',
//     gap: 8,
//   },
//   categoryTileSelected: {
//     backgroundColor: '#EFF6FF',
//     borderColor: '#2563EB',
//   },
//   categoryLabel: {
//     fontSize: 11,
//     fontWeight: '600',
//     letterSpacing: 0.6,
//     color: '#4B5563',
//   },
//   categoryLabelSelected: {
//     color: '#2563EB',
//   },

//   // ── Footer / Continue Button
//   footer: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#F7F8FA',
//   },
//   continueButton: {
//     flexDirection: 'row',
//     backgroundColor: '#2563EB',
//     paddingVertical: 18,
//     borderRadius: 50,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 10,
//     elevation: 3,
//     shadowColor: '#2563EB',
//     shadowOpacity: 0.35,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   continueText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });