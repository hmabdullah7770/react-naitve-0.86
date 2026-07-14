import React from 'react';
import {View, Image, ActivityIndicator, StyleSheet} from 'react-native';

/**
 * Renders the visual content of a single media slot:
 * - For photos: the photo itself
 * - For videos: the extracted poster frame (or a custom thumbnail if the
 *   user uploaded one), a loading spinner while extraction is in progress,
 *   and the play-button overlay once a frame is ready
 *
 * Used by all layout render functions (renderSingleColumn, renderTwoColumn,
 * renderGrid, renderAsymmetric, renderCarousel) so this logic lives in one
 * place instead of being repeated 5 times.
 */
const MediaThumbnail = ({
  media,
  index,
  videoSettings,
  onImageError,
  VideoThumbnailOverlay,
  onVideoPress,
  imageStyle,
}) => {
  const customThumbnail = videoSettings.thumbnails[index];

  // Decide what image to actually show:
  // custom thumbnail > extracted poster frame > nothing yet
  const displayUri = media.isVideo
    ? customThumbnail?.uri || media.posterUri || null
    : media.uri;

  return (
    <>
      {displayUri ? (
        <Image
          source={{uri: displayUri}}
          style={imageStyle}
          resizeMode="cover"
          onError={onImageError}
        />
      ) : (
        // Video selected but no frame extracted yet and extraction failed/pending
        <View style={[imageStyle, styles.emptyFill]} />
      )}

      {media.isVideo && media.thumbnailExtracting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {media.isVideo && !media.thumbnailExtracting && (
        <VideoThumbnailOverlay
          videoIndex={index}
          thumbnail={customThumbnail}
          onPress={onVideoPress}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  emptyFill: {
    backgroundColor: '#222',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MediaThumbnail;