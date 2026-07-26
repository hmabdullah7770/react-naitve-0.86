import RNFS from 'react-native-fs';
import {extractFrames, getVideoMetadata} from '../../../../native/VideoFrames'; // adjust path
import {useCheckVideoFrames, useDeleteVideoModeration} from '../../../../ReactQuery/TanStackQueryHooks/useModerationApi'; // adjust path

// Tune these to match your Vision API budget / latency requirements.
// MAX_FRAMES must stay <= the backend's multer `.array('frames', 15)` limit
// and the `files.length > 15` check in the controller — keep these three
// numbers in sync across frontend/route/controller.
const SECONDS_PER_FRAME = 2; // sample roughly 1 frame every 2 seconds
const MIN_FRAMES = 6;
const MAX_FRAMES = 15;

/**
 * Works out how many frames to sample for a video of a given duration (ms).
 */
function calculateFrameCount(durationMs) {
  const durationSeconds = durationMs / 1000;
  const raw = Math.ceil(durationSeconds / SECONDS_PER_FRAME);
  return Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, raw));
}

/**
 * Strips the file:// prefix so RNFS.unlink gets a plain filesystem path.
 */
function toFsPath(uri) {
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}

/**
 * Deletes a list of extracted frame files from the device cache.
 * Safe to call even if some/all files are already gone.
 */
async function deleteFrameFiles(frameUris = []) {
  await Promise.all(
    frameUris.map(async uri => {
      try {
        const path = toFsPath(uri);
        const exists = await RNFS.exists(path);
        if (exists) {
          await RNFS.unlink(path);
        }
      } catch (err) {
        console.warn('Failed to delete frame file:', uri, err);
      }
    }),
  );
}

/**
 * Hook that:
 * 1. Extracts a duration-aware number of frames spread across the whole video
 * 2. Uploads those frames via the useCheckVideoFrames mutation (React Query),
 *    which hits the backend for Google Vision SafeSearch moderation
 * 3. Deletes the extracted frame files once the upload finishes (success or failure)
 * 4. Processes multiple videos sequentially, one full cycle at a time
 * 5. Exposes a manual cleanup function for when the user removes a video
 *    before extraction/upload has finished
 *
 * @param {Function} setSelectedMedia - the setState function from the caller
 */
export default function useVideoModeration(setSelectedMedia) {
  const {mutateAsync: checkVideoFramesMutate} = useCheckVideoFrames();
  const {mutate: deleteVideoModerationMutate} = useDeleteVideoModeration();

  const updateMediaAt = (mediaIndex, videoUri, patch) => {
    setSelectedMedia(prev => {
      const updated = [...prev];
      if (updated[mediaIndex] && updated[mediaIndex].uri === videoUri) {
        updated[mediaIndex] = {...updated[mediaIndex], ...patch};
      }
      return updated;
    });
  };

  const moderateVideo = async (videoUri, mediaIndex) => {
    let extractedFrameUris = [];

    try {
      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: 'checking',
        moderationError: false,
      });

      const metadata = await getVideoMetadata(videoUri);
      const frameCount = calculateFrameCount(metadata.duration);

      const frames = await extractFrames(videoUri, {
        startTime: 0,
        endTime: -1,
        frameCount,
        quality: 70,
        format: 'jpeg',
        width: 480,
      });

      if (!frames || frames.length === 0) {
        throw new Error('No frames extracted');
      }

      extractedFrameUris = frames.map(f => f.uri);

      // Frame extraction is done — clear the thumbnail spinner now and
      // keep track of the frame files in case the user removes the video
      // before the upload below finishes.
      updateMediaAt(mediaIndex, videoUri, {
        posterUri: frames[0].uri,
        thumbnailExtracting: false,
        pendingFrameUris: extractedFrameUris,
      });

      // Goes through React Query -> API/moderation.js -> your shared `api`
      // axios instance, same pattern as useAddBanner. Auth header is
      // handled by whatever interceptor `api` already has configured.
      const response = await checkVideoFramesMutate({mediaIndex, frames});

      // Axios wraps the server response in `.data`; your backend's
      // ApiResponse also nests the payload under `.data`, hence `.data.data`.
      // Adjust this line if your `api` instance already unwraps one layer.
      const result = response?.data?.data;

      if (!result) {
        throw new Error('Malformed moderation response');
      }

      // Store the raw record exactly as the API returned it — this is
      // what buildVideoModerationPayload reads from later when assembling
      // the publish-post payload, and what MediaThumbnail reads to decide
      // whether to show the red "rejected" overlay.
      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: result.approved ? 'approved' : 'flagged',
        moderationRecord: {
          mediaIndex: result.mediaIndex,
          _id: result._id,
          approved: result.approved,
          rejectionReason: result.rejectionReason || null,
        },
        pendingFrameUris: [],
      });
    } catch (error) {
      console.error('Video moderation failed:', error);
      updateMediaAt(mediaIndex, videoUri, {
        moderationStatus: 'error',
        moderationError: true,
        pendingFrameUris: [],
      });
    } finally {
      // Frames only exist to be uploaded for moderation — once the
      // request has resolved (success or failure) they're no longer
      // needed on-device, so delete them regardless of outcome.
      // The poster frame (frames[0].uri) is excluded so the thumbnail
      // keeps working after cleanup.
      const posterUri = extractedFrameUris[0];
      const toDelete = extractedFrameUris.filter(uri => uri !== posterUri);
      if (toDelete.length > 0) {
        deleteFrameFiles(toDelete);
      }
    }
  };

  /**
   * Moderates every video in a freshly-added batch, ONE AT A TIME.
   * Each video's full cycle (extract → upload → Vision API response)
   * completes before the next video starts. Matches the backend's
   * per-user processing lock, which rejects a second concurrent request
   * with 429 anyway — so sequencing client-side avoids wasted requests too.
   */
  const moderateNewMedia = async (newMedia, startIndex) => {
    const videoEntries = newMedia
      .map((media, i) => ({media, index: startIndex + i}))
      .filter(entry => entry.media.isVideo);

    for (const {media, index} of videoEntries) {
      // eslint-disable-next-line no-await-in-loop
      await moderateVideo(media.uri, index);
    }
  };

  /**
   * Call this when the user removes a video from the picker (cross/remove
   * button) so:
   * 1. Any local frame files already extracted for it — poster included —
   *    are cleaned up instead of lingering in cache
   * 2. The corresponding VideoModeration DB record (if one exists yet) is
   *    deleted too, since the video it belonged to no longer exists in
   *    this post — fire-and-forget, doesn't block the UI removal on the
   *    network call completing.
   */
  const cleanupMediaFrames = media => {
    if (!media || !media.isVideo) {
      return;
    }

    const uris = [
      ...(media.pendingFrameUris || []),
      media.posterUri,
    ].filter(Boolean);
    if (uris.length > 0) {
      deleteFrameFiles(uris);
    }

    const recordId = media.moderationRecord?._id;
    if (recordId) {
      deleteVideoModerationMutate(recordId);
    }
  };

  return {moderateVideo, moderateNewMedia, cleanupMediaFrames};
}


// import RNFS from 'react-native-fs';
// import {extractFrames, getVideoMetadata} from '../../../../native/VideoFrames'; // adjust path
// import {useCheckVideoFrames} from '../../../../ReactQuery/TanStackQueryHooks/useModerationApi'; // adjust path

// // Tune these to match your Vision API budget / latency requirements.
// // MAX_FRAMES must stay <= the backend's multer `.array('frames', 15)` limit
// // and the `files.length > 15` check in the controller — keep these three
// // numbers in sync across frontend/route/controller.
// const SECONDS_PER_FRAME = 2; // sample roughly 1 frame every 2 seconds
// const MIN_FRAMES = 6;
// const MAX_FRAMES = 15;

// /**
//  * Works out how many frames to sample for a video of a given duration (ms).
//  */
// function calculateFrameCount(durationMs) {
//   const durationSeconds = durationMs / 1000;
//   const raw = Math.ceil(durationSeconds / SECONDS_PER_FRAME);
//   return Math.min(MAX_FRAMES, Math.max(MIN_FRAMES, raw));
// }

// /**
//  * Strips the file:// prefix so RNFS.unlink gets a plain filesystem path.
//  */
// function toFsPath(uri) {
//   return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
// }

// /**
//  * Deletes a list of extracted frame files from the device cache.
//  * Safe to call even if some/all files are already gone.
//  */
// async function deleteFrameFiles(frameUris = []) {
//   await Promise.all(
//     frameUris.map(async uri => {
//       try {
//         const path = toFsPath(uri);
//         const exists = await RNFS.exists(path);
//         if (exists) {
//           await RNFS.unlink(path);
//         }
//       } catch (err) {
//         console.warn('Failed to delete frame file:', uri, err);
//       }
//     }),
//   );
// }

// /**
//  * Hook that:
//  * 1. Extracts a duration-aware number of frames spread across the whole video
//  * 2. Uploads those frames via the useCheckVideoFrames mutation (React Query),
//  *    which hits the backend for Google Vision SafeSearch moderation
//  * 3. Deletes the extracted frame files once the upload finishes (success or failure)
//  * 4. Processes multiple videos sequentially, one full cycle at a time
//  * 5. Exposes a manual cleanup function for when the user removes a video
//  *    before extraction/upload has finished
//  *
//  * @param {Function} setSelectedMedia - the setState function from the caller
//  */
// export default function useVideoModeration(setSelectedMedia) {
//   const {mutateAsync: checkVideoFramesMutate} = useCheckVideoFrames();

