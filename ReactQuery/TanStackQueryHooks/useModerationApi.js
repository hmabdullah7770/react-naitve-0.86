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