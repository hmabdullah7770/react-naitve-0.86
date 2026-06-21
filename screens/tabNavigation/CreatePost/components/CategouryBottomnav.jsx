import React, {useEffect, useRef,useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import RBSheet from 'react-native-raw-bottom-sheet';

const CategouryBottomnav = ({visible, onClose, onApply, initialSelected, categories, isLoading, error}) => {
  const bottomSheetRef = useRef(null);
const snapPoints = useMemo(() => ['28%'], []);
  // Handle bottom sheet visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderItem = ({item}) => {
    const isSelected = initialSelected?.id === item.id || initialSelected?.name === item.name;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => onApply?.({id: item.id, name: item.name})}
        activeOpacity={0.7}>
        <Icon name="category" size={18} color={isSelected ? '#fff' : '#FF9800'} />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.handleBar} />

      <View style={styles.header}>
        <Text style={styles.title}>Select Category</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FF9800" />
            <Text style={styles.loadingText}>Loading categories…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorState}>
            <Icon name="error-outline" size={20} color="#ff4757" />
            <Text style={styles.errorText}>Failed to load categories</Text>
          </View>
        )}

        {!isLoading && !error && (
          <FlatList
            data={categories}
            renderItem={renderItem}
            keyExtractor={item => String(item.id || item._id || item.name)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            scrollEnabled={true}
            bounces={true}
            removeClippedSubviews={false}
          />
        )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  draggableIcon: {
    backgroundColor: '#ddd',
  },
  container: {
    minHeight: 200,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  list: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffe0b2',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  categoryText: {
    marginLeft: 8,
    color: '#333',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    marginLeft: 8,
    color: '#ff4757',
    fontWeight: '500',
  },
});

export default CategouryBottomnav;
