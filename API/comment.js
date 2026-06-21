import api from '../services/apiservice';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Helper function to add a delay (useful for ensuring file is fully written)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to verify file exists before upload
const verifyFileExists = async (uri) => {
  try {
    // Remove file:// prefix for RNFS
    const filePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
    const exists = await RNFS.exists(filePath);
    if (exists) {
      const stat = await RNFS.stat(filePath);
      console.log('📁 File verification:', { path: filePath, exists, size: stat.size });
      return stat.size > 0; // File exists and has content
    }
    console.warn('⚠️ File does not exist:', filePath);
    return false;
  } catch (error) {
    console.error('❌ File verification error:', error);
    return false;
  }
};

// Helper function to retry failed requests
const retryRequest = async (requestFn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      const result = await requestFn();
      console.log(`✅ Upload succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await delay(delayMs);
        delayMs *= 1.5; // Exponential backoff
      }
    }
  }
  throw lastError;
};

// IMPROVED: Helper function to detect MIME type with special handling for audio recordings
const getFileType = (uri, isAudioRecording = false) => {
  if (!uri) return 'application/octet-stream';

  // If it's explicitly an audio recording (from the recorder), use audio MIME type
  if (isAudioRecording) {
    const extension = uri.split('.').pop().toLowerCase();
    if (extension === 'mp4' || extension === 'm4a') {
      return 'audio/mp4'; // or 'audio/mpeg' depending on your backend
    }
    if (extension === 'aac') return 'audio/aac';
    if (extension === 'wav') return 'audio/wav';
    if (extension === 'mp3') return 'audio/mpeg';
  }

  const extension = uri.split('.').pop().toLowerCase();
  const mimeTypes = {
    // Video formats
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    // Audio formats
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    aac: 'audio/aac',
    // Image formats
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    // Document formats
    pdf: 'application/pdf',
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

// Helper function to get file name from URI
const getFileName = (uri, defaultName = 'file') => {
  if (!uri) return defaultName;
  const parts = uri.split('/');
  return parts[parts.length - 1] || defaultName;
};

// Get comments for a specific post
export const getComments = (cursor, limit, postId, options = {}) => {
  const { getHasReply, getRepliesCount, userCommentId} = options;
  return api.get(`/newcomments/${encodeURIComponent(postId)}`, {
    params: {
      cursor ,
      limit,
      getHasReply,
      getRepliesCount,
      userCommentId,
    
    },
  });
};

// Add comment to a post
export const addComment = async (postId, content, audioComment, videoComment, sticker, imageComment, fileComment) => {
  console.log('🔧 Building FormData...');

  // Verify audio file exists before building FormData (if present)
  if (audioComment) {
    console.log('🔍 Verifying audio file before upload...');
    const fileExists = await verifyFileExists(audioComment);
    if (!fileExists) {
      // Wait a bit and try again - file might still be writing
      console.log('⏳ File not ready, waiting 500ms...');
      await delay(500);
      const fileExistsRetry = await verifyFileExists(audioComment);
      if (!fileExistsRetry) {
        throw new Error('Audio file does not exist or is empty. Please try recording again.');
      }
    }
  }

  const formData = new FormData();

  // Add text content if present
  if (content) {
    formData.append('content', content);
    console.log('✏️ Added content:', content);
  }

  // Add audio file if present - FIXED: Use audio MIME type for recordings
  if (audioComment) {
    // Detect if this is a recording (contains 'sound_' in filename)
    const isRecording = audioComment.includes('sound_') || audioComment.includes('recording');

    const audioFile = {
      uri: audioComment,
      type: getFileType(audioComment, isRecording),
      name: getFileName(audioComment, 'audio_recording.m4a')
    };

    formData.append('audioComment', audioFile);

    console.log('🎤 Audio file details:', {
      uri: audioFile.uri,
      type: audioFile.type,
      name: audioFile.name,
      isRecording: isRecording
    });
  }

  // Add video file if present
  if (videoComment) {
    const videoFile = {
      uri: videoComment,
      type: getFileType(videoComment, false),
      name: getFileName(videoComment, 'video.mp4')
    };
    formData.append('videoComment', videoFile);
    console.log('🎥 Added video:', videoFile.name);
  }

  // Add sticker if present
  if (sticker) {
    const stickerFile = {
      uri: sticker,
      type: getFileType(sticker, false),
      name: getFileName(sticker, 'sticker.png')
    };
    formData.append('sticker', stickerFile);
    console.log('😀 Added sticker:', stickerFile.name);
  }

  // Add image if present
  if (imageComment) {
    const imageFile = {
      uri: imageComment,
      type: getFileType(imageComment, false),
      name: getFileName(imageComment, 'image.jpg')
    };
    formData.append('imageComment', imageFile);
    console.log('🖼️ Added image:', imageFile.name);
  }

  // Add file if present
  if (fileComment) {
    const pdfFile = {
      uri: fileComment,
      type: getFileType(fileComment, false),
      name: getFileName(fileComment, 'document.pdf')
    };
    formData.append('fileComment', pdfFile);
    console.log('📄 Added file:', pdfFile.name);
  }

  console.log('🚀 Sending FormData to:', `/newcomments/${postId}`);

  // Use retry logic for the upload
  const makeRequest = () => api.post(`/newcomments/${encodeURIComponent(postId)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => {
      return data;
    },
    timeout: 60000, // Increased to 60 seconds for large files
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`📤 Upload progress: ${percentCompleted}%`);
    },
  });

  // Retry up to 3 times with exponential backoff
  return retryRequest(makeRequest, 3, 1000);
};

// Update comment
export const updateComment = (commentId, content, audioComment, videoComment, sticker) => {
  const formData = new FormData();

  if (content) {
    formData.append('content', content);
  }

  if (audioComment) {
    const isRecording = audioComment.includes('sound_') || audioComment.includes('recording');
    const audioFile = {
      uri: audioComment,
      type: getFileType(audioComment, isRecording),
      name: getFileName(audioComment, 'audio_recording.m4a')
    };
    formData.append('audioComment', audioFile);
  }

  if (videoComment) {
    const videoFile = {
      uri: videoComment,
      type: getFileType(videoComment, false),
      name: getFileName(videoComment, 'video.mp4')
    };
    formData.append('videoComment', videoFile);
  }

  if (sticker) {
    const stickerFile = {
      uri: sticker,
      type: getFileType(sticker, false),
      name: getFileName(sticker, 'sticker.png')
    };
    formData.append('sticker', stickerFile);
  }

  return api.patch(`/newcomments/${encodeURIComponent(commentId)}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => {
      return data;
    },
    timeout: 60000,
  });
};

// Delete comment
export const deleteComment = (commentId, postId) =>
  api.delete(`/newcomments/${encodeURIComponent(commentId)}`, {
    data: { postId }
  });

// Add reply to a comment
export const addReply = async (commentId, content, audioComment, videoComment, sticker, imageComment, fileComment) => {
  console.log('🔧 Building Reply FormData...');

  // Verify audio file exists before building FormData (if present)
  if (audioComment) {
    console.log('🔍 Verifying reply audio file before upload...');
    const fileExists = await verifyFileExists(audioComment);
    if (!fileExists) {
      // Wait a bit and try again - file might still be writing
      console.log('⏳ File not ready, waiting 500ms...');
      await delay(500);
      const fileExistsRetry = await verifyFileExists(audioComment);
      if (!fileExistsRetry) {
        throw new Error('Audio file does not exist or is empty. Please try recording again.');
      }
    }
  }

  const formData = new FormData();

  if (content) {
    formData.append('content', content);
  }

  if (audioComment) {
    const isRecording = audioComment.includes('sound_') || audioComment.includes('recording');
    const audioFile = {
      uri: audioComment,
      type: getFileType(audioComment, isRecording),
      name: getFileName(audioComment, 'audio_recording.m4a')
    };
    formData.append('audioComment', audioFile);
    console.log('🎤 Reply audio:', audioFile);
  }

  if (videoComment) {
    const videoFile = {
      uri: videoComment,
      type: getFileType(videoComment, false),
      name: getFileName(videoComment, 'video.mp4')
    };
    formData.append('videoComment', videoFile);
  }

  if (sticker) {
    const stickerFile = {
      uri: sticker,
      type: getFileType(sticker, false),
      name: getFileName(sticker, 'sticker.png')
    };
    formData.append('sticker', stickerFile);
  }

  if (imageComment) {
    const imageFile = {
      uri: imageComment,
      type: getFileType(imageComment, false),
      name: getFileName(imageComment, 'image.jpg')
    };
    formData.append('imageComment', imageFile);
  }

  if (fileComment) {
    const pdfFile = {
      uri: fileComment,
      type: getFileType(fileComment, false),
      name: getFileName(fileComment, 'document.pdf')
    };
    formData.append('fileComment', pdfFile);
  }

  console.log('🚀 Sending Reply FormData to:', `/newcomments/${commentId}/reply`);

  // Use retry logic for the upload
  const makeRequest = () => api.post(`/newcomments/${encodeURIComponent(commentId)}/reply`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => {
      return data;
    },
    timeout: 60000,
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`📤 Reply upload progress: ${percentCompleted}%`);
    },
  });

  // Retry up to 3 times with exponential backoff
  return retryRequest(makeRequest, 3, 1000);
};

// Get replies for a comment
export const getReplies = (commentId, cursor, limit, options = {}) => {
  const { getHasReply, getRepliesCount, userCommentId, pinnedComment} = options;
  return api.get(`/newcomments/${encodeURIComponent(commentId)}/replies`, {
    params: {
      cursor,
      limit,
      getHasReply,
      getRepliesCount,
      userCommentId,
      pinnedComment,
    },
  });
};

// Comments with ratings
export const getCommentsWithRatings = (contentType, contentId) =>
  api.get(`/${contentType}/${contentId}/with-ratings`);

// Like a comment
export const addLike = (commentId) =>
  api.post(`/newcomments/comment/${commentId}/like`);

// Dislike a comment
export const addDisLike = (commentId) =>
  api.post(`/newcomments/comment/${commentId}/dislike`);

// Get like/dislike status for a comment
export const getCommentLikeStatus = (commentId) =>
  api.get(`/newcomments/comment/${commentId}/like-status`);

// Pin a comment
export const pinComment = (commentId, postId) =>
  api.post(`/newcomments/comment/${encodeURIComponent(commentId)}/pin`, { postId });

// Unpin a comment
export const unpinComment = (commentId, postId) =>
  api.post(`/newcomments/comment/${encodeURIComponent(commentId)}/unpin`, { postId });

// import api from '../services/apiservice';

// // Get comments for a specific post
// export const getComments = (cursor, limit, postId, options = {}) => {
//   const { getHasReply, getRepliesCount, userCommentId, pinnedCommentId } = options;
//   return api.get(`/newcomments/${encodeURIComponent(postId)}`, {
//     params: {
//       cursor,
//       limit,
//       getHasReply,
//       getRepliesCount,
//       userCommentId,
//       pinnedCommentId,
//     },
//   });
// };

// // Add comment to a post
// export const addComment = (postId, content, audioComment, videoComment, sticker, imageComment, fileComment) =>
//   api.post(`/newcomments/${encodeURIComponent(postId)}`, {
//     content,
//     audioComment,
//     videoComment,
//     sticker,
//     imageComment,
//     fileComment,
//   });

// export const updateComment = (commentId, content, audioComment, videoComment, sticker) =>
//   api.patch(`/newcomments/${encodeURIComponent(commentId)}`, {
//     content,
//     audioComment,
//     videoComment,
//     sticker
//   });

// export const deleteComment = (commentId, postId) =>
//   api.delete(`/newcomments/${encodeURIComponent(commentId)}`, {
//     data: { postId } // DELETE requests often send body in 'data' property in axios
//   });

// export const addReply = (commentId, content, audioComment, videoComment, sticker, imageComment, fileComment) =>
//   api.post(`/newcomments/${encodeURIComponent(commentId)}/reply`, {
//     content,
//     audioComment,
//     videoComment,
//     sticker,
//     imageComment,
//     fileComment,
//   });

// export const getReplies = (commentId, cursor, limit, options = {}) => {
//   const { getHasReply, getRepliesCount, userCommentId, pinnedCommentId } = options;
//   return api.get(`/newcomments/${encodeURIComponent(commentId)}/replies`, {
//     params: {
//       cursor,
//       limit,
//       getHasReply,
//       getRepliesCount,
//       userCommentId,
//       pinnedCommentId,
//     },
//   });
// };

// // Comments with ratings
// export const getCommentsWithRatings = (contentType, contentId) =>
//   api.get(`/${contentType}/${contentId}/with-ratings`);

// export const addLike = (commentId) =>
//   api.post(`/newcomments/comment/${commentId}/like`);

// export const addDisLike = (commentId) =>
//   api.post(`/newcomments/comment/${commentId}/dislike`);

// export const getCommentLikeStatus = (commentId) =>
//   api.get(`/newcomments/comment/${commentId}/like-status`);


// export const pinComment = (commentId, postId) =>
//   api.post(`/newcomments/${encodeURIComponent(commentId)}/pin`, { postId });

// export const unpinComment = (commentId, postId) =>
//   api.post(`/newcomments/${encodeURIComponent(commentId)}/unpin`, { postId });