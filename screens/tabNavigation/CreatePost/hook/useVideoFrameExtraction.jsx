import {extractFrameAtTime} from '../../../../native/VideoFrames'; // adjust path

/**
 * Hook that extracts a poster frame for video assets and writes the
 * result back into the media list via the setter you pass in.
 *
 * @param {Function} setSelectedMedia - the setState function from the caller
 */
export default function useVideoFrameExtraction(setSelectedMedia) {
  const extractFramesOfVideo = async (videoUri, mediaIndex) => {
    try {
      const frame = await extractFrameAtTime(videoUri, 500, {
        quality: 70,
        format: 'jpeg',
        width: 400,
      });
      console.log('✅ Frame extracted for', videoUri, '→', frame.uri); // temp debug log
      setSelectedMedia(prev => {
        const updated = [...prev];
        if (updated[mediaIndex] && updated[mediaIndex].uri === videoUri) {
          updated[mediaIndex] = {
            ...updated[mediaIndex],
            posterUri: frame.uri,
            thumbnailExtracting: false,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('Frame extraction failed:', error);
      setSelectedMedia(prev => {
        const updated = [...prev];
        if (updated[mediaIndex] && updated[mediaIndex].uri === videoUri) {
          updated[mediaIndex] = {
            ...updated[mediaIndex],
            thumbnailExtracting: false,
            thumbnailError: true,
          };
        }
        return updated;
      });
    }
  };

  // Convenience: extract frames for every video in a freshly-added batch,
  // given the offset in the full array where that batch starts.
  const extractFramesForNewMedia = (newMedia, startIndex) => {
    newMedia.forEach((media, i) => {
      if (media.isVideo) {
        extractFramesOfVideo(media.uri, startIndex + i);
      }
    });
  };

  return {extractFramesOfVideo, extractFramesForNewMedia};
}