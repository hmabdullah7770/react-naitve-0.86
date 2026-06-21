import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';
import IonIcon from 'react-native-vector-icons/Ionicons';
import {useTheme, THEME_OPTIONS} from '../../../theme/ThemeContext';

const OPTIONS = [
  {
    label: 'System default',
    description: 'Follows your device setting',
    value: THEME_OPTIONS.SYSTEM,
    icon: 'phone-portrait-outline', // Ionicons
  },
  {
    label: 'Light',
    description: 'Always light appearance',
    value: THEME_OPTIONS.LIGHT,
    icon: 'sunny-outline', // Ionicons
  },
  {
    label: 'Dark',
    description: 'Always dark appearance',
    value: THEME_OPTIONS.DARK,
    icon: 'moon-outline', // Ionicons
  },
];

const DisplaySettings = () => {
  const {theme, selectedOption, setThemeOption} = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.screen}>
      <View style={styles.box}>
        {/* THEME heading inside the box */}
        <Text style={styles.sectionLabel}>THEME</Text>

        {OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={styles.row}
            onPress={() => setThemeOption(option.value)}
            activeOpacity={0.6}>
            {/* Icon Box */}
            <View style={styles.iconBox}>
              <IonIcon name={option.icon} size={20} color={theme.textSub} />
            </View>

            {/* Labels */}
            <View style={styles.textGroup}>
              <Text style={styles.label}>{option.label}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </View>

            {/* Radio */}
            <View
              style={[
                styles.radioOuter,
                selectedOption === option.value && styles.radioOuterActive,
              ]}>
              {selectedOption === option.value && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default DisplaySettings;

const makeStyles = theme =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
      padding: 20,
    },
    box: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 0.5,
      borderColor: theme.border,
      overflow: 'hidden',
      paddingBottom: 4,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSub,
      letterSpacing: 0.8,
      marginTop: 14,
      marginBottom: 6,
      marginLeft: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textGroup: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      color: theme.text,
    },
    description: {
      fontSize: 12,
      color: theme.textSub,
      marginTop: 1,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border, // grey when unselected
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: theme.primary, // blue when selected
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primary,
    },
  });
