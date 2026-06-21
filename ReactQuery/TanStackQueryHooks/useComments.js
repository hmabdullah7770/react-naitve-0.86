import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getComments,
  addComment,
  getReplies,
  addReply,
  pinComment,
  unpinComment,
  addLike,
  addDisLike,
  deleteComment,
} from '../../API/comment';

export const usegetComments = (limit, postId, options = {}) => {
  const {userCommentId, getHasReply, getRepliesCount, ...queryOptions} =
    options;
  return useInfiniteQuery({
    queryKey: ['comments', postId, userCommentId, getHasReply, getRepliesCount],
    queryFn: async ({pageParam = null}) => {
      console.log('📥 Fetching Comments - API Call');
      console.log('PostId:', postId);
      console.log('Page Param:', pageParam);
      console.log('Limit:', limit);
      console.log('Options:', options);

      const response = await getComments(pageParam, limit, postId, options);

      console.log('✅ Comments Fetched Successfully');
      console.log('Response:', response.data);

      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: lastPage => {
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return (
        pagination.nextCursor ||
        lastPage?.data?.comments?.slice(-1)[0]?.inCommentId
      );
    },
    staleTime: 2 * 1000,
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      audioComment,
      videoComment,
      sticker,
      imageComment,
      fileComment,
    }) => {
      console.log('🚀 ADD COMMENT - API CALL STARTED');
      console.log('='.repeat(50));
      console.log('Payload Details:');
      console.log('- PostId:', postId);
      console.log('- Content:', content);
      console.log('- Audio Comment:', audioComment);
      console.log('- Video Comment:', videoComment);
      console.log('- Sticker:', sticker);
      console.log('- Image Comment:', imageComment);
      console.log('- File Comment:', fileComment);
      console.log('='.repeat(50));

      const response = await addComment(
        postId,
        content,
        audioComment,
        videoComment,
        sticker,
        imageComment,
        fileComment,
      );

      console.log('✅ ADD COMMENT - API CALL SUCCESS');
      console.log('Response:', response);
      console.log('='.repeat(50));

      return response;
    },

    onMutate: async ({
      postId,
      content,
      audioComment,
      videoComment,
      sticker,
      imageComment,
      fileComment,
    }) => {
      console.log('⚡ Optimistic Update - Adding comment locally');

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments', postId],
      });

      // Get current comments
      const previousComments = queryClient.getQueryData(['comments', postId]);

      // Create optimistic comment
      const optimisticComment = {
        _id: Date.now().toString(),
        postId,
        content,
        audioComment,
        videoComment,
        sticker,
        imageComment,
        fileComment,
        createdAt: new Date().toISOString(),
        user: {
          // Get current user details from auth state or local storage
          _id: 'temp-id',
          username: 'You',
          avatar: 'default-avatar-url',
        },
        isOptimistic: true,
      };

      // Optimistically update comments list
      queryClient.setQueryData(['comments', postId], old => {
        if (!old)
          return {pages: [{data: [optimisticComment]}], pageParams: [null]};
        return {
          pages: [
            {
              ...old.pages[0],
              messege: {
                ...old.pages[0].messege,
                comments: [
                  optimisticComment,
                  ...(old.pages[0]?.messege?.comments || []),
                ],
              },
            },
            ...old.pages.slice(1),
          ],
          pageParams: old.pageParams,
        };
      });

      console.log('✅ Optimistic comment added to cache');
      return {previousComments};
    },

    onError: (err, variables, context) => {
      console.error('❌ ADD COMMENT - API CALL FAILED');
      console.error('Error:', err);
      // console.error('Variables:', variables);

      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', variables.postId],
          context.previousComments,
        );
        console.log('↩️  Rolled back optimistic update');
      }
    },

    onSuccess: (data, variables) => {
      console.log('🎉 ADD COMMENT - Mutation Success');
      console.log('Server Response:', data);
    },

    onSettled: (data, error, {postId}) => {
      console.log('🔄 Invalidating comments query to refetch from server');
      // Refetch comments to sync with server
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      });
    },
  });
};

