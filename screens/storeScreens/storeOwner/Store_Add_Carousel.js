import React, { useState } from 'react'
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Switch, Image, Alert, ActivityIndicator
} from 'react-native'
import MaterialIcons from '@react-native-vector-icons/material-icons'
import { launchImageLibrary } from 'react-native-image-picker'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { useCreateStoreCarousel } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreCarousel'
import { useGetStoreProducts } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts'
import ProductDropdown from '../components/ProductDropdown'
import FilteredProductsModal from '../components/Filteredproductsmodal'   // ← NEW

const PRESET_COLORS = [
  '#FFFFFF', '#1a1a2e', '#e53935',
  '#1E88E5', '#E91E8C', '#4CAF50',
  '#FF9800', '#9C27B0',
]


const BUTTON_ACTIONS = [
  { key: 'product',  label: 'Link a Product' },
  { key: 'screen',   label: 'Link All Products Screen' },
  { key: 'filtered', label: 'Link Filtered Products' },
]

const ColorPicker = ({ selected, onSelect }) => (
  <View style={styles.colorRow}>
    {PRESET_COLORS.map(color => (
      <TouchableOpacity
        key={color}
        onPress={() => onSelect(color)}
        style={[
          styles.colorSwatch,
          { backgroundColor: color },
          selected === color && styles.colorSwatchSelected,
        ]}
      >
        {selected === color && (
          <MaterialIcons
            name="check"
            size={12}
            color={color === '#FFFFFF' ? '#000' : '#fff'}
          />
        )}
      </TouchableOpacity>
    ))}
  </View>
)

