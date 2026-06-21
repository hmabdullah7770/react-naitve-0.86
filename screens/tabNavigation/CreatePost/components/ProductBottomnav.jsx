import React, {useEffect, useState, useRef,useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Keychain from 'react-native-keychain';
import {useDispatch, useSelector} from 'react-redux';
import {getStoreProductRequest} from '../../../../Redux/action/storee/store_product';
import {useCreatePostContext} from '../context/CreatePostContext';
import ProductDropdown from './ProductDropdown';
// import RBSheet from 'react-native-raw-bottom-sheet';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-.,@?^=%&:/~+#]*)?$/i;

const ProductBottomnav = ({visible, onClose, onApply, onRemove}) => {
  const [selectedMode, setSelectedMode] = useState('product'); // 'product' or 'url'
  const [url, setUrl] = useState('');
  const [storeIdPresent, setStoreIdPresent] = useState(false);
  const snapPoints = useMemo(() => ['60%'], []);

  // Add TextInput ref for focus management
  const textInputRef = useRef(null);
  const bottomSheetRef = useRef(null);

  const dispatch = useDispatch();
  const {products, loading, error} = useSelector(
    state => state.storeproduct || {products: [], loading: false, error: null},
  );

  useEffect(() => {
    (async () => {
      try {
        const creds = await Keychain.getGenericPassword({service: 'storeId'});
        if (creds) {
          setStoreIdPresent(true);
          setSelectedMode('product');
          // fetch products
          if (visible)
            {dispatch(getStoreProductRequest(creds.password || creds.username));}
        } else {
          setStoreIdPresent(false);
          setSelectedMode('url');
        }
      } catch (err) {
        console.warn('Keychain read error', err);
        setStoreIdPresent(false);
        setSelectedMode('url');
      }
    })();
  }, [visible]);

  // Handle bottom sheet visibility
  useEffect(() => {
    if (visible) {
       bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const toggleMode = mode => {
    if (mode === 'product' && !storeIdPresent) {
      Alert.alert('No Store Found', 'You do not have a store in this app.');
      return;
    }
    setSelectedMode(mode);

    // Focus TextInput when switching to URL mode
    if (mode === 'url' && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  const handleApply = async () => {
    try {
      if (selectedMode === 'url') {
        if (!url || !urlRegex.test(url)) {
          Alert.alert('Validation Error', 'Please enter a valid URL');
          return;
        }

        // First call the parent apply handler - this may throw if it fails
        if (onApply) {
          await onApply({type: 'url', value: url});
        }

        // Only update context if parent apply succeeded
        applySize('product', pendingSize);
        console.log(
          'ProductBottomnav: Successfully applied URL with size:',
          pendingSize,
        );

        // Close the bottom sheet
        onClose && onClose();
        return;
      }

      // product mode
      if (!products || products.length === 0) {
        Alert.alert('No items', 'No products available to select.');
        return;
      }
    } catch (error) {
      console.warn('Product apply operation failed:', error);
      Alert.alert(
        'Error',
        'Failed to apply product changes. Please try again.',
      );
    }
  };

  const handleRemove = () => {
    try {
      // Clear context constraint first
      clearApplied('product');

      // Reset local state to default (product default is 'small')
      const defaultSize = 'small';
      setPendingSize(defaultSize);

      console.log(
        'ProductBottomnav: Removed product and reset to default size:',
        defaultSize,
      );

      // Notify parent components
      onRemove && onRemove();
      onClose && onClose();
    } catch (error) {
      console.warn('Error during product remove operation:', error);
      try {
        setPendingSize('small'); // Force reset to default
        onRemove && onRemove();
        onClose && onClose();
      } catch (fallbackError) {
        console.error(
          'Critical error in handleRemove fallback:',
          fallbackError,
        );
        onClose && onClose();
      }
    }
  };

  const onSelectProduct = async product => {
    try {
      // First call the parent apply handler - this may throw if it fails
      if (onApply) {
        await onApply({type: 'product', value: product});
      }

      // Only update context if parent apply succeeded
      applySize('product', pendingSize);
      console.log(
        'ProductBottomnav: Successfully applied product with size:',
        pendingSize,
      );

      // Close the bottom sheet
      onClose && onClose();
    } catch (error) {
      console.warn('Product selection failed:', error);
      Alert.alert(
        'Error',
        'Failed to apply product selection. Please try again.',
      );
    }
  };

  // button size controls: use pending local selection until user hits Apply
  const {
    appliedLargeBy,
    getAppliedSizeFor,
    applySize,
    isLargeDisabled,
    isSmallDisabled,
    clearApplied,
    debugState,
  } = useCreatePostContext();
  const [pendingSize, setPendingSize] = useState(getAppliedSizeFor('product'));

  // Make disabled states reactive to context changes
  const [largeDisabled, setLargeDisabled] = useState(
    isLargeDisabled('product'),
  );
  const [smallDisabled, setSmallDisabled] = useState(
    isSmallDisabled('product'),
  );

  // Update disabled states when context changes
  useEffect(() => {
    const newLargeDisabled = isLargeDisabled('product');
    const newSmallDisabled = isSmallDisabled('product');
    console.log(
      `ProductBottomnav: Updating disabled states - Large: ${newLargeDisabled}, Small: ${newSmallDisabled}, appliedLargeBy: ${appliedLargeBy}`,
    );
    setLargeDisabled(newLargeDisabled);
    setSmallDisabled(newSmallDisabled);
  }, [appliedLargeBy, isLargeDisabled, isSmallDisabled]);

  // Keep pendingSize in-sync with context when appliedLargeBy changes or other component removes
  useEffect(() => {
    try {
      const effective = getAppliedSizeFor('product');
      setPendingSize(effective);
      debugState('PRODUCT_SYNC_PENDING', 'product', effective);
      console.log(
        'ProductBottomnav: Synced pendingSize to:',
        effective,
        'due to appliedLargeBy:',
        appliedLargeBy,
      );
    } catch (error) {
      console.warn('Error syncing product pending size with context:', error);
      try {
        setPendingSize('small');
        console.log(
          'ProductBottomnav: Fallback to default size due to sync error',
        );
      } catch (fallbackError) {
        console.error(
          'Critical error in product sync fallback:',
          fallbackError,
        );
      }
    }
  }, [appliedLargeBy, getAppliedSizeFor, debugState]);

  // Initialize pendingSize and disabled states when component mounts or becomes visible
  useEffect(() => {
    if (visible) {
      try {
        const effective = getAppliedSizeFor('product');
        setPendingSize(effective);

        const newLargeDisabled = isLargeDisabled('product');
        const newSmallDisabled = isSmallDisabled('product');
        console.log(
          `ProductBottomnav: Initializing on open - Size: ${effective}, Large disabled: ${newLargeDisabled}, Small disabled: ${newSmallDisabled}, appliedLargeBy: ${appliedLargeBy}`,
        );
        setLargeDisabled(newLargeDisabled);
        setSmallDisabled(newSmallDisabled);

        debugState('PRODUCT_OPENED', 'product', effective);
      } catch (error) {
        console.warn('Error initializing product component state:', error);
        try {
          setPendingSize('small');
          setLargeDisabled(false);
          setSmallDisabled(false);
          console.log(
            'ProductBottomnav: Fallback to default state due to initialization error',
          );
        } catch (fallbackError) {
          console.error(
            'Critical error in product initialization fallback:',
            fallbackError,
          );
        }
      }
    }
  }, [
    visible,
    getAppliedSizeFor,
    debugState,
    appliedLargeBy,
    isLargeDisabled,
    isSmallDisabled,
  ]);

  const handleSizeChange = size => {
    try {
      if (size === 'large' && largeDisabled) {
        Alert.alert(
          'Info',
          'Store button is already large so you cannot select Large for Product.',
        );
        return;
      }
      if (size === 'small' && smallDisabled) {
        Alert.alert(
          'Info',
          'Store button is already small so you cannot select Small for Product.',
        );
        return;
      }

      setPendingSize(size);
      console.log('ProductBottomnav: Changed pending size to:', size);
    } catch (error) {
      console.warn('Error changing product size:', error);
      Alert.alert('Error', 'Failed to change button size. Please try again.');
    }
  };

  const renderContent = () => (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Product</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'product' && styles.modeButtonActive,
            ]}
            onPress={() => toggleMode('product')}>
            <Text
              style={[
                styles.modeText,
                selectedMode === 'product' && styles.modeTextActive,
              ]}>
              Product
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'url' && styles.modeButtonActive,
            ]}
            onPress={() => toggleMode('url')}>
            <Text
              style={[
                styles.modeText,
                selectedMode === 'url' && styles.modeTextActive,
              ]}>
              URL
            </Text>
          </TouchableOpacity>
        </View>

        {selectedMode === 'url' ? (
          <View style={styles.inputRow}>
            <TextInput
              ref={textInputRef}
              style={[styles.input, styles.inputEnabled]}
              placeholder={'Enter URL'}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              contextMenuHidden={false}
              onFocus={() => console.log('ProductBottomnav TextInput focused')}
              onBlur={() => console.log('ProductBottomnav TextInput blurred')}
              returnKeyType="done"
            />
          </View>
        ) : (
          <View style={styles.productListWrapper}>
            <ProductDropdown
              products={products}
              loading={loading}
              error={error}
              isOpen={false}
              onToggle={open => {
                // control toggle: when opening, nothing special required because products are already fetched
              }}
              onProductSelect={onSelectProduct}
            />
          </View>
        )}

        {/* Button size toggle */}
        <View style={styles.sizeRow}>
          <Text style={styles.sizeTitle}>Button size</Text>
          <View style={styles.sizeButtonsRow}>
            <TouchableOpacity
              style={[
                styles.sizeButton,
                pendingSize === 'large' && styles.sizeButtonActive,
                largeDisabled && styles.sizeButtonDisabled,
              ]}
              disabled={largeDisabled}
              onPress={() => {
                if (largeDisabled) {
                  Alert.alert(
                    'Info',
                    'Store button is already large so you cannot select Large for Product.',
                  );
                  return;
                }
                handleSizeChange('large');
              }}>
              <Text
                style={[
                  styles.sizeText,
                  pendingSize === 'large' && styles.sizeTextActive,
                  largeDisabled && styles.sizeTextDisabled,
                ]}>
                Large
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sizeButton,
                pendingSize === 'small' && styles.sizeButtonActive,
                smallDisabled && styles.sizeButtonDisabled,
              ]}
              disabled={smallDisabled}
              onPress={() => handleSizeChange('small')}>
              <Text
                style={[
                  styles.sizeText,
                  pendingSize === 'small' && styles.sizeTextActive,
                  smallDisabled && styles.sizeTextDisabled,
                ]}>
                Small
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Icon name="close" size={18} color="#ff4757" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={async () => {
              try {
                debugState('PRODUCT_BEFORE_APPLY', 'product', pendingSize);
                await handleApply();
                debugState('PRODUCT_AFTER_APPLY', 'product', pendingSize);
              } catch (error) {
                console.warn('Apply button error:', error);
              }
            }}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
      <BottomSheet
    ref={bottomSheetRef}
    index={-1}
    snapPoints={snapPoints}
    enablePanDownToClose={true}
    onChange={(index) => {
      if (index === -1) {
        onClose && onClose();
      }
    }}
    backgroundStyle={styles.sheetContainer}
    handleIndicatorStyle={styles.draggableIcon}
  ><BottomSheetView>
      {renderContent()}
      </BottomSheetView>
   </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // sheetWrapper: {
  //   backgroundColor: 'rgba(0,0,0,0.5)',
  // },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  draggableIcon: {
    backgroundColor: '#ddd',
  },
  container: {
    padding: 16,
    minHeight: 480,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeText: {
    color: '#333',
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#fff',
  },
  inputRow: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputEnabled: {
    backgroundColor: '#fff',
  },
  productListWrapper: {
    maxHeight: 260,
    marginBottom: 16,
  },
  sizeRow: {
    marginBottom: 16,
  },
  sizeTitle: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  sizeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    flex: 1,
  },
  sizeButtonActive: {
    backgroundColor: '#2196F3',
  },
  sizeButtonDisabled: {
    opacity: 0.45,
  },
  sizeText: {
    color: '#333',
    fontWeight: '500',
  },
  sizeTextActive: {
    color: '#fff',
  },
  sizeTextDisabled: {
    color: '#999',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffebee',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  removeText: {
    marginLeft: 8,
    color: '#ff4757',
    fontWeight: '500',
  },
  applyBtn: {
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  applyText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProductBottomnav;