export const useGetReplies = (commentId, limit, options = {}) => {
  const {userCommentId, pinnedCommentId, getHasReply, getRepliesCount} =
    options;
  return useInfiniteQuery({
    queryKey: [
      'replies',
      commentId,
      userCommentId,
      pinnedCommentId,
      getHasReply,
      getRepliesCount,
    ],
    queryFn: async ({pageParam = null}) => {
      console.log('📥 Fetching Replies - API Call');
      console.log('CommentId:', commentId);
      console.log('Page Param:', pageParam);
      console.log('Limit:', limit);

      const response = await getReplies(commentId, pageParam, limit, options);

      console.log('✅ Replies Fetched Successfully');
      console.log('Response:', response.data);

      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: lastPage => {
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return (
        pagination.nextCursor ||
        lastPage?.data?.replies?.slice(-1)[0]?.inCommentId
      );
    },
    staleTime: 2 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// export const useAddReply = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       commentId,
//       content,
//       audioComment,
//       videoComment,
//       sticker,
//       imageComment,
//       fileComment,
//     }) => {
//       console.log('🚀 ADD REPLY - API CALL STARTED');
//       console.log('='.repeat(50));
//       console.log('Payload Details:');
//       console.log('- CommentId:', commentId);
//       console.log('- Content:', content);
//       console.log('- Audio Comment:', audioComment);
//       console.log('- Video Comment:', videoComment);
//       console.log('- Sticker:', sticker);
//       console.log('- Image Comment:', imageComment);
//       console.log('- File Comment:', fileComment);
//       console.log('='.repeat(50));

//       const response = await addReply(
//         commentId,
//         content,
//         audioComment,
//         videoComment,
//         sticker,
//         imageComment,
//         fileComment,
//       );

//       console.log('✅ ADD REPLY - API CALL SUCCESS');
//       console.log('Response:', response);
//       console.log('='.repeat(50));

//       return response;
//     },

//     onMutate: async ({
//       commentId,
//       content,
//       audioComment,
//       videoComment,
//       sticker,
//       imageComment,
//       fileComment,
//     }) => {
//       console.log('⚡ Optimistic Update - Adding reply locally');

//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['replies', commentId],
//       });

//       // Get current replies
//       const previousReplies = queryClient.getQueryData(['replies', commentId]);

//       // Create optimistic reply
//       const optimisticReply = {
//         _id: Date.now().toString(),
//         commentId,
//         content,
//         audioComment,
//         videoComment,
//         sticker,
//         imageComment,
//         fileComment,
//         createdAt: new Date().toISOString(),
//         user: {
//           _id: 'temp-id',
//           username: 'You',
//           avatar: 'default-avatar-url',
//         },
//         isOptimistic: true,
//       };

//       // Optimistically update replies list
//       queryClient.setQueryData(['replies', commentId], old => {
//         if (!old)
//           return {pages: [{data: [optimisticReply]}], pageParams: [null]};
//         return {
//           pages: [
//             {
//               ...old.pages[0],
//               messege: {
//                 ...old.pages[0].messege,
//                 replies: [
//                   optimisticReply,
//                   ...(old.pages[0]?.messege?.replies || []),
//                 ],
//               },
//             },
//             ...old.pages.slice(1),
//           ],
//           pageParams: old.pageParams,
//         };
//       });

//       console.log('✅ Optimistic reply added to cache');
//       return {previousReplies};
//     },

//     onError: (err, variables, context) => {
//       console.error('❌ ADD REPLY - API CALL FAILED');
//       console.error('Error:', err);
//       console.error('Variables:', variables);

//       // Rollback on error
//       if (context?.previousReplies) {
//         queryClient.setQueryData(
//           ['replies', variables.commentId],
//           context.previousReplies,
//         );
//         console.log('↩️  Rolled back optimistic update');
//       }
//     },

//     onSuccess: (data, variables) => {
//       console.log('🎉 ADD REPLY - Mutation Success');
//       console.log('Server Response:', data);
//     },

//     onSettled: (data, error, {commentId}) => {
//       console.log('🔄 Invalidating replies query to refetch from server');
//       // Refetch replies to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['replies', commentId],
//       });
//     },
//   });
// };




export const useAddReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
      audioComment,
      videoComment,
      sticker,
      imageComment,
      fileComment,
    }) => {
      console.log('🚀 ADD REPLY - API CALL STARTED');
      console.log('='.repeat(50));
      console.log('Payload Details:');
      console.log('- CommentId:', commentId);
      console.log('- Content:', content);
      console.log('- Audio Comment:', audioComment);
      console.log('- Video Comment:', videoComment);
      console.log('- Sticker:', sticker);
      console.log('- Image Comment:', imageComment);
      console.log('- File Comment:', fileComment);
      console.log('='.repeat(50));

      const response = await addReply(
        commentId,
        content,
        audioComment,
        videoComment,
        sticker,
        imageComment,
        fileComment,
      );

      console.log('✅ ADD REPLY - API CALL SUCCESS');
      console.log('Response:', response);
      console.log('='.repeat(50));

      return response;
    },

    onMutate: async ({
      commentId,
      content,
      audioComment,
      videoComment,
      sticker,
      imageComment,
      fileComment,
    }) => {
      console.log('⚡ Optimistic Update - Adding reply locally');

      // Cancel outgoing refetches for both replies AND comments
      await queryClient.cancelQueries({
        queryKey: ['replies', commentId],
      });
      await queryClient.cancelQueries({
        queryKey: ['comments'],
      });
      await queryClient.cancelQueries({
        queryKey: ['replies'],
      });

      // Get current replies
      const previousReplies = queryClient.getQueryData(['replies', commentId]);
      const previousComments = queryClient.getQueryData(['comments']);

      // Create optimistic reply
      const optimisticReply = {
        _id: `temp-${Date.now()}`,
        commentId,
        content,
        audioUrl: audioComment,
        videoUrl: videoComment,
        stickerUrl: sticker,
        imageUrl: imageComment,
        fileUrl: fileComment,
        commentType: content ? 'text' : (audioComment ? 'audio' : (videoComment ? 'video' : (imageComment ? 'image' : (fileComment ? 'file' : 'sticker')))),
        createdAt: new Date().toISOString(),
        owner: {
          _id: 'temp-user-id',
          username: 'You',
          avatar: 'default-avatar-url',
        },
        userHasLiked: false,
        userHasDisliked: false,
        numberOfLikes: 0,
        numberOfDislikes: 0,
        hasReply: false,
        isOptimistic: true,
      };

      // 1. Optimistically update replies list for this specific comment
      queryClient.setQueryData(['replies', commentId], old => {
        if (!old) {
          return {
            pages: [{
              data: {
                replies: [optimisticReply],
                pagination: {
                  totalReplies: 1,
                  hasNextPage: false,
                }
              }
            }],
            pageParams: [null]
          };
        }
        
        const newPages = [...old.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            data: {
              ...newPages[0].data,
              replies: [optimisticReply, ...(newPages[0]?.data?.replies || [])],
              pagination: {
                ...newPages[0]?.data?.pagination,
                totalReplies: (newPages[0]?.data?.pagination?.totalReplies || 0) + 1,
              }
            },
          };
        }
        
        return {
          ...old,
          pages: newPages,
        };
      });

      // 2. ✅ UPDATE THE PARENT COMMENT'S hasReply FLAG in comments cache
      queryClient.setQueryData(['comments'], old => {
        if (!old) return old;

        const newPages = old.pages.map(page => {
          const comments = page?.data?.comments || [];
          return {
            ...page,
            data: {
              ...page.data,
              comments: comments.map(comment =>
                comment._id === commentId
                  ? { ...comment, hasReply: true }
                  : comment
              ),
            },
          };
        });

        return { ...old, pages: newPages };
      });

      // 3. ✅ NEW: UPDATE THE PARENT REPLY'S hasReply FLAG in ALL replies caches
      queryClient.setQueriesData(['replies'], (old) => {
        // Safety check: only process if old exists and has the expected structure
        if (!old || !old.pages || !Array.isArray(old.pages)) return old;

        const newPages = old.pages.map(page => {
          // Safety check: ensure page has the expected structure
          if (!page || !page.data || !page.data.replies) return page;
          
          const replies = page.data.replies;
          return {
            ...page,
            data: {
              ...page.data,
              replies: replies.map(reply =>
                reply._id === commentId
                  ? { ...reply, hasReply: true }
                  : reply
              ),
            },
          };
        });

        return { ...old, pages: newPages };
      });

      console.log('✅ Optimistic reply added to cache');
      console.log('✅ Parent comment/reply hasReply flag updated');
      
      return { previousReplies, previousComments };
    },

    onError: (err, variables, context) => {
      console.error('❌ ADD REPLY - API CALL FAILED');
      console.error('Error:', err);

      // Rollback on error
      if (context?.previousReplies) {
        queryClient.setQueryData(
          ['replies', variables.commentId],
          context.previousReplies,
        );
        console.log('↩️  Rolled back replies optimistic update');
      }
      
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments'],
          context.previousComments,
        );
        console.log('↩️  Rolled back comments optimistic update');
      }
    },

    onSuccess: (data, variables) => {
      console.log('🎉 ADD REPLY - Mutation Success');
      console.log('Server Response:', data);
    },

    onSettled: (data, error, {commentId}) => {
      console.log('🔄 Invalidating queries to refetch from server');
      // Refetch replies, comments, and all nested replies to sync with server
      queryClient.invalidateQueries({
        queryKey: ['replies', commentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['replies'],
      });
    },
  });
};




