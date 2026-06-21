import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useGetProductsId} from '../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';
import {OwnerContext} from '../../context/IsOwner';
import {
  useAddToCart,
  useRemoveFromCart,
  useGetCart,
} from '../../ReactQuery/TanStackQueryHooks/storee/useCart';
import {useRoute, useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const Store_ProductDetail = ({
  GetStoreById,
  StoreByIdLoading,
  StoreByIderror,
  //  route,navigation
}) => {
  const route = useRoute(); // ✅ always works regardless of how screen is rendered
  const {productId, productIdfromcard, storeIdfromcard, source,productIdfromoffer,storeIdfromoffer,productIdfromTopProduct,storeIdfromTopProduct} = route.params;

  console.log('source is :', source);

  const navigation = useNavigation();

  const addToCart = useAddToCart();

  const {ownerId} = useContext(OwnerContext);
  const userId = ownerId;

  console.log(
    'GetStoreById._id in product detail',
    GetStoreById?.data?.data?._id,
  );

  const handleAddToBag = async () => {
    if (!isInStock) return;

    try {
      await addToCart.mutateAsync({
        userId, // from auth context / store
        ...(source === 'storeProductCard'
          ? {storeId: GetStoreById?.data?.data?._id}
          : source === 'offer'
          ? {storeId: storeIdfromoffer}
          : source === 'TopProduct'
          ? {storeId: storeIdfromTopProduct}
          : {storeId: storeIdfromcard}),
        productId: product._id,
        quantity,
        color: selectedColor,
        size: selectedSize,
      });

      navigation.navigate('Store_CartScreen');
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
  } = useGetProductsId(
    source === 'storeProductCard' ? productId  : source === 'offer' ? productIdfromoffer : source === 'TopProduct' ? productIdfromTopProduct : productIdfromcard,
  );
  const product = response?.data?.data; // axios.data → ApiResponse.data → product

  // ── Local State ────────────────────────────────────────────────────────────
  const [selectedImage, setSelectedImage] = useState(0); // latest tap always wins
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavourite, setIsFavourite] = useState(false);

  const handleDecrease = () => setQuantity(q => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity(q => q + 1);

  // ── Derived helpers ────────────────────────────────────────────────────────
  const isInStock = product?.stock > 0;
  const hasDiscount = product?.productDiscount > 0;
  const displayPrice = product?.finalPrice ?? product?.productPrice ?? 0;
  const hasImages = product?.productImages?.length > 0;
  const hasColors = product?.productColors?.length > 0;
  const hasSizes = product?.productSizes?.length > 0;
  const hasSpecs = product?.specifications?.length > 0;
  const hasVariants = product?.variants?.length > 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Icon name="alert-circle-outline" size={48} color="#e53935" />
        <Text style={styles.errorText}>Failed to load product.</Text>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.goBackBtn}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}>
          <Icon name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsFavourite(f => !f)}
          style={styles.headerBtn}
          activeOpacity={0.7}>
          <Icon
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavourite ? '#E53935' : '#1a1a1a'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Main Image ── */}
        <View style={styles.mainImageContainer}>
          {hasImages ? (
            <Image
              source={{uri: product.productImages[selectedImage]}}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Icon name="image-outline" size={48} color="#ccc" />
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </View>

        {/* ── Thumbnails
             Always show if more than 1 image.
             User can tap thumbnail OR color swatch — latest tap wins.
             Both just call setSelectedImage so they stay in sync. ── */}
        {hasImages && product.productImages.length > 1 && (
          <View style={styles.thumbnailRow}>
            {product.productImages.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                activeOpacity={0.8}
                style={[
                  styles.thumbnailWrapper,
                  selectedImage === index && styles.thumbnailWrapperActive,
                ]}>
                <Image
                  source={{uri: img}}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Info Card ── */}
        <View style={styles.infoCard}>
          {/* Price Row */}
          <View style={styles.priceRow}>
            {hasDiscount && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>
                  {product.productDiscount}% OFF
                </Text>
              </View>
            )}
            <Text style={styles.priceText}>${displayPrice.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                ${product.productPrice.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Product Name */}
          <Text style={styles.productName}>{product.productName}</Text>

          {/* Category + Tags */}
          <View style={styles.tagRow}>
            {product.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category}</Text>
              </View>
            ) : null}
            {product.tags?.map(tag => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Stock Status */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status: </Text>
            <Text
              style={[
                styles.statusValue,
                !isInStock && styles.statusOutOfStock,
              ]}>
              {isInStock ? `In Stock (${product.stock})` : 'Out of Stock'}
            </Text>
          </View>

          {/* Share */}
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
            <MaterialIcons name="share" size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ── Colors
               Tapping a color calls setSelectedImage(colorObj.index)
               which syncs main image + active thumbnail highlight ── */}
          {hasColors && (
            <>
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={styles.colorRow}>
                {product.productColors.map(colorObj => (
                  <TouchableOpacity
                    key={colorObj._id}
                    onPress={() => {
                      // setSelectedColor(colorObj._id); // highlight swatch
                      setSelectedColor(colorObj); // store full object
                      setSelectedImage(colorObj.index); // swap main image
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.colorSwatch,
                      {backgroundColor: colorObj.color}, // .color is the string e.g "red"
                      // selectedColor === colorObj._id
                      selectedColor?._id === colorObj._id &&
                        styles.colorSwatchSelected,
                    ]}>
                    {
                      // selectedColor === colorObj._id
                      selectedColor?._id === colorObj._id && (
                        <Icon name="checkmark" size={14} color="#fff" />
                      )
                    }
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Sizes ── */}
          {hasSizes && (
            <>
              <View style={styles.sizeTitleRow}>
                <Text style={styles.sectionLabel}>Size</Text>
              </View>
              <View style={styles.sizeRow}>
                {product.productSizes.map((size, index) => {
                  const isSelected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedSize(size)}
                      activeOpacity={0.8}
                      style={[
                        styles.sizeChip,
                        isSelected && styles.sizeChipSelected,
                      ]}>
                      {isSelected && (
                        <Icon
                          name="checkmark"
                          size={11}
                          color="#fff"
                          style={{marginRight: 3}}
                        />
                      )}
                      <Text
                        style={[
                          styles.sizeChipText,
                          isSelected && styles.sizeChipTextSelected,
                        ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Variants ── */}
          {hasVariants && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Variants</Text>
              {product.variants.map((variant, index) => (
                <View key={index} style={styles.variantRow}>
                  <Text style={styles.variantText}>
                    {JSON.stringify(variant)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── Description ── */}
        {product.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        {/* ── Warnings ── */}
        {product.warnings ? (
          <View style={[styles.section, styles.warningSection]}>
            <View style={styles.sectionHeader}>
              <Icon name="warning-outline" size={16} color="#F57F17" />
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  {color: '#F57F17', marginLeft: 6},
                ]}>
                Warnings
              </Text>
            </View>
            <Text style={styles.descriptionText}>{product.warnings}</Text>
          </View>
        ) : null}

        {/* ── Specifications ── */}
        {hasSpecs && (
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>
              Technical Specifications
            </Text>
            <View style={styles.specsTable}>
              {product.specifications.map((spec, i) => (
                <View
                  key={i}
                  style={[styles.specRow, i % 2 === 0 && styles.specRowAlt]}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={handleDecrease}
            style={styles.qtyBtn}
            activeOpacity={0.7}>
            <Icon name="remove" size={18} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity
            onPress={handleIncrease}
            style={styles.qtyBtn}
            activeOpacity={0.7}>
            <Icon name="add" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addToBagBtn, !isInStock && styles.addToBagBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleAddToBag}
          disabled={!isInStock || addToCart.isPending}>
          <Icon
            name="bag-handle-outline"
            size={20}
            color="#fff"
            style={{marginRight: 8}}
          />
          <Text style={styles.addToBagText}>
            {/* {isInStock ? 'Add to Bag' : 'Out of Stock'} */}
            {addToCart.isPending
              ? 'Adding...'
              : isInStock
              ? 'Add to Bag'
              : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Store_ProductDetail;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  // ── Centered screens (loading / error) ──
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  goBackBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
  },
  goBackBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Scroll ──
  scrollContent: {
    paddingBottom: 220,
  },

  // ── Main Image ──
  mainImageContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#eee',
    height: width * 0.72,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  noImageText: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 8,
  },

  // ── Thumbnails ──
  thumbnailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#e0e0e0',
  },
  thumbnailWrapperActive: {
    borderColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },

  // ── Info Card ──
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
  },

  // ── Price ──
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  saleBadge: {
    backgroundColor: '#FFF9C4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F57F17',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  originalPrice: {
    fontSize: 13,
    color: '#aaa',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },

  // ── Name ──
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },

  // ── Tags ──
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
  },
  tagBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBadgeText: {
    fontSize: 11,
    color: '#666',
  },

  // ── Status ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 13,
    color: '#888',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusOutOfStock: {
    color: '#E53935',
  },

  // ── Share ──
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 14,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },

  // ── Colors ──
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // ── Sizes ──
  sizeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  sizeChipSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  sizeChipTextSelected: {
    color: '#fff',
  },

  // ── Variants ──
  variantRow: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 6,
  },
  variantText: {
    fontSize: 12,
    color: '#555',
  },

  // ── Sections ──
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555',
    fontWeight: '400',
  },
  warningSection: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },

  // ── Specs ──
  specsTable: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  specRowAlt: {
    backgroundColor: '#f3f3f3',
  },
  specLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 108 : 96,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: '#f7f7f7',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    minWidth: 26,
    textAlign: 'center',
  },
  addToBagBtn: {
    flex: 1,
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
  addToBagBtnDisabled: {
    backgroundColor: '#9e9e9e',
    shadowOpacity: 0,
    elevation: 0,
  },
  addToBagText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   Image,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   SafeAreaView,
//   Platform,
//   Dimensions,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { useGetProductsId } from '../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';
// const {width} = Dimensions.get('window');

// // ─── Dummy Product Data ────────────────────────────────────────────────────────
// const PRODUCT = {
//   id: '1',
//   name: 'Nike Air Jordan 1 Retro',
//   brand: 'Nike Store',
//   rating: 4.8,
//   reviewCount: 120,
//   status: 'In Stock',
//   priceMin: 150.0,
//   priceMax: 175.0,
//   isSale: true,
//   images: [
//     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
//     'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=200&q=80',
//     'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200&q=80',
//     'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80',
//   ],
//   colors: [
//     {id: 'red',   hex: '#D32F2F'},
//     {id: 'navy',  hex: '#1A237E'},
//     {id: 'brown', hex: '#8D6E63'},
//     {id: 'white', hex: '#F5F5F5'},
//   ],
//   sizes: ['EU 38', 'EU 40', 'EU 42', 'EU 44'],
//   stockPerVariation: {
//     price: 175.0,
//     stock: 'In Stock',
//   },
//   description:
//     'The Air Jordan 1 Retro High OG brings back the classic silhouette with premium materials and iconic color blocking. Built for both style and performance, this sneaker features a durable leather upper, Air-Sole cushioning for lightweight comfort, and a solid rubber outsole for traction. A timeless classic reimagined for the modern streetwear enthusiast.',
//   specs: [
//     {label: 'Upper Material', value: 'Full-grain Leather'},
//     {label: 'Sole',           value: 'Rubber with Air-Sole unit'},
//     {label: 'Closure',        value: 'Lace-up'},
//     {label: 'Weight',         value: 'Approx. 400g'},
//   ],
//   reviews: [
//     {
//       id: '1',
//       name: 'John Doe',
//       avatar: 'https://i.pravatar.cc/150?img=11',
//       rating: 5,
//       text: 'Absolutely love these kicks! The comfort is unmatched and the style is timeless. Fast shipping too.',
//     },
//     {
//       id: '2',
//       name: 'Sarah M.',
//       avatar: 'https://i.pravatar.cc/150?img=5',
//       rating: 4,
//       text: 'Great quality for a half size up, as otherwise perfect.',
//     },
//   ],
// };

// // ─── Component ────────────────────────────────────────────────────────────────
// const Store_ProductDetail = ({navigation,route}) => {
//    const {productId} = route.params;

//    console.log('route productId', productId);

//   const [selectedImage, setSelectedImage]   = useState(0);
//   const [selectedColor, setSelectedColor]   = useState('red');
//   const [selectedSize, setSelectedSize]     = useState('EU 44');
//   const [quantity, setQuantity]             = useState(1);
//   const [isFavourite, setIsFavourite]       = useState(false);

//   const handleDecrease = () => setQuantity(q => Math.max(1, q - 1));
//   const handleIncrease = () => setQuantity(q => q + 1);

//   return (
//     <SafeAreaView style={styles.safe}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation?.goBack()}
//           style={styles.headerBtn}
//           activeOpacity={0.7}>
//           <Icon name="chevron-back" size={22} color="#1a1a1a" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => setIsFavourite(f => !f)}
//           style={styles.headerBtn}
//           activeOpacity={0.7}>
//           <Icon
//             name={isFavourite ? 'heart' : 'heart-outline'}
//             size={22}
//             color={isFavourite ? '#E53935' : '#1a1a1a'}
//           />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}>

//         {/* ── Main Image ── */}
//         <View style={styles.mainImageContainer}>
//           <Image
//             source={{uri: PRODUCT.images[selectedImage]}}
//             style={styles.mainImage}
//             resizeMode="cover"
//           />
//         </View>

//         {/* ── Thumbnails ── */}
//         <View style={styles.thumbnailRow}>
//           {PRODUCT.images.map((img, index) => (
//             <TouchableOpacity
//               key={index}
//               onPress={() => setSelectedImage(index)}
//               activeOpacity={0.8}
//               style={[
//                 styles.thumbnailWrapper,
//                 selectedImage === index && styles.thumbnailWrapperActive,
//               ]}>
//               <Image
//                 source={{uri: img}}
//                 style={styles.thumbnail}
//                 resizeMode="cover"
//               />
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* ── Info Card ── */}
//         <View style={styles.infoCard}>

//           {/* Rating + Share */}
//           <View style={styles.ratingRow}>
//             <View style={styles.ratingLeft}>
//               <Icon name="star" size={14} color="#FFC107" />
//               <Text style={styles.ratingValue}>{PRODUCT.rating}</Text>
//               <Text style={styles.ratingCount}>({PRODUCT.reviewCount} Reviews)</Text>
//             </View>
//             <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
//               <MaterialIcons name="share" size={20} color="#666" />
//             </TouchableOpacity>
//           </View>

//           {/* Sale Badge + Price */}
//           <View style={styles.priceRow}>
//             {PRODUCT.isSale && (
//               <View style={styles.saleBadge}>
//                 <Text style={styles.saleBadgeText}>SALE</Text>
//               </View>
//             )}
//             <Text style={styles.priceText}>
//               ${PRODUCT.priceMin.toFixed(2)} – ${PRODUCT.priceMax.toFixed(2)}
//             </Text>
//           </View>

//           {/* Product Name */}
//           <Text style={styles.productName}>{PRODUCT.name}</Text>

//           {/* Status */}
//           <View style={styles.statusRow}>
//             <Text style={styles.statusLabel}>Status: </Text>
//             <Text style={styles.statusValue}>{PRODUCT.status}</Text>
//           </View>

//           {/* Brand */}
//           <TouchableOpacity style={styles.brandRow} activeOpacity={0.7}>
//             <Icon name="storefront-outline" size={14} color="#555" />
//             <Text style={styles.brandText}>{PRODUCT.brand}</Text>
//             <Icon name="chevron-forward" size={14} color="#555" />
//           </TouchableOpacity>

//           {/* Divider */}
//           <View style={styles.divider} />

//           {/* Variation Header */}
//           <View style={styles.variationHeader}>
//             <Text style={styles.sectionTitle}>Variation:</Text>
//             <View style={styles.variationMeta}>
//               <Text style={styles.variationMetaText}>
//                 Price: ${PRODUCT.stockPerVariation.price.toFixed(1)}
//               </Text>
//               <Text style={styles.variationMetaText}>
//                 Stock: {PRODUCT.stockPerVariation.stock}
//               </Text>
//             </View>
//           </View>

//           {/* Color */}
//           <Text style={styles.sectionLabel}>Color</Text>
//           <View style={styles.colorRow}>
//             {PRODUCT.colors.map(color => (
//               <TouchableOpacity
//                 key={color.id}
//                 onPress={() => setSelectedColor(color.id)}
//                 activeOpacity={0.8}
//                 style={[
//                   styles.colorSwatch,
//                   {backgroundColor: color.hex},
//                   selectedColor === color.id && styles.colorSwatchSelected,
//                 ]}>
//                 {selectedColor === color.id && (
//                   <Icon name="checkmark" size={14} color="#fff" />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Size */}
//           <View style={styles.sizeTitleRow}>
//             <Text style={styles.sectionLabel}>Size</Text>
//             <TouchableOpacity activeOpacity={0.7}>
//               <Text style={styles.sizeGuideText}>Size Guide</Text>
//             </TouchableOpacity>
//           </View>
//           <View style={styles.sizeRow}>
//             {PRODUCT.sizes.map(size => {
//               const isSelected = selectedSize === size;
//               const isDisabled = size === 'EU 38'; // e.g. out of stock
//               return (
//                 <TouchableOpacity
//                   key={size}
//                   onPress={() => !isDisabled && setSelectedSize(size)}
//                   activeOpacity={0.8}
//                   style={[
//                     styles.sizeChip,
//                     isSelected  && styles.sizeChipSelected,
//                     isDisabled  && styles.sizeChipDisabled,
//                   ]}>
//                   {isSelected && (
//                     <Icon name="checkmark" size={11} color="#fff" style={{marginRight: 3}} />
//                   )}
//                   <Text
//                     style={[
//                       styles.sizeChipText,
//                       isSelected && styles.sizeChipTextSelected,
//                       isDisabled && styles.sizeChipTextDisabled,
//                     ]}>
//                     {size}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//         </View>

//         {/* ── Description ── */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionHeaderTitle}>Description</Text>
//             <TouchableOpacity activeOpacity={0.7}>
//               <Text style={styles.sectionHeaderLink}>Read more</Text>
//             </TouchableOpacity>
//           </View>
//           <Text style={styles.descriptionText}>{PRODUCT.description}</Text>
//         </View>

//         {/* ── Technical Specifications ── */}
//         <View style={styles.section}>
//           <Text style={styles.sectionHeaderTitle}>Technical Specifications</Text>
//           <View style={styles.specsTable}>
//             {PRODUCT.specs.map((spec, i) => (
//               <View
//                 key={spec.label}
//                 style={[styles.specRow, i % 2 === 0 && styles.specRowAlt]}>
//                 <Text style={styles.specLabel}>{spec.label}</Text>
//                 <Text style={styles.specValue}>{spec.value}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* ── Customer Reviews ── */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionHeaderTitle}>Customer Reviews</Text>
//             <TouchableOpacity activeOpacity={0.7}>
//               <Text style={styles.sectionHeaderLink}>View All ({PRODUCT.reviewCount})</Text>
//             </TouchableOpacity>
//           </View>
//           {PRODUCT.reviews.map(review => (
//             <View key={review.id} style={styles.reviewCard}>
//               <View style={styles.reviewTop}>
//                 <Image source={{uri: review.avatar}} style={styles.reviewAvatar} />
//                 <View style={{flex: 1}}>
//                   <Text style={styles.reviewName}>{review.name}</Text>
//                   <View style={styles.starsRow}>
//                     {[1, 2, 3, 4, 5].map(star => (
//                       <Icon
//                         key={star}
//                         name="star"
//                         size={12}
//                         color={star <= review.rating ? '#FFC107' : '#e0e0e0'}
//                         style={{marginRight: 2}}
//                       />
//                     ))}
//                   </View>
//                 </View>
//               </View>
//               <Text style={styles.reviewText}>{review.text}</Text>
//             </View>
//           ))}
//         </View>

//         {/* ── Product Details CTA ── */}
//         <TouchableOpacity style={styles.productDetailsBtn} activeOpacity={0.75}>
//           <Text style={styles.productDetailsBtnText}>PRODUCT DETAILS</Text>
//           <Icon name="chevron-forward" size={16} color="#1a1a1a" />
//         </TouchableOpacity>

//       </ScrollView>

//       {/* ── Bottom Bar: Qty + Add to Bag ── */}
//       <View style={styles.bottomBar}>
//         {/* Quantity */}
//         <View style={styles.qtyControl}>
//           <TouchableOpacity
//             onPress={handleDecrease}
//             style={styles.qtyBtn}
//             activeOpacity={0.7}>
//             <Icon name="remove" size={18} color="#1a1a1a" />
//           </TouchableOpacity>
//           <Text style={styles.qtyValue}>{quantity}</Text>
//           <TouchableOpacity
//             onPress={handleIncrease}
//             style={styles.qtyBtn}
//             activeOpacity={0.7}>
//             <Icon name="add" size={18} color="#1a1a1a" />
//           </TouchableOpacity>
//         </View>

//         {/* Add to Bag */}
//         <TouchableOpacity style={styles.addToBagBtn} activeOpacity={0.85}>
//           <Icon name="bag-handle-outline" size={20} color="#fff" style={{marginRight: 8}} />
//           <Text style={styles.addToBagText}>Add to Bag</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Store_ProductDetail;
