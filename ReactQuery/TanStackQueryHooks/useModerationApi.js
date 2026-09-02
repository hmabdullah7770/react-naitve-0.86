import {useMutation} from '@tanstack/react-query';
import {checkVideoFrames, verifyModeration,deleteVideoModeration} from '../../API/moderation'; // adjust path to your api file

// CHECK video frames (nudity/moderation check via Vision API)
export const useCheckVideoFrames = () => {
  return useMutation({
    mutationFn: ({mediaIndex, frames}) => {
      console.log(
        '🌐 useCheckVideoFrames — calling API for mediaIndex:',
        mediaIndex,
        'frameCount:',
        frames.length,
      );
      return checkVideoFrames(mediaIndex, frames);
    },

    // 👇 this is the fix — React Query handles retry natively
    retry: (failureCount, error) => {
      const isRetryable = error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response;
      if (!isRetryable) return false;       // don't retry real server errors (4xx/5xx)
      return failureCount < 3;               // retry up to 3 times for transport failures
    },
    retryDelay: attempt => Math.min(500 * 2 ** attempt, 5000) + Math.random() * 200, // exponential backoff + jitter

    onSuccess: data => {
      console.log('✅ useCheckVideoFrames — success:', data);
    },
    onError: error => {
      console.log('❌ useCheckVideoFrames — error:', error);
    },
  });
};

// VERIFY moderation record before allowing a post to submit
export const useVerifyModeration = () => {
  return useMutation({
    mutationFn: _id => {
      console.log('🌐 useVerifyModeration — calling API with _id:', _id);
      return verifyModeration(_id);
    },
    onSuccess: data => {
      console.log('✅ useVerifyModeration — success:', data);
    },
    onError: error => {
      console.log('❌ useVerifyModeration — error:', error);
    },
  });
};


// ✅ add this whole hook
export const useDeleteVideoModeration = () => {
  return useMutation({
    mutationFn: id => {
      console.log('🌐 useDeleteVideoModeration — calling API with id:', id);
      return deleteVideoModeration(id);
    },
    onSuccess: data => {
      console.log('✅ useDeleteVideoModeration — success:', data);
    },
    onError: error => {
      console.log('❌ useDeleteVideoModeration — error:', error);
    },
  });
};