export const usePinComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({commentId, postId}) => {
      console.log('🚀 PIN COMMENT - API CALL STARTED');
      console.log('='.repeat(50));
      console.log('Payload Details:');
      console.log('- CommentId:', commentId);
      console.log('- PostId:', postId);
      console.log('='.repeat(50));

      const response = await pinComment(commentId, postId);

      console.log('✅ PIN COMMENT - API CALL SUCCESS');
      console.log('Response:', response);
      console.log('='.repeat(50));

      return response;
    },

    onMutate: async ({commentId, postId}) => {
      console.log('⚡ Optimistic Update - Pinning comment');

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments', postId],
      });

      // Get current comments data
      const previousComments = queryClient.getQueryData(['comments', postId]);

      // Optimistically update comments list
      queryClient.setQueryData(['comments', postId], old => {
        if (!old) return old;

        // Find the comment to pin across all pages
        let commentToPin = null;
        let sourcePageIndex = -1;
        let sourceCommentIndex = -1;

        for (let i = 0; i < old.pages.length; i++) {
          const comments = old.pages[i]?.data?.comments || [];
          const idx = comments.findIndex(c => c._id === commentId);

          if (idx !== -1) {
            // Found the comment - mark it as pinned
            commentToPin = {...comments[idx], isPinned: true};
            sourcePageIndex = i;
            sourceCommentIndex = idx;
            break;
          }
        }

        if (!commentToPin) {
          console.warn('⚠️ Comment not found for pinning');
          return old;
        }

        console.log('📌 Found comment to pin:', commentToPin._id);

        // Create new pages array
        const newPages = old.pages.map((page, pageIdx) => {
          if (pageIdx === sourcePageIndex) {
            // Remove comment from its current position
            const comments = page?.data?.comments || [];
            return {
              ...page,
              data: {
                ...page.data,
                comments: comments.filter(
                  (_, idx) => idx !== sourceCommentIndex,
                ),
              },
            };
          }
          return page;
        });

        // Add pinned comment to the TOP of the FIRST page
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            data: {
              ...newPages[0].data,
              comments: [commentToPin, ...(newPages[0]?.data?.comments || [])],
            },
          };
        }

        console.log('✅ Comment optimistically pinned and moved to top');
        return {...old, pages: newPages};
      });

      return {previousComments};
    },

    onError: (err, variables, context) => {
      console.error('❌ PIN COMMENT - API CALL FAILED');
      console.error('Error:', err);

      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', variables.postId],
          context.previousComments,
        );
        console.log('↩️  Rolled back optimistic update');
      }
    },

    onSuccess: (data, variables) => {
      console.log('🎉 PIN COMMENT - Mutation Success');
      console.log('Server Response:', data);
    },

    onSettled: (data, error, {postId}) => {
      console.log('🔄 Invalidating comments query to refetch from server');
      // Refetch comments to sync with server (backend returns pinned comment at top)
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      });
    },
  });
};

export const useUnpinComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({commentId, postId}) => {
      console.log('🚀 UNPIN COMMENT - API CALL STARTED');
      console.log('='.repeat(50));
      console.log('Payload Details:');
      console.log('- CommentId:', commentId);
      console.log('- PostId:', postId);
      console.log('='.repeat(50));

      const response = await unpinComment(commentId, postId);

      console.log('✅ UNPIN COMMENT - API CALL SUCCESS');
      console.log('Response:', response);
      console.log('='.repeat(50));

      return response;
    },

    onMutate: async ({commentId, postId}) => {
      console.log('⚡ Optimistic Update - Unpinning comment');

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments', postId],
      });

      // Get current comments
      const previousComments = queryClient.getQueryData(['comments', postId]);

      // Optimistically update comments list
      queryClient.setQueryData(['comments', postId], old => {
        if (!old) return old;

        // Find and update the pinned comment
        const newPages = old.pages.map(page => {
          const comments = page?.data?.comments || [];
          return {
            ...page,
            data: {
              ...page.data,
              comments: comments.map(comment =>
                comment._id === commentId
                  ? {...comment, isPinned: false}
                  : comment,
              ),
            },
          };
        });

        console.log('✅ Comment optimistically unpinned');
        return {...old, pages: newPages};
      });

      return {previousComments};
    },

    onError: (err, variables, context) => {
      console.error('❌ UNPIN COMMENT - API CALL FAILED');
      console.error('Error:', err);

      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', variables.postId],
          context.previousComments,
        );
        console.log('↩️  Rolled back optimistic update');
      }
    },

    onSuccess: (data, variables) => {
      console.log('🎉 UNPIN COMMENT - Mutation Success');
      console.log('Server Response:', data);
    },

    onSettled: (data, error, {postId}) => {
      console.log('🔄 Invalidating comments query to refetch from server');
      // Refetch comments to sync with server
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      });
    },
  });
};




/* ---------------- LIKE COMMENT ---------------- */

