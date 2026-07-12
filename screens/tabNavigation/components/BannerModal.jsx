import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker'; // adjust if using a different picker lib
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAddBanner } from '../../../ReactQuery/TanStackQueryHooks/useBanner'; // adjust path

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GRID_GAP = 10;
const ITEM_SIZE = (width - 40 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS; // 40 = sheet horizontal padding

const BannerModal = ({ visible, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null); // { uri, type, fileName, ... }
  const [buttonText, setButtonText] = useState('Shop Now');

  // NEW: mutation lives in the modal now
  const { mutate: addBanner, isPending: isSubmitting } = useAddBanner();

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset) {
          setSelectedImage(asset);
        }
      }
    );
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setButtonText('Shop Now');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedImage) return;

    addBanner(
      {
        bannerImage: selectedImage,
        bannerbutton: buttonText.trim() || 'Shop Now',
      },
      {
        onSuccess: () => {
          handleClose(); // resets fields + closes modal; list refetches via query invalidation
        },
        // optionally handle onError here (e.g. toast/snackbar)
      }
    );
  };

  const gridData = selectedImage ? [selectedImage] : [];

  const renderGridItem = ({ item }) => (
    <View style={styles.gridItemWrapper}>
      <Image source={{ uri: item.uri }} style={styles.gridImage} />
      <TouchableOpacity style={styles.removeBadge} onPress={handleRemoveImage}>
        <Icon name="close" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderAddTile = () => (
    <TouchableOpacity style={styles.addTile} onPress={handlePickImage}>
      <Icon name="add-photo-alternate" size={28} color="#999" />
      <Text style={styles.addTileText}>Add Image</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Banner</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Banner Image</Text>
          <View style={styles.gridWrap}>
            <FlatList
              data={gridData}
              renderItem={renderGridItem}
              keyExtractor={(item, index) => item.uri || String(index)}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              ListFooterComponent={!selectedImage ? renderAddTile : null}
              columnWrapperStyle={NUM_COLUMNS > 1 ? styles.gridRow : null}
            />
          </View>

          <Text style={styles.sectionLabel}>Button Text</Text>
          <TextInput
            style={styles.input}
            value={buttonText}
            onChangeText={setButtonText}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!selectedImage || isSubmitting) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedImage || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add Banner</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default BannerModal;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#000' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 4,
  },
  gridWrap: { marginBottom: 16 },
  gridRow: { justifyContent: 'flex-start', gap: GRID_GAP, marginBottom: GRID_GAP },
  gridItemWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTileText: { fontSize: 11, color: '#999', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

// import React, { useState } from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Pressable,
//   Image,
//   TextInput,
//   FlatList,
//   Dimensions,
//   ActivityIndicator,
// } from 'react-native';
// import { launchImageLibrary } from 'react-native-image-picker'; // adjust if using a different picker lib
// import Icon from 'react-native-vector-icons/MaterialIcons';

// const { width } = Dimensions.get('window');
// const NUM_COLUMNS = 3;
// const GRID_GAP = 10;
// const ITEM_SIZE = (width - 40 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS; // 40 = sheet horizontal padding

// const BannerModal = ({ visible, onClose, onSubmit, isSubmitting }) => {
//   const [selectedImage, setSelectedImage] = useState(null); // { uri, type, fileName, ... }
//   const [buttonText, setButtonText] = useState('Shop Now');

//   const handlePickImage = () => {
//     launchImageLibrary(
//       {
//         mediaType: 'photo',
//         selectionLimit: 1,
//         quality: 0.8,
//       },
//       (response) => {
//         if (response.didCancel || response.errorCode) return;
//         const asset = response.assets?.[0];
//         if (asset) {
//           setSelectedImage(asset);
//         }
//       }
//     );
//   };

//   const handleRemoveImage = () => {
//     setSelectedImage(null);
//   };

//   const handleClose = () => {
//     setSelectedImage(null);
//     setButtonText('Shop Now');
//     onClose();
//   };

//   const handleSubmit = () => {
//     if (!selectedImage) return;
//     onSubmit({
//       bannerImage: selectedImage,
//       bannerbutton: buttonText.trim() || 'Shop Now',
//     });
//   };

//   // Grid data: existing selected image (if any) + an "add" tile
//   const gridData = selectedImage ? [selectedImage] : [];

//   const renderGridItem = ({ item }) => (
//     <View style={styles.gridItemWrapper}>
//       <Image source={{ uri: item.uri }} style={styles.gridImage} />
//       <TouchableOpacity style={styles.removeBadge} onPress={handleRemoveImage}>
//         <Icon name="close" size={14} color="#fff" />
//       </TouchableOpacity>
//     </View>
//   );

//   const renderAddTile = () => (
//     <TouchableOpacity style={styles.addTile} onPress={handlePickImage}>
//       <Icon name="add-photo-alternate" size={28} color="#999" />
//       <Text style={styles.addTileText}>Add Image</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
//       <Pressable style={styles.backdrop} onPress={handleClose}>
//         <Pressable style={styles.sheet} onPress={() => {}}>
//           <View style={styles.header}>
//             <Text style={styles.title}>Add Banner</Text>
//             <TouchableOpacity onPress={handleClose}>
//               <Icon name="close" size={22} color="#333" />
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.sectionLabel}>Banner Image</Text>
//           <View style={styles.gridWrap}>
//             <FlatList
//               data={gridData}
//               renderItem={renderGridItem}
//               keyExtractor={(item, index) => item.uri || String(index)}
//               numColumns={NUM_COLUMNS}
//               scrollEnabled={false}
//               ListFooterComponent={!selectedImage ? renderAddTile : null}
//               columnWrapperStyle={NUM_COLUMNS > 1 ? styles.gridRow : null}
//             />
//             {selectedImage ? null : null}
//           </View>

//           <Text style={styles.sectionLabel}>Button Text</Text>
//           <TextInput
//             style={styles.input}
//             value={buttonText}
//             onChangeText={setButtonText}
//             placeholder="Shop Now"
//             placeholderTextColor="#999"
//           />

//           <TouchableOpacity
//             style={[
//               styles.submitBtn,
//               (!selectedImage || isSubmitting) && styles.submitBtnDisabled,
//             ]}
//             onPress={handleSubmit}
//             disabled={!selectedImage || isSubmitting}
//           >
//             {isSubmitting ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.submitText}>Add Banner</Text>
//             )}
//           </TouchableOpacity>
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// };

// export default BannerModal;

// const styles = StyleSheet.create({
//   backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   sheet: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     padding: 20,
//     paddingBottom: 30,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   title: { fontSize: 16, fontWeight: '600', color: '#000' },
//   sectionLabel: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#555',
//     marginBottom: 8,
//     marginTop: 4,
//   },
//   gridWrap: { marginBottom: 16 },
//   gridRow: { justifyContent: 'flex-start', gap: GRID_GAP, marginBottom: GRID_GAP },
//   gridItemWrapper: {
//     width: ITEM_SIZE,
//     height: ITEM_SIZE,
//     borderRadius: 8,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   gridImage: { width: '100%', height: '100%' },
//   removeBadge: {
//     position: 'absolute',
//     top: 4,
//     right: 4,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     borderRadius: 10,
//     width: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   addTile: {
//     width: ITEM_SIZE,
//     height: ITEM_SIZE,
//     borderRadius: 8,
//     borderWidth: 1.5,
//     borderColor: '#ddd',
//     borderStyle: 'dashed',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   addTileText: { fontSize: 11, color: '#999', marginTop: 4 },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     fontSize: 15,
//     color: '#000',
//     marginBottom: 20,
//   },
//   submitBtn: {
//     backgroundColor: '#000',
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   submitBtnDisabled: { backgroundColor: '#aaa' },
//   submitText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
// });