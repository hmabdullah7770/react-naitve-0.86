import {extractFrames, getVideoMetadata} from '../../../../native/VideoFrames'; // adjust path

// Tune these to match your Vision API budget / latency requirements
const SECONDS_PER_FRAME = 2; // sample roughly 1 frame every 2 seconds
const MIN_FRAMES = 6;
const MAX_FRAMES = 30;

// Your backend moderation endpoint (adjust to your API)
const MODERATION_ENDPOINT = 'https://your-backend.example.com/api/moderation/video-frames';

/**
 * Works out how many frames to sample for a video of a given duration (ms).
 * Short videos get denser sampling; long videos are capped so we don't
 * blow up Vision API cost/latency.
 */
function calculateFrameCount(durationMs) {
  const durationSeconds = durationMs / 1000;
  const raw = Math.ceil(durationSeconds / SECONDS_PER_FRAME);
  return Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, raw));
}

/**
 * Hook that:
 * 1. Extracts a duration-aware number of frames spread across the whole video
 * 2. Uploads those frames to the backend for Google Vision SafeSearch moderation
 * 3. Reports back a moderation status per media item (pending / approved / flagged / error)
 *
 * @param {Function} setSelectedMedia - the setState function from the caller
 */
export default function useVideoModeration(setSelectedMedia) {
  const updateMediaAt = (mediaIndex, videoUri, patch) => {
    setSelectedMedia(prev => {
      const updated = [...prev];
      if (updated[mediaIndex] && updated[mediaIndex].uri === videoUri) {
        updated[mediaIndex] = {...updated[mediaIndex], ...patch};
      }
      return updated;
    });
  };

  const uploadFramesForModeration = async (frames, videoUri) => {
    // Frames come back as local file:// or data: URIs (FrameResult[]).
    // Uploading as multipart form data keeps payload size reasonable
    // compared to inlining base64 in JSON for many frames.
    const formData = new FormData();
    formData.append('videoUri', videoUri);
    frames.forEach((frame, i) => {
      formData.append('frames', {
        uri: frame.uri,
        type: 'image/jpeg',
        name: `frame_${i}.jpg`,
      });
      formData.append('timestamps', String(frame.timestamp));
    });

    const response = await fetch(MODERATION_ENDPOINT, {
      method: 'POST',
      headers: {
        // Do NOT set Content-Type manually for multipart/form-data —
        // fetch sets the correct boundary automatically
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Moderation request failed: ${response.status}`);
    }

    // Expected backend shape (adjust to match your actual API):
    // { flagged: boolean, reason?: string, perFrame: [{ timestamp, flagged, categories }] }
    return response.json();
  };

  const moderateVideo = async (videoUri, mediaIndex) => {
    try {
      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: 'checking',
        moderationError: false,
      });

      // Duration-aware frame count so short clips aren't over-sampled
      // and long videos don't generate excessive Vision API calls
      const metadata = await getVideoMetadata(videoUri);
      const frameCount = calculateFrameCount(metadata.duration);

      const frames = await extractFrames(videoUri, {
        startTime: 0,
        endTime: -1, // full duration
        frameCount,
        quality: 70,
        format: 'jpeg',
        width: 480,
      });

      if (!frames || frames.length === 0) {
        throw new Error('No frames extracted');
      }

      // Use the first extracted frame as the display poster too,
      // so we don't need a second native call just for the thumbnail
      updateMediaAt(mediaIndex, videoUri, {
        posterUri: frames[0].uri,
      });

      const result = await uploadFramesForModeration(frames, videoUri);

      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: result.flagged ? 'flagged' : 'approved',
        moderationReason: result.reason || null,
        thumbnailExtracting: false,
      });
    } catch (error) {
      console.error('Video moderation failed:', error);
      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: 'error',
        moderationError: true,
        thumbnailExtracting: false,
      });
    }
  };

  // Convenience: moderate every video in a freshly-added batch,
  // given the offset in the full array where that batch starts.
  const moderateNewMedia = (newMedia, startIndex) => {
    newMedia.forEach((media, i) => {
      if (media.isVideo) {
        moderateVideo(media.uri, startIndex + i);
      }
    });
  };

  return {moderateVideo, moderateNewMedia};
}