export const useLikeComment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addLike, // Expects just commentId

    onMutate: async (commentId) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries(['comments']);

      // Snapshot the previous value
      const prev = qc.getQueryData(['comments']);

      // Optimistically update the cache
      qc.setQueryData(['comments'], old => {
        if (!old) return old;

        return {
          ...old,
          pages: updateCommentInPages(old.pages, commentId, c => ({
            ...c,
            numberOfLikes: c.userHasLiked 
              ? c.numberOfLikes - 1 
              : c.numberOfLikes + 1,
            userHasLiked: !c.userHasLiked,
            userHasDisliked: false,
            numberOfDislikes: c.userHasDisliked 
              ? c.numberOfDislikes - 1 
              : c.numberOfDislikes,
          })),
        };
      });

      return { prev };
    },

    onError: (_e, _commentId, ctx) => {
      // Rollback to previous state on error
      if (ctx?.prev) {
        qc.setQueryData(['comments'], ctx.prev);
      }
    },

    onSettled: (_data, _error, commentId) => {
      // Only invalidate if there was an error (success is already handled optimistically)
      // This prevents infinite loops from constant refetching
      if (_error) {
        qc.invalidateQueries(['comments']);
      }
    },
  });
};

/* ---------------- DISLIKE COMMENT ---------------- */

export const useDislikeComment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addDisLike, // Expects just commentId

    onMutate: async (commentId) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries(['comments']);

      // Snapshot the previous value
      const prev = qc.getQueryData(['comments']);

      // Optimistically update the cache
      qc.setQueryData(['comments'], old => {
        if (!old) return old;

        return {
          ...old,
          pages: updateCommentInPages(old.pages, commentId, c => ({
            ...c,
            numberOfDislikes: c.userHasDisliked 
              ? c.numberOfDislikes - 1 
              : c.numberOfDislikes + 1,
            userHasDisliked: !c.userHasDisliked,
            userHasLiked: false,
            numberOfLikes: c.userHasLiked 
              ? c.numberOfLikes - 1 
              : c.numberOfLikes,
          })),
        };
      });

      return { prev };
    },

    onError: (_e, _commentId, ctx) => {
      // Rollback to previous state on error
      if (ctx?.prev) {
        qc.setQueryData(['comments'], ctx.prev);
      }
    },

    onSettled: (_data, _error, commentId) => {
      // Only invalidate if there was an error (success is already handled optimistically)
      // This prevents infinite loops from constant refetching
      if (_error) {
        qc.invalidateQueries(['comments']);
      }
    },
  });
};

/* ---------------- HELPER FUNCTION ---------------- */

// Make sure you have this helper function that updates a comment in all pages
const updateCommentInPages = (pages, commentId, updateFn) => {
  return pages.map(page => ({
    ...page,
    data: {
      ...page.data,
      comments: page.data.comments.map(comment => 
        comment._id === commentId 
          ? updateFn(comment) 
          : comment
      ),
    },
  }));
};

// * ---------------- DELETE COMMENT (works for both comments and replies) ---------------- */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }) => {
      console.log('🗑️ DELETE COMMENT - API CALL STARTED');
      console.log('='.repeat(50));
      console.log('Payload Details:');
      console.log('- CommentId:', commentId);
      console.log('- PostId:', postId);
      console.log('='.repeat(50));

      const response = await deleteComment(commentId, postId);

      console.log('✅ DELETE COMMENT - API CALL SUCCESS');
      console.log('Response:', response);
      console.log('='.repeat(50));

      return response;
    },

    onMutate: async ({ commentId, postId }) => {
      console.log('⚡ Optimistic Update - Deleting comment/reply from UI');

      // Cancel all outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments'],
      });
      await queryClient.cancelQueries({
        queryKey: ['replies'],
      });

      // Snapshot previous values
      const previousComments = queryClient.getQueryData(['comments']);
      const previousRepliesQueries = queryClient.getQueriesData(['replies']);

      // 1. Try to remove from comments cache
      queryClient.setQueryData(['comments', postId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map(page => {
          const comments = page?.data?.comments || [];
          return {
            ...page,
            data: {
              ...page.data,
              comments: comments.filter(comment => comment._id !== commentId),
              pagination: {
                ...page.data.pagination,
                totalComments: Math.max(0, (page.data.pagination?.totalComments || 0) - 1),
              }
            },
          };
        });

        console.log('✅ Removed from comments cache');
        return { ...old, pages: newPages };
      });

      // 2. Remove from all replies caches
      queryClient.setQueriesData(['replies'], (old) => {
        if (!old || !old.pages || !Array.isArray(old.pages)) return old;

        const newPages = old.pages.map(page => {
          if (!page || !page.data || !page.data.replies) return page;
          
          const replies = page.data.replies;
          return {
            ...page,
            data: {
              ...page.data,
              replies: replies.filter(reply => reply._id !== commentId),
              pagination: {
                ...page.data.pagination,
                totalReplies: Math.max(0, (page.data.pagination?.totalReplies || 0) - 1),
              }
            },
          };
        });

        console.log('✅ Removed from replies cache');
        return { ...old, pages: newPages };
      });

      // 3. Update hasReply flags in comments cache
      queryClient.setQueryData(['comments'], (old) => {
        if (!old) return old;

        const newPages = old.pages.map(page => {
          const comments = page?.data?.comments || [];
          return {
            ...page,
            data: {
              ...page.data,
              comments: comments.map(comment => {
                // Check if this comment still has replies after deletion
                const repliesData = queryClient.getQueryData(['replies', comment._id]);
                const hasReplies = repliesData?.pages?.[0]?.data?.replies?.length > 0;
                
                return {
                  ...comment,
                  hasReply: hasReplies || false,
                };
              }),
            },
          };
        });

        console.log('✅ Updated hasReply flags in comments');
        return { ...old, pages: newPages };
      });

      // 4. Update hasReply flags in all replies caches
      queryClient.setQueriesData(['replies'], (old) => {
        if (!old || !old.pages || !Array.isArray(old.pages)) return old;

        const newPages = old.pages.map(page => {
          if (!page || !page.data || !page.data.replies) return page;
          
          const replies = page.data.replies;
          return {
            ...page,
            data: {
              ...page.data,
              replies: replies.map(reply => {
                // Check if this reply still has nested replies after deletion
                const nestedRepliesData = queryClient.getQueryData(['replies', reply._id]);
                const hasNestedReplies = nestedRepliesData?.pages?.[0]?.data?.replies?.length > 0;
                
                return {
                  ...reply,
                  hasReply: hasNestedReplies || false,
                };
              }),
            },
          };
        });

        console.log('✅ Updated hasReply flags in replies');
        return { ...old, pages: newPages };
      });

      console.log('✅ Comment/Reply optimistically deleted from all caches');
      return { previousComments, previousRepliesQueries };
    },

    onError: (err, variables, context) => {
      console.error('❌ DELETE COMMENT - API CALL FAILED');
      console.error('Error:', err);

      // Rollback comments
      if (context?.previousComments) {
        queryClient.setQueryData(['comments'], context.previousComments);
        console.log('↩️ Rolled back comments optimistic delete');
      }

      // Rollback all replies queries
      if (context?.previousRepliesQueries) {
        context.previousRepliesQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
        console.log('↩️ Rolled back replies optimistic delete');
      }
    },

    onSuccess: (data, variables) => {
      console.log('🎉 DELETE COMMENT - Mutation Success');
      console.log('Server Response:', data);
    },

    onSettled: (data, error, { postId }) => {
      console.log('🔄 Invalidating all queries to refetch from server');
      // Refetch everything to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['replies'],
      });
    },
  });
};







