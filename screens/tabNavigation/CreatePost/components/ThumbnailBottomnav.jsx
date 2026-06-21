import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';



const ThumbnailBottomnav = ({
  visible,
  onClose,
  title = 'Options',
  items = [],
  height = 250,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, height, slideAnim]);

  const renderItem = (item, index) => {
    switch (item.type) {
      case 'switch':
        return (
          <View key={index} style={styles.switchItem}>
            <View style={styles.itemInfo}>
              <Icon name={item.icon} size={20} color={item.iconColor || '#666'} />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <item.component
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={item.value ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        );

      case 'button':
        return (
          <TouchableOpacity
            key={index}
            style={styles.buttonItem}
            onPress={item.onPress}>
            <Icon name={item.icon} size={20} color={item.iconColor || '#2196F3'} />
            <Text style={[styles.buttonText, {color: item.textColor || '#2196F3'}]}>
              {item.title}
            </Text>
            {item.showArrow && <Icon name="chevron-right" size={20} color="#666" />}
          </TouchableOpacity>
        );

      case 'info':
        return (
          <View key={index} style={styles.infoItem}>
            <Icon name={item.icon} size={20} color={item.iconColor || '#666'} />
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.itemDescription}>{item.description}</Text>
              )}
            </View>
            {item.value && <Text style={styles.infoValue}>{item.value}</Text>}
          </View>
        );

      case 'iconButton':
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.iconButtonItem,
              {
                backgroundColor: item.backgroundColor || '#ffebee',
                borderColor: item.borderColor || '#ffcdd2',
              },
            ]}
            onPress={item.onPress}>
            <Icon
              name={item.icon}
              size={24}
              color={item.iconColor || '#ff4757'}
            />
          </TouchableOpacity>
        );

      case 'divider':
        return <View key={index} style={styles.divider} />;

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              height: height,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => renderItem(item, index))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding for devices with home indicator
    maxHeight: '80%',
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
    paddingBottom: 16,
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
    padding: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});

export default ThumbnailBottomnav;
