import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SocialBox = ({platform, label, value, isSelected, onPress, onDelete}) => {
  return (
    <TouchableOpacity
      style={[styles.box, isSelected && styles.selectedBox]}
      onPress={onPress}>
      <View style={styles.contentContainer}>
        <Text style={styles.boxTitle}>{label}</Text>
        {value ? (
          <Text style={styles.boxValue} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={onPress}>
            <Icon name={'add'} size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {isSelected && value && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(platform)}
        >
          <Icon name="delete" size={20} color="black" />
        </TouchableOpacity>
      )}

      {isSelected && (
        <View style={styles.tickContainer}>
          <View style={styles.tickCircle}>
            <Text style={styles.tickSymbol}>✓</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SocialBox;

const styles = StyleSheet.create({
  box: {
    width: '100%',
    aspectRatio: 1.2,
    minHeight: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'start',
  },
  addButton: {
    position: 'absolute',
    bottom: -5,
    right: 3,
    backgroundColor: '#1FFFA5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1FFFA5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    lineHeight: 18,
  },
  boxValue: {
    fontSize: 13,
    color: '#666',
    paddingRight: 25,
    lineHeight: 16,
  },
  boxPlaceholder: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  tickContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  tickCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickSymbol: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
