import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';

const CardLayout = ({
  pattern,
  imageFiles = [],
  videoFiles = [],
  children,
  renderMediaItem,
}) => {
  const { width } = Dimensions.get('window');

  const getAllMedia = () => {
    const allMedia = [...imageFiles, ...videoFiles];
    return allMedia.sort((a, b) =>
      (a.Imageposition || a.Videoposition) - (b.Imageposition || b.Videoposition)
    );
  };

  const getLayoutStyles = () => {
    switch (pattern) {
      case '1':
        return styles.singleLayout;
      case '2':
        return styles.grid11Layout;
      case '1x2':
        return styles.grid12Layout;
      case '1x3':
        return styles.grid13Layout;
      case '2x2':
        return styles.grid2x2Layout;
      case 'carousel':
        return styles.carouselLayout;
      default:
        return styles.defaultLayout;
    }
  };

  const renderLayout = () => {
    const media = getAllMedia();

    switch (pattern) {
      case '1':
        return (
          <View style={styles.singleContainer}>
            {media[0] && renderMediaItem(media[0], styles.singleItem)}
          </View>
        );

      case '2':
        return (
          <View style={styles.grid11Container}>
            {media.slice(0, 2).map((item, index) =>
              renderMediaItem(item, styles.grid11Item, index)
            )}
          </View>
        );

      case '1x2':
        return (
          <View style={styles.grid12Container}>
            <View style={styles.grid12Left}>
              {media[0] && renderMediaItem(media[0], styles.grid12LeftItem)}
            </View>
            <View style={styles.grid12Right}>
              {media.slice(1, 3).map((item, index) =>
                renderMediaItem(item, styles.grid12RightItem, index + 1)
              )}
            </View>
          </View>
        );

      case '1x3':
        return (
          <View style={styles.grid13Container}>
            <View style={styles.grid13Left}>
              {media[0] && renderMediaItem(media[0], styles.grid13LeftItem)}
            </View>
            <View style={styles.grid13Right}>
              {media.slice(1, 4).map((item, index) =>
                renderMediaItem(item, styles.grid13RightItem, index + 1)
              )}
            </View>
          </View>
        );

      case '2x2':
        return (
          <View style={styles.grid2x2Container}>
            <View style={styles.grid2x2Row}>
              {media.slice(0, 2).map((item, index) =>
                renderMediaItem(item, styles.grid2x2Item, index)
              )}
            </View>
            <View style={styles.grid2x2Row}>
              {media.slice(2, 4).map((item, index) =>
                renderMediaItem(item, styles.grid2x2Item, index + 2)
              )}
            </View>
          </View>
        );

      case 'carousel':
        return (
          <View style={styles.carouselContainer}>
            {/* Implement carousel scrolling here */}
            {media[0] && renderMediaItem(media[0], styles.carouselItem)}
          </View>
        );

      default:
        return (
          <View style={styles.defaultContainer}>
            {children}
          </View>
        );
    }
  };

  return (
    <View style={[styles.layoutContainer, getLayoutStyles()]}>
      {renderLayout()}
    </View>
  );
};

const styles = StyleSheet.create({
  layoutContainer: {
    width: '100%',
  },

  // Single layout
  singleLayout: {
    height: 350,
  },
  singleContainer: {
    width: '100%',
    height: '100%',
  },
  singleItem: {
    width: '100%',
    height: '100%',
  },

  // Grid 1x1 layout (2 items side by side)
  grid11Layout: {
    height: 350,
  },
  grid11Container: {
    flexDirection: 'row',
    height: '100%',
    gap: 2,
  },
  grid11Item: {
    flex: 1,
    height: '100%',
  },

  // Grid 1x2 layout (1 large, 2 small)
  grid12Layout: {
    height: 350,
  },
  grid12Container: {
    flexDirection: 'row',
    height: '100%',
    gap: 2,
  },
  grid12Left: {
    flex: 1,
    height: '100%',
  },
  grid12LeftItem: {
    width: '100%',
    height: '100%',
  },
  grid12Right: {
    flex: 1,
    height: '100%',
    gap: 2,
  },
  grid12RightItem: {
    width: '100%',
    flex: 1,
  },

  // Grid 1x3 layout (1 large, 3 small)
  grid13Layout: {
    height: 350,
  },
  grid13Container: {
    flexDirection: 'row',
    height: '100%',
    gap: 2,
  },
  grid13Left: {
    flex: 1,
    height: '100%',
  },
  grid13LeftItem: {
    width: '100%',
    height: '100%',
  },
  grid13Right: {
    flex: 1,
    height: '100%',
    gap: 2,
  },
  grid13RightItem: {
    width: '100%',
    flex: 1,
  },

  // Grid 2x2 layout (4 items in square)
  grid2x2Layout: {
    height: 350,
  },
  grid2x2Container: {
    height: '100%',
    gap: 2,
  },
  grid2x2Row: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  grid2x2Item: {
    flex: 1,
    height: '100%',
  },

  // Carousel layout
  carouselLayout: {
    height: 350,
  },
  carouselContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  carouselItem: {
    width: '100%',
    height: '100%',
  },

  // Default layout
  defaultLayout: {
    height: 350,
  },
  defaultContainer: {
    width: '100%',
    height: '100%',
  },
});

export default CardLayout;
