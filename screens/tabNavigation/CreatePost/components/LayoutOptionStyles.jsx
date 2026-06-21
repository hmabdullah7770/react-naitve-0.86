import React from 'react';
import {View, StyleSheet} from 'react-native';

const LayoutOptionStyles = ({layoutId, size = 40, isSelected = false}) => {
  const spacing = 2;
  const selectedColor = '#2196F3';
  const normalColor = isSelected ? selectedColor : '#e0e0e0';

  const renderLayout = () => {
    switch (layoutId) {
      case '1':
        return (
          <View style={[styles.container, {width: size, height: size}]}>
            <View
              style={[
                styles.box,
                {
                  width: size - 4,
                  height: size - 4,
                  backgroundColor: normalColor,
                },
              ]}
            />
          </View>
        );

      case '2':
        return (
          <View
            style={[
              styles.container,
              {width: size, height: size, flexDirection: 'row'},
            ]}>
            <View
              style={[
                styles.box,
                {
                  width: (size - 6) / 2,
                  height: size - 4,
                  backgroundColor: normalColor,
                },
              ]}
            />
            <View
              style={[
                styles.box,
                {
                  width: (size - 6) / 2,
                  height: size - 4,
                  marginLeft: spacing,
                  backgroundColor: normalColor,
                },
              ]}
            />
          </View>
        );

      case '2x2':
        return (
          <View
            style={[
              styles.container,
              {width: size, height: size, flexDirection: 'column'},
            ]}>
            <View style={styles.row}>
              <View
                style={[
                  styles.box,
                  {
                    width: (size - 6) / 2,
                    height: (size - 6) / 2,
                    backgroundColor: normalColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.box,
                  {
                    width: (size - 6) / 2,
                    height: (size - 6) / 2,
                    marginLeft: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
            </View>
            <View style={[styles.row, {marginTop: spacing}]}>
              <View
                style={[
                  styles.box,
                  {
                    width: (size - 6) / 2,
                    height: (size - 6) / 2,
                    backgroundColor: normalColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.box,
                  {
                    width: (size - 6) / 2,
                    height: (size - 6) / 2,
                    marginLeft: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
            </View>
          </View>
        );

      case '1x2':
        return (
          <View
            style={[
              styles.container,
              {width: size, height: size, flexDirection: 'row'},
            ]}>
            <View
              style={[
                styles.box,
                {
                  width: size * 0.65 - 2,
                  height: size - 4,
                  backgroundColor: normalColor,
                },
              ]}
            />
            <View style={styles.column}>
              <View
                style={[
                  styles.box,
                  {
                    width: size * 0.33,
                    height: (size - 6) / 2,
                    marginLeft: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.box,
                  {
                    width: size * 0.33,
                    height: (size - 6) / 2,
                    marginLeft: spacing,
                    marginTop: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
            </View>
          </View>
        );

      case '1x3':
        return (
          <View
            style={[
              styles.container,
              {width: size, height: size, flexDirection: 'row'},
            ]}>
            <View
              style={[
                styles.box,
                {
                  width: size * 0.65 - 2,
                  height: size - 4,
                  backgroundColor: normalColor,
                },
              ]}
            />
            <View style={styles.column}>
              <View
                style={[
                  styles.box,
                  {
                    width: size * 0.33,
                    height: (size - 8) / 3,
                    marginLeft: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.box,
                  {
                    width: size * 0.33,
                    height: (size - 8) / 3,
                    marginLeft: spacing,
                    marginTop: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.box,
                  {
                    width: size * 0.33,
                    height: (size - 8) / 3,
                    marginLeft: spacing,
                    marginTop: spacing,
                    backgroundColor: normalColor,
                  },
                ]}
              />
            </View>
          </View>
        );

      case 'carousel':
        return (
          <View
            style={[
              styles.container,
              {
                width: size,
                height: size,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}>
            <View
              style={[
                styles.box,
                {
                  width: size * 0.45,
                  height: size - 8,
                  backgroundColor: normalColor,
                },
              ]}
            />
            <View
              style={[
                styles.box,
                {
                  width: size * 0.3,
                  height: (size - 8) * 0.8,
                  marginLeft: spacing,
                  opacity: 0.7,
                  backgroundColor: normalColor,
                },
              ]}
            />
            <View
              style={[
                styles.box,
                {
                  width: size * 0.2,
                  height: (size - 8) * 0.6,
                  marginLeft: spacing,
                  opacity: 0.4,
                  backgroundColor: normalColor,
                },
              ]}
            />
          </View>
        );

      default:
        return (
          <View style={[styles.container, {width: size, height: size}]}>
            <View
              style={[
                styles.box,
                {
                  width: size - 4,
                  height: size - 4,
                  backgroundColor: normalColor,
                },
              ]}
            />
          </View>
        );
    }
  };

  return renderLayout();
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 2,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  box: {
    borderRadius: 2,
  },
});

export default LayoutOptionStyles;