// import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getComments, addComment, getReplies, addReply } from '../../API/comment';

// export const usegetComments = (limit, postId, options = {}) => {
//   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount, ...queryOptions } = options;
//   return useInfiniteQuery({
//     queryKey: ['comments', postId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
//     queryFn: async ({ pageParam = null }) => {
//       const response = await getComments(pageParam, limit, postId, options);
//       return response.data;
//     },
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.nextCursor || lastPage?.data?.comments?.slice(-1)[0]?.inCommentId;
//     },
//     staleTime: 2 * 1000,
//     gcTime: 5 * 60 * 1000,
//     ...queryOptions,
//   });
// };

// export const useAddComment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) =>
//       addComment(postId, content, audioComment, videoComment, sticker, imageComment, fileComment),

//     onMutate: async ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['comments', postId],
//       });

//       // Get current comments
//       const previousComments = queryClient.getQueryData(['comments', postId]);

//       // Create optimistic comment
//       const optimisticComment = {
//         _id: Date.now().toString(),
//         postId,
//         content,
//         audioComment,
//         videoComment,
//         sticker,
//         imageComment,
//         fileComment,
//         createdAt: new Date().toISOString(),
//         user: {
//           // Get current user details from auth state or local storage
//           _id: 'temp-id',
//           username: 'You',
//           avatar: 'default-avatar-url',
//         },
//         isOptimistic: true,
//       };

//       // Optimistically update comments list
//       queryClient.setQueryData(
//         ['comments', postId],
//         (old) => {
//           if (!old) return { pages: [{ data: [optimisticComment] }], pageParams: [null] };
//           return {
//             pages: [
//               {
//                 ...old.pages[0],
//                 messege: {
//                   ...old.pages[0].messege,
//                   comments: [optimisticComment, ...(old.pages[0]?.messege?.comments || [])]
//                 }
//               },
//               ...old.pages.slice(1),
//             ],
//             pageParams: old.pageParams,
//           };
//         }
//       );

//       return { previousComments };
//     },

//     onError: (err, variables, context) => {
//       // Rollback on error
//       if (context?.previousComments) {
//         queryClient.setQueryData(['comments', variables.postId], context.previousComments);
//       }
//     },

//     onSettled: (data, error, { postId }) => {
//       // Refetch comments to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['comments', postId],
//       });
//     },
//   });
// };

// export const useGetReplies = (commentId, limit, options = {}) => {
//   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount } = options;
//   return useInfiniteQuery({
//     queryKey: ['replies', commentId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
//     queryFn: async ({ pageParam = null }) => {
//       const response = await getReplies(commentId, pageParam, limit, options);
//       return response.data;
//     },
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.nextCursor || lastPage?.data?.replies?.slice(-1)[0]?.inCommentId;
//     },
//     staleTime: 2 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// export const useAddReply = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) =>
//       addReply(commentId, content, audioComment, videoComment, sticker, imageComment, fileComment),

//     onMutate: async ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['replies', commentId],
//       });

//       // Get current replies
//       const previousReplies = queryClient.getQueryData(['replies', commentId]);

//       // Create optimistic reply
//       const optimisticReply = {
//         _id: Date.now().toString(),
//         commentId,
//         content, audioComment, videoComment,
//         sticker, imageComment, fileComment,
//         createdAt: new Date().toISOString(),
//         user: {
//           _id: 'temp-id',
//           username: 'You',
//           avatar: 'default-avatar-url',
//         },
//         isOptimistic: true,
//       };

//       // Optimistically update replies list
//       queryClient.setQueryData(
//         ['replies', commentId],
//         (old) => {
//           if (!old) return { pages: [{ data: [optimisticReply] }], pageParams: [null] };
//           return {
//             pages: [
//               {
//                 ...old.pages[0],
//                 messege: {
//                   ...old.pages[0].messege,
//                   replies: [optimisticReply, ...(old.pages[0]?.messege?.replies || [])]
//                 }
//               },
//               ...old.pages.slice(1),
//             ],
//             pageParams: old.pageParams,
//           };
//         }
//       );

//       return { previousReplies };
//     },

//     onError: (err, variables, context) => {
//       // Rollback on error
//       if (context?.previousReplies) {
//         queryClient.setQueryData(['replies', variables.commentId], context.previousReplies);
//       }
//     },

//     onSettled: (data, error, { commentId }) => {
//       // Refetch replies to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['replies', commentId],
//       });
//     },
//   });
// };

// 99999999999999999999999999999999999999

// import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getComments, addComment, getReplies, addReply,pinComment,unpinComment } from '../../API/comment';

// export const usegetComments = (limit, postId, options = {}) => {
//   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount, ...queryOptions } = options;
//   return useInfiniteQuery({
//     queryKey: ['comments', postId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
//     queryFn: async ({ pageParam = null }) => {
//       console.log('📥 Fetching Comments - API Call');
//       console.log('PostId:', postId);
//       console.log('Page Param:', pageParam);
//       console.log('Limit:', limit);
//       console.log('Options:', options);

//       const response = await getComments(pageParam, limit, postId, options);

