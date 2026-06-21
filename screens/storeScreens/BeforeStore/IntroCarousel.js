import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useStep } from './context/StoreSetupContext';

// ── Preset text colours the user can pick from ──────────────────────
const COLOR_OPTIONS = [
  '#FFFFFF',
  '#111827',
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#EC4899',
];

const DEFAULT_OVERLAY = { title: '', text: '', textColor: '#FFFFFF' };

const IntroCarousel = ({ navigation }) => {
  const { setCurrentStep } = useStep();

  // Each slot stores { uri, overlay: { title, text, textColor } }
  const [slots, setSlots] = useState([
    { uri: null, overlay: { ...DEFAULT_OVERLAY } },
    { uri: null, overlay: { ...DEFAULT_OVERLAY } },
    { uri: null, overlay: { ...DEFAULT_OVERLAY } },
  ]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftOverlay, setDraftOverlay] = useState({ ...DEFAULT_OVERLAY });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCurrentStep(2);
    });
    return unsubscribe;
  }, [navigation]);

  // ── Image picker ─────────────────────────────────────────────────
  const handlePickImage = async (index) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (!result.didCancel && result.assets?.length) {
      const updated = [...slots];
      updated[index] = { ...updated[index], uri: result.assets[0].uri };
      setSlots(updated);
    }
  };

  const handleRemoveImage = (index) => {
    const updated = [...slots];
    updated[index] = { uri: null, overlay: { ...DEFAULT_OVERLAY } };
    setSlots(updated);
  };

  // ── 3-dot menu ───────────────────────────────────────────────────
  const openOverlayModal = (index) => {
    setEditingIndex(index);
    setDraftOverlay({ ...slots[index].overlay });
    setModalVisible(true);
  };

  const handleSaveOverlay = () => {
    if (editingIndex === null) return;
    const updated = [...slots];
    updated[editingIndex] = { ...updated[editingIndex], overlay: { ...draftOverlay } };
    setSlots(updated);
    setModalVisible(false);
    setEditingIndex(null);
  };

  const handleCancelOverlay = () => {
    setModalVisible(false);
    setEditingIndex(null);
  };

  // ── Navigation ───────────────────────────────────────────────────
  const handleContinue = () => navigation.navigate('IntroProduct');
  const handleSkip    = () => navigation.navigate('IntroProduct');

  const hasAnyImage = slots.some((s) => s.uri);

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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
        <Text style={styles.title}>Carousel Images</Text>
        <Text style={styles.subtitle}>
          Showcase your best products on your store's home page. We recommend
          using high-quality landscape images.
        </Text>

        {/* ── Upload Slots ─────────────────────────────────────── */}
        {slots.map(({ uri, overlay }, index) => {
          const slotNumber = index + 1;
          const isActive   = slotNumber === 1;

          return (
            <View key={index} style={styles.slotRow}>
              {/* numbered badge */}
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {slotNumber}
                </Text>
              </View>

              {/* upload tile */}
              <TouchableOpacity
                style={[
                  styles.uploadTile,
                  isActive ? styles.uploadTileActive : styles.uploadTileInactive,
                  uri && styles.uploadTileFilled,
                ]}
                onPress={() => !uri && handlePickImage(index)}
                activeOpacity={uri ? 1 : 0.8}
              >
                {uri ? (
                  <>
                    {/* background image */}
                    <Image source={{ uri }} style={styles.previewImage} />

                    {/* overlay text preview */}
                    {(overlay.title || overlay.text) ? (
                      <View style={styles.overlayTextContainer} pointerEvents="none">
                        {overlay.title ? (
                          <Text style={[styles.overlayTitle, { color: overlay.textColor }]} numberOfLines={1}>
                            {overlay.title}
                          </Text>
                        ) : null}
                        {overlay.text ? (
                          <Text style={[styles.overlayBody, { color: overlay.textColor }]} numberOfLines={2}>
                            {overlay.text}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {/* ── 3-dot button (top-right) ── */}
                    <TouchableOpacity
                      style={styles.dotsButton}
                      onPress={() => openOverlayModal(index)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Icon name="more-vert" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* remove button (top-left) */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={[styles.plusCircle, isActive ? styles.plusCircleActive : styles.plusCircleInactive]}>
                      <Icon name="add" size={24} color={isActive ? '#2563EB' : '#9CA3AF'} />
                    </View>
                    <Text style={[styles.uploadLabel, isActive ? styles.uploadLabelActive : styles.uploadLabelInactive]}>
                      Upload Slot {slotNumber}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Tip Box ──────────────────────────────────────────── */}
        <View style={styles.tipBox}>
          <Icon name="lightbulb" size={20} color="#2563EB" style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Use images with text-free areas so your promotional headlines stay readable.
          </Text>
        </View>
      </ScrollView>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          {hasAnyImage ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.9}>
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

      {/* ── Overlay Options Modal ─────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCancelOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.kvView}
          >
            {/* Stop backdrop press from closing when tapping inside sheet */}
            <Pressable style={styles.modalSheet} onPress={() => {}}>

              {/* drag handle */}
              <View style={styles.dragHandle} />

              <Text style={styles.modalTitle}>Carousel Overlay</Text>
              <Text style={styles.modalSubtitle}>
                Add text that appears on top of your image.
              </Text>

              {/* ── Title field ── */}
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Summer Sale"
                placeholderTextColor="#9CA3AF"
                value={draftOverlay.title}
                onChangeText={(v) => setDraftOverlay((p) => ({ ...p, title: v }))}
                returnKeyType="next"
              />

              {/* ── Body text field ── */}
              <Text style={styles.fieldLabel}>Text</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g. Up to 50% off all items"
                placeholderTextColor="#9CA3AF"
                value={draftOverlay.text}
                onChangeText={(v) => setDraftOverlay((p) => ({ ...p, text: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* ── Text colour picker ── */}
              <Text style={styles.fieldLabel}>Text Colour</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => {
                  const selected = draftOverlay.textColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        color === '#FFFFFF' && styles.swatchWhiteBorder,
                        selected && styles.swatchSelected,
                      ]}
                      onPress={() => setDraftOverlay((p) => ({ ...p, textColor: color }))}
                      activeOpacity={0.8}
                    >
                      {selected && (
                        <Icon
                          name="check"
                          size={14}
                          color={color === '#FFFFFF' || color === '#F59E0B' ? '#111827' : '#fff'}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Actions ── */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOverlay} activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOverlay} activeOpacity={0.9}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
};

export default IntroCarousel;

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton:   { width: 36, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSpacer: { width: 36 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 16 },

  // Title
  title:    { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 28 },

  // Slot row
  slotRow: { marginBottom: 16, position: 'relative' },
  badge: {
    position: 'absolute', top: -10, left: -8, zIndex: 10,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeActive:        { backgroundColor: '#2563EB' },
  badgeInactive:      { backgroundColor: '#E5E7EB' },
  badgeText:          { fontSize: 13, fontWeight: '700' },
  badgeTextActive:    { color: '#FFFFFF' },
  badgeTextInactive:  { color: '#6B7280' },

  // Upload tile
  uploadTile: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16,
    height: 150, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  uploadTileActive:   { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  uploadTileInactive: { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  uploadTileFilled:   { borderStyle: 'solid', borderColor: '#2563EB', borderWidth: 2 },

  // Plus circle
  plusCircle:         { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  plusCircleActive:   { backgroundColor: '#DBEAFE' },
  plusCircleInactive: { backgroundColor: '#E5E7EB' },

  // Upload label
  uploadLabel:        { fontSize: 14, fontWeight: '600' },
  uploadLabelActive:  { color: '#2563EB' },
  uploadLabelInactive:{ color: '#9CA3AF' },

  // Preview image
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },

  // Overlay text on image
  overlayTextContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 20,
    // subtle gradient-like shadow so text is readable
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  overlayTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  overlayBody:  { fontSize: 12, fontWeight: '500', lineHeight: 16 },

  // 3-dot button
  dotsButton: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Remove button
  removeButton: {
    position: 'absolute', top: 8, left: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Tip box
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 14,
    padding: 14, marginTop: 8, gap: 10,
  },
  tipIcon: { marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 18,
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  footerInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueButton: {
    flexDirection: 'row', backgroundColor: '#2563EB',
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 50, alignItems: 'center', gap: 8,
    elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  continueText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipText:     { fontSize: 15, fontWeight: '700', color: '#2563EB', marginLeft: 'auto' },

  // ── Modal ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  kvView: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  dragHandle: {
    alignSelf: 'center', width: 40, height: 4,
    borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 20,
  },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },

  // Fields
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  textInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  textArea: { height: 80, paddingTop: 11 },

  // Colour swatches
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  swatchWhiteBorder: { borderWidth: 1.5, borderColor: '#D1D5DB' },
  swatchSelected:    { borderWidth: 2.5, borderColor: '#2563EB' },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 50,
    backgroundColor: '#2563EB', alignItems: 'center',
    elevation: 3, shadowColor: '#2563EB', shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
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
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { launchImageLibrary } from 'react-native-image-picker';

// const TOTAL_STEPS = 5;
// const CURRENT_STEP = 2;
// const PROGRESS_PERCENT = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100); // 40

// const IntroCarousel = ({ navigation }) => {
//   const [images, setImages] = useState([null, null, null]);

//   const handlePickImage = async (index) => {
//     const result = await launchImageLibrary({
//       mediaType: 'photo',
//       quality: 1,
//     });
//     if (!result.didCancel && result.assets?.length) {
//       const updated = [...images];
//       updated[index] = result.assets[0].uri;
//       setImages(updated);
//     }
//   };

//   const handleRemoveImage = (index) => {
//     const updated = [...images];
//     updated[index] = null;
//     setImages(updated);
//   };

//   const handleContinue = () => {
//     navigation.navigate('NextScreen'); // replace with your next screen name
//   };

//   const handleSkip = () => {
//     navigation.navigate('NextScreen'); // replace with your next screen name
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* ── Header ─────────────────────────────────── */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Icon name="chevron-left" size={28} color="#2563EB" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Store Setup</Text>
//         {/* invisible spacer to keep title centred */}
//         <View style={styles.headerSpacer} />
//       </View>

//       {/* ── Progress ───────────────────────────────── */}
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
//         {/* ── Title ──────────────────────────────────── */}
//         <Text style={styles.title}>Carousel Images</Text>
//         <Text style={styles.subtitle}>
//           Showcase your best products on your store's home page. We recommend
//           using high-quality landscape images.
//         </Text>

//         {/* ── Upload Slots ───────────────────────────── */}
//         {images.map((uri, index) => {
//           const slotNumber = index + 1;
//           const isActive = slotNumber === 1; // first slot visually highlighted

//           return (
//             <View key={index} style={styles.slotRow}>
//               {/* numbered badge */}
//               <View
//                 style={[
//                   styles.badge,
//                   isActive ? styles.badgeActive : styles.badgeInactive,
//                 ]}
//               >
//                 <Text
//                   style={[
//                     styles.badgeText,
//                     isActive ? styles.badgeTextActive : styles.badgeTextInactive,
//                   ]}
//                 >
//                   {slotNumber}
//                 </Text>
//               </View>

//               {/* upload tile */}
//               <TouchableOpacity
//                 style={[
//                   styles.uploadTile,
//                   isActive ? styles.uploadTileActive : styles.uploadTileInactive,
//                   uri && styles.uploadTileFilled,
//                 ]}
//                 onPress={() => handlePickImage(index)}
//                 activeOpacity={0.8}
//               >
//                 {uri ? (
//                   /* ── Filled state ── */
//                   <>
//                     <Image source={{ uri }} style={styles.previewImage} />
//                     {/* remove button */}
//                     <TouchableOpacity
//                       style={styles.removeButton}
//                       onPress={() => handleRemoveImage(index)}
//                     >
//                       <Icon name="close" size={16} color="#fff" />
//                     </TouchableOpacity>
//                   </>
//                 ) : (
//                   /* ── Empty state ── */
//                   <>
//                     <View
//                       style={[
//                         styles.plusCircle,
//                         isActive
//                           ? styles.plusCircleActive
//                           : styles.plusCircleInactive,
//                       ]}
//                     >
//                       <Icon
//                         name="add"
//                         size={24}
//                         color={isActive ? '#2563EB' : '#9CA3AF'}
//                       />
//                     </View>
//                     <Text
//                       style={[
//                         styles.uploadLabel,
//                         isActive
//                           ? styles.uploadLabelActive
//                           : styles.uploadLabelInactive,
//                       ]}
//                     >
//                       Upload Slot {slotNumber}
//                     </Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           );
//         })}

//         {/* ── Tip Box ────────────────────────────────── */}
//         <View style={styles.tipBox}>
//           <Icon name="lightbulb" size={20} color="#2563EB" style={styles.tipIcon} />
//           <Text style={styles.tipText}>
//             Use images with text-free areas so your promotional headlines stay
//             readable.
//           </Text>
//         </View>
//       </ScrollView>

//       {/* ── Footer ─────────────────────────────────── */}
//       <View style={styles.footer}>
//         <View style={styles.footerInner}>
//           {/* Continue button only shown when at least 1 image uploaded */}
//           {images.some(Boolean) ? (
//             <TouchableOpacity
//               style={styles.continueButton}
//               onPress={handleContinue}
//               activeOpacity={0.9}
//             >
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
//     </SafeAreaView>
//   );
// };

// export default IntroCarousel;

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
//   headerSpacer: {
//     width: 36,
//   },

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
//     paddingHorizontal: 18,
//     paddingTop: 24,
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
//     marginBottom: 28,
//   },

//   // ── Slot row
//   slotRow: {
//     marginBottom: 16,
//     position: 'relative',
//   },
//   badge: {
//     position: 'absolute',
//     top: -10,
//     left: -8,
//     zIndex: 10,
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   badgeActive: {
//     backgroundColor: '#2563EB',
//   },
//   badgeInactive: {
//     backgroundColor: '#E5E7EB',
//   },
//   badgeText: {
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   badgeTextActive: {
//     color: '#FFFFFF',
//   },
//   badgeTextInactive: {
//     color: '#6B7280',
//   },

//   // ── Upload tile
//   uploadTile: {
//     borderWidth: 1.5,
//     borderStyle: 'dashed',
//     borderRadius: 16,
//     height: 150,
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   uploadTileActive: {
//     borderColor: '#93C5FD',
//     backgroundColor: '#EFF6FF',
//   },
//   uploadTileInactive: {
//     borderColor: '#D1D5DB',
//     backgroundColor: '#F9FAFB',
//   },
//   uploadTileFilled: {
//     borderStyle: 'solid',
//     borderColor: '#2563EB',
//     borderWidth: 2,
//   },

//   // ── Plus circle inside tile
//   plusCircle: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   plusCircleActive: {
//     backgroundColor: '#DBEAFE',
//   },
//   plusCircleInactive: {
//     backgroundColor: '#E5E7EB',
//   },

//   // ── Upload label
//   uploadLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   uploadLabelActive: {
//     color: '#2563EB',
//   },
//   uploadLabelInactive: {
//     color: '#9CA3AF',
//   },

//   // ── Preview image (filled slot)
//   previewImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   removeButton: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   // ── Tip box
//   tipBox: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     backgroundColor: '#EFF6FF',
//     borderRadius: 14,
//     padding: 14,
//     marginTop: 8,
//     gap: 10,
//   },
//   tipIcon: {
//     marginTop: 1,
//   },
//   tipText: {
//     flex: 1,
//     fontSize: 13,
//     color: '#374151',
//     lineHeight: 19,
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
//     paddingVertical: 14,
//     paddingHorizontal: 28,
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
// });