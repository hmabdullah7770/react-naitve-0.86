import api from '../services/apiservice'; // adjust path to match your project

/**
 * Sends extracted video frames to the backend for Google Vision
 * SafeSearch moderation. One video per call — frontend processes
 * videos sequentially, one full cycle (extract -> upload -> result)
 * at a time.
 *
 * @param {number} mediaIndex - index of this video in selectedMedia
 * @param {Array<{uri: string}>} frames - extracted frame results (from extractFrames)
 */
export const checkVideoFrames = (mediaIndex, frames) => {
  const formData = new FormData();
  formData.append('mediaIndex', String(mediaIndex));

  frames.forEach((frame, i) => {
    formData.append('frames', {
      uri: frame.uri,
      type: 'image/jpeg',
      name: `frame_${i}.jpg`,
    });
  });

  return api.post('/videomoderation/check-frames', formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
};

/**
 * Verifies a moderation record is approved before a post is actually
 * submitted. Call this at post-submit time for every video in the post,
 * passing the moderationRecordId stored on that media item.
 *
 * @param {string} _id - the moderation record's MongoDB _id
 */
export const verifyModeration = _id => api.post('/videomoderation/verify', {_id});


/**
 * Deletes a VideoModeration record — called when the user removes a
 * video from the picker, so the DB record doesn't linger after the
 * video itself is gone from the post being composed.
 *
 * @param {string} id - the moderation record's MongoDB _id
 */

export const deleteVideoModeration = id => api.delete(`/videomoderation/${id}`);
 