//       console.log('✅ Comments Fetched Successfully');
//       console.log('Response:', response.data);

//       return response.data;
//     },
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.nextCursor || lastPage?.data?.comments?.slice(-1)[0]?.inCommentId;
//     },
//     staleTime: 2 * 1000,
//     gcTime: 5 * 60 * 1000,
//     ...queryOptions,
//   });
// };

// export const useAddComment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       console.log('🚀 ADD COMMENT - API CALL STARTED');
//       console.log('='.repeat(50));
//       console.log('Payload Details:');
//       console.log('- PostId:', postId);
//       console.log('- Content:', content);
//       console.log('- Audio Comment:', audioComment);
//       console.log('- Video Comment:', videoComment);
//       console.log('- Sticker:', sticker);
//       console.log('- Image Comment:', imageComment);
//       console.log('- File Comment:', fileComment);
//       console.log('='.repeat(50));

//       const response = await addComment(postId, content, audioComment, videoComment, sticker, imageComment, fileComment);

//       console.log('✅ ADD COMMENT - API CALL SUCCESS');
//       console.log('Response:', response);
//       console.log('='.repeat(50));

//       return response;
//     },

//     onMutate: async ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       console.log('⚡ Optimistic Update - Adding comment locally');

//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['comments', postId],
//       });

//       // Get current comments
//       const previousComments = queryClient.getQueryData(['comments', postId]);

//       // Create optimistic comment
//       const optimisticComment = {
//         _id: Date.now().toString(),
//         postId,
//         content,
//         audioComment,
//         videoComment,
//         sticker,
//         imageComment,
//         fileComment,
//         createdAt: new Date().toISOString(),
//         user: {
//           // Get current user details from auth state or local storage
//           _id: 'temp-id',
//           username: 'You',
//           avatar: 'default-avatar-url',
//         },
//         isOptimistic: true,
//       };

//       // Optimistically update comments list
//       queryClient.setQueryData(
//         ['comments', postId],
//         (old) => {
//           if (!old) return { pages: [{ data: [optimisticComment] }], pageParams: [null] };
//           return {
//             pages: [
//               {
//                 ...old.pages[0],
//                 messege: {
//                   ...old.pages[0].messege,
//                   comments: [optimisticComment, ...(old.pages[0]?.messege?.comments || [])]
//                 }
//               },
//               ...old.pages.slice(1),
//             ],
//             pageParams: old.pageParams,
//           };
//         }
//       );

//       console.log('✅ Optimistic comment added to cache');
//       return { previousComments };
//     },

//     onError: (err, variables, context) => {
//       console.error('❌ ADD COMMENT - API CALL FAILED');
//       console.error('Error:', err);
//       // console.error('Variables:', variables);

//       // Rollback on error
//       if (context?.previousComments) {
//         queryClient.setQueryData(['comments', variables.postId], context.previousComments);
//         console.log('↩️  Rolled back optimistic update');
//       }
//     },

//     onSuccess: (data, variables) => {
//       console.log('🎉 ADD COMMENT - Mutation Success');
//       console.log('Server Response:', data);
//     },

//     onSettled: (data, error, { postId }) => {
//       console.log('🔄 Invalidating comments query to refetch from server');
//       // Refetch comments to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['comments', postId],
//       });
//     },
//   });
// };

// export const useGetReplies = (commentId, limit, options = {}) => {
//   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount } = options;
//   return useInfiniteQuery({
//     queryKey: ['replies', commentId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
//     queryFn: async ({ pageParam = null }) => {
//       console.log('📥 Fetching Replies - API Call');
//       console.log('CommentId:', commentId);
//       console.log('Page Param:', pageParam);
//       console.log('Limit:', limit);

//       const response = await getReplies(commentId, pageParam, limit, options);

//       console.log('✅ Replies Fetched Successfully');
//       console.log('Response:', response.data);

//       return response.data;
//     },
//     initialPageParam: null,
//     getNextPageParam: (lastPage) => {
//       const pagination = lastPage?.data?.pagination;
//       if (!pagination?.hasNextPage) return undefined;
//       return pagination.nextCursor || lastPage?.data?.replies?.slice(-1)[0]?.inCommentId;
//     },
//     staleTime: 2 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// export const useAddReply = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       console.log('🚀 ADD REPLY - API CALL STARTED');
//       console.log('='.repeat(50));
//       console.log('Payload Details:');
//       console.log('- CommentId:', commentId);
//       console.log('- Content:', content);
//       console.log('- Audio Comment:', audioComment);
//       console.log('- Video Comment:', videoComment);
//       console.log('- Sticker:', sticker);
//       console.log('- Image Comment:', imageComment);
//       console.log('- File Comment:', fileComment);
//       console.log('='.repeat(50));

//       const response = await addReply(commentId, content, audioComment, videoComment, sticker, imageComment, fileComment);

//       console.log('✅ ADD REPLY - API CALL SUCCESS');
//       console.log('Response:', response);
//       console.log('='.repeat(50));

//       return response;
//     },

//     onMutate: async ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
//       console.log('⚡ Optimistic Update - Adding reply locally');

//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['replies', commentId],
//       });

//       // Get current replies
//       const previousReplies = queryClient.getQueryData(['replies', commentId]);

//       // Create optimistic reply
//       const optimisticReply = {
//         _id: Date.now().toString(),
//         commentId,
//         content, audioComment, videoComment,
//         sticker, imageComment, fileComment,
//         createdAt: new Date().toISOString(),
//         user: {
//           _id: 'temp-id',
//           username: 'You',
//           avatar: 'default-avatar-url',
//         },
//         isOptimistic: true,
//       };

//       // Optimistically update replies list
//       queryClient.setQueryData(
//         ['replies', commentId],
//         (old) => {
//           if (!old) return { pages: [{ data: [optimisticReply] }], pageParams: [null] };
//           return {
//             pages: [
//               {
//                 ...old.pages[0],
//                 messege: {
//                   ...old.pages[0].messege,
//                   replies: [optimisticReply, ...(old.pages[0]?.messege?.replies || [])]
//                 }
//               },
//               ...old.pages.slice(1),
//             ],
//             pageParams: old.pageParams,
//           };
//         }
//       );

//       console.log('✅ Optimistic reply added to cache');
//       return { previousReplies };
//     },

//     onError: (err, variables, context) => {
//       console.error('❌ ADD REPLY - API CALL FAILED');
//       console.error('Error:', err);
//       console.error('Variables:', variables);

//       // Rollback on error
//       if (context?.previousReplies) {
//         queryClient.setQueryData(['replies', variables.commentId], context.previousReplies);
//         console.log('↩️  Rolled back optimistic update');
//       }
//     },

//     onSuccess: (data, variables) => {
//       console.log('🎉 ADD REPLY - Mutation Success');
//       console.log('Server Response:', data);
//     },

//     onSettled: (data, error, { commentId }) => {
//       console.log('🔄 Invalidating replies query to refetch from server');
//       // Refetch replies to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['replies', commentId],
//       });
//     },
//   });
// };

// export const usePinComment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ commentId, postId }) => {
//       console.log('🚀 PIN COMMENT - API CALL STARTED');
//       console.log('='.repeat(50));
//       console.log('Payload Details:');
//       console.log('- CommentId:', commentId);
//       console.log('- PostId:', postId);
//       console.log('='.repeat(50));

//       const response = await pinComment(commentId, postId);

//       console.log('✅ PIN COMMENT - API CALL SUCCESS');
//       console.log('Response:', response);
//       console.log('='.repeat(50));

//       return response;
//     },

//     onMutate: async ({ commentId, postId }) => {
//       console.log('⚡ Optimistic Update - Pinning comment');

//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['comments', postId],
//       });

//       // Get current comments data
//       const previousComments = queryClient.getQueryData(['comments', postId]);

//       // Optimistically update comments list
//       queryClient.setQueryData(['comments', postId], (old) => {
//         if (!old) return old;

//         // Find the comment to pin across all pages
//         let commentToPin = null;
//         let sourcePageIndex = -1;
//         let sourceCommentIndex = -1;

//         for (let i = 0; i < old.pages.length; i++) {
//           const comments = old.pages[i]?.data?.comments || [];
//           const idx = comments.findIndex(c => c._id === commentId);

//           if (idx !== -1) {
//             // Found the comment - mark it as pinned
//             commentToPin = { ...comments[idx], isPinned: true };
//             sourcePageIndex = i;
//             sourceCommentIndex = idx;
//             break;
//           }
//         }

//         if (!commentToPin) {
//           console.warn('⚠️ Comment not found for pinning');
//           return old;
//         }

//         console.log('📌 Found comment to pin:', commentToPin._id);

//         // Create new pages array
//         const newPages = old.pages.map((page, pageIdx) => {
//           if (pageIdx === sourcePageIndex) {
//             // Remove comment from its current position
//             const comments = page?.data?.comments || [];
//             return {
//               ...page,
//               data: {
//                 ...page.data,
//                 comments: comments.filter((_, idx) => idx !== sourceCommentIndex)
//               }
//             };
//           }
//           return page;
//         });

//         // Add pinned comment to the TOP of the FIRST page
//         if (newPages[0]) {
//           newPages[0] = {
//             ...newPages[0],
//             data: {
//               ...newPages[0].data,
//               comments: [commentToPin, ...(newPages[0]?.data?.comments || [])]
//             }
//           };
//         }

//         console.log('✅ Comment optimistically pinned and moved to top');
//         return { ...old, pages: newPages };
//       });

//       return { previousComments };
//     },

//     onError: (err, variables, context) => {
//       console.error('❌ PIN COMMENT - API CALL FAILED');
//       console.error('Error:', err);

//       // Rollback on error
//       if (context?.previousComments) {
//         queryClient.setQueryData(['comments', variables.postId], context.previousComments);
//         console.log('↩️  Rolled back optimistic update');
//       }
//     },

//     onSuccess: (data, variables) => {
//       console.log('🎉 PIN COMMENT - Mutation Success');
//       console.log('Server Response:', data);
//     },

//     onSettled: (data, error, { postId }) => {
//       console.log('🔄 Invalidating comments query to refetch from server');
//       // Refetch comments to sync with server (backend returns pinned comment at top)
//       queryClient.invalidateQueries({
//         queryKey: ['comments', postId],
//       });
//     },
//   });
// };

// export const useUnpinComment = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ commentId, postId }) => {
//       console.log('🚀 UNPIN COMMENT - API CALL STARTED');
//       console.log('='.repeat(50));
//       console.log('Payload Details:');
//       console.log('- CommentId:', commentId);
//       console.log('- PostId:', postId);
//       console.log('='.repeat(50));

//       const response = await unpinComment(commentId, postId);

//       console.log('✅ UNPIN COMMENT - API CALL SUCCESS');
//       console.log('Response:', response);
//       console.log('='.repeat(50));

//       return response;
//     },

//     onMutate: async ({ commentId, postId }) => {
//       console.log('⚡ Optimistic Update - Unpinning comment');

//       // Cancel outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: ['comments', postId],
//       });

//       // Get current comments
//       const previousComments = queryClient.getQueryData(['comments', postId]);

//       // Optimistically update comments list
//       queryClient.setQueryData(['comments', postId], (old) => {
//         if (!old) return old;

//         // Find and update the pinned comment
//         const newPages = old.pages.map(page => {
//           const comments = page?.data?.comments || [];
//           return {
//             ...page,
//             data: {
//               ...page.data,
//               comments: comments.map(comment =>
//                 comment._id === commentId
//                   ? { ...comment, isPinned: false }
//                   : comment
//               )
//             }
//           };
//         });

//         console.log('✅ Comment optimistically unpinned');
//         return { ...old, pages: newPages };
//       });

//       return { previousComments };
//     },

//     onError: (err, variables, context) => {
//       console.error('❌ UNPIN COMMENT - API CALL FAILED');
//       console.error('Error:', err);

//       // Rollback on error
//       if (context?.previousComments) {
//         queryClient.setQueryData(['comments', variables.postId], context.previousComments);
//         console.log('↩️  Rolled back optimistic update');
//       }
//     },

//     onSuccess: (data, variables) => {
//       console.log('🎉 UNPIN COMMENT - Mutation Success');
//       console.log('Server Response:', data);
//     },

//     onSettled: (data, error, { postId }) => {
//       console.log('🔄 Invalidating comments query to refetch from server');
//       // Refetch comments to sync with server
//       queryClient.invalidateQueries({
//         queryKey: ['comments', postId],
//       });
//     },
//   });
// };

// // import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// // import { getComments, addComment, getReplies, addReply } from '../../API/comment';

// // export const usegetComments = (limit, postId, options = {}) => {
// //   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount, ...queryOptions } = options;
// //   return useInfiniteQuery({
// //     queryKey: ['comments', postId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
// //     queryFn: async ({ pageParam = null }) => {
// //       const response = await getComments(pageParam, limit, postId, options);
// //       return response.data;
// //     },
// //     initialPageParam: null,
// //     getNextPageParam: (lastPage) => {
// //       const pagination = lastPage?.data?.pagination;
// //       if (!pagination?.hasNextPage) return undefined;
// //       return pagination.nextCursor || lastPage?.data?.comments?.slice(-1)[0]?.inCommentId;
// //     },
// //     staleTime: 2 * 1000,
// //     gcTime: 5 * 60 * 1000,
// //     ...queryOptions,
// //   });
// // };

// // export const useAddComment = () => {
// //   const queryClient = useQueryClient();

// //   return useMutation({
// //     mutationFn: ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) =>
// //       addComment(postId, content, audioComment, videoComment, sticker, imageComment, fileComment),

// //     onMutate: async ({ postId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
// //       // Cancel outgoing refetches
// //       await queryClient.cancelQueries({
// //         queryKey: ['comments', postId],
// //       });

// //       // Get current comments
// //       const previousComments = queryClient.getQueryData(['comments', postId]);

// //       // Create optimistic comment
// //       const optimisticComment = {
// //         _id: Date.now().toString(),
// //         postId,
// //         content,
// //         audioComment,
// //         videoComment,
// //         sticker,
// //         imageComment,
// //         fileComment,
// //         createdAt: new Date().toISOString(),
// //         user: {
// //           // Get current user details from auth state or local storage
// //           _id: 'temp-id',
// //           username: 'You',
// //           avatar: 'default-avatar-url',
// //         },
// //         isOptimistic: true,
// //       };

// //       // Optimistically update comments list
// //       queryClient.setQueryData(
// //         ['comments', postId],
// //         (old) => {
// //           if (!old) return { pages: [{ data: [optimisticComment] }], pageParams: [null] };
// //           return {
// //             pages: [
// //               {
// //                 ...old.pages[0],
// //                 messege: {
// //                   ...old.pages[0].messege,
// //                   comments: [optimisticComment, ...(old.pages[0]?.messege?.comments || [])]
// //                 }
// //               },
// //               ...old.pages.slice(1),
// //             ],
// //             pageParams: old.pageParams,
// //           };
// //         }
// //       );

// //       return { previousComments };
// //     },

// //     onError: (err, variables, context) => {
// //       // Rollback on error
// //       if (context?.previousComments) {
// //         queryClient.setQueryData(['comments', variables.postId], context.previousComments);
// //       }
// //     },

// //     onSettled: (data, error, { postId }) => {
// //       // Refetch comments to sync with server
// //       queryClient.invalidateQueries({
// //         queryKey: ['comments', postId],
// //       });
// //     },
// //   });
// // };

// // export const useGetReplies = (commentId, limit, options = {}) => {
// //   const { userCommentId, pinnedCommentId, getHasReply, getRepliesCount } = options;
// //   return useInfiniteQuery({
// //     queryKey: ['replies', commentId, userCommentId, pinnedCommentId, getHasReply, getRepliesCount],
// //     queryFn: async ({ pageParam = null }) => {
// //       const response = await getReplies(commentId, pageParam, limit, options);
// //       return response.data;
// //     },
// //     initialPageParam: null,
// //     getNextPageParam: (lastPage) => {
// //       const pagination = lastPage?.data?.pagination;
// //       if (!pagination?.hasNextPage) return undefined;
// //       return pagination.nextCursor || lastPage?.data?.replies?.slice(-1)[0]?.inCommentId;
// //     },
// //     staleTime: 2 * 1000,
// //     gcTime: 5 * 60 * 1000,
// //   });
// // };

// // export const useAddReply = () => {
// //   const queryClient = useQueryClient();

// //   return useMutation({
// //     mutationFn: ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) =>
// //       addReply(commentId, content, audioComment, videoComment, sticker, imageComment, fileComment),

// //     onMutate: async ({ commentId, content, audioComment, videoComment, sticker, imageComment, fileComment }) => {
// //       // Cancel outgoing refetches
// //       await queryClient.cancelQueries({
// //         queryKey: ['replies', commentId],
// //       });

// //       // Get current replies
// //       const previousReplies = queryClient.getQueryData(['replies', commentId]);

// //       // Create optimistic reply
// //       const optimisticReply = {
// //         _id: Date.now().toString(),
// //         commentId,
// //         content, audioComment, videoComment,
// //         sticker, imageComment, fileComment,
// //         createdAt: new Date().toISOString(),
// //         user: {
// //           _id: 'temp-id',
// //           username: 'You',
// //           avatar: 'default-avatar-url',
// //         },
// //         isOptimistic: true,
// //       };

// //       // Optimistically update replies list
// //       queryClient.setQueryData(
// //         ['replies', commentId],
// //         (old) => {
// //           if (!old) return { pages: [{ data: [optimisticReply] }], pageParams: [null] };
// //           return {
// //             pages: [
// //               {
// //                 ...old.pages[0],
// //                 messege: {
// //                   ...old.pages[0].messege,
// //                   replies: [optimisticReply, ...(old.pages[0]?.messege?.replies || [])]
// //                 }
// //               },
// //               ...old.pages.slice(1),
// //             ],
// //             pageParams: old.pageParams,
// //           };
// //         }
// //       );

// //       return { previousReplies };
// //     },

// //     onError: (err, variables, context) => {
// //       // Rollback on error
// //       if (context?.previousReplies) {
// //         queryClient.setQueryData(['replies', variables.commentId], context.previousReplies);
// //       }
// //     },

// //     onSettled: (data, error, { commentId }) => {
// //       // Refetch replies to sync with server
// //       queryClient.invalidateQueries({
// //         queryKey: ['replies', commentId],
// //       });
// //     },
// //   });
// // };
