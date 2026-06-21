// hooks/useToggleFollow.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { togglefollow } from '../../API/followerlist'; // your api function

export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
     mutationFn: (followingId) => {
      console.log('Mutation payload (followingId):', followingId);
      return togglefollow(followingId);
    },
    onMutate: async (followingId) => {

        console.log('onMutate payload:', followingId);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['followList'] });

      // Snapshot the previous value
      const previousFollowList = queryClient.getQueryData(['followList']);

      // Optimistically update the cache
      queryClient.setQueryData(['followList'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          following: oldData.following?.some((user) => user._id === followingId)
            ? oldData.following.filter((user) => user._id !== followingId) // Unfollow
            : [...(oldData.following || []), { _id: followingId }], // Follow
        };
      });

      // Return context with snapshot
      return { previousFollowList };
    },

    onError: (error, followingId, context) => {
      // Rollback on error
      queryClient.setQueryData(['followList'], context.previousFollowList);
      console.error('Toggle follow failed:', error);
    },

    onSuccess: (data) => {
      console.log('Toggle follow success:', data);
    },

    onSettled: (data, error, followingId) => {
      // Always refetch after error or success

      console.log('Toggle follow settled:', data, error, followingId);

      queryClient.invalidateQueries({ queryKey: ['followList'] });
      queryClient.invalidateQueries({
    queryKey: ['getUserById', followingId],
    refetchType: 'all',
  });
    },
  });
};