import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFilter, FILTER_OPTIONS } from '../../tabNavigation/context/FilterContext'; // adjust path

const FilterModal = ({ visible, onClose }) => {
  const { selectedFilters, toggleFilter, resetFilters } = useFilter();

  const handleSelect = (key) => {
    const isSelected = selectedFilters.includes(key);
    resetFilters();          // clear whatever was selected before
    if (!isSelected) {
      toggleFilter(key);     // only add the new one if it wasn't already the selected one
    }
     onClose();                // auto-apply + close modal
    // if it WAS selected, resetFilters() alone leaves it deselected (toggle off)
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter by</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.badgeWrap}>
            {FILTER_OPTIONS.map((option) => {
              const isSelected = selectedFilters.includes(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.badge, isSelected && styles.badgeSelected]}
                  onPress={() => handleSelect(option.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View> */}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#000' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  badgeSelected: { backgroundColor: '#1FFFA5', borderColor: '#333' },
  badgeText: { fontSize: 14, color: '#333', fontWeight: '500' },
  badgeTextSelected: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  resetBtn: { flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  resetText: { color: '#333', fontWeight: '500' },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#0a66c2', alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '500' },
});
// import React from 'react';
// import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useFilter, FILTER_OPTIONS } from '../../tabNavigation/context/FilterContext'; // adjust path

// const FilterModal = ({ visible, onClose }) => {
//   const { selectedFilters, toggleFilter, resetFilters } = useFilter();

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//       <Pressable style={styles.backdrop} onPress={onClose}>
//         <Pressable style={styles.sheet} onPress={() => {}}>
//           <View style={styles.header}>
//             <Text style={styles.title}>Filter by</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Icon name="close" size={22} color="#333" />
//             </TouchableOpacity>
//           </View>

//           {FILTER_OPTIONS.map((option) => {
//             const isSelected = selectedFilters.includes(option.key);
//             return (
//               <TouchableOpacity
//                 key={option.key}
//                 style={styles.optionRow}
//                 onPress={() => toggleFilter(option.key)}
//                 activeOpacity={0.7}
//               >
//                 <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
//                   {isSelected && <Icon name="check" size={16} color="#fff" />}
//                 </View>
//                 <Text style={styles.optionLabel}>{option.label}</Text>
//               </TouchableOpacity>
//             );
//           })}

//           <View style={styles.footer}>
//             <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
//               <Text style={styles.resetText}>Reset</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
//               <Text style={styles.applyText}>Apply</Text>
//             </TouchableOpacity>
//           </View>
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// };

// export default FilterModal;

// const styles = StyleSheet.create({
//   backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 30 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//   title: { fontSize: 16, fontWeight: '600', color: '#000' },
//   optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
//   checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   checkboxSelected: { backgroundColor: '#0a66c2', borderColor: '#0a66c2' },
//   optionLabel: { fontSize: 15, color: '#333' },
//   footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
//   resetBtn: { flex: 1, marginRight: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
//   resetText: { color: '#333', fontWeight: '500' },
//   applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#0a66c2', alignItems: 'center' },
//   applyText: { color: '#fff', fontWeight: '500' },
// });