//   const updateMediaAt = (mediaIndex, videoUri, patch) => {
//     setSelectedMedia(prev => {
//       const updated = [...prev];
//       if (updated[mediaIndex] && updated[mediaIndex].uri === videoUri) {
//         updated[mediaIndex] = {...updated[mediaIndex], ...patch};
//       }
//       return updated;
//     });
//   };

//   const moderateVideo = async (videoUri, mediaIndex) => {
//     let extractedFrameUris = [];

//     try {
//       updateMediaAt(mediaIndex, videoUri, {
//         moderationStatus: 'checking',
//         moderationError: false,
//       });

//       const metadata = await getVideoMetadata(videoUri);
//       const frameCount = calculateFrameCount(metadata.duration);

//       const frames = await extractFrames(videoUri, {
//         startTime: 0,
//         endTime: -1,
//         frameCount,
//         quality: 70,
//         format: 'jpeg',
//         width: 480,
//       });

//       if (!frames || frames.length === 0) {
//         throw new Error('No frames extracted');
//       }

//       extractedFrameUris = frames.map(f => f.uri);

//       // Frame extraction is done — clear the thumbnail spinner now and
//       // keep track of the frame files in case the user removes the video
//       // before the upload below finishes.
//       updateMediaAt(mediaIndex, videoUri, {
//         posterUri: frames[0].uri,
//         thumbnailExtracting: false,
//         pendingFrameUris: extractedFrameUris,
//       });

//       // Goes through React Query -> API/moderation.js -> your shared `api`
//       // axios instance, same pattern as useAddBanner. Auth header is
//       // handled by whatever interceptor `api` already has configured.
//       const response = await checkVideoFramesMutate({mediaIndex, frames});

//       // Axios wraps the server response in `.data`; your backend's
//       // ApiResponse also nests the payload under `.data`, hence `.data.data`.
//       // Adjust this line if your `api` instance already unwraps one layer.
//       const result = response?.data?.data;

//       if (!result) {
//         throw new Error('Malformed moderation response');
//       }

//       updateMediaAt(mediaIndex, videoUri, {
//         moderationStatus: result.approved ? 'approved' : 'flagged',
//         moderationReason: result.rejectionReason || null,
//         moderationRecordId: result._id, // needed later for /verify before posting
//         pendingFrameUris: [],
//       });
//     } catch (error) {
//       console.error('Video moderation failed:', error);
//       updateMediaAt(mediaIndex, videoUri, {
//         moderationStatus: 'error',
//         moderationError: true,
//         pendingFrameUris: [],
//       });
//     } finally {
//       // Frames only exist to be uploaded for moderation — once the
//       // request has resolved (success or failure) they're no longer
//       // needed on-device, so delete them regardless of outcome.
//       // The poster frame (frames[0].uri) is excluded so the thumbnail
//       // keeps working after cleanup.
//       const posterUri = extractedFrameUris[0];
//       const toDelete = extractedFrameUris.filter(uri => uri !== posterUri);
//       if (toDelete.length > 0) {
//         deleteFrameFiles(toDelete);
//       }
//     }
//   };

//   /**
//    * Moderates every video in a freshly-added batch, ONE AT A TIME.
//    * Each video's full cycle (extract → upload → Vision API response)
//    * completes before the next video starts. Matches the backend's
//    * per-user processing lock, which rejects a second concurrent request
//    * with 429 anyway — so sequencing client-side avoids wasted requests too.
//    */
//   const moderateNewMedia = async (newMedia, startIndex) => {
//     const videoEntries = newMedia
//       .map((media, i) => ({media, index: startIndex + i}))
//       .filter(entry => entry.media.isVideo);

//     for (const {media, index} of videoEntries) {
//       // eslint-disable-next-line no-await-in-loop
//       await moderateVideo(media.uri, index);
//     }
//   };

//   /**
//    * Call this when the user removes a video from the picker (cross/remove
//    * button) so any frames already extracted for it — poster included —
//    * are cleaned up instead of lingering in cache.
//    */
//   const cleanupMediaFrames = media => {
//     if (!media || !media.isVideo) {
//       return;
//     }
//     const uris = [
//       ...(media.pendingFrameUris || []),
//       media.posterUri,
//     ].filter(Boolean);
//     if (uris.length > 0) {
//       deleteFrameFiles(uris);
//     }
//   };

//   return {moderateVideo, moderateNewMedia, cleanupMediaFrames};
// }
