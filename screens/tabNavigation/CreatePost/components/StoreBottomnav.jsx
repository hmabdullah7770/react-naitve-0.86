import React, {useEffect, useState, useRef,useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Keychain from 'react-native-keychain';
// import RBSheet from 'react-native-raw-bottom-sheet';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {useCreatePostContext} from '../context/CreatePostContext';
import * as yup from 'yup';

const urlSchema = yup.object().shape({
  url: yup.string().url('Please enter a valid URL').required('URL is required'),
});

const StoreBottomnav = ({visible, onClose, onApply, onRemove}) => {
  const [selectedMode, setSelectedMode] = useState('store'); // 'store' or 'url'
  const [placeholderEnabled, setPlaceholderEnabled] = useState(false);
  const [url, setUrl] = useState('');
  const [storeIdPresent, setStoreIdPresent] = useState(false);
  const snapPoints = useMemo(() => ['55%'], []);

  // Add TextInput ref for focus management
  const textInputRef = useRef(null);
  const bottomSheetRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const creds = await Keychain.getGenericPassword({service: 'storeId'});
        if (creds) {
          setStoreIdPresent(true);
          setSelectedMode('store');
          setPlaceholderEnabled(false);
        } else {
          setStoreIdPresent(false);
          setSelectedMode('url');
          setPlaceholderEnabled(true);
        }
      } catch (err) {
        console.warn('Error reading storeId from Keychain', err);
        setStoreIdPresent(false);
        setSelectedMode('url');
        setPlaceholderEnabled(true);
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

  const toggleMode = (mode) => {
    if (mode === 'store' && !storeIdPresent) {
      Alert.alert('No Store Found', 'You do not have a store in this app.');
      return;
    }

    setSelectedMode(mode);
    setPlaceholderEnabled(mode === 'url');

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
        try {
          await urlSchema.validate({url});
          onApply({type: 'url', value: url});
          onClose();
        } catch (err) {
          Alert.alert('Validation Error', err.message);
        }
        return;
      }

      // selectedMode === 'store'
      if (!storeIdPresent) {
        Alert.alert('No Store Found', 'You do not have a store in this app.');
        return;
      }

      // First call the parent apply handler - this may throw if it fails
      if (onApply) {
        await onApply({type: 'store', value: true});
      }

      // Only update context if parent apply succeeded
      applySize('store', pendingSize);
      console.log('StoreBottomnav: Successfully applied store with size:', pendingSize);

      // Close the bottom sheet
      onClose && onClose();
    } catch (error) {
      console.warn('Store apply operation failed:', error);
      Alert.alert('Error', 'Failed to apply store changes. Please try again.');
    }
  };

  const handleRemove = () => {
    try {
      // Clear context constraint first
      clearApplied('store');

      // Reset local state to default (store default is 'large')
      const defaultSize = 'large';
      setPendingSize(defaultSize);

      console.log('StoreBottomnav: Removed store and reset to default size:', defaultSize);

      // Notify parent components
      onRemove && onRemove();
      onClose && onClose();
    } catch (error) {
      console.warn('Error during store remove operation:', error);
      // Still proceed with removal to avoid stuck state
      try {
        setPendingSize('large'); // Force reset to default
        onRemove && onRemove();
        onClose && onClose();
      } catch (fallbackError) {
        console.error('Critical error in handleRemove fallback:', fallbackError);
        onClose && onClose();
      }
    }
  };

  // Button size control: use a pending local selection until user hits Apply
  const {appliedLargeBy, getAppliedSizeFor, applySize, isLargeDisabled, isSmallDisabled, clearApplied, debugState} = useCreatePostContext();
  const [pendingSize, setPendingSize] = useState(getAppliedSizeFor('store'));

  // Make disabled states reactive to context changes
  const [largeDisabled, setLargeDisabled] = useState(isLargeDisabled('store'));
  const [smallDisabled, setSmallDisabled] = useState(isSmallDisabled('store'));

  // Update disabled states when context changes
  useEffect(() => {
    const newLargeDisabled = isLargeDisabled('store');
    const newSmallDisabled = isSmallDisabled('store');
    console.log(`StoreBottomnav: Updating disabled states - Large: ${newLargeDisabled}, Small: ${newSmallDisabled}, appliedLargeBy: ${appliedLargeBy}`);
    setLargeDisabled(newLargeDisabled);
    setSmallDisabled(newSmallDisabled);
  }, [appliedLargeBy, isLargeDisabled, isSmallDisabled]);

  // keep in sync with context when other side applies or removes
  useEffect(() => {
    try {
      const effective = getAppliedSizeFor('store');
      setPendingSize(effective);
      debugState('STORE_SYNC_PENDING', 'store', effective);
      console.log('StoreBottomnav: Synced pendingSize to:', effective, 'due to appliedLargeBy:', appliedLargeBy);
    } catch (error) {
      console.warn('Error syncing store pending size with context:', error);
      try {
        setPendingSize('large');
        console.log('StoreBottomnav: Fallback to default size due to sync error');
      } catch (fallbackError) {
        console.error('Critical error in store sync fallback:', fallbackError);
      }
    }
  }, [appliedLargeBy, getAppliedSizeFor, debugState]);

  // Initialize pendingSize and disabled states when component mounts or becomes visible
  useEffect(() => {
    if (visible) {
      try {
        const effective = getAppliedSizeFor('store');
        setPendingSize(effective);

        const newLargeDisabled = isLargeDisabled('store');
        const newSmallDisabled = isSmallDisabled('store');
        console.log(`StoreBottomnav: Initializing on open - Size: ${effective}, Large disabled: ${newLargeDisabled}, Small disabled: ${newSmallDisabled}, appliedLargeBy: ${appliedLargeBy}`);
        setLargeDisabled(newLargeDisabled);
        setSmallDisabled(newSmallDisabled);

        debugState('STORE_OPENED', 'store', effective);
      } catch (error) {
        console.warn('Error initializing store component state:', error);
        try {
          setPendingSize('large');
          setLargeDisabled(false);
          setSmallDisabled(false);
          console.log('StoreBottomnav: Fallback to default state due to initialization error');
        } catch (fallbackError) {
          console.error('Critical error in store initialization fallback:', fallbackError);
        }
      }
    }
  }, [visible, getAppliedSizeFor, debugState, appliedLargeBy, isLargeDisabled, isSmallDisabled]);

  const handleSizeChange = (size) => {
    try {
      if (size === 'large' && largeDisabled) {
        Alert.alert('Info', 'Product button is already large so you cannot select Large for Store.');
        return;
      }
      if (size === 'small' && smallDisabled) {
        Alert.alert('Info', 'Product button is already small so you cannot select Small for Store.');
        return;
      }

      setPendingSize(size);
      console.log('StoreBottomnav: Changed pending size to:', size);
    } catch (error) {
      console.warn('Error changing store size:', error);
      Alert.alert('Error', 'Failed to change button size. Please try again.');
    }
  };

  const renderContent = () => (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Store</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'store' && styles.modeButtonActive]}
            onPress={() => toggleMode('store')}
          >
            <Text style={[styles.modeText, selectedMode === 'store' && styles.modeTextActive]}>Store</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'url' && styles.modeButtonActive]}
            onPress={() => toggleMode('url')}
          >
            <Text style={[styles.modeText, selectedMode === 'url' && styles.modeTextActive]}>URL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            ref={textInputRef}
            style={[styles.input, placeholderEnabled ? styles.inputEnabled : styles.inputDisabled]}
            placeholder={selectedMode === 'url' ? 'Enter URL' : 'Store selection (disabled)'}
            editable={placeholderEnabled}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            contextMenuHidden={false}
            onFocus={() => console.log('StoreBottomnav TextInput focused')}
            onBlur={() => console.log('StoreBottomnav TextInput blurred')}
            returnKeyType="done"
          />
        </View>

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
                  Alert.alert('Info', 'Product button is already large so you cannot select Large for Store.');
                  return;
                }
                handleSizeChange('large');
              }}
            >
              <Text style={[
                styles.sizeText,
                pendingSize === 'large' && styles.sizeTextActive,
                largeDisabled && styles.sizeTextDisabled,
              ]}>Large</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sizeButton,
                pendingSize === 'small' && styles.sizeButtonActive,
                smallDisabled && styles.sizeButtonDisabled,
              ]}
              disabled={smallDisabled}
              onPress={() => handleSizeChange('small')}
            >
              <Text style={[
                styles.sizeText,
                pendingSize === 'small' && styles.sizeTextActive,
                smallDisabled && styles.sizeTextDisabled,
              ]}>Small</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Icon name="close" size={18} color="#ff4757" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyBtn} onPress={async () => {
            try {
              debugState('STORE_BEFORE_APPLY', 'store', pendingSize);
              await handleApply();
              debugState('STORE_AFTER_APPLY', 'store', pendingSize);
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
  >
     <BottomSheetView>
      {renderContent()}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({

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
    minHeight: 420,
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
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  inputEnabled: {
    backgroundColor: '#fff',
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

export default StoreBottomnav;