// ─────────────────────────────────────────────────────────────────────────────
// ButtonActionSection
// ─────────────────────────────────────────────────────────────────────────────
const ButtonActionSection = ({
  buttonAction, setButtonAction,
  selectedProduct, setSelectedProduct,
  filteredProductIds,                      // ← array of ids
  onOpenFilterModal,                       // ← opens the modal
  dropdownOpen, setDropdownOpen,
  products, isLoadingProducts, productsError,
}) => (
  <View style={styles.actionWrapper}>
    <Text style={styles.subLabel}>BUTTON ACTION</Text>

    {/* ── Action Tabs ── */}
    <View style={styles.actionTabRow}>
      {BUTTON_ACTIONS.map(action => (
        <TouchableOpacity
          key={action.key}
          onPress={() => {
            setButtonAction(action.key)
            setDropdownOpen(false)
          }}
          activeOpacity={0.8}
          style={[
            styles.actionTab,
            buttonAction === action.key && styles.actionTabActive,
          ]}
        >
          <Text style={[
            styles.actionTabText,
            buttonAction === action.key && styles.actionTabTextActive,
          ]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* ── Link a Product ── */}
    {buttonAction === 'product' && (
      <ProductDropdown
        products={products ?? []}
        loading={isLoadingProducts}
        error={productsError}
        isOpen={dropdownOpen}
        onToggle={open => setDropdownOpen(open)}
        onProductSelect={product => {
          setSelectedProduct(product)
          setDropdownOpen(false)
        }}
        selectedProductId={selectedProduct?._id ?? null}
      />
    )}

    {/* ── Link Filtered Products ── */}
    {buttonAction === 'filtered' && (
      <TouchableOpacity
        style={styles.selectBox}
        activeOpacity={0.8}
        onPress={onOpenFilterModal}        // ← opens the modal
      >
        <View style={{ flex: 1 }}>
          {filteredProductIds.length > 0 ? (
            <Text style={styles.selectText}>
              {filteredProductIds.length} product{filteredProductIds.length !== 1 ? 's' : ''} selected
            </Text>
          ) : (
            <Text style={[styles.selectText, { color: '#bbb' }]}>
              Select products to filter…
            </Text>
          )}
        </View>

        {/* badge */}
        {filteredProductIds.length > 0 && (
          <View style={styles.idCountBadge}>
            <Text style={styles.idCountText}>{filteredProductIds.length}</Text>
          </View>
        )}

        <MaterialIcons name="grid-view" size={18} color="#aaa" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    )}

    {/* ── Link All Products Screen ── */}
    {buttonAction === 'screen' && (
      <View style={styles.disabledBox}>
        <MaterialIcons name="check-circle-outline" size={15} color="#4CAF50" />
        <Text style={[styles.disabledText, { color: '#4CAF50' }]}>
          You have linked your Product Screen
        </Text>
      </View>
    )}
  </View>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const Store_Add_Carousel = ({ GetStoreById }) => {
  const navigation = useNavigation()
  const route = useRoute()

  const storeId = GetStoreById?.data?.data?._id
   const { carouselIndex } = route.params
  
  // const [carouselIndex, setCarouselIndex] = useState(route.params?.carouselIndex)

// useFocusEffect(
//   React.useCallback(() => {
//     setCarouselIndex(route.params?.carouselIndex)
//   }, [route.params?.carouselIndex])
// )
  
  console.log('Received carouselIndex Add carousel screen:', carouselIndex)

  const { mutateAsync: createCarousel, isPending } = useCreateStoreCarousel()

  const {
    data: storeProductsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useGetStoreProducts(storeId)

  const products = storeProductsData?.data?.data ?? []

  const [image, setImage]                             = useState(null)
  const [title, setTitle]                             = useState('')
  const [titleColor, setTitleColor]                   = useState('#FFFFFF')
  const [description, setDescription]                 = useState('')
  const [descColor, setDescColor]                     = useState('#FFFFFF')
  const [buttonEnabled, setButtonEnabled]             = useState(false)
  const [buttonText, setButtonText]                   = useState('Shop Now')
  const [buttonBg, setButtonBg]                       = useState('#0052FF')
  const [buttonTextColor, setButtonTextColor]         = useState('#FFFFFF')
  const [buttonAction, setButtonAction]               = useState('product')
  const [selectedProduct, setSelectedProduct]         = useState(null)
  const [filteredProductIds, setFilteredProductIds]   = useState([])   // ← NEW: array of ids
  const [filterModalVisible, setFilterModalVisible]   = useState(false) // ← NEW: modal visibility
  const [dropdownOpen, setDropdownOpen]               = useState(false)

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return
      if (response.assets?.[0]) setImage(response.assets[0])
    })
  }

  const handleSave = async () => {
    if (!image) {
      return Alert.alert('Image required', 'Please add a carousel image.')
    }
    if (buttonEnabled && !buttonText.trim()) {
      return Alert.alert('Validation', 'Button label cannot be empty when button is enabled.')
    }
    if (buttonEnabled && buttonAction === 'product' && !selectedProduct) {
      return Alert.alert('Validation', 'Please select a product to link.')
    }
    if (buttonEnabled && buttonAction === 'filtered' && filteredProductIds.length === 0) {
      return Alert.alert('Validation', 'Please select at least one product to filter.')
    }

    const formData = new FormData()

    formData.append(`carousel_${carouselIndex}_images`, {
      uri: image.uri,
      type: image.type ?? 'image/jpeg',
      name: image.fileName ?? `carousel_${carouselIndex}.jpg`,
    })

    const carouselPayload = {
      index: carouselIndex,
      title,
      titleColor,
      description,
      descriptionColor: descColor,
      fontFamily: ['Arial'],
      category: 'promotion',
      ...(buttonEnabled && {
        buttonText: buttonText.trim(),
        buttonTextColor,
        buttonBackground: buttonBg,
        buttonAction,
        ...(buttonAction === 'product' && selectedProduct && {
          productId: selectedProduct._id,
        }),
        ...(buttonAction === 'screen' && {
          linkScreen: true,
        }),
        ...(buttonAction === 'filtered' && filteredProductIds.length > 0 && {
          filteredProductIds,           // ← e.g. ['66643rt...','ew35g..','tgsy']
        }),
      }),
    }

    formData.append('carouselsData', JSON.stringify([carouselPayload]))

    try {
      await createCarousel({ formData, storeId })
      navigation.goBack()
    } catch (e) {
      Alert.alert('Error', 'Failed to create carousel. Please try again.')
    }
  }

  console.log('Carousel Payload:', {
    index: carouselIndex,
    title,
    titleColor,
    description,
    descriptionColor: descColor,
    fontFamily: ['Arial'],
    category: 'promotion',
    ...(buttonEnabled && {
      buttonText: buttonText.trim(),
      buttonTextColor,
      buttonBackground: buttonBg,
      buttonAction,
      ...(buttonAction === 'product' && selectedProduct && {
        productId: selectedProduct._id,
      }),
      ...(buttonAction === 'screen' && {
        linkScreen: true,
      }),
      ...(buttonAction === 'filtered' && filteredProductIds.length > 0 && {
        filteredProductIds,
      }),
    }),
  })

  console.log('Selected Product:', selectedProduct?._id)
  console.log('Filtered Product IDs:', filteredProductIds)
  console.log('Button Action:', buttonAction)
  // console.log("Link Product Screen:", linkScreen)

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Image Picker ── */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <>
              <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.imageEditBadge}>
                <MaterialIcons name="edit" size={14} color="#fff" />
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={34} color="#aaa" />
              <Text style={styles.imageLabel}>Add Image</Text>
              <Text style={styles.imageSubLabel}>PNG, JPG up to 5MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── CTA Button Toggle ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>CALL TO ACTION BUTTON</Text>
          <Switch
            value={buttonEnabled}
            onValueChange={setButtonEnabled}
            trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        {buttonEnabled && (
          <View style={styles.buttonSection}>

            <Text style={styles.subLabel}>BUTTON LABEL</Text>
            <TextInput
              style={styles.input}
              value={buttonText}
              onChangeText={setButtonText}
              placeholder="Shop Now"
              placeholderTextColor="#bbb"
              maxLength={30}
            />

            <View style={styles.colorPairRow}>
              <View style={styles.colorPairCol}>
                <Text style={styles.subLabel}>BACKGROUND</Text>
                <View style={styles.colorPreviewRow}>
                  <View style={[styles.colorPreviewBox, { backgroundColor: buttonBg }]} />
                  <Text style={styles.colorHex}>{buttonBg}</Text>
                </View>
                <ColorPicker selected={buttonBg} onSelect={setButtonBg} />
              </View>

              <View style={styles.colorPairCol}>
                <Text style={styles.subLabel}>TEXT COLOR</Text>
                <View style={styles.colorPreviewRow}>
                  <View style={[styles.colorPreviewBox, { backgroundColor: buttonTextColor }]} />
                  <Text style={styles.colorHex}>{buttonTextColor}</Text>
                </View>
                <ColorPicker selected={buttonTextColor} onSelect={setButtonTextColor} />
              </View>
            </View>

            {/* ── Preview ── */}
            <TouchableOpacity
              style={[styles.btnPreview, { backgroundColor: buttonBg }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnPreviewText, { color: buttonTextColor }]}>
                {buttonText || 'Shop Now'}
              </Text>
            </TouchableOpacity>

            {/* ── Button Action ── */}
            <ButtonActionSection
              buttonAction={buttonAction}
              setButtonAction={setButtonAction}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              filteredProductIds={filteredProductIds}
              onOpenFilterModal={() => setFilterModalVisible(true)}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              products={products}
              isLoadingProducts={isLoadingProducts}
              productsError={productsError}
            />

          </View>
        )}

        {/* ── Title ── */}
        <Text style={styles.label}>CAROUSEL TITLE</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter an engaging title"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>TITLE COLOR</Text>
        <ColorPicker selected={titleColor} onSelect={setTitleColor} />

        {/* ── Description ── */}
        <Text style={styles.label}>CAROUSEL DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe this slide..."
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>TEXT COLOR</Text>
        <ColorPicker selected={descColor} onSelect={setDescColor} />

        {/* ── Save ── */}
        <TouchableOpacity
          style={[styles.saveBtn, isPending && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Slide</Text>
          }
        </TouchableOpacity>

      </ScrollView>

      {/* ── Filtered Products Modal ── */}
      <FilteredProductsModal
        visible={filterModalVisible}
        products={products}
        initialSelectedIds={filteredProductIds}
        loading={isLoadingProducts}
        onClose={() => setFilterModalVisible(false)}
        onApply={(ids) => {
          setFilteredProductIds(ids)   // ← ['66643rt...','ew35g..','tgsy']
          setFilterModalVisible(false)
        }}
      />
    </>
  )
}

export default Store_Add_Carousel

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  imagePicker: {
    width: '100%', height: 160, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed',
    backgroundColor: '#fafafa', overflow: 'hidden', marginBottom: 24,
  },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  imageLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
  imageSubLabel: { fontSize: 12, color: '#bbb' },
  previewImage: { width: '100%', height: '100%' },
  imageEditBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 6,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  subLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.6, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: '#1a1a2e', backgroundColor: '#fafafa', marginBottom: 16,
  },
  textarea: { height: 90, paddingTop: 11 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  colorSwatchSelected: { borderWidth: 2.5, borderColor: '#1a1a2e' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  buttonSection: { backgroundColor: '#f8f9fa', borderRadius: 14, padding: 14, marginBottom: 16, gap: 4 },
  colorPairRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  colorPairCol: { flex: 1 },
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorPreviewBox: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  colorHex: { fontSize: 12, fontWeight: '600', color: '#555' },
  btnPreview: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPreviewText: { fontSize: 13, fontWeight: '700' },
  actionWrapper: { marginTop: 14 },
  actionTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  actionTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  actionTabActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  actionTabText: { fontSize: 12, fontWeight: '600', color: '#555' },
  actionTabTextActive: { color: '#fff' },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  selectText: { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  idCountBadge: { backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  idCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  disabledBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4 },
  disabledText: { fontSize: 12, fontWeight: '500' },
  saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 10, marginBottom: 90 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})


// import React, { useState } from 'react'
// import {
//   StyleSheet, Text, View, TextInput, TouchableOpacity,
//   ScrollView, Switch, Image, Alert, ActivityIndicator
// } from 'react-native'
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
// import { launchImageLibrary } from 'react-native-image-picker'
// import { useNavigation, useRoute } from '@react-navigation/native'
// import { useCreateStoreCarousel } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreCarousel'
// import { useGetStoreProducts } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts'
// import ProductDropdown from '../components/ProductDropdown'

// const PRESET_COLORS = [
//   '#FFFFFF', '#1a1a2e', '#e53935',
//   '#1E88E5', '#E91E8C', '#4CAF50',
//   '#FF9800', '#9C27B0',
// ]

// const BUTTON_ACTIONS = [
//   { key: 'product',  label: 'Link a Product' },
//   { key: 'screen',   label: 'Link All Products Screen' },
//   { key: 'filtered', label: 'Link Filtered Products' },
// ]

// const ColorPicker = ({ selected, onSelect }) => (
//   <View style={styles.colorRow}>
//     {PRESET_COLORS.map(color => (
//       <TouchableOpacity
//         key={color}
//         onPress={() => onSelect(color)}
//         style={[
//           styles.colorSwatch,
//           { backgroundColor: color },
//           selected === color && styles.colorSwatchSelected,
//         ]}
//       >
//         {selected === color && (
//           <MaterialIcons
//             name="check"
//             size={12}
//             color={color === '#FFFFFF' ? '#000' : '#fff'}
//           />
//         )}
//       </TouchableOpacity>
//     ))}
//   </View>
// )

// const ButtonActionSection = ({
//   buttonAction, setButtonAction,
//   selectedProduct, setSelectedProduct,
//   selectedFilter, setSelectedFilter,
//   dropdownOpen, setDropdownOpen,
//   products, isLoadingProducts, productsError,
// }) => (
//   <View style={styles.actionWrapper}>
//     <Text style={styles.subLabel}>BUTTON ACTION</Text>

//     {/* ── Action Tabs ── */}
//     <View style={styles.actionTabRow}>
//       {BUTTON_ACTIONS.map(action => (
//         <TouchableOpacity
//           key={action.key}
//           onPress={() => {
//             setButtonAction(action.key)
//             setDropdownOpen(false) // close dropdown when switching tabs
//           }}
//           activeOpacity={0.8}
//           style={[
//             styles.actionTab,
//             buttonAction === action.key && styles.actionTabActive,
//           ]}
//         >
//           <Text style={[
//             styles.actionTabText,
//             buttonAction === action.key && styles.actionTabTextActive,
//           ]}>
//             {action.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>

//     {/* ── Link a Product ── */}
//     {buttonAction === 'product' && (
//       <ProductDropdown
//         products={products ?? []}
//         loading={isLoadingProducts}
//         error={productsError}
//         isOpen={dropdownOpen}
//         onToggle={open => setDropdownOpen(open)}
//         onProductSelect={product => {
//           setSelectedProduct(product)
//           setDropdownOpen(false)
//         }}
//         selectedProductId={selectedProduct?._id ?? null}
//       />
//     )}

//     {/* ── Link Filtered Products ── */}
//     {buttonAction === 'filtered' && (
//       <TouchableOpacity
//         style={styles.selectBox}
//         activeOpacity={0.8}
//         onPress={() => setDropdownOpen(prev => !prev)}
//       >
//         <Text style={[styles.selectText, !selectedFilter && { color: '#bbb' }]}>
//           {selectedFilter ?? 'Select Filter...'}
//         </Text>
//         <MaterialIcons name="keyboard-arrow-down" size={20} color="#aaa" />
//       </TouchableOpacity>
//     )}

//     {/* ── Link All Products Screen ── */}
//     {buttonAction === 'screen' && (
//       <View style={styles.disabledBox}>
//         <MaterialIcons name="check-circle-outline" size={15} color="#4CAF50" />
//         <Text style={[styles.disabledText, { color: '#4CAF50' }]}>
//           You have linked your Product Screen
//         </Text>
//       </View>
//     )}
//   </View>
// )

// const Store_Add_Carousel = ({ GetStoreById }) => {
//   const navigation = useNavigation()
//   const route = useRoute()

//   const storeId = GetStoreById?.data?.data?._id
//   const { carouselIndex } = route.params

//   const { mutateAsync: createCarousel, isPending } = useCreateStoreCarousel()

//   // ── fetch products for the dropdown ──
//   const {
//     data: storeProductsData,
//     isLoading: isLoadingProducts,
//     error: productsError,
//   } = useGetStoreProducts(storeId)

//   const products = storeProductsData?.data?.data ?? []

//   const [image, setImage]                         = useState(null)
//   const [title, setTitle]                         = useState('')
//   const [titleColor, setTitleColor]               = useState('#FFFFFF')
//   const [description, setDescription]             = useState('')
//   const [descColor, setDescColor]                 = useState('#FFFFFF')
//   const [buttonEnabled, setButtonEnabled]         = useState(false)
//   const [buttonText, setButtonText]               = useState('Shop Now')
//   const [buttonBg, setButtonBg]                   = useState('#0052FF')
//   const [buttonTextColor, setButtonTextColor]     = useState('#FFFFFF')
//   const [buttonAction, setButtonAction]           = useState('product')
//   const [selectedProduct, setSelectedProduct]     = useState(null)  // full product object
//   const [selectedFilter, setSelectedFilter]       = useState(null)
//   const [dropdownOpen, setDropdownOpen]           = useState(false)

//   const pickImage = () => {
//     launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
//       if (response.didCancel) return
//       if (response.assets?.[0]) setImage(response.assets[0])
//     })
//   }

//   const handleSave = async () => {
//     if (!image) {
//       return Alert.alert('Image required', 'Please add a carousel image.')
//     }
//     if (buttonEnabled && !buttonText.trim()) {
//       return Alert.alert('Validation', 'Button label cannot be empty when button is enabled.')
//     }
//     if (buttonEnabled && buttonAction === 'product' && !selectedProduct) {
//       return Alert.alert('Validation', 'Please select a product to link.')
//     }

//     const formData = new FormData()

//     formData.append(`carousel_${carouselIndex}_images`, {
//       uri: image.uri,
//       type: image.type ?? 'image/jpeg',
//       name: image.fileName ?? `carousel_${carouselIndex}.jpg`,
//     })

//     const carouselPayload = {
//       index: carouselIndex,
//       title,
//       titleColor,
//       description,
//       descriptionColor: descColor,
//       fontFamily: ['Arial'],
//       category: 'promotion',
//       ...(buttonEnabled && {
//         buttonText: buttonText.trim(),
//         buttonTextColor,
//         buttonBackground: buttonBg,
//         buttonAction,                                         // ← 'product' | 'screen' | 'filtered'
//         ...(buttonAction === 'product' && selectedProduct && {
//           productId: selectedProduct._id,                    // ← single product id
//         }),
//         ...(buttonAction === 'screen' && {
//           linkScreen: true,                                   // ← boolean flag
//         }),
//         ...(buttonAction === 'filtered' && selectedFilter && {
//           filteredProductIds: selectedFilter,                 // ← array of ids
//         }),
//       }),
//     }

//     formData.append('carouselsData', JSON.stringify([carouselPayload]))

//     try {
//       await createCarousel({ formData, storeId })
//       navigation.goBack()
//     } catch (e) {
//       Alert.alert('Error', 'Failed to create carousel. Please try again.')
//     }
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.content}
//       keyboardShouldPersistTaps="handled"
//     >

