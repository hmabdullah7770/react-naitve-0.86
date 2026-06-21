import React, { useState,useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAddProduct } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';
import { StoreOwnerContext } from '../../../context/IsStoreOwner';
import { useNavigation } from '@react-navigation/native';

// ─── Palette & constants ───────────────────────────────────────────────────────
const BLUE       = '#2563EB';
const BLUE_LIGHT = '#EFF4FF';
const BORDER     = '#E4E7EC';
const BG         = '#F7F8FA';
const TEXT       = '#111827';
const MUTED      = '#6B7280';
const WHITE      = '#FFFFFF';
const DANGER     = '#EF4444';

const DEFAULT_SIZES      = ['S', 'M', 'L', 'XL'];
const DEFAULT_COLORS     = [
  { hex: '#111827', label: 'Black' },
  { hex: '#9CA3AF', label: 'Gray'  },
  { hex: '#3B82F6', label: 'Blue'  },
  { hex: '#EF4444', label: 'Red'   },
];
const DEFAULT_CATEGORIES = ['Apparel', 'Accessories', 'Electronics', 'Digital'];

// ─── Small reusable components ─────────────────────────────────────────────────
const SectionCard = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const LabelText = ({ children }) => (
  <Text style={styles.label}>{children}</Text>
);

const ToggleRow = ({ icon, title, value, onToggle }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLeft}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <Text style={styles.toggleTitle}>{title}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#D1D5DB', true: BLUE }}
      thumbColor={WHITE}
      ios_backgroundColor="#D1D5DB"
    />
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const Store_Add_Product = ({  route }) => {
  const { isStoreOwner } = useContext(StoreOwnerContext);
  const storeId = isStoreOwner;
  const navigation = useNavigation();

  console.log('🌐 Store_Add_Product — storeId:', storeId);

  const { mutate: addProduct, isPending } = useAddProduct();

  // ── Form state ────────────────────────────────────────────────────────────────
  const [productName,          setProductName]          = useState('');
  const [selectedCategory,     setSelectedCategory]     = useState('Apparel');
  const [categories,           setCategories]           = useState(DEFAULT_CATEGORIES);
  const [newCategoryInput,     setNewCategoryInput]     = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [productPrice,         setProductPrice]         = useState('');
  const [productDiscount,      setProductDiscount]      = useState('0');

  // ── Section toggles ───────────────────────────────────────────────────────────
  const [sizeEnabled,  setSizeEnabled]  = useState(true);
  const [colorEnabled, setColorEnabled] = useState(true);
  const [stockEnabled, setStockEnabled] = useState(true);
  const [descEnabled,  setDescEnabled]  = useState(false);
  const [warnEnabled,  setWarnEnabled]  = useState(false);
  const [tagsEnabled,  setTagsEnabled]  = useState(false);

  // ── Sizes ─────────────────────────────────────────────────────────────────────
  const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);
  const [selectedSizes,  setSelectedSizes]  = useState(['S', 'M']);
  const [newSizeInput,   setNewSizeInput]   = useState('');
  const [showSizeInput,  setShowSizeInput]  = useState(false);

  // ── Images ────────────────────────────────────────────────────────────────────
  const [mainImages,      setMainImages]      = useState([]);
  const [selectedThumbId, setSelectedThumbId] = useState('main-0');

  // ── Colors ────────────────────────────────────────────────────────────────────
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [colors,           setColors]           = useState(DEFAULT_COLORS);
  // colorImages now only stores { uri } — index is always computed fresh at submit time
  const [colorImages,  setColorImages]  = useState({});
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorHex,  setNewColorHex]  = useState('');

  // ── Stock & extras ────────────────────────────────────────────────────────────
  const [stock,            setStock]           = useState('100');
  const [description,      setDescription]     = useState('');
  const [warnings,         setWarnings]         = useState('');
  const [tags,             setTags]             = useState([]);
  const [tagInput,         setTagInput]         = useState('');
  const [variants,         setVariants]         = useState([]);
  const [variantInput,     setVariantInput]     = useState('');
  const [showVariantInput, setShowVariantInput] = useState(false);

  // ─── Image helpers ────────────────────────────────────────────────────────────
  const openGallery = (selectionLimit = 1) =>
    new Promise((resolve) => {
      launchImageLibrary(
        { mediaType: 'photo', quality: 0.85, selectionLimit, includeBase64: false },
        (response) => {
          if (response.didCancel || response.errorCode) resolve(null);
          else resolve(response.assets ?? []);
        },
      );
    });

  const pickImage = async (type = 'main') => {
    if (type === 'main') {
      const assets = await openGallery(0);
      if (!assets) return;
      const uris = assets.map((a) => a.uri);
      setMainImages((prev) => [...prev, ...uris]);
    } else {
      const assets = await openGallery(1);
      if (!assets || assets.length === 0) return;
      const uri         = assets[0].uri;
      const activeColor = colors[selectedColorIdx];
      // ✅ Only store the URI — index is calculated fresh at submit time in buildFormData
      setColorImages((prev) => ({
        ...prev,
        [activeColor.hex]: { uri },
      }));
    }
  };

  const removeMainImage = (idx) => {
    setMainImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);

      setSelectedThumbId((cur) => {
        if (!cur.startsWith('main-')) return cur;
        const curIdx = parseInt(cur.replace('main-', ''), 10);
        if (curIdx === idx)  return 'main-0';
        if (curIdx > idx)    return `main-${curIdx - 1}`;
        return cur;
      });

      return next;
    });
  };

  const removeColorImage = (hex) => {
    setSelectedThumbId((cur) => (cur === `color-${hex}` ? 'main-0' : cur));
    setColorImages((prev) => {
      const next = { ...prev };
      delete next[hex];
      return next;
    });
  };

  // ─── Size helpers ─────────────────────────────────────────────────────────────
  const toggleSize = (size) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );

  const addSize = () => {
    const s = newSizeInput.trim().toUpperCase();
    if (s && !availableSizes.includes(s)) {
      setAvailableSizes((prev) => [...prev, s]);
      setSelectedSizes((prev)  => [...prev, s]);
    }
    setNewSizeInput('');
    setShowSizeInput(false);
  };

  // ─── Category helpers ─────────────────────────────────────────────────────────
  const addCategory = () => {
    const c = newCategoryInput.trim();
    if (c && !categories.includes(c)) {
      setCategories((prev) => [...prev, c]);
      setSelectedCategory(c);
    }
    setNewCategoryInput('');
    setShowNewCategoryInput(false);
  };

  // ─── Tag / variant helpers ────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const addVariant = () => {
    const v = variantInput.trim();
    if (v && !variants.includes(v)) setVariants((prev) => [...prev, v]);
    setVariantInput('');
  };

  // ─── FormData builder ─────────────────────────────────────────────────────────
  /**
   * FIX: Color image indices are now calculated fresh at submit time.
   * Main images occupy slots 0…N, then color images are appended after them.
   * This means adding/removing main images after picking color images never
   * causes stale or colliding indices.
   */
  const buildFormData = () => {
    // 1. Start with all main images
    const allImages = [...mainImages];

    // 2. ✅ Append color images AFTER main images and record the real index now
    const parsedColors = colors
      .filter((c) => colorImages[c.hex])
      .map((c) => {
        const { uri } = colorImages[c.hex];
        const index   = allImages.length; // always appended at the current end
        allImages.push(uri);              // push — never overwrite an existing slot
        return { color: c.hex, index };
      });

    const formData = new FormData();

    // 3. Append images — React Native FormData accepts { uri, type, name }
    allImages.forEach((uri, i) => {
      if (!uri) return;
      const ext      = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append(`productImage${i}`, {
        uri,
        type: mimeType,
        name: `productImage${i}.${ext}`,
      });
    });

    // 4. Scalar text fields
    formData.append('productName',     productName.trim());
    formData.append('description',     description.trim());
    formData.append('warnings',        warnings.trim());
    formData.append('productPrice',    String(parseFloat(productPrice)));
    formData.append('productDiscount', String(parseFloat(productDiscount) || 0));
    formData.append('category',        selectedCategory);
    formData.append('stock',           String(parseInt(stock, 10) || 0));

    // 5. productColors as JSON string (controller does JSON.parse)
    formData.append('productColors', JSON.stringify(parsedColors));

    // 6. Array fields — repeated keys; multer builds them into arrays
    selectedSizes.forEach((s) => formData.append('productSizes', s));
    tags.forEach((t)           => formData.append('tags',        t));
    variants.forEach((v)       => formData.append('variants',    v));

    return formData;
  };

  // ─── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!storeId)
      return Alert.alert('Error', 'Store ID is missing. Please go back and try again.');
    if (!productName.trim())
      return Alert.alert('Required', 'Please enter a product name');
    if (!productPrice)
      return Alert.alert('Required', 'Please enter a product price');
    if (mainImages.length === 0)
      return Alert.alert('Required', 'Please upload at least one product image');

    const productData = buildFormData();

    addProduct(
      { storeId, productData },
      {
        onSuccess: () => {
           navigation.goBack();
          Alert.alert('Success', 'Product added successfully!', [
            { text: 'OK',  },
          ]);
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ??
            error?.message ??
            'Something went wrong. Please try again.';
          Alert.alert('Upload Failed', message);
        },
      },
    );
  };

  // ─── Derived display values ───────────────────────────────────────────────────
  const activeColor      = colors[selectedColorIdx];
  const activeColorImage = activeColor ? colorImages[activeColor.hex] : null;

  const allThumbs = [
    ...mainImages.map((uri, i) => ({ id: `main-${i}`, uri, type: 'main', idx: i })),
    ...colors
      .filter((c) => colorImages[c.hex])
      .map((c) => ({
        id:    `color-${c.hex}`,
        uri:   colorImages[c.hex].uri,
        type:  'color',
        hex:   c.hex,
        label: c.label,
      })),
  ];

  const selectedThumb     = allThumbs.find((t) => t.id === selectedThumbId) ?? allThumbs[0];
  const displayedTopImage = selectedThumb?.uri ?? null;

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
          disabled={isPending}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <TouchableOpacity>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Image Upload Card ── */}
        <SectionCard>
          {mainImages.length === 0 ? (
            <TouchableOpacity
              style={styles.imageBox}
              onPress={() => pickImage('main')}
              activeOpacity={0.8}
            >
              <View style={styles.imagePlaceholder}>
                <View style={styles.imageIconWrap}>
                  <Text style={styles.imageIconText}>🖼️</Text>
                </View>
                <Text style={styles.uploadTitle}>Upload Product Image</Text>
                <Text style={styles.uploadSub}>Tap to browse or take a photo</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              {/* Big preview */}
              <View style={styles.imageBox}>
                <Image source={{ uri: displayedTopImage }} style={styles.uploadedImage} />

                {selectedThumb?.type === 'main' && (
                  <TouchableOpacity
                    style={styles.imgRemoveBtn}
                    onPress={() => removeMainImage(selectedThumb.idx)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Text style={styles.imgRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}

                {selectedThumb?.type === 'color' && (
                  <>
                    <TouchableOpacity
                      style={styles.imgRemoveBtn}
                      onPress={() => removeColorImage(selectedThumb.hex)}
                      hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                    >
                      <Text style={styles.imgRemoveText}>✕</Text>
                    </TouchableOpacity>
                    <View style={[styles.colorBadge, { backgroundColor: selectedThumb.hex }]} />
                  </>
                )}
              </View>

              {/* Thumbnail strip */}
              <ScrollView
                horizontal
                style={styles.thumbStrip}
                contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingTop: 10 }}
                showsHorizontalScrollIndicator={false}
              >
                {allThumbs.map((thumb) => (
                  <View key={thumb.id} style={styles.thumbWrap}>
                    <TouchableOpacity
                      onPress={() => setSelectedThumbId(thumb.id)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: thumb.uri }}
                        style={[
                          styles.thumb,
                          selectedThumbId === thumb.id && styles.thumbActive,
                        ]}
                      />
                      {thumb.type === 'color' && (
                        <View style={[styles.thumbColorDot, { backgroundColor: thumb.hex }]} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.thumbRemoveBtn}
                      onPress={() =>
                        thumb.type === 'main'
                          ? removeMainImage(thumb.idx)
                          : removeColorImage(thumb.hex)
                      }
                      hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
                    >
                      <Text style={styles.thumbRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.thumbAddTile, { marginTop: 10 }]}
                  onPress={() => pickImage('main')}
                >
                  <Text style={styles.thumbAddText}>+</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.addMoreImgBtn} onPress={() => pickImage('main')}>
                <Text style={styles.addMoreImgText}>+ Add more images</Text>
              </TouchableOpacity>
            </>
          )}
        </SectionCard>

        {/* ── Product Info Card ── */}
        <SectionCard>
          <LabelText>PRODUCT NAME</LabelText>
          <TextInput
            style={styles.input}
            placeholder="Enter product name..."
            placeholderTextColor={MUTED}
            value={productName}
            onChangeText={setProductName}
          />

          <View style={styles.spacer12} />

          <LabelText>PRODUCT CATEGORY</LabelText>
          <View style={styles.chipsWrap}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}

            {showNewCategoryInput ? (
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Category..."
                  placeholderTextColor={MUTED}
                  value={newCategoryInput}
                  onChangeText={setNewCategoryInput}
                  onSubmitEditing={addCategory}
                  autoFocus
                />
                <TouchableOpacity onPress={addCategory} style={styles.inlineAddBtn}>
                  <Text style={styles.inlineAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.chip, styles.chipDashed]}
                onPress={() => setShowNewCategoryInput(true)}
              >
                <Text style={styles.chipText}>+ Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.spacer12} />

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <LabelText>PRICE ($)</LabelText>
              <View style={styles.priceInput}>
                <Text style={styles.priceCurrency}>$</Text>
                <TextInput
                  style={styles.priceField}
                  placeholder="0.00"
                  placeholderTextColor={MUTED}
                  keyboardType="decimal-pad"
                  value={productPrice}
                  onChangeText={setProductPrice}
                />
              </View>
            </View>
            <View style={styles.priceCol}>
              <LabelText>DISCOUNT (%)</LabelText>
              <View style={styles.priceInput}>
                <Text style={styles.priceCurrency}>%</Text>
                <TextInput
                  style={styles.priceField}
                  placeholder="0"
                  placeholderTextColor={MUTED}
                  keyboardType="decimal-pad"
                  value={productDiscount}
                  onChangeText={setProductDiscount}
                />
              </View>
            </View>
          </View>
        </SectionCard>

        {/* ── Product Size ── */}
        <SectionCard>
          <ToggleRow icon="📐" title="Product Size" value={sizeEnabled} onToggle={setSizeEnabled} />
          {sizeEnabled && (
            <View style={styles.sectionBody}>
              <View style={styles.chipsWrap}>
                {availableSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeChip, selectedSizes.includes(size) && styles.sizeChipActive]}
                    onPress={() => toggleSize(size)}
                  >
                    <Text style={[styles.sizeChipText, selectedSizes.includes(size) && styles.sizeChipTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}

                {showSizeInput ? (
                  <View style={styles.inlineInputRow}>
                    <TextInput
                      style={[styles.inlineInput, { width: 60 }]}
                      placeholder="XS"
                      placeholderTextColor={MUTED}
                      value={newSizeInput}
                      onChangeText={setNewSizeInput}
                      onSubmitEditing={addSize}
                      autoFocus
                      maxLength={5}
                    />
                    <TouchableOpacity onPress={addSize} style={styles.inlineAddBtn}>
                      <Text style={styles.inlineAddBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.sizeChipAdd} onPress={() => setShowSizeInput(true)}>
                    <Text style={styles.sizeChipAddText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── Product Color ── */}
        <SectionCard>
          <ToggleRow icon="🎨" title="Product Color" value={colorEnabled} onToggle={setColorEnabled} />
          {colorEnabled && (
            <View style={styles.sectionBody}>
              <View style={styles.colorDotsRow}>
                {colors.map((c, i) => (
                  <TouchableOpacity
                    key={c.hex}
                    onPress={() => setSelectedColorIdx(i)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c.hex },
                      selectedColorIdx === i && styles.colorDotActive,
                    ]}
                  />
                ))}

                {showAddColor ? (
                  <View style={styles.inlineInputRow}>
                    <View style={[styles.colorDotPreview, { backgroundColor: newColorHex || '#ccc' }]} />
                    <TextInput
                      style={[styles.inlineInput, { width: 90 }]}
                      placeholder="#FF0000"
                      placeholderTextColor={MUTED}
                      value={newColorHex}
                      onChangeText={setNewColorHex}
                      autoFocus
                      maxLength={7}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const hex = newColorHex.trim();
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          setColors((prev) => [...prev, { hex, label: hex }]);
                          setSelectedColorIdx(colors.length);
                        }
                        setNewColorHex('');
                        setShowAddColor(false);
                      }}
                      style={styles.inlineAddBtn}
                    >
                      <Text style={styles.inlineAddBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.colorDotAdd} onPress={() => setShowAddColor(true)}>
                    <Text style={styles.colorDotAddText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Image picker for selected color */}
              <TouchableOpacity
                style={styles.colorImagePicker}
                onPress={() => pickImage('color')}
                activeOpacity={0.75}
              >
                {activeColorImage ? (
                  <View style={styles.colorImagePreviewWrap}>
                    <Image source={{ uri: activeColorImage.uri }} style={styles.colorImagePreview} />
                    <View style={[styles.colorImageBadge, { backgroundColor: activeColor?.hex }]} />
                    <TouchableOpacity
                      style={styles.imgRemoveBtn}
                      onPress={() => removeColorImage(activeColor.hex)}
                      hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                    >
                      <Text style={styles.imgRemoveText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.colorImagePickerText}>
                      Tap to change image for{' '}
                      <Text style={{ fontWeight: '700' }}>{activeColor?.label}</Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.colorImagePickerInner}>
                    <Text style={styles.colorPickerIcon}>🖼️</Text>
                    <Text style={styles.colorImagePickerText}>
                      Select image of the product with{'\n'}
                      <Text style={{ fontWeight: '700' }}>
                        {activeColor ? activeColor.label : 'this'} color
                      </Text>
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Assigned color thumbnails mini-map */}
              {Object.keys(colorImages).length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {colors
                      .filter((c) => colorImages[c.hex])
                      .map((c) => (
                        <View key={c.hex} style={styles.assignedColorThumb}>
                          <Image source={{ uri: colorImages[c.hex].uri }} style={styles.assignedColorImg} />
                          <View style={[styles.assignedColorDot, { backgroundColor: c.hex }]} />
                          <TouchableOpacity
                            style={styles.thumbRemoveBtn}
                            onPress={() => removeColorImage(c.hex)}
                            hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
                          >
                            <Text style={styles.thumbRemoveText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Stock Amount ── */}
        <SectionCard>
          <ToggleRow icon="📦" title="Stock Amount" value={stockEnabled} onToggle={setStockEnabled} />
          {stockEnabled && (
            <View style={styles.sectionBody}>
              <LabelText>STOCK AMOUNT LEFT</LabelText>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                placeholderTextColor={MUTED}
              />
            </View>
          )}
        </SectionCard>

        {/* ── Product Variety ── */}
        <SectionCard>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>🏷️</Text>
              <Text style={styles.toggleTitle}>Product Variety</Text>
            </View>
            <TouchableOpacity
              style={styles.addVariantBtn}
              onPress={() => setShowVariantInput((v) => !v)}
            >
              <Text style={styles.addVariantBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {(showVariantInput || variants.length > 0) && (
            <View style={styles.sectionBody}>
              {variants.length > 0 && (
                <View style={styles.chipsWrap}>
                  {variants.map((v, i) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{v}</Text>
                      <TouchableOpacity
                        onPress={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Text style={styles.tagChipRemove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {showVariantInput && (
                <View style={[styles.inlineInputRow, { marginTop: variants.length > 0 ? 8 : 0 }]}>
                  <TextInput
                    style={[styles.inlineInput, { flex: 1 }]}
                    placeholder="e.g. Bundle, Pack of 3..."
                    placeholderTextColor={MUTED}
                    value={variantInput}
                    onChangeText={setVariantInput}
                    onSubmitEditing={addVariant}
                    autoFocus
                  />
                  <TouchableOpacity onPress={addVariant} style={styles.inlineAddBtn}>
                    <Text style={styles.inlineAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Product Description ── */}
        <SectionCard>
          <ToggleRow icon="📄" title="Product Description" value={descEnabled} onToggle={setDescEnabled} />
          {descEnabled && (
            <View style={styles.sectionBody}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your product..."
                placeholderTextColor={MUTED}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}
        </SectionCard>

        {/* ── Warning Message ── */}
        <SectionCard>
          <ToggleRow icon="⚠️" title="Warning Message" value={warnEnabled} onToggle={setWarnEnabled} />
          {warnEnabled && (
            <View style={styles.sectionBody}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any warnings or cautions..."
                placeholderTextColor={MUTED}
                value={warnings}
                onChangeText={setWarnings}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        </SectionCard>

        {/* ── Tags ── */}
        <SectionCard>
          <ToggleRow icon="🏷️" title="Tags" value={tagsEnabled} onToggle={setTagsEnabled} />
          {tagsEnabled && (
            <View style={styles.sectionBody}>
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={[styles.inlineInput, { flex: 1 }]}
                  placeholder="Add a tag and press enter..."
                  placeholderTextColor={MUTED}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity onPress={addTag} style={styles.inlineAddBtn}>
                  <Text style={styles.inlineAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={[styles.chipsWrap, { marginTop: 8 }]}>
                  {tags.map((tag, i) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{tag}</Text>
                      <TouchableOpacity
                        onPress={() => setTags((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Text style={styles.tagChipRemove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </SectionCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Save Button ── */}
      <View style={styles.saveContainer}>
        <TouchableOpacity
          style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <ActivityIndicator color={WHITE} size="small" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Text style={styles.saveBtnIcon}>💾  </Text>
              <Text style={styles.saveBtnText}>Save Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Store_Add_Product;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   WHITE,
    paddingTop:        Platform.OS === 'ios' ? 52 : StatusBar.currentHeight + 12,
    paddingBottom:     14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn:     { padding: 4 },
  backArrow:   { fontSize: 22, color: TEXT },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT, letterSpacing: 0.2 },
  exportText:  { fontSize: 15, fontWeight: '600', color: BLUE },

  card: {
    backgroundColor: WHITE,
    borderRadius:    14,
    padding:         16,
    marginBottom:    12,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },

  imageBox: {
    borderRadius:    10,
    overflow:        'hidden',
    backgroundColor: BLUE_LIGHT,
    minHeight:       170,
    justifyContent:  'center',
    alignItems:      'center',
  },
  imagePlaceholder: { alignItems: 'center', paddingVertical: 32 },
  imageIconWrap: {
    width:           56,
    height:          56,
    borderRadius:    14,
    backgroundColor: '#DBEAFE',
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    12,
  },
  imageIconText:  { fontSize: 26 },
  uploadTitle:    { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 4 },
  uploadSub:      { fontSize: 13, color: MUTED },
  uploadedImage:  { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 10 },
  colorBadge: {
    position:     'absolute',
    top:          10,
    right:        10,
    width:        20,
    height:       20,
    borderRadius: 10,
    borderWidth:  2,
    borderColor:  WHITE,
  },

  imgRemoveBtn: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent:  'center',
    alignItems:      'center',
    zIndex:          10,
  },
  imgRemoveText: { color: WHITE, fontSize: 12, fontWeight: '700', lineHeight: 14 },

  thumbStrip: { marginTop: 10 },
  thumbWrap: {
    position:     'relative',
    paddingTop:   10,
    paddingRight: 10,
  },
  thumb: {
    width:        56,
    height:       56,
    borderRadius: 10,
    borderWidth:  2,
    borderColor:  BORDER,
  },
  thumbActive:   { borderColor: BLUE },
  thumbColorDot: {
    position:     'absolute',
    bottom:       2,
    right:        12,
    width:        12,
    height:       12,
    borderRadius: 6,
    borderWidth:  1.5,
    borderColor:  WHITE,
  },
  thumbRemoveBtn: {
    position:        'absolute',
    top:             0,
    right:           0,
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: DANGER,
    justifyContent:  'center',
    alignItems:      'center',
    zIndex:          10,
    shadowColor:     '#000',
    shadowOpacity:   0.25,
    shadowRadius:    2,
    elevation:       4,
  },
  thumbRemoveText: { color: WHITE, fontSize: 10, fontWeight: '800', lineHeight: 12 },
  thumbAddTile: {
    width:           56,
    height:          56,
    borderRadius:    10,
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     BLUE,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: BLUE_LIGHT,
  },
  thumbAddText:   { fontSize: 24, color: BLUE, lineHeight: 28 },
  addMoreImgBtn:  { marginTop: 10, alignSelf: 'center' },
  addMoreImgText: { color: BLUE, fontSize: 13, fontWeight: '600' },

  label: {
    fontSize:      11,
    fontWeight:    '700',
    color:         MUTED,
    letterSpacing: 0.8,
    marginBottom:  8,
  },
  input: {
    borderWidth:       1,
    borderColor:       BORDER,
    borderRadius:      8,
    paddingHorizontal: 12,
    paddingVertical:   10,
    fontSize:          14,
    color:             TEXT,
    backgroundColor:   '#FAFAFA',
  },
  textArea: { height: 90, paddingTop: 10 },
  spacer12: { height: 12 },

  priceRow: { flexDirection: 'row', gap: 12 },
  priceCol: { flex: 1 },
  priceInput: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       BORDER,
    borderRadius:      8,
    backgroundColor:   '#FAFAFA',
    paddingHorizontal: 10,
  },
  priceCurrency: { fontSize: 14, color: MUTED, marginRight: 4 },
  priceField:    { flex: 1, paddingVertical: 10, fontSize: 14, color: TEXT },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    backgroundColor:   '#F3F4F6',
    borderWidth:       1,
    borderColor:       '#E5E7EB',
  },
  chipActive:     { backgroundColor: BLUE, borderColor: BLUE },
  chipDashed:     { borderStyle: 'dashed', borderColor: '#9CA3AF' },
  chipText:       { fontSize: 13, fontWeight: '600', color: TEXT },
  chipTextActive: { color: WHITE },

  sectionBody: { marginTop: 14 },

  sizeChip: {
    width:           40,
    height:          40,
    borderRadius:    8,
    borderWidth:     1.5,
    borderColor:     BORDER,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: WHITE,
  },
  sizeChipActive:     { backgroundColor: BLUE, borderColor: BLUE },
  sizeChipText:       { fontSize: 13, fontWeight: '700', color: TEXT },
  sizeChipTextActive: { color: WHITE },
  sizeChipAdd: {
    width:          40,
    height:         40,
    borderRadius:   8,
    borderWidth:    1.5,
    borderStyle:    'dashed',
    borderColor:    BLUE,
    justifyContent: 'center',
    alignItems:     'center',
  },
  sizeChipAddText: { fontSize: 20, color: BLUE, lineHeight: 24 },

  toggleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleIcon:  { fontSize: 18 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: TEXT },

  colorDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  colorDot: {
    width:        36,
    height:       36,
    borderRadius: 18,
    borderWidth:  2,
    borderColor:  'transparent',
  },
  colorDotActive: {
    borderColor:   BLUE,
    transform:     [{ scale: 1.15 }],
    shadowColor:   '#000',
    shadowOpacity: 0.18,
    shadowRadius:  4,
    elevation:     4,
  },
  colorDotAdd: {
    width:          36,
    height:         36,
    borderRadius:   18,
    borderWidth:    1.5,
    borderStyle:    'dashed',
    borderColor:    BLUE,
    justifyContent: 'center',
    alignItems:     'center',
  },
  colorDotAddText: { fontSize: 20, color: BLUE, lineHeight: 24 },
  colorDotPreview: {
    width:        24,
    height:       24,
    borderRadius: 12,
    borderWidth:  1,
    borderColor:  BORDER,
    marginRight:  4,
  },

  colorImagePicker: {
    marginTop:       12,
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     BLUE,
    borderRadius:    10,
    padding:         14,
    alignItems:      'center',
    backgroundColor: BLUE_LIGHT,
  },
  colorImagePickerInner: { alignItems: 'center', gap: 6 },
  colorPickerIcon:       { fontSize: 22 },
  colorImagePickerText:  { fontSize: 13, color: BLUE, textAlign: 'center', lineHeight: 19 },
  colorImagePreviewWrap: { alignItems: 'center', gap: 6, width: '100%', position: 'relative' },
  colorImagePreview:     { width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' },
  colorImageBadge: {
    position:     'absolute',
    top:          8,
    right:        8,
    width:        18,
    height:       18,
    borderRadius: 9,
    borderWidth:  2,
    borderColor:  WHITE,
  },

  assignedColorThumb: { paddingTop: 10, paddingRight: 10 },
  assignedColorImg: {
    width:        52,
    height:       52,
    borderRadius: 8,
    borderWidth:  1,
    borderColor:  BORDER,
  },
  assignedColorDot: {
    position:     'absolute',
    bottom:       2,
    right:        12,
    width:        14,
    height:       14,
    borderRadius: 7,
    borderWidth:  1.5,
    borderColor:  WHITE,
  },

  addVariantBtn:     { paddingHorizontal: 12, paddingVertical: 5 },
  addVariantBtnText: { fontSize: 14, fontWeight: '600', color: BLUE },

  tagChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   BLUE_LIGHT,
    borderRadius:      16,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap:               4,
  },
  tagChipText:   { fontSize: 13, color: BLUE, fontWeight: '600' },
  tagChipRemove: { fontSize: 16, color: BLUE, lineHeight: 18 },

  inlineInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineInput: {
    borderWidth:       1,
    borderColor:       BORDER,
    borderRadius:      8,
    paddingHorizontal: 10,
    paddingVertical:   7,
    fontSize:          13,
    color:             TEXT,
    backgroundColor:   '#FAFAFA',
  },
  inlineAddBtn:     { backgroundColor: BLUE, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  inlineAddBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  saveContainer: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    backgroundColor:   WHITE,
    paddingHorizontal: 16,
    paddingVertical:   12,
    paddingBottom:     Platform.OS === 'ios' ? 100 : 100,
    borderTopWidth:    1,
    borderTopColor:    BORDER,
  },
  saveBtn: {
    backgroundColor: BLUE,
    borderRadius:    12,
    paddingVertical: 15,
    flexDirection:   'row',
    justifyContent:  'center',
    alignItems:      'center',
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnIcon:     { fontSize: 17, color: WHITE },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.3 },
});

// import React, { useState,useContext } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   Switch,
//   Platform,
//   Alert,
//   StatusBar,
//   KeyboardAvoidingView,
//   ActivityIndicator,
// } from 'react-native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { useAddProduct } from '../../../ReactQuery/TanStackQueryHooks/storee/useStoreProducts';
// import { StoreOwnerContext } from '../../../context/IsStoreOwner';

// // ─── Palette & constants ───────────────────────────────────────────────────────
// const BLUE       = '#2563EB';
// const BLUE_LIGHT = '#EFF4FF';
// const BORDER     = '#E4E7EC';
// const BG         = '#F7F8FA';
// const TEXT       = '#111827';
// const MUTED      = '#6B7280';
// const WHITE      = '#FFFFFF';
// const DANGER     = '#EF4444';

// const DEFAULT_SIZES      = ['S', 'M', 'L', 'XL'];
// const DEFAULT_COLORS     = [
//   { hex: '#111827', label: 'Black' },
//   { hex: '#9CA3AF', label: 'Gray'  },
//   { hex: '#3B82F6', label: 'Blue'  },
//   { hex: '#EF4444', label: 'Red'   },
// ];
// const DEFAULT_CATEGORIES = ['Apparel', 'Accessories', 'Electronics', 'Digital'];

// // ─── Small reusable components ─────────────────────────────────────────────────
// const SectionCard = ({ children, style }) => (
//   <View style={[styles.card, style]}>{children}</View>
// );

// const LabelText = ({ children }) => (
//   <Text style={styles.label}>{children}</Text>
// );

// const ToggleRow = ({ icon, title, value, onToggle }) => (
//   <View style={styles.toggleRow}>
//     <View style={styles.toggleLeft}>
//       <Text style={styles.toggleIcon}>{icon}</Text>
//       <Text style={styles.toggleTitle}>{title}</Text>
//     </View>
//     <Switch
//       value={value}
//       onValueChange={onToggle}
//       trackColor={{ false: '#D1D5DB', true: BLUE }}
//       thumbColor={WHITE}
//       ios_backgroundColor="#D1D5DB"
//     />
//   </View>
// );

// // ─── Main Screen ───────────────────────────────────────────────────────────────
// const Store_Add_Product = ({ navigation, route }) => {
//   // storeId comes from the navigator — e.g. navigation.navigate('AddProduct', { storeId })
  
//    const { isStoreOwner } = useContext(StoreOwnerContext)
//   // const storeId = route?.params?.storeId;
//   const storeId = isStoreOwner;

//   console.log('🌐 Store_Add_Product — storeId:', storeId);

//   const { mutate: addProduct, isPending } = useAddProduct();

//   // ── Form state ────────────────────────────────────────────────────────────────
//   const [productName,          setProductName]          = useState('');
//   const [selectedCategory,     setSelectedCategory]     = useState('Apparel');
//   const [categories,           setCategories]           = useState(DEFAULT_CATEGORIES);
//   const [newCategoryInput,     setNewCategoryInput]     = useState('');
//   const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
//   const [productPrice,         setProductPrice]         = useState('');
//   const [productDiscount,      setProductDiscount]      = useState('0');

//   // ── Section toggles ───────────────────────────────────────────────────────────
//   const [sizeEnabled,  setSizeEnabled]  = useState(true);
//   const [colorEnabled, setColorEnabled] = useState(true);
//   const [stockEnabled, setStockEnabled] = useState(true);
//   const [descEnabled,  setDescEnabled]  = useState(false);
//   const [warnEnabled,  setWarnEnabled]  = useState(false);
//   const [tagsEnabled,  setTagsEnabled]  = useState(false);

//   // ── Sizes ─────────────────────────────────────────────────────────────────────
//   const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);
//   const [selectedSizes,  setSelectedSizes]  = useState(['S', 'M']);
//   const [newSizeInput,   setNewSizeInput]   = useState('');
//   const [showSizeInput,  setShowSizeInput]  = useState(false);

//   // ── Images ────────────────────────────────────────────────────────────────────
//   // selectedThumbId = 'main-{i}' | 'color-{hex}'
//   const [mainImages,      setMainImages]      = useState([]);
//   const [selectedThumbId, setSelectedThumbId] = useState('main-0');

//   // ── Colors ────────────────────────────────────────────────────────────────────
//   const [selectedColorIdx, setSelectedColorIdx] = useState(0);
//   const [colors,           setColors]           = useState(DEFAULT_COLORS);
//   // colorImages: { [hex]: { uri: string, productImagesIndex: number } }
//   const [colorImages,  setColorImages]  = useState({});
//   const [showAddColor, setShowAddColor] = useState(false);
//   const [newColorHex,  setNewColorHex]  = useState('');

//   // ── Stock & extras ────────────────────────────────────────────────────────────
//   const [stock,            setStock]           = useState('100');
//   const [description,      setDescription]     = useState('');
//   const [warnings,         setWarnings]         = useState('');
//   const [tags,             setTags]             = useState([]);
//   const [tagInput,         setTagInput]         = useState('');
//   const [variants,         setVariants]         = useState([]);
//   const [variantInput,     setVariantInput]     = useState('');
//   const [showVariantInput, setShowVariantInput] = useState(false);

//   // ─── Image helpers ────────────────────────────────────────────────────────────
//   const openGallery = (selectionLimit = 1) =>
//     new Promise((resolve) => {
//       launchImageLibrary(
//         { mediaType: 'photo', quality: 0.85, selectionLimit, includeBase64: false },
//         (response) => {
//           if (response.didCancel || response.errorCode) resolve(null);
//           else resolve(response.assets ?? []);
//         },
//       );
//     });

//   const pickImage = async (type = 'main') => {
//     if (type === 'main') {
//       const assets = await openGallery(0); // 0 = unlimited
//       if (!assets) return;
//       const uris = assets.map((a) => a.uri);
//       setMainImages((prev) => [...prev, ...uris]);
//     } else {
//       const assets = await openGallery(1);
//       if (!assets || assets.length === 0) return;
//       const uri           = assets[0].uri;
//       const activeColor   = colors[selectedColorIdx];
//       const alreadyHas    = !!colorImages[activeColor.hex];
//       const existingCount = Object.keys(colorImages).length;
//       const productImagesIndex = alreadyHas
//         ? colorImages[activeColor.hex].productImagesIndex
//         : mainImages.length + existingCount;

//       setColorImages((prev) => ({
//         ...prev,
//         [activeColor.hex]: { uri, productImagesIndex },
//       }));
//     }
//   };

//   const removeMainImage = (idx) => {
//     setMainImages((prev) => {
//       const next = prev.filter((_, i) => i !== idx);

//       setSelectedThumbId((cur) => {
//         if (!cur.startsWith('main-')) return cur;
//         const curIdx = parseInt(cur.replace('main-', ''), 10);
//         if (curIdx === idx)  return 'main-0';
//         if (curIdx > idx)    return `main-${curIdx - 1}`;
//         return cur;
//       });

//       setColorImages((prevCI) => {
//         const updated = {};
//         Object.entries(prevCI).forEach(([hex, ci]) => {
//           if (ci.productImagesIndex === idx) return;
//           updated[hex] = {
//             ...ci,
//             productImagesIndex:
//               ci.productImagesIndex > idx
//                 ? ci.productImagesIndex - 1
//                 : ci.productImagesIndex,
//           };
//         });
//         return updated;
//       });

//       return next;
//     });
//   };

//   const removeColorImage = (hex) => {
//     setSelectedThumbId((cur) => (cur === `color-${hex}` ? 'main-0' : cur));
//     setColorImages((prev) => {
//       const removed = prev[hex];
//       const next    = { ...prev };
//       delete next[hex];
//       if (removed) {
//         Object.keys(next).forEach((h) => {
//           if (next[h].productImagesIndex > removed.productImagesIndex) {
//             next[h] = {
//               ...next[h],
//               productImagesIndex: next[h].productImagesIndex - 1,
//             };
//           }
//         });
//       }
//       return next;
//     });
//   };

//   // ─── Size helpers ─────────────────────────────────────────────────────────────
//   const toggleSize = (size) =>
//     setSelectedSizes((prev) =>
//       prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
//     );

//   const addSize = () => {
//     const s = newSizeInput.trim().toUpperCase();
//     if (s && !availableSizes.includes(s)) {
//       setAvailableSizes((prev) => [...prev, s]);
//       setSelectedSizes((prev)  => [...prev, s]);
//     }
//     setNewSizeInput('');
//     setShowSizeInput(false);
//   };

//   // ─── Category helpers ─────────────────────────────────────────────────────────
//   const addCategory = () => {
//     const c = newCategoryInput.trim();
//     if (c && !categories.includes(c)) {
//       setCategories((prev) => [...prev, c]);
//       setSelectedCategory(c);
//     }
//     setNewCategoryInput('');
//     setShowNewCategoryInput(false);
//   };

//   // ─── Tag / variant helpers ────────────────────────────────────────────────────
//   const addTag = () => {
//     const t = tagInput.trim();
//     if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
//     setTagInput('');
//   };

//   const addVariant = () => {
//     const v = variantInput.trim();
//     if (v && !variants.includes(v)) setVariants((prev) => [...prev, v]);
//     setVariantInput('');
//   };

//   // ─── FormData builder ─────────────────────────────────────────────────────────
//   /**
//    * The backend uses multer upload.any() so the request MUST be multipart/form-data.
//    *
//    * Image slot layout (must match what the controller expects):
//    *   productImage0 … productImageN  →  ordered array; each slot is either a
//    *   main gallery image or a per-color image, placed at its productImagesIndex.
//    *
//    * productColors is sent as a JSON string; the controller does JSON.parse() on it.
//    * Array fields (productSizes, tags, variants) use repeated keys so multer
//    * collects them into arrays automatically.
//    */
//   const buildFormData = () => {
//     // 1. Build the fully ordered image-URI array
//     const allImages    = [...mainImages];
//     const parsedColors = colors
//       .filter((c) => colorImages[c.hex])
//       .map((c) => {
//         const ci = colorImages[c.hex];
//         // Fill the color-image slot if it isn't already occupied by a main image
//         if (!allImages[ci.productImagesIndex]) {
//           allImages[ci.productImagesIndex] = ci.uri;
//         }
//         return { color: c.hex, index: ci.productImagesIndex };
//       });

//     const formData = new FormData();

//     // 2. Append images — React Native FormData accepts { uri, type, name }
//     allImages.forEach((uri, i) => {
//       if (!uri) return; // skip any gaps
//       const ext      = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
//       const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
//       formData.append(`productImage${i}`, {
//         uri,
//         type: mimeType,
//         name: `productImage${i}.${ext}`,
//       });
//     });

//     // 3. Scalar text fields
//     formData.append('productName',     productName.trim());
//     formData.append('description',     description.trim());
//     formData.append('warnings',        warnings.trim());
//     formData.append('productPrice',    String(parseFloat(productPrice)));
//     formData.append('productDiscount', String(parseFloat(productDiscount) || 0));
//     formData.append('category',        selectedCategory);
//     formData.append('stock',           String(parseInt(stock, 10) || 0));

//     // 4. productColors as JSON string (controller does JSON.parse)
//     formData.append('productColors', JSON.stringify(parsedColors));

//     // 5. Array fields — repeated keys; multer builds them into arrays
//     selectedSizes.forEach((s) => formData.append('productSizes', s));
//     tags.forEach((t)           => formData.append('tags',        t));
//     variants.forEach((v)       => formData.append('variants',    v));

//     return formData;
//   };

//   // ─── Save handler ─────────────────────────────────────────────────────────────
//   const handleSave = () => {
//     if (!storeId)
//       return Alert.alert('Error', 'Store ID is missing. Please go back and try again.');
//     if (!productName.trim())
//       return Alert.alert('Required', 'Please enter a product name');
//     if (!productPrice)
//       return Alert.alert('Required', 'Please enter a product price');
//     if (mainImages.length === 0)
//       return Alert.alert('Required', 'Please upload at least one product image');

//     const productData = buildFormData();

//     addProduct(
//       { storeId, productData },
//       {
//         onSuccess: () => {
//           Alert.alert('Success', 'Product added successfully!', [
//             { text: 'OK', onPress: () => navigation?.goBack() },
//           ]);
//         },
//         onError: (error) => {
//           // Unwrap Axios error message from the backend's ApiError shape
//           const message =
//             error?.response?.data?.message ??
//             error?.message ??
//             'Something went wrong. Please try again.';
//           Alert.alert('Upload Failed', message);
//         },
//       },
//     );
//   };

//   // ─── Derived display values ───────────────────────────────────────────────────
//   const activeColor      = colors[selectedColorIdx];
//   const activeColorImage = activeColor ? colorImages[activeColor.hex] : null;

//   const allThumbs = [
//     ...mainImages.map((uri, i) => ({ id: `main-${i}`, uri, type: 'main', idx: i })),
//     ...colors
//       .filter((c) => colorImages[c.hex])
//       .map((c) => ({
//         id:    `color-${c.hex}`,
//         uri:   colorImages[c.hex].uri,
//         type:  'color',
//         hex:   c.hex,
//         label: c.label,
//       })),
//   ];

//   const selectedThumb     = allThumbs.find((t) => t.id === selectedThumbId) ?? allThumbs[0];
//   const displayedTopImage = selectedThumb?.uri ?? null;

//   // ─── RENDER ───────────────────────────────────────────────────────────────────
//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation?.goBack()}
//           style={styles.backBtn}
//           disabled={isPending}
//         >
//           <Text style={styles.backArrow}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Add Product</Text>
//         <TouchableOpacity>
//           <Text style={styles.exportText}>Export</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Image Upload Card ── */}
//         <SectionCard>
//           {mainImages.length === 0 ? (
//             <TouchableOpacity
//               style={styles.imageBox}
//               onPress={() => pickImage('main')}
//               activeOpacity={0.8}
//             >
//               <View style={styles.imagePlaceholder}>
//                 <View style={styles.imageIconWrap}>
//                   <Text style={styles.imageIconText}>🖼️</Text>
//                 </View>
//                 <Text style={styles.uploadTitle}>Upload Product Image</Text>
//                 <Text style={styles.uploadSub}>Tap to browse or take a photo</Text>
//               </View>
//             </TouchableOpacity>
//           ) : (
//             <>
//               {/* Big preview */}
//               <View style={styles.imageBox}>
//                 <Image source={{ uri: displayedTopImage }} style={styles.uploadedImage} />

//                 {selectedThumb?.type === 'main' && (
//                   <TouchableOpacity
//                     style={styles.imgRemoveBtn}
//                     onPress={() => removeMainImage(selectedThumb.idx)}
//                     hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
//                   >
//                     <Text style={styles.imgRemoveText}>✕</Text>
//                   </TouchableOpacity>
//                 )}

//                 {selectedThumb?.type === 'color' && (
//                   <>
//                     <TouchableOpacity
//                       style={styles.imgRemoveBtn}
//                       onPress={() => removeColorImage(selectedThumb.hex)}
//                       hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
//                     >
//                       <Text style={styles.imgRemoveText}>✕</Text>
//                     </TouchableOpacity>
//                     <View style={[styles.colorBadge, { backgroundColor: selectedThumb.hex }]} />
//                   </>
//                 )}
//               </View>

//               {/* Thumbnail strip */}
//               <ScrollView
//                 horizontal
//                 style={styles.thumbStrip}
//                 contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingTop: 10 }}
//                 showsHorizontalScrollIndicator={false}
//               >
//                 {allThumbs.map((thumb) => (
//                   <View key={thumb.id} style={styles.thumbWrap}>
//                     <TouchableOpacity
//                       onPress={() => setSelectedThumbId(thumb.id)}
//                       activeOpacity={0.8}
//                     >
//                       <Image
//                         source={{ uri: thumb.uri }}
//                         style={[
//                           styles.thumb,
//                           selectedThumbId === thumb.id && styles.thumbActive,
//                         ]}
//                       />
//                       {thumb.type === 'color' && (
//                         <View style={[styles.thumbColorDot, { backgroundColor: thumb.hex }]} />
//                       )}
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.thumbRemoveBtn}
//                       onPress={() =>
//                         thumb.type === 'main'
//                           ? removeMainImage(thumb.idx)
//                           : removeColorImage(thumb.hex)
//                       }
//                       hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
//                     >
//                       <Text style={styles.thumbRemoveText}>✕</Text>
//                     </TouchableOpacity>
//                   </View>
//                 ))}

//                 <TouchableOpacity
//                   style={[styles.thumbAddTile, { marginTop: 10 }]}
//                   onPress={() => pickImage('main')}
//                 >
//                   <Text style={styles.thumbAddText}>+</Text>
//                 </TouchableOpacity>
//               </ScrollView>

//               <TouchableOpacity style={styles.addMoreImgBtn} onPress={() => pickImage('main')}>
//                 <Text style={styles.addMoreImgText}>+ Add more images</Text>
//               </TouchableOpacity>
//             </>
//           )}
//         </SectionCard>

//         {/* ── Product Info Card ── */}
//         <SectionCard>
//           <LabelText>PRODUCT NAME</LabelText>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter product name..."
//             placeholderTextColor={MUTED}
//             value={productName}
//             onChangeText={setProductName}
//           />

//           <View style={styles.spacer12} />

//           <LabelText>PRODUCT CATEGORY</LabelText>
//           <View style={styles.chipsWrap}>
//             {categories.map((cat) => (
//               <TouchableOpacity
//                 key={cat}
//                 style={[styles.chip, selectedCategory === cat && styles.chipActive]}
//                 onPress={() => setSelectedCategory(cat)}
//               >
//                 <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
//                   {cat}
//                 </Text>
//               </TouchableOpacity>
//             ))}

//             {showNewCategoryInput ? (
//               <View style={styles.inlineInputRow}>
//                 <TextInput
//                   style={styles.inlineInput}
//                   placeholder="Category..."
//                   placeholderTextColor={MUTED}
//                   value={newCategoryInput}
//                   onChangeText={setNewCategoryInput}
//                   onSubmitEditing={addCategory}
//                   autoFocus
//                 />
//                 <TouchableOpacity onPress={addCategory} style={styles.inlineAddBtn}>
//                   <Text style={styles.inlineAddBtnText}>Add</Text>
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 style={[styles.chip, styles.chipDashed]}
//                 onPress={() => setShowNewCategoryInput(true)}
//               >
//                 <Text style={styles.chipText}>+ Add New</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           <View style={styles.spacer12} />

//           <View style={styles.priceRow}>
//             <View style={styles.priceCol}>
//               <LabelText>PRICE ($)</LabelText>
//               <View style={styles.priceInput}>
//                 <Text style={styles.priceCurrency}>$</Text>
//                 <TextInput
//                   style={styles.priceField}
//                   placeholder="0.00"
//                   placeholderTextColor={MUTED}
//                   keyboardType="decimal-pad"
//                   value={productPrice}
//                   onChangeText={setProductPrice}
//                 />
//               </View>
//             </View>
//             <View style={styles.priceCol}>
//               <LabelText>DISCOUNT (%)</LabelText>
//               <View style={styles.priceInput}>
//                 <Text style={styles.priceCurrency}>%</Text>
//                 <TextInput
//                   style={styles.priceField}
//                   placeholder="0"
//                   placeholderTextColor={MUTED}
//                   keyboardType="decimal-pad"
//                   value={productDiscount}
//                   onChangeText={setProductDiscount}
//                 />
//               </View>
//             </View>
//           </View>
//         </SectionCard>

//         {/* ── Product Size ── */}
//         <SectionCard>
//           <ToggleRow icon="📐" title="Product Size" value={sizeEnabled} onToggle={setSizeEnabled} />
//           {sizeEnabled && (
//             <View style={styles.sectionBody}>
//               <View style={styles.chipsWrap}>
//                 {availableSizes.map((size) => (
//                   <TouchableOpacity
//                     key={size}
//                     style={[styles.sizeChip, selectedSizes.includes(size) && styles.sizeChipActive]}
//                     onPress={() => toggleSize(size)}
//                   >
//                     <Text style={[styles.sizeChipText, selectedSizes.includes(size) && styles.sizeChipTextActive]}>
//                       {size}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}

//                 {showSizeInput ? (
//                   <View style={styles.inlineInputRow}>
//                     <TextInput
//                       style={[styles.inlineInput, { width: 60 }]}
//                       placeholder="XS"
//                       placeholderTextColor={MUTED}
//                       value={newSizeInput}
//                       onChangeText={setNewSizeInput}
//                       onSubmitEditing={addSize}
//                       autoFocus
//                       maxLength={5}
//                     />
//                     <TouchableOpacity onPress={addSize} style={styles.inlineAddBtn}>
//                       <Text style={styles.inlineAddBtnText}>✓</Text>
//                     </TouchableOpacity>
//                   </View>
//                 ) : (
//                   <TouchableOpacity style={styles.sizeChipAdd} onPress={() => setShowSizeInput(true)}>
//                     <Text style={styles.sizeChipAddText}>+</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Product Color ── */}
//         <SectionCard>
//           <ToggleRow icon="🎨" title="Product Color" value={colorEnabled} onToggle={setColorEnabled} />
//           {colorEnabled && (
//             <View style={styles.sectionBody}>
//               <View style={styles.colorDotsRow}>
//                 {colors.map((c, i) => (
//                   <TouchableOpacity
//                     key={c.hex}
//                     onPress={() => setSelectedColorIdx(i)}
//                     style={[
//                       styles.colorDot,
//                       { backgroundColor: c.hex },
//                       selectedColorIdx === i && styles.colorDotActive,
//                     ]}
//                   />
//                 ))}

//                 {showAddColor ? (
//                   <View style={styles.inlineInputRow}>
//                     <View style={[styles.colorDotPreview, { backgroundColor: newColorHex || '#ccc' }]} />
//                     <TextInput
//                       style={[styles.inlineInput, { width: 90 }]}
//                       placeholder="#FF0000"
//                       placeholderTextColor={MUTED}
//                       value={newColorHex}
//                       onChangeText={setNewColorHex}
//                       autoFocus
//                       maxLength={7}
//                     />
//                     <TouchableOpacity
//                       onPress={() => {
//                         const hex = newColorHex.trim();
//                         if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
//                           setColors((prev) => [...prev, { hex, label: hex }]);
//                           setSelectedColorIdx(colors.length);
//                         }
//                         setNewColorHex('');
//                         setShowAddColor(false);
//                       }}
//                       style={styles.inlineAddBtn}
//                     >
//                       <Text style={styles.inlineAddBtnText}>✓</Text>
//                     </TouchableOpacity>
//                   </View>
//                 ) : (
//                   <TouchableOpacity style={styles.colorDotAdd} onPress={() => setShowAddColor(true)}>
//                     <Text style={styles.colorDotAddText}>+</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>

//               {/* Image picker for selected color */}
//               <TouchableOpacity
//                 style={styles.colorImagePicker}
//                 onPress={() => pickImage('color')}
//                 activeOpacity={0.75}
//               >
//                 {activeColorImage ? (
//                   <View style={styles.colorImagePreviewWrap}>
//                     <Image source={{ uri: activeColorImage.uri }} style={styles.colorImagePreview} />
//                     <View style={[styles.colorImageBadge, { backgroundColor: activeColor?.hex }]} />
//                     <TouchableOpacity
//                       style={styles.imgRemoveBtn}
//                       onPress={() => removeColorImage(activeColor.hex)}
//                       hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
//                     >
//                       <Text style={styles.imgRemoveText}>✕</Text>
//                     </TouchableOpacity>
//                     <Text style={styles.colorImagePickerText}>
//                       Tap to change image for{' '}
//                       <Text style={{ fontWeight: '700' }}>{activeColor?.label}</Text>
//                     </Text>
//                   </View>
//                 ) : (
//                   <View style={styles.colorImagePickerInner}>
//                     <Text style={styles.colorPickerIcon}>🖼️</Text>
//                     <Text style={styles.colorImagePickerText}>
//                       Select image of the product with{'\n'}
//                       <Text style={{ fontWeight: '700' }}>
//                         {activeColor ? activeColor.label : 'this'} color
//                       </Text>
//                     </Text>
//                   </View>
//                 )}
//               </TouchableOpacity>

//               {/* Assigned color thumbnails mini-map */}
//               {Object.keys(colorImages).length > 0 && (
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
//                   <View style={{ flexDirection: 'row', gap: 8 }}>
//                     {colors
//                       .filter((c) => colorImages[c.hex])
//                       .map((c) => (
//                         <View key={c.hex} style={styles.assignedColorThumb}>
//                           <Image source={{ uri: colorImages[c.hex].uri }} style={styles.assignedColorImg} />
//                           <View style={[styles.assignedColorDot, { backgroundColor: c.hex }]} />
//                           <TouchableOpacity
//                             style={styles.thumbRemoveBtn}
//                             onPress={() => removeColorImage(c.hex)}
//                             hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
//                           >
//                             <Text style={styles.thumbRemoveText}>✕</Text>
//                           </TouchableOpacity>
//                         </View>
//                       ))}
//                   </View>
//                 </ScrollView>
//               )}
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Stock Amount ── */}
//         <SectionCard>
//           <ToggleRow icon="📦" title="Stock Amount" value={stockEnabled} onToggle={setStockEnabled} />
//           {stockEnabled && (
//             <View style={styles.sectionBody}>
//               <LabelText>STOCK AMOUNT LEFT</LabelText>
//               <TextInput
//                 style={styles.input}
//                 keyboardType="number-pad"
//                 value={stock}
//                 onChangeText={setStock}
//                 placeholder="0"
//                 placeholderTextColor={MUTED}
//               />
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Product Variety ── */}
//         <SectionCard>
//           <View style={styles.toggleRow}>
//             <View style={styles.toggleLeft}>
//               <Text style={styles.toggleIcon}>🏷️</Text>
//               <Text style={styles.toggleTitle}>Product Variety</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.addVariantBtn}
//               onPress={() => setShowVariantInput((v) => !v)}
//             >
//               <Text style={styles.addVariantBtnText}>+ Add</Text>
//             </TouchableOpacity>
//           </View>

//           {(showVariantInput || variants.length > 0) && (
//             <View style={styles.sectionBody}>
//               {variants.length > 0 && (
//                 <View style={styles.chipsWrap}>
//                   {variants.map((v, i) => (
//                     <View key={i} style={styles.tagChip}>
//                       <Text style={styles.tagChipText}>{v}</Text>
//                       <TouchableOpacity
//                         onPress={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
//                       >
//                         <Text style={styles.tagChipRemove}>×</Text>
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </View>
//               )}
//               {showVariantInput && (
//                 <View style={[styles.inlineInputRow, { marginTop: variants.length > 0 ? 8 : 0 }]}>
//                   <TextInput
//                     style={[styles.inlineInput, { flex: 1 }]}
//                     placeholder="e.g. Bundle, Pack of 3..."
//                     placeholderTextColor={MUTED}
//                     value={variantInput}
//                     onChangeText={setVariantInput}
//                     onSubmitEditing={addVariant}
//                     autoFocus
//                   />
//                   <TouchableOpacity onPress={addVariant} style={styles.inlineAddBtn}>
//                     <Text style={styles.inlineAddBtnText}>Add</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Product Description ── */}
//         <SectionCard>
//           <ToggleRow icon="📄" title="Product Description" value={descEnabled} onToggle={setDescEnabled} />
//           {descEnabled && (
//             <View style={styles.sectionBody}>
//               <TextInput
//                 style={[styles.input, styles.textArea]}
//                 placeholder="Describe your product..."
//                 placeholderTextColor={MUTED}
//                 value={description}
//                 onChangeText={setDescription}
//                 multiline
//                 numberOfLines={4}
//                 textAlignVertical="top"
//               />
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Warning Message ── */}
//         <SectionCard>
//           <ToggleRow icon="⚠️" title="Warning Message" value={warnEnabled} onToggle={setWarnEnabled} />
//           {warnEnabled && (
//             <View style={styles.sectionBody}>
//               <TextInput
//                 style={[styles.input, styles.textArea]}
//                 placeholder="Add any warnings or cautions..."
//                 placeholderTextColor={MUTED}
//                 value={warnings}
//                 onChangeText={setWarnings}
//                 multiline
//                 numberOfLines={3}
//                 textAlignVertical="top"
//               />
//             </View>
//           )}
//         </SectionCard>

//         {/* ── Tags ── */}
//         <SectionCard>
//           <ToggleRow icon="🏷️" title="Tags" value={tagsEnabled} onToggle={setTagsEnabled} />
//           {tagsEnabled && (
//             <View style={styles.sectionBody}>
//               <View style={styles.inlineInputRow}>
//                 <TextInput
//                   style={[styles.inlineInput, { flex: 1 }]}
//                   placeholder="Add a tag and press enter..."
//                   placeholderTextColor={MUTED}
//                   value={tagInput}
//                   onChangeText={setTagInput}
//                   onSubmitEditing={addTag}
//                 />
//                 <TouchableOpacity onPress={addTag} style={styles.inlineAddBtn}>
//                   <Text style={styles.inlineAddBtnText}>Add</Text>
//                 </TouchableOpacity>
//               </View>
//               {tags.length > 0 && (
//                 <View style={[styles.chipsWrap, { marginTop: 8 }]}>
//                   {tags.map((tag, i) => (
//                     <View key={i} style={styles.tagChip}>
//                       <Text style={styles.tagChipText}>{tag}</Text>
//                       <TouchableOpacity
//                         onPress={() => setTags((prev) => prev.filter((_, j) => j !== i))}
//                       >
//                         <Text style={styles.tagChipRemove}>×</Text>
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </View>
//               )}
//             </View>
//           )}
//         </SectionCard>

//         <View style={{ height: 100 }} />
//       </ScrollView>

//       {/* ── Save Button ── */}
//       <View style={styles.saveContainer}>
//         <TouchableOpacity
//           style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
//           onPress={handleSave}
//           activeOpacity={0.85}
//           disabled={isPending}
//         >
//           {isPending ? (
//             <>
//               <ActivityIndicator color={WHITE} size="small" style={{ marginRight: 8 }} />
//               <Text style={styles.saveBtnText}>Uploading...</Text>
//             </>
//           ) : (
//             <>
//               <Text style={styles.saveBtnIcon}>💾  </Text>
//               <Text style={styles.saveBtnText}>Save Product</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default Store_Add_Product;

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   scroll:        { flex: 1, backgroundColor: BG },
//   scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

//   header: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     justifyContent:    'space-between',
//     backgroundColor:   WHITE,
//     paddingTop:        Platform.OS === 'ios' ? 52 : StatusBar.currentHeight + 12,
//     paddingBottom:     14,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: BORDER,
//   },
//   backBtn:     { padding: 4 },
//   backArrow:   { fontSize: 22, color: TEXT },
//   headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT, letterSpacing: 0.2 },
//   exportText:  { fontSize: 15, fontWeight: '600', color: BLUE },

//   card: {
//     backgroundColor: WHITE,
//     borderRadius:    14,
//     padding:         16,
//     marginBottom:    12,
//     shadowColor:     '#000',
//     shadowOpacity:   0.04,
//     shadowRadius:    6,
//     shadowOffset:    { width: 0, height: 2 },
//     elevation:       2,
//   },

//   imageBox: {
//     borderRadius:    10,
//     overflow:        'hidden',
//     backgroundColor: BLUE_LIGHT,
//     minHeight:       170,
//     justifyContent:  'center',
//     alignItems:      'center',
//   },
//   imagePlaceholder: { alignItems: 'center', paddingVertical: 32 },
//   imageIconWrap: {
//     width:           56,
//     height:          56,
//     borderRadius:    14,
//     backgroundColor: '#DBEAFE',
//     justifyContent:  'center',
//     alignItems:      'center',
//     marginBottom:    12,
//   },
//   imageIconText:  { fontSize: 26 },
//   uploadTitle:    { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 4 },
//   uploadSub:      { fontSize: 13, color: MUTED },
//   uploadedImage:  { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 10 },
//   colorBadge: {
//     position:     'absolute',
//     top:          10,
//     right:        10,
//     width:        20,
//     height:       20,
//     borderRadius: 10,
//     borderWidth:  2,
//     borderColor:  WHITE,
//   },

//   imgRemoveBtn: {
//     position:        'absolute',
//     top:             8,
//     right:           8,
//     width:           26,
//     height:          26,
//     borderRadius:    13,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     justifyContent:  'center',
//     alignItems:      'center',
//     zIndex:          10,
//   },
//   imgRemoveText: { color: WHITE, fontSize: 12, fontWeight: '700', lineHeight: 14 },

//   thumbStrip: { marginTop: 10 },
//   thumbWrap: {
//     position:     'relative',
//     paddingTop:   10,
//     paddingRight: 10,
//   },
//   thumb: {
//     width:        56,
//     height:       56,
//     borderRadius: 10,
//     borderWidth:  2,
//     borderColor:  BORDER,
//   },
//   thumbActive:   { borderColor: BLUE },
//   thumbColorDot: {
//     position:     'absolute',
//     bottom:       2,
//     right:        12,
//     width:        12,
//     height:       12,
//     borderRadius: 6,
//     borderWidth:  1.5,
//     borderColor:  WHITE,
//   },
//   thumbRemoveBtn: {
//     position:        'absolute',
//     top:             0,
//     right:           0,
//     width:           20,
//     height:          20,
//     borderRadius:    10,
//     backgroundColor: DANGER,
//     justifyContent:  'center',
//     alignItems:      'center',
//     zIndex:          10,
//     shadowColor:     '#000',
//     shadowOpacity:   0.25,
//     shadowRadius:    2,
//     elevation:       4,
//   },
//   thumbRemoveText: { color: WHITE, fontSize: 10, fontWeight: '800', lineHeight: 12 },
//   thumbAddTile: {
//     width:           56,
//     height:          56,
//     borderRadius:    10,
//     borderWidth:     1.5,
//     borderStyle:     'dashed',
//     borderColor:     BLUE,
//     justifyContent:  'center',
//     alignItems:      'center',
//     backgroundColor: BLUE_LIGHT,
//   },
//   thumbAddText:   { fontSize: 24, color: BLUE, lineHeight: 28 },
//   addMoreImgBtn:  { marginTop: 10, alignSelf: 'center' },
//   addMoreImgText: { color: BLUE, fontSize: 13, fontWeight: '600' },

//   label: {
//     fontSize:      11,
//     fontWeight:    '700',
//     color:         MUTED,
//     letterSpacing: 0.8,
//     marginBottom:  8,
//   },
//   input: {
//     borderWidth:       1,
//     borderColor:       BORDER,
//     borderRadius:      8,
//     paddingHorizontal: 12,
//     paddingVertical:   10,
//     fontSize:          14,
//     color:             TEXT,
//     backgroundColor:   '#FAFAFA',
//   },
//   textArea: { height: 90, paddingTop: 10 },
//   spacer12: { height: 12 },

//   priceRow: { flexDirection: 'row', gap: 12 },
//   priceCol: { flex: 1 },
//   priceInput: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     borderWidth:       1,
//     borderColor:       BORDER,
//     borderRadius:      8,
//     backgroundColor:   '#FAFAFA',
//     paddingHorizontal: 10,
//   },
//   priceCurrency: { fontSize: 14, color: MUTED, marginRight: 4 },
//   priceField:    { flex: 1, paddingVertical: 10, fontSize: 14, color: TEXT },

//   chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//   chip: {
//     paddingHorizontal: 14,
//     paddingVertical:   7,
//     borderRadius:      20,
//     backgroundColor:   '#F3F4F6',
//     borderWidth:       1,
//     borderColor:       '#E5E7EB',
//   },
//   chipActive:     { backgroundColor: BLUE, borderColor: BLUE },
//   chipDashed:     { borderStyle: 'dashed', borderColor: '#9CA3AF' },
//   chipText:       { fontSize: 13, fontWeight: '600', color: TEXT },
//   chipTextActive: { color: WHITE },

//   sectionBody: { marginTop: 14 },

//   sizeChip: {
//     width:           40,
//     height:          40,
//     borderRadius:    8,
//     borderWidth:     1.5,
//     borderColor:     BORDER,
//     justifyContent:  'center',
//     alignItems:      'center',
//     backgroundColor: WHITE,
//   },
//   sizeChipActive:     { backgroundColor: BLUE, borderColor: BLUE },
//   sizeChipText:       { fontSize: 13, fontWeight: '700', color: TEXT },
//   sizeChipTextActive: { color: WHITE },
//   sizeChipAdd: {
//     width:          40,
//     height:         40,
//     borderRadius:   8,
//     borderWidth:    1.5,
//     borderStyle:    'dashed',
//     borderColor:    BLUE,
//     justifyContent: 'center',
//     alignItems:     'center',
//   },
//   sizeChipAddText: { fontSize: 20, color: BLUE, lineHeight: 24 },

//   toggleRow: {
//     flexDirection:  'row',
//     alignItems:     'center',
//     justifyContent: 'space-between',
//   },
//   toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   toggleIcon:  { fontSize: 18 },
//   toggleTitle: { fontSize: 15, fontWeight: '600', color: TEXT },

//   colorDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
//   colorDot: {
//     width:        36,
//     height:       36,
//     borderRadius: 18,
//     borderWidth:  2,
//     borderColor:  'transparent',
//   },
//   colorDotActive: {
//     borderColor:   BLUE,
//     transform:     [{ scale: 1.15 }],
//     shadowColor:   '#000',
//     shadowOpacity: 0.18,
//     shadowRadius:  4,
//     elevation:     4,
//   },
//   colorDotAdd: {
//     width:          36,
//     height:         36,
//     borderRadius:   18,
//     borderWidth:    1.5,
//     borderStyle:    'dashed',
//     borderColor:    BLUE,
//     justifyContent: 'center',
//     alignItems:     'center',
//   },
//   colorDotAddText: { fontSize: 20, color: BLUE, lineHeight: 24 },
//   colorDotPreview: {
//     width:        24,
//     height:       24,
//     borderRadius: 12,
//     borderWidth:  1,
//     borderColor:  BORDER,
//     marginRight:  4,
//   },

//   colorImagePicker: {
//     marginTop:       12,
//     borderWidth:     1.5,
//     borderStyle:     'dashed',
//     borderColor:     BLUE,
//     borderRadius:    10,
//     padding:         14,
//     alignItems:      'center',
//     backgroundColor: BLUE_LIGHT,
//   },
//   colorImagePickerInner: { alignItems: 'center', gap: 6 },
//   colorPickerIcon:       { fontSize: 22 },
//   colorImagePickerText:  { fontSize: 13, color: BLUE, textAlign: 'center', lineHeight: 19 },
//   colorImagePreviewWrap: { alignItems: 'center', gap: 6, width: '100%', position: 'relative' },
//   colorImagePreview:     { width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' },
//   colorImageBadge: {
//     position:     'absolute',
//     top:          8,
//     right:        8,
//     width:        18,
//     height:       18,
//     borderRadius: 9,
//     borderWidth:  2,
//     borderColor:  WHITE,
//   },

//   assignedColorThumb: { paddingTop: 10, paddingRight: 10 },
//   assignedColorImg: {
//     width:        52,
//     height:       52,
//     borderRadius: 8,
//     borderWidth:  1,
//     borderColor:  BORDER,
//   },
//   assignedColorDot: {
//     position:     'absolute',
//     bottom:       2,
//     right:        12,
//     width:        14,
//     height:       14,
//     borderRadius: 7,
//     borderWidth:  1.5,
//     borderColor:  WHITE,
//   },

//   addVariantBtn:     { paddingHorizontal: 12, paddingVertical: 5 },
//   addVariantBtnText: { fontSize: 14, fontWeight: '600', color: BLUE },

//   tagChip: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     backgroundColor:   BLUE_LIGHT,
//     borderRadius:      16,
//     paddingHorizontal: 10,
//     paddingVertical:   5,
//     gap:               4,
//   },
//   tagChipText:   { fontSize: 13, color: BLUE, fontWeight: '600' },
//   tagChipRemove: { fontSize: 16, color: BLUE, lineHeight: 18 },

//   inlineInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   inlineInput: {
//     borderWidth:       1,
//     borderColor:       BORDER,
//     borderRadius:      8,
//     paddingHorizontal: 10,
//     paddingVertical:   7,
//     fontSize:          13,
//     color:             TEXT,
//     backgroundColor:   '#FAFAFA',
//   },
//   inlineAddBtn:     { backgroundColor: BLUE, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
//   inlineAddBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

//   saveContainer: {
//     position:          'absolute',
//     bottom:            0,
//     left:              0,
//     right:             0,
//     backgroundColor:   WHITE,
//     paddingHorizontal: 16,
//     paddingVertical:   12,
//     paddingBottom:     Platform.OS === 'ios' ? 100 : 100,
//     borderTopWidth:    1,
//     borderTopColor:    BORDER,
//   },
//   saveBtn: {
//     backgroundColor: BLUE,
//     borderRadius:    12,
//     paddingVertical: 15,
//     flexDirection:   'row',
//     justifyContent:  'center',
//     alignItems:      'center',
//   },
//   saveBtnDisabled: { opacity: 0.65 },
//   saveBtnIcon:     { fontSize: 17, color: WHITE },
//   saveBtnText:     { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.3 },
// });
