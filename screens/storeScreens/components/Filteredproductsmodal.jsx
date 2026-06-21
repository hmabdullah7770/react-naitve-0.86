import React, { useState, useMemo } from 'react'
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, TextInput, SafeAreaView,
  StatusBar, ActivityIndicator,
} from 'react-native'
import MaterialIcons from '@react-native-vector-icons/material-icons'

/**
 * FilteredProductsModal
 *
 * Props:
 *  visible            – boolean
 *  products           – array  [{ _id, name, price, images: [{ url }] }]
 *  initialSelectedIds – string[]   pre-ticked ids
 *  loading            – boolean
 *  onClose            – () => void
 *  onApply            – (ids: string[]) => void
 */
const FilteredProductsModal = ({
  visible,
  products = [],
  initialSelectedIds = [],
  loading = false,
  onClose,
  onApply,
}) => {
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(new Set(initialSelectedIds))

  // Reset selection + search whenever modal opens fresh
  React.useEffect(() => {
    if (visible) {
      setSelected(new Set(initialSelectedIds))
      setSearch('')
    }
  }, [visible])

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p => p.productName?.toLowerCase().includes(q))
  }, [products, search])

  const toggle = (id) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allSelected   = filtered.length > 0 && filtered.every(p => selected.has(p._id))
  const someSelected  = filtered.some(p => selected.has(p._id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.delete(p._id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(p => next.add(p._id))
        return next
      })
    }
  }

  const handleApply = () => {
    onApply([...selected])
    onClose()
  }

  const renderProduct = ({ item }) => {
    const isChecked = selected.has(item._id)
    const imageUri  = item.productImages?.[0] ?? null

    return (
      <TouchableOpacity
        onPress={() => toggle(item._id)}
        activeOpacity={0.75}
        style={[styles.card, isChecked && styles.cardChecked]}
      >
        {/* Checkbox badge */}
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <MaterialIcons name="check" size={11} color="#fff" />}
        </View>

        {/* Product image */}
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <MaterialIcons name="image-not-supported" size={22} color="#ccc" />
            </View>
          )}
        </View>

        {/* Info */}
        <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
      <Text style={styles.productPrice}>${Number(item.productPrice ?? 0).toFixed(2)}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={22} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Products</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <MaterialIcons name="cancel" size={16} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Select All + count ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleAll} style={styles.selectAllBtn} activeOpacity={0.75}>
            {/* <View style={[styles.checkbox, (allSelected || someSelected) && styles.checkboxChecked, someSelected && !allSelected && styles.checkboxPartial]}>
              {allSelected && <MaterialIcons name="check" size={11} color="#fff" />}
              {someSelected && !allSelected && <View style={styles.partialDash} />}
            </View> */}
            <Text style={styles.selectAllText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.countBadge}>
            {selected.size} selected
          </Text>
        </View>

        {/* ── Product Grid ── */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1a1a2e" />
            <Text style={styles.loadingText}>Loading products…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <MaterialIcons name="search-off" size={40} color="#ddd" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            renderItem={renderProduct}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* ── Apply Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyBtn, selected.size === 0 && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={selected.size === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>
              Apply  {selected.size > 0 ? `(${selected.size})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default FilteredProductsModal

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: '#fff' },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },

  // Search
  searchWrapper:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f5f5f5', borderRadius: 12 },
  searchInput:    { flex: 1, fontSize: 14, color: '#1a1a2e', padding: 0 },

  // Top bar
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  selectAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText:  { fontSize: 13, fontWeight: '600', color: '#555' },
  countBadge:     { fontSize: 12, fontWeight: '700', color: '#fff', backgroundColor: '#1a1a2e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  // Grid
  listContent:    { paddingHorizontal: 12, paddingBottom: 20 },
  row:            { justifyContent: 'space-between', marginBottom: 12 },

  // Card
  card: {
    width: '48.5%', borderRadius: 14, padding: 10,
    backgroundColor: '#fafafa', borderWidth: 1.5, borderColor: '#ebebeb',
    position: 'relative',
  },
  cardChecked:    { borderColor: '#1a1a2e', backgroundColor: '#f0f2ff' },

  // Checkbox
  checkbox: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  checkboxChecked:  { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  checkboxPartial:  { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  partialDash:      { width: 8, height: 2, borderRadius: 1, backgroundColor: '#fff' },

  // Image
  imageWrapper:   { width: '100%', height: 100, borderRadius: 10, overflow: 'hidden', marginBottom: 8, backgroundColor: '#f0f0f0' },
  productImage:   { width: '100%', height: '100%' },
  imageFallback:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Text
  productName:    { fontSize: 12, fontWeight: '600', color: '#1a1a2e', lineHeight: 16, marginBottom: 4 },
  productPrice:   { fontSize: 12, fontWeight: '700', color: '#1E88E5' },

  // States
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText:    { fontSize: 13, color: '#aaa' },
  emptyText:      { fontSize: 14, color: '#bbb', fontWeight: '500' },

  // Footer
  footer:         { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  applyBtn:       { backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  applyBtnDisabled: { backgroundColor: '#ccc' },
  applyBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
})