//       {/* ── Image Picker ── */}
//       <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
//         {image ? (
//           <>
//             <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
//             <View style={styles.imageEditBadge}>
//               <MaterialIcons name="edit" size={14} color="#fff" />
//             </View>
//           </>
//         ) : (
//           <View style={styles.imagePlaceholder}>
//             <MaterialIcons name="add-photo-alternate" size={34} color="#aaa" />
//             <Text style={styles.imageLabel}>Add Image</Text>
//             <Text style={styles.imageSubLabel}>PNG, JPG up to 5MB</Text>
//           </View>
//         )}
//       </TouchableOpacity>

//       {/* ── CTA Button Toggle ── */}
//       <View style={styles.toggleRow}>
//         <Text style={styles.label}>CALL TO ACTION BUTTON</Text>
//         <Switch
//           value={buttonEnabled}
//           onValueChange={setButtonEnabled}
//           trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
//           thumbColor="#fff"
//         />
//       </View>

//       {buttonEnabled && (
//         <View style={styles.buttonSection}>

//           <Text style={styles.subLabel}>BUTTON LABEL</Text>
//           <TextInput
//             style={styles.input}
//             value={buttonText}
//             onChangeText={setButtonText}
//             placeholder="Shop Now"
//             placeholderTextColor="#bbb"
//             maxLength={30}
//           />

//           <View style={styles.colorPairRow}>
//             <View style={styles.colorPairCol}>
//               <Text style={styles.subLabel}>BACKGROUND</Text>
//               <View style={styles.colorPreviewRow}>
//                 <View style={[styles.colorPreviewBox, { backgroundColor: buttonBg }]} />
//                 <Text style={styles.colorHex}>{buttonBg}</Text>
//               </View>
//               <ColorPicker selected={buttonBg} onSelect={setButtonBg} />
//             </View>

//             <View style={styles.colorPairCol}>
//               <Text style={styles.subLabel}>TEXT COLOR</Text>
//               <View style={styles.colorPreviewRow}>
//                 <View style={[styles.colorPreviewBox, { backgroundColor: buttonTextColor }]} />
//                 <Text style={styles.colorHex}>{buttonTextColor}</Text>
//               </View>
//               <ColorPicker selected={buttonTextColor} onSelect={setButtonTextColor} />
//             </View>
//           </View>

//           {/* ── Preview ── */}
//           <TouchableOpacity
//             style={[styles.btnPreview, { backgroundColor: buttonBg }]}
//             activeOpacity={0.85}
//           >
//             <Text style={[styles.btnPreviewText, { color: buttonTextColor }]}>
//               {buttonText || 'Shop Now'}
//             </Text>
//           </TouchableOpacity>

//           {/* ── Button Action ── */}
//           <ButtonActionSection
//             buttonAction={buttonAction}
//             setButtonAction={setButtonAction}
//             selectedProduct={selectedProduct}
//             setSelectedProduct={setSelectedProduct}
//             selectedFilter={selectedFilter}
//             setSelectedFilter={setSelectedFilter}
//             dropdownOpen={dropdownOpen}
//             setDropdownOpen={setDropdownOpen}
//             products={products}
//             isLoadingProducts={isLoadingProducts}
//             productsError={productsError}
//           />

//         </View>
//       )}

//       {/* ── Title ── */}
//       <Text style={styles.label}>CAROUSEL TITLE</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter an engaging title"
//         placeholderTextColor="#bbb"
//         value={title}
//         onChangeText={setTitle}
//       />

//       <Text style={styles.label}>TITLE COLOR</Text>
//       <ColorPicker selected={titleColor} onSelect={setTitleColor} />

//       {/* ── Description ── */}
//       <Text style={styles.label}>CAROUSEL DESCRIPTION</Text>
//       <TextInput
//         style={[styles.input, styles.textarea]}
//         placeholder="Describe this slide..."
//         placeholderTextColor="#bbb"
//         value={description}
//         onChangeText={setDescription}
//         multiline
//         numberOfLines={3}
//         textAlignVertical="top"
//       />

//       <Text style={styles.label}>TEXT COLOR</Text>
//       <ColorPicker selected={descColor} onSelect={setDescColor} />

//       {/* ── Save ── */}
//       <TouchableOpacity
//         style={[styles.saveBtn, isPending && { opacity: 0.7 }]}
//         onPress={handleSave}
//         disabled={isPending}
//         activeOpacity={0.85}
//       >
//         {isPending
//           ? <ActivityIndicator color="#fff" />
//           : <Text style={styles.saveBtnText}>Save Slide</Text>
//         }
//       </TouchableOpacity>

//     </ScrollView>
//   )
// }

// export default Store_Add_Carousel

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   content: { padding: 20, paddingBottom: 40 },
//   imagePicker: {
//     width: '100%', height: 160, borderRadius: 14,
//     borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed',
//     backgroundColor: '#fafafa', overflow: 'hidden', marginBottom: 24,
//   },
//   imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
//   imageLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
//   imageSubLabel: { fontSize: 12, color: '#bbb' },
//   previewImage: { width: '100%', height: '100%' },
//   imageEditBadge: {
//     position: 'absolute', bottom: 10, right: 10,
//     backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 6,
//   },
//   label: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
//   subLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.6, marginBottom: 6 },
//   input: {
//     borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 10,
//     paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
//     color: '#1a1a2e', backgroundColor: '#fafafa', marginBottom: 16,
//   },
//   textarea: { height: 90, paddingTop: 11 },
//   colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
//   colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
//   colorSwatchSelected: { borderWidth: 2.5, borderColor: '#1a1a2e' },
//   toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//   buttonSection: { backgroundColor: '#f8f9fa', borderRadius: 14, padding: 14, marginBottom: 16, gap: 4 },
//   colorPairRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
//   colorPairCol: { flex: 1 },
//   colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   colorPreviewBox: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
//   colorHex: { fontSize: 12, fontWeight: '600', color: '#555' },
//   btnPreview: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
//   btnPreviewText: { fontSize: 13, fontWeight: '700' },
//   actionWrapper: { marginTop: 14 },
//   actionTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
//   actionTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff' },
//   actionTabActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
//   actionTabText: { fontSize: 12, fontWeight: '600', color: '#555' },
//   actionTabTextActive: { color: '#fff' },
//   selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
//   selectText: { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
//   disabledBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4 },
//   disabledText: { fontSize: 12, fontWeight: '500' },
//   saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
//   saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
// })
