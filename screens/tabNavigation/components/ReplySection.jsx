import React, { useState, useCallback, useEffect, useRef, useContext, createContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { format } from 'date-fns';
import { useGetReplies, useAddReply,useLikeComment,useDislikeComment,useDeleteComment } from '../../../ReactQuery/TanStackQueryHooks/useComments';
import * as Keychain from 'react-native-keychain';
import Sound from 'react-native-nitro-sound';

// Create context for managing audio playback - this will be provided by parent Comments component
const AudioPlaybackContext = createContext(null);

// Audio Player Component with fixed playback
const AudioPlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const progressIntervalRef = useRef(null);
  const isPlayerInitialized = useRef(false);
  
  // Get the global audio controller from context
  const audioContext = useContext(AudioPlaybackContext);
  const currentPlayingUrl = audioContext?.currentPlayingUrl;
  const setCurrentPlayingUrl = audioContext?.setCurrentPlayingUrl;

  useEffect(() => {
    // If another audio starts playing, stop this one
    if (currentPlayingUrl && currentPlayingUrl !== audioUrl && isPlaying) {
      stopThisPlayer();
    }
  }, [currentPlayingUrl]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isPlaying && isPlayerInitialized.current) {
        stopThisPlayer();
      }
    };
  }, []);

  const stopThisPlayer = async () => {
    try {
      setIsPlaying(false);
      setCurrentTime(0);
      isPlayerInitialized.current = false;
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping this player:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        // Pause current audio
        await Sound.stopPlayer();
        Sound.removePlayBackListener();
        await stopThisPlayer();
        if (setCurrentPlayingUrl) setCurrentPlayingUrl(null);
      } else {
        // Set this as the current playing URL FIRST (this will stop others via useEffect)
        if (setCurrentPlayingUrl) setCurrentPlayingUrl(audioUrl);
        
        // Small delay to let other players stop
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Start playing this audio
        setIsLoading(true);
        
        try {
          // Stop any existing player first
          await Sound.stopPlayer();
          Sound.removePlayBackListener();
        } catch (e) {
          // Ignore if nothing was playing
        }
        
        await Sound.startPlayer(audioUrl);
        isPlayerInitialized.current = true;
        setIsPlaying(true);
        setIsLoading(false);

        // Add playback listener to track progress
        Sound.addPlayBackListener((e) => {
          if (e.currentPosition && e.duration) {
            const current = e.currentPosition / 1000;
            const total = e.duration / 1000;
            
            setCurrentTime(current);
            setTotalDuration(total);

            // Check if playback finished
            if (current >= total - 0.1) {
              stopThisPlayer();
              if (setCurrentPlayingUrl) setCurrentPlayingUrl(null);
              Sound.stopPlayer().catch(() => {});
              Sound.removePlayBackListener();
            }
          }
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      isPlayerInitialized.current = false;
      if (setCurrentPlayingUrl) setCurrentPlayingUrl(null);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Icon name={isPlaying ? "pause" : "play"} size={20} color="#007AFF" />
        )}
      </TouchableOpacity>
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                { 
                  height: Math.random() * 20 + 10,
                  backgroundColor: (currentTime / totalDuration) * 20 > i ? '#007AFF' : '#D1D1D6'
                }
              ]}
            />
          ))}
        </View>
      </View>
      {/* <Text style={styles.audioDuration}>
        {formatTime(isPlaying ? currentTime : totalDuration)}
      </Text> */}
    </View>
  );
};

const VideoPlayer = ({ videoUrl, thumbnail, duration }) => (
  <View style={styles.videoContainer}>
    <Image
      source={{ uri: thumbnail || videoUrl || 'https://via.placeholder.com/300x200' }}
      style={styles.videoThumbnail}
    />
    <View style={styles.videoOverlay}>
      <View style={styles.playIconContainer}>
        <Icon name="play" size={32} color="#fff" />
      </View>
      {duration && (
        <View style={styles.videoDuration}>
          <Text style={styles.videoDurationText}>{duration}</Text>
        </View>
      )}
    </View>
  </View>
);

const PDFAttachment = ({ fileUrl }) => {
  const fileName = fileUrl?.split('/').pop()?.split('.')[0] || 'Document';

  return (
    <View style={styles.pdfContainer}>
      <View style={styles.pdfIconContainer}>
        <MaterialIcons name="picture-as-pdf" size={32} color="#FF3B30" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfFileName} numberOfLines={1}>{fileName}.pdf</Text>
        <Text style={styles.pdfFileSize}>PDF Document</Text>
      </View>
      <TouchableOpacity style={styles.downloadButton}>
        <Icon name="download-outline" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const ImageAttachment = ({ imageUrl }) => (
  <Image
    source={{ uri: imageUrl }}
    style={styles.imageAttachment}
    resizeMode="cover"
  />
);

const StickerAttachment = ({ stickerUrl }) => (
  <Image
    source={{ uri: stickerUrl }}
    style={styles.stickerAttachment}
    resizeMode="contain"
  />
);

const ReplyItem = ({ item, onReply, replyingTo,isOwner }) => {
  const [viewNestedReplies, setViewNestedReplies] = useState(false);
  const [isReplyingToThis, setIsReplyingToThis] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [replyWriter, setReplyWriter] = useState(false);
  const replyRef = useRef(null);


// Local state for like/dislike (DON'T mutate props!)
  const [localLikeState, setLocalLikeState] = useState({
    userHasLiked: item.userHasLiked,
    userHasDisliked: item.userHasDisliked,
    numberOfLikes: item.numberOfLikes,
    numberOfDislikes: item.numberOfDislikes,
  });





 // Sync local state when item changes from server
  useEffect(() => {
    setLocalLikeState({
      userHasLiked: item.userHasLiked,
      userHasDisliked: item.userHasDisliked,
      numberOfLikes: item.numberOfLikes,
      numberOfDislikes: item.numberOfDislikes,
    });
  }, [item.userHasLiked, item.userHasDisliked, item.numberOfLikes, item.numberOfDislikes]);


 // Refs for debouncing
  const likeTimeoutRef = useRef(null);
  const dislikeTimeoutRef = useRef(null);
  const isApiCallPendingRef = useRef(false); // Prevent duplicate calls



 // Get the mutation hooks
  const { mutate: likeComment } = useLikeComment();
  const { mutate: dislikeComment } = useDislikeComment();

// Inside the CommentItem component, add the mutation hook after your existing hooks:
const { mutate: deleteCommentMutation, isPending: isDeletingComment } = useDeleteComment();



  
  // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (likeTimeoutRef.current) {
          clearTimeout(likeTimeoutRef.current);
        }
        if (dislikeTimeoutRef.current) {
          clearTimeout(dislikeTimeoutRef.current);
        }
      };
    }, []);

  // Reset isReplyingToThis when replyingTo is cleared from parent
  useEffect(() => {
    if (!replyingTo) {
      setIsReplyingToThis(false);
    }
  }, [replyingTo]);

  // Check if current user is the owner of this reply
  useEffect(() => {
    const checkReplyWriter = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: 'userId' });
        if (credentials) {
          const userId = credentials.password;

          if (userId === item?.owner?._id) {
            setReplyWriter(true);
          } else {
            setReplyWriter(false);
          }
        }
      } catch (error) {
        console.log('Error checking reply ownership:', error);
        setReplyWriter(false);
      }
    };

    checkReplyWriter();
  }, [item]);

  const handleLongPress = () => {
    setIsLongPressing(true);
    replyRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setModalPosition({ x: pageX, y: pageY + height });
      setModalVisible(true);
    });
  };

  const handlePressOut = () => {
    setIsLongPressing(false);
  };





  
  const handleLike = () => {
    // Clear previous timeout
    if (likeTimeoutRef.current) {
      clearTimeout(likeTimeoutRef.current);
    }

    // Calculate new state
    const newLikeState = !localLikeState.userHasLiked;
    const wasDisliked = localLikeState.userHasDisliked;

    // Calculate new counts
    const newNumberOfLikes = newLikeState 
      ? localLikeState.numberOfLikes + 1 
      : localLikeState.numberOfLikes - 1;
    
    const newNumberOfDislikes = wasDisliked && newLikeState
      ? localLikeState.numberOfDislikes - 1
      : localLikeState.numberOfDislikes;

    // Update local state immediately for instant UI feedback
    setLocalLikeState({
      userHasLiked: newLikeState,
      userHasDisliked: newLikeState ? false : localLikeState.userHasDisliked,
      numberOfLikes: newNumberOfLikes,
      numberOfDislikes: newNumberOfDislikes,
    });

    // Set new 2-second debounce timer
    likeTimeoutRef.current = setTimeout(() => {
      // Prevent duplicate API calls
      if (isApiCallPendingRef.current) {
        console.log('⏳ API call already pending, skipping...');
        return;
      }

      isApiCallPendingRef.current = true;
      console.log('📤 Calling Like API for', item._id);

      // Call the like API
      likeComment(item._id, {
        onSuccess: () => {
          console.log('✅ Like API called successfully for', item._id);
          isApiCallPendingRef.current = false;
        },
        onError: (error) => {
          console.error('❌ Like API error:', error);
          isApiCallPendingRef.current = false;
          
          // Revert to original state on error
          setLocalLikeState({
            userHasLiked: item.userHasLiked,
            userHasDisliked: item.userHasDisliked,
            numberOfLikes: item.numberOfLikes,
            numberOfDislikes: item.numberOfDislikes,
          });
        },
      });

      likeTimeoutRef.current = null;
    }, 2000);
  };

  const handleDislike = () => {
    // Clear previous timeout
    if (dislikeTimeoutRef.current) {
      clearTimeout(dislikeTimeoutRef.current);
    }

    // Calculate new state
    const newDislikeState = !localLikeState.userHasDisliked;
    const wasLiked = localLikeState.userHasLiked;

    // Calculate new counts
    const newNumberOfDislikes = newDislikeState
      ? localLikeState.numberOfDislikes + 1
      : localLikeState.numberOfDislikes - 1;
    
    const newNumberOfLikes = wasLiked && newDislikeState
      ? localLikeState.numberOfLikes - 1
      : localLikeState.numberOfLikes;

    // Update local state immediately for instant UI feedback
    setLocalLikeState({
      userHasLiked: newDislikeState ? false : localLikeState.userHasLiked,
      userHasDisliked: newDislikeState,
      numberOfLikes: newNumberOfLikes,
      numberOfDislikes: newNumberOfDislikes,
    });

    // Set new 2-second debounce timer
    dislikeTimeoutRef.current = setTimeout(() => {
      // Prevent duplicate API calls
      if (isApiCallPendingRef.current) {
        console.log('⏳ API call already pending, skipping...');
        return;
      }

      isApiCallPendingRef.current = true;
      console.log('📤 Calling Dislike API for', item._id);

      // Call the dislike API
      dislikeComment(item._id, {
        onSuccess: () => {
          console.log('✅ Dislike API called successfully for', item._id);
          isApiCallPendingRef.current = false;
        },
        onError: (error) => {
          console.error('❌ Dislike API error:', error);
          isApiCallPendingRef.current = false;
          
          // Revert to original state on error
          setLocalLikeState({
            userHasLiked: item.userHasLiked,
            userHasDisliked: item.userHasDisliked,
            numberOfLikes: item.numberOfLikes,
            numberOfDislikes: item.numberOfDislikes,
          });
        },
      });

      dislikeTimeoutRef.current = null;
    }, 2000);
  };


  const handleDelete = () => {
  Alert.alert(
    'Delete Comment',
    'Are you sure you want to delete this comment?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          console.log('🗑️ Deleting comment:', item._id);
          setModalVisible(false);
          
          deleteCommentMutation(
            { 
              commentId: item._id, 
              postId: item.postId 
            },
            {
              onSuccess: () => {
                console.log('✅ Comment deleted successfully');
              },
              onError: (error) => {
                console.error('❌ Delete failed:', error);
                Alert.alert('Error', 'Failed to delete comment. Please try again.');
              },
            }
          );
        }
      }
    ]
  );
};


  const renderMedia = () => {
    const { commentType, audioUrl, videoUrl, imageUrl, stickerUrl, fileUrl } = item;

    if (commentType === 'audio' || (commentType === 'text_audio' && audioUrl)) {
      return <AudioPlayer audioUrl={audioUrl} />;
    }

    if (commentType === 'video' || (commentType === 'text_video' && videoUrl)) {
      return <VideoPlayer videoUrl={videoUrl} />;
    }

    if ((commentType === 'file' || commentType === 'text_file') && fileUrl) {
      return <PDFAttachment fileUrl={fileUrl} />;
    }

    if (commentType === 'image' || (commentType === 'text_image' && imageUrl)) {
      return <ImageAttachment imageUrl={imageUrl} />;
    }

    if (commentType === 'sticker' || (commentType === 'text_sticker' && stickerUrl)) {
      return <StickerAttachment stickerUrl={stickerUrl} />;
    }

    return null;
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? '1d' : `${diffInDays}d`;
      }
    } catch {
      return '';
    }
  };

  return (
    <>
      <View style={styles.replyItemContainer}>
        <View style={styles.replyItem}>
          <Image
            source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }}
            style={styles.replyAvatar}
          />
          <View style={styles.replyContent}>
            
             <Pressable
              ref={replyRef}
              onLongPress={handleLongPress}
              onPressOut={handlePressOut}
              delayLongPress={100}
              style={() => [
                styles.pressableWrapper,
                isLongPressing && { opacity: 0.5 }
              ]}
            >
            <View style={styles.replyHeader}>
              <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
            </View>

           
              {item.content && <Text style={styles.replyText}>{item.content}</Text>}
              {renderMedia()}
            </Pressable>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => {
                setIsReplyingToThis(!isReplyingToThis);
                if (!isReplyingToThis) {
                  onReply(item);
                } else {
                  onReply(null);
                }
              }}>
                <Text style={styles.replyActionText}>
                  {isReplyingToThis ? 'Cancel' : 'Reply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Side Actions (Like/Dislike) */}
          <View style={styles.rightActions}>
          
            <TouchableOpacity style={styles.rightActionButton} onPress={handleLike}>
                      <Icon 
                        name={localLikeState.userHasLiked ? "thumbs-up" : "thumbs-up-outline"} 
                        size={16} 
                        color={localLikeState.userHasLiked ? "#007AFF" : "#666"} 
                      />
                      <Text style={[styles.actionText, localLikeState.userHasLiked && styles.activeActionText]}>
                        {localLikeState.numberOfLikes || 0}
                      </Text>
                    </TouchableOpacity>
          
                    <TouchableOpacity style={styles.rightActionButton} onPress={handleDislike}>
                      <Icon 
                        name={localLikeState.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"} 
                        size={16} 
                        color={localLikeState.userHasDisliked ? "#007AFF" : "#666"} 
                      />
                      <Text style={[styles.actionText, localLikeState.userHasDisliked && styles.activeActionText]}>
                        {localLikeState.numberOfDislikes || 0}
                      </Text>
                    </TouchableOpacity>
          
          </View>
        </View>

        {/* View Nested Replies Link */}
        {item.hasReply && !viewNestedReplies && (
          <TouchableOpacity
            style={styles.viewNestedButton}
            onPress={() => setViewNestedReplies(true)}
          >
            <View style={styles.line} />
            <Text style={styles.viewNestedText}>View reply</Text>
          </TouchableOpacity>
        )}

        {/* Nested Replies Section */}
        {(viewNestedReplies || isReplyingToThis) && (
          <ReplySection
            commentId={item._id}
            hasReply={item.hasReply}
            showInput={isReplyingToThis}
            onReplyAdded={() => setIsReplyingToThis(false)}
            onReply={onReply}
            replyingTo={replyingTo}
            isOwner ={isOwner}
          />
        )}
      </View>

      {/* Modal that appears below the reply */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { top: modalPosition.y, left: modalPosition.x }]}>
            {/* Delete option - only show if user is the reply owner */}
            {(replyWriter || isOwner) && (
              <TouchableOpacity style={styles.modalOption}
              onPress={handleDelete}
              disabled={isDeletingComment}
              >
                <MaterialIcons name="delete-outline" size={20} color="#333" />
                <Text style={styles.modalOptionText}>Delete</Text>
              </TouchableOpacity>
            )}

            {/* Report option - always available */}
            <TouchableOpacity style={styles.modalOption}>
              <Icon name="flag-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Report</Text>
            </TouchableOpacity>

            {/* Copy option - always available */}
            <TouchableOpacity style={styles.modalOption}>
              <Icon name="copy-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Copy</Text>
            </TouchableOpacity>

            {/* Share option - always available */}
            <TouchableOpacity style={styles.modalOption}>
              <Icon name="share-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const ReplySection = ({ commentId, onReplyAdded, hasReply, showInput = false, onReply, inreplyplaceholder = false, replyingTo , isOwner}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [mentionUsername, setMentionUsername] = useState('');
  const { mutate: addReply, isLoading: isAddingReply } = useAddReply();


// Auto-fill @username when replying to nested replies
useEffect(() => {
  if (replyingTo && showInput) {
    const username = replyingTo?.owner?.username || 'Unknown';
    const mention = `@${username} `;
    setMentionUsername(mention);
    setReplyText(mention);
  } else if (!showInput) {
    setMentionUsername('');
    setReplyText('');
  }
}, [replyingTo, showInput]);


  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetReplies(commentId, 10, { enabled: showReplies || hasReply });

  const replies = data?.pages?.flatMap(page => page?.data?.replies || []) || [];
  const shouldShowRepliesButton = hasReply || replies.length > 0;

  // const handleAddReply = () => {
  //   if (!replyText.trim()) { return; }
  //   addReply(
  //     {
  //       commentId,
  //       content: replyText,
  //     },
  //     {
  //       onSuccess: () => {
  //         setReplyText('');
  //         onReplyAdded?.();
  //         setShowReplies(true);
  //       },
  //     }
  //   );
  // };

 const handleAddReply = () => {
  // Remove the @mention from the content before sending
  let contentToSend = replyText;
  if (mentionUsername) {
    contentToSend = replyText.replace(mentionUsername, '').trim();
  }
  
  if (!contentToSend.trim()) { return; }
  
  addReply(
    {
      commentId,
      content: contentToSend,
    },
    {
      onSuccess: () => {
        setReplyText('');
        setMentionUsername(''); // NEW: Clear mention
        onReplyAdded?.();
        setShowReplies(true);
      },
    }
  );
};
 
 
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderReply = useCallback(({ item }) => (
    <ReplyItem item={item} onReply={onReply} replyingTo={replyingTo} isOwner={isOwner}/>
  ), [onReply, replyingTo]);

  return (
    <View style={styles.container}>
      {shouldShowRepliesButton && !showReplies && !showInput && (
        <TouchableOpacity
          style={styles.showRepliesButton}
          onPress={() => setShowReplies(true)}
        >
          <View style={styles.line} />
          <Text style={styles.showRepliesText}>
            View {replies.length > 0 ? replies.length : ''} replies
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && (shouldShowRepliesButton) && (
        <TouchableOpacity
          style={styles.showRepliesButton}
          onPress={() => setShowReplies(false)}
        >
          <View style={styles.line} />
          <Text style={styles.showRepliesText}>Hide replies</Text>
        </TouchableOpacity>
      )}

      {showReplies && (
        <FlatList
          data={replies}
          renderItem={renderReply}
          keyExtractor={item => item._id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage &&
            <ActivityIndicator size="small" color="#007AFF" />
          }
        />
      )}

      {inreplyplaceholder && showInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            // placeholder="Add a reply..."
             placeholder={replyingTo ? `Reply to ${replyingTo?.owner?.username || 'Unknown'}...` : "Add a reply..."}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
            autoFocus
          />
          {/* <TouchableOpacity
            style={[
              styles.replyButton,
              isAddingReply && styles.replyButtonDisabled,
            ]}
            onPress={handleAddReply}
            disabled={isAddingReply || !replyText.trim()}
          >
            <Icon
              name="send"
              size={20}
              color={isAddingReply ? '#ccc' : '#007AFF'}
            />
          </TouchableOpacity> */}

<TouchableOpacity
  style={[
    styles.replyButton,
    isAddingReply && styles.replyButtonDisabled,
  ]}
  onPress={handleAddReply}
  disabled={
    isAddingReply || 
    !replyText.trim() || 
    replyText.trim() === mentionUsername.trim()
  }
>
  <Icon
    name="send"
    size={20}
    color={
      isAddingReply || 
      !replyText.trim() || 
      replyText.trim() === mentionUsername.trim() 
        ? '#ccc' 
        : '#007AFF'
    }
  />
</TouchableOpacity>


        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 0,
    marginTop: 4,
    // marginRight: -77,
    width: 276.5,
   
  },
  replyItemContainer: {
    marginBottom: 12,
     
  },
  replyItem: {
    flexDirection: 'row',
   
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#000',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  replyText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  replyActionText: {
    // color: '#666',
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 12,
    marginRight: 16,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: 8,
    paddingLeft: 8,
    marginTop: 4,
  },
  rightActionButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activeText: {
    color: '#007AFF',
  },
  pressableWrapper: {
    flex: 1,
  },
  // Audio Player Styles
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 8,
    marginBottom: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveformContainer: {
    flex: 1,
    marginRight: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  waveformBar: {
    width: 2.5,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },
  // Video Player Styles
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: 180,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // PDF Styles
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pdfIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  pdfFileSize: {
    fontSize: 12,
    color: '#666',
  },
  downloadButton: {
    padding: 8,
  },
  // Image Styles
  imageAttachment: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  // Sticker Styles
  stickerAttachment: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingRight: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    fontSize: 13,
    backgroundColor: '#fff',
    maxHeight: 80,
    minHeight: 36,
  },
  replyButton: {
    padding: 6,
    
  },
  replyButtonDisabled: {
    opacity: 0.5,
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  showRepliesText: {
     color: '#666',
    // color: '#007AFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  viewNestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 32,
  },
  viewNestedText: {
     color: '#666',
    // color: '#007AFF',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 8,
  },
  line: {
    width: 20,
    height: 1,
    backgroundColor: '#ddd',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

// Export the context so it can be used by parent components
export { AudioPlaybackContext };

export default ReplySection;



// ================ old 




// import React, { useState, useCallback } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { format } from 'date-fns';
// import { useGetReplies, useAddReply } from '../../../ReactQuery/TanStackQueryHooks/useComments';

// // Media Components
// const AudioPlayer = ({ audioUrl, duration }) => (
//   <View style={styles.audioContainer}>
//     <TouchableOpacity style={styles.playButton}>
//       <Icon name="play" size={20} color="#007AFF" />
//     </TouchableOpacity>
//     <View style={styles.waveformContainer}>
//       <View style={styles.waveform}>
//         {[...Array(20)].map((_, i) => (
//           <View
//             key={i}
//             style={[
//               styles.waveformBar,
//               { height: Math.random() * 20 + 10 }
//             ]}
//           />
//         ))}
//       </View>
//     </View>
//     <Text style={styles.audioDuration}>{duration || '0:14'}</Text>
//   </View>
// );

// const VideoPlayer = ({ videoUrl, thumbnail, duration }) => (
//   <View style={styles.videoContainer}>
//     <Image
//       source={{ uri: thumbnail || videoUrl || 'https://via.placeholder.com/300x200' }}
//       style={styles.videoThumbnail}
//     />
//     <View style={styles.videoOverlay}>
//       <View style={styles.playIconContainer}>
//         <Icon name="play" size={32} color="#fff" />
//       </View>
//       {duration && (
//         <View style={styles.videoDuration}>
//           <Text style={styles.videoDurationText}>{duration}</Text>
//         </View>
//       )}
//     </View>
//   </View>
// );

// const PDFAttachment = ({ fileUrl }) => {
//   const fileName = fileUrl?.split('/').pop()?.split('.')[0] || 'Document';

//   return (
//     <View style={styles.pdfContainer}>
//       <View style={styles.pdfIconContainer}>
//         <MaterialIcons name="picture-as-pdf" size={32} color="#FF3B30" />
//       </View>
//       <View style={styles.pdfInfo}>
//         <Text style={styles.pdfFileName} numberOfLines={1}>{fileName}.pdf</Text>
//         <Text style={styles.pdfFileSize}>PDF Document</Text>
//       </View>
//       <TouchableOpacity style={styles.downloadButton}>
//         <Icon name="download-outline" size={20} color="#666" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const ImageAttachment = ({ imageUrl }) => (
//   <Image
//     source={{ uri: imageUrl }}
//     style={styles.imageAttachment}
//     resizeMode="cover"
//   />
// );

// const StickerAttachment = ({ stickerUrl }) => (
//   <Image
//     source={{ uri: stickerUrl }}
//     style={styles.stickerAttachment}
//     resizeMode="contain"
//   />
// );

// const ReplyItem = ({ item, onReply, replyingTo }) => {
//   const [viewNestedReplies, setViewNestedReplies] = useState(false);
//   const [isReplyingToThis, setIsReplyingToThis] = useState(false);
//   const [inreplyplaceholder, setinreplyplaceholder] = useState(false);

//   // Reset isReplyingToThis when replyingTo is cleared from parent
//   React.useEffect(() => {
//     if (!replyingTo) {
//       setIsReplyingToThis(false);
//     }
//   }, [replyingTo]);

//   const renderMedia = () => {
//     const { commentType, audioUrl, videoUrl, imageUrl, stickerUrl, fileUrl } = item;

//     // Check comment type and render appropriate media
//     if (commentType === 'audio' || (commentType === 'text_audio' && audioUrl)) {
//       return <AudioPlayer audioUrl={audioUrl} />;
//     }

//     if (commentType === 'video' || (commentType === 'text_video' && videoUrl)) {
//       return <VideoPlayer videoUrl={videoUrl} />;
//     }

//     if ((commentType === 'file' || commentType === 'text_file') && fileUrl) {
//       return <PDFAttachment fileUrl={fileUrl} />;
//     }

//     if (commentType === 'image' || (commentType === 'text_image' && imageUrl)) {
//       return <ImageAttachment imageUrl={imageUrl} />;
//     }

//     if (commentType === 'sticker' || (commentType === 'text_sticker' && stickerUrl)) {
//       return <StickerAttachment stickerUrl={stickerUrl} />;
//     }

//     return null;
//   };

//   const formatTimestamp = (timestamp) => {
//     try {
//       const date = new Date(timestamp);
//       const now = new Date();
//       const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

//       if (diffInHours < 1) {
//         const diffInMinutes = Math.floor((now - date) / (1000 * 60));
//         return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
//       } else if (diffInHours < 24) {
//         return `${diffInHours}h`;
//       } else {
//         const diffInDays = Math.floor(diffInHours / 24);
//         return diffInDays === 1 ? '1d' : `${diffInDays}d`;
//       }
//     } catch {
//       return '';
//     }
//   };

//   return (
//     <View style={styles.replyItemContainer}>
//       <View style={styles.replyItem}>
//         <Image
//           source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }}
//           style={styles.replyAvatar}
//         />
//         <View style={styles.replyContent}>
//           <View style={styles.replyHeader}>
//             <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
//             <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
//           </View>

//           {item.content && <Text style={styles.replyText}>{item.content}</Text>}

//           {renderMedia()}

//           <View style={styles.actionRow}>
//             <TouchableOpacity onPress={() => {
//               setIsReplyingToThis(!isReplyingToThis);
//               if (!isReplyingToThis) {
//                 onReply(item);
//               } else {
//                 onReply(null);
//               }
//             }}>
//               <Text style={styles.replyActionText}>
//                 {isReplyingToThis ? 'Cancel' : 'Reply'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Right Side Actions (Like/Dislike) */}
//         <View style={styles.rightActions}>
//           <TouchableOpacity style={styles.rightActionButton}>
//             <Icon
//               name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"}
//               size={14}
//               color={item.userHasLiked ? "#007AFF" : "#666"}
//             />
//             <Text style={[styles.countText, item.userHasLiked && styles.activeText]}>
//               {item.numberOfLikes || 0}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.rightActionButton}>
//             <Icon
//               name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"}
//               size={14}
//               color={item.userHasDisliked ? "#007AFF" : "#666"}
//             />
//             <Text style={[styles.countText, item.userHasDisliked && styles.activeText]}>
//               {item.numberOfDislikes || 0}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* View Nested Replies Link */}
//       {item.hasReply && !viewNestedReplies && (
//         <TouchableOpacity
//           style={styles.viewNestedButton}
//           onPress={() => setViewNestedReplies(true)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.viewNestedText}>View reply</Text>
//         </TouchableOpacity>
//       )}

//       {/* Nested Replies Section */}
//       {(viewNestedReplies || isReplyingToThis) && (
//         <ReplySection
//           commentId={item._id}
//           hasReply={item.hasReply}
//           showInput={isReplyingToThis}
//           onReplyAdded={() => setIsReplyingToThis(false)}
//           onReply={onReply}
//           inreplyplaceholder={inreplyplaceholder}
//           replyingTo={replyingTo}
//         />
//       )}
//     </View>
//   );
// };

// const ReplySection = ({ commentId, onReplyAdded, hasReply, showInput = false, onReply, inreplyplaceholder = false, replyingTo }) => {
//   const [replyText, setReplyText] = useState('');
//   const [showReplies, setShowReplies] = useState(false);
//   const { mutate: addReply, isLoading: isAddingReply } = useAddReply();
//   const {
//     data,
//     isLoading,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useGetReplies(commentId, 10, { enabled: showReplies || hasReply });

//   const replies = data?.pages?.flatMap(page => page?.data?.replies || []) || [];
//   const shouldShowRepliesButton = hasReply || replies.length > 0;

//   const handleAddReply = () => {
//     if (!replyText.trim()) { return; }
//     addReply(
//       {
//         commentId,
//         content: replyText,
//       },
//       {
//         onSuccess: () => {
//           setReplyText('');
//           onReplyAdded?.();
//           setShowReplies(true);
//         },
//       }
//     );
//   };

//   const loadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   const renderReply = useCallback(({ item }) => (
//     <ReplyItem item={item} onReply={onReply} replyingTo={replyingTo} />
//   ), [onReply, replyingTo]);

//   return (
//     <View style={styles.container}>
//       {shouldShowRepliesButton && !showReplies && !showInput && (
//         <TouchableOpacity
//           style={styles.showRepliesButton}
//           onPress={() => setShowReplies(true)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.showRepliesText}>
//             View {replies.length > 0 ? replies.length : ''} replies
//           </Text>
//         </TouchableOpacity>
//       )}

//       {showReplies && (shouldShowRepliesButton) && (
//         <TouchableOpacity
//           style={styles.showRepliesButton}
//           onPress={() => setShowReplies(false)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.showRepliesText}>Hide replies</Text>
//         </TouchableOpacity>
//       )}

//       {showReplies && (
//         <FlatList
//           data={replies}
//           renderItem={renderReply}
//           keyExtractor={item => item._id}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={
//             isFetchingNextPage &&
//             <ActivityIndicator size="small" color="#007AFF" />
//           }
//         />
//       )}

//       {inreplyplaceholder && showInput && (
//         <View style={styles.replyInputContainer}>
//           <TextInput
//             style={styles.replyInput}
//             placeholder="Add a reply..."
//             value={replyText}
//             onChangeText={setReplyText}
//             multiline
//             maxLength={500}
//             autoFocus
//           />
//           <TouchableOpacity
//             style={[
//               styles.replyButton,
//               isAddingReply && styles.replyButtonDisabled,
//             ]}
//             onPress={handleAddReply}
//             disabled={isAddingReply || !replyText.trim()}
//           >
//             <Icon
//               name="send"
//               size={20}
//               color={isAddingReply ? '#ccc' : '#007AFF'}
//             />
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginLeft: 0,
//     marginTop: 4,
//   },
//   replyItemContainer: {
//     marginBottom: 12,
//   },
//   replyItem: {
//     flexDirection: 'row',
//   },
//   replyAvatar: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   replyContent: {
//     flex: 1,
//   },
//   replyHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 2,
//   },
//   username: {
//     fontWeight: 'bold',
//     fontSize: 13,
//     color: '#000',
//     marginRight: 8,
//   },
//   timestamp: {
//     fontSize: 11,
//     color: '#999',
//   },
//   replyText: {
//     fontSize: 14,
//     marginBottom: 8,
//     color: '#333',
//     lineHeight: 18,
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   replyActionText: {
//     color: '#666',
//     fontWeight: '500',
//     fontSize: 12,
//     marginRight: 16,
//   },
//   rightActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'flex-start',
//     marginLeft: 8,
//     paddingLeft: 8,
//     marginTop: 4,
//   },
//   rightActionButton: {
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },
//   countText: {
//     fontSize: 12,
//     color: '#666',
//     marginLeft: 4,
//   },
//   activeText: {
//     color: '#007AFF',
//   },
//   // Audio Player Styles
//   audioContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F0F0F0',
//     borderRadius: 20,
//     padding: 8,
//     marginBottom: 8,
//   },
//   playButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   waveformContainer: {
//     flex: 1,
//     marginRight: 8,
//   },
//   waveform: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     height: 24,
//   },
//   waveformBar: {
//     width: 3,
//     backgroundColor: '#007AFF',
//     marginHorizontal: 1,
//     borderRadius: 2,
//   },
//   audioDuration: {
//     fontSize: 12,
//     color: '#666',
//     minWidth: 35,
//   },
//   // Video Player Styles
//   videoContainer: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginBottom: 8,
//     backgroundColor: '#000',
//   },
//   videoThumbnail: {
//     width: '100%',
//     height: 180,
//   },
//   videoOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   playIconContainer: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoDuration: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   videoDurationText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   // PDF Styles
//   pdfContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: '#E8E8E8',
//   },
//   pdfIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 8,
//     backgroundColor: '#FFE5E5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   pdfInfo: {
//     flex: 1,
//   },
//   pdfFileName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 2,
//   },
//   pdfFileSize: {
//     fontSize: 12,
//     color: '#666',
//   },
//   downloadButton: {
//     padding: 8,
//   },
//   // Image Styles
//   imageAttachment: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     marginBottom: 8,
//   },
//   // Sticker Styles
//   stickerAttachment: {
//     width: 120,
//     height: 120,
//     marginBottom: 8,
//   },
//   replyInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     paddingRight: 8,
//   },
//   replyInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 18,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     marginRight: 8,
//     fontSize: 13,
//     backgroundColor: '#fff',
//     maxHeight: 80,
//     minHeight: 36,
//   },
//   replyButton: {
//     padding: 6,
//   },
//   replyButtonDisabled: {
//     opacity: 0.5,
//   },
//   showRepliesButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//   },
//   showRepliesText: {
//     color: '#666',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   viewNestedButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//     marginLeft: 32,
//   },
//   viewNestedText: {
//     color: '#666',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   line: {
//     width: 20,
//     height: 1,
//     backgroundColor: '#ddd',
//   }
// });

// export default ReplySection;





// ===========very old code 


// import React, { useState, useCallback } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { format } from 'date-fns';
// import { useGetReplies, useAddReply } from '../../../ReactQuery/TanStackQueryHooks/useComments';

// const ReplyItem = ({ item, onReply }) => {
//   const [viewNestedReplies, setViewNestedReplies] = useState(false);
//   const [isReplyingToThis, setIsReplyingToThis] = useState(false);
//   const [inreplyplaceholder, setinreplyplaceholder] = useState(false);


//   return (

//     <View style={styles.replyItemContainer}>
//       <View style={styles.replyItem}>
//         <Image source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }} style={styles.replyAvatar} />
//         <View style={styles.replyContent}>
//           <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
//           <Text style={styles.replyText}>{item.content}</Text>

//           <View style={styles.actionRow}>
//             {/* Reply Button */}
//             <TouchableOpacity onPress={() => setIsReplyingToThis(!isReplyingToThis)}>
//               <Text style={styles.replyActionText}>
//                 {isReplyingToThis ? 'Cancel' : 'Reply'}
//               </Text>
//             </TouchableOpacity>

//             {/* Timestamp */}
//             {/* <Text style={styles.timestamp}>
//               {format(new Date(item.createdAt), 'MMM dd, yyyy')}
//             </Text> */}
//           </View>
//         </View>

//         {/* Right Side Actions (Like/Dislike) */}
//         <View style={styles.rightActions}>
//           <TouchableOpacity style={styles.rightActionButton}>
//             <Icon
//               name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"}
//               size={14}
//               color={item.userHasLiked ? "#007AFF" : "#666"}
//             />
//             <Text style={[styles.countText, item.userHasLiked && styles.activeText]}>
//               {item.numberOfLikes || 0}
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.rightActionButton}>
//             <Icon
//               name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"}
//               size={14}
//               color={item.userHasDisliked ? "#007AFF" : "#666"}
//             />
//             <Text style={[styles.countText, item.userHasDisliked && styles.activeText]}>
//               {item.numberOfDislikes || 0}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* View Nested Replies Link */}
//       {item.hasReply && !viewNestedReplies && (
//         <TouchableOpacity
//           style={styles.viewNestedButton}
//           onPress={() => setViewNestedReplies(true)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.viewNestedText}>View reply</Text>
//         </TouchableOpacity>
//       )}

//       {/* Nested Replies Section */}
//       {(viewNestedReplies || isReplyingToThis) && (
//         <ReplySection
//           commentId={item._id}
//           hasReply={item.hasReply}
//           // If we are just replying, we force input to show.
//           // If viewing nested, we follow normal logic (show actions).
//           showInput={isReplyingToThis}
//           onReplyAdded={() => setIsReplyingToThis(false)}
//         />
//       )}
//     </View>
//   );
// };

// const ReplySection = ({ commentId, onReplyAdded, hasReply, showInput = false }) => {
//   const [replyText, setReplyText] = useState('');
//   const [showReplies, setShowReplies] = useState(false);
//   const { mutate: addReply, isLoading: isAddingReply } = useAddReply();
//   const {
//     data,
//     isLoading,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useGetReplies(commentId, 10, { enabled: showReplies || hasReply });

//   const replies = data?.pages?.flatMap(page => page?.data?.replies || []) || [];
//   const shouldShowRepliesButton = hasReply || replies.length > 0;

//   const handleAddReply = () => {
//     if (!replyText.trim()) { return; }
//     addReply(
//       {
//         commentId,
//         content: replyText,
//       },
//       {
//         onSuccess: () => {
//           setReplyText('');
//           onReplyAdded?.();
//           setShowReplies(true);
//         },
//       }
//     );
//   };

//   const loadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   const renderReply = useCallback(({ item }) => (
//     <ReplyItem item={item} onReply={() => { }} />
//   ), []);

//   return (
//     <View style={styles.container}>
//       {/* "View Replies" Toggle - Only for logic passed from parent */}
//       {shouldShowRepliesButton && !showReplies && !showInput && (
//         <TouchableOpacity
//           style={styles.showRepliesButton}
//           onPress={() => setShowReplies(true)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.showRepliesText}>
//             View {replies.length > 0 ? replies.length : ''} replies
//           </Text>
//         </TouchableOpacity>
//       )}

//       {/* Hide Button if expanded */}
//       {showReplies && (shouldShowRepliesButton) && (
//         <TouchableOpacity
//           style={styles.showRepliesButton}
//           onPress={() => setShowReplies(false)}
//         >
//           <View style={styles.line} />
//           <Text style={styles.showRepliesText}>Hide replies</Text>
//         </TouchableOpacity>
//       )}

//       {/* Replies List */}
//       {showReplies && (
//         <FlatList
//           data={replies}
//           renderItem={renderReply}
//           keyExtractor={item => item._id}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={
//             isFetchingNextPage &&
//             <ActivityIndicator size="small" color="#007AFF" />
//           }
//         />
//       )}

//       {/* Input Field */}
//       {showInput && (
//         <View style={styles.replyInputContainer}>
//           <TextInput
//             style={styles.replyInput}
//             placeholder="Add a reply..."
//             value={replyText}
//             onChangeText={setReplyText}
//             multiline
//             maxLength={500}
//             autoFocus
//           />
//           <TouchableOpacity
//             style={[
//               styles.replyButton,
//               isAddingReply && styles.replyButtonDisabled,
//             ]}
//             onPress={handleAddReply}
//             disabled={isAddingReply || !replyText.trim()}
//           >
//             <Icon
//               name="send"
//               size={20}
//               color={isAddingReply ? '#ccc' : '#007AFF'}
//             />
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginLeft: 0,
//     marginTop: 4,
//   },
//   replyItemContainer: {
//     marginBottom: 12,
//   },
//   replyItem: {
//     flexDirection: 'row',
//   },
//   replyAvatar: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   replyContent: {
//     flex: 1,
//   },
//   username: {
//     fontWeight: 'bold',
//     fontSize: 13,
//     marginBottom: 2,
//     color: '#000',
//   },
//   replyText: {
//     fontSize: 14,
//     marginBottom: 4,
//     color: '#333',
//     lineHeight: 18,
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   replyActionText: {
//     color: '#666',
//     fontWeight: '500',
//     fontSize: 12,
//     marginRight: 16,
//   },
//   rightActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'flex-start',
//     marginLeft: 8,
//     paddingLeft: 8,
//     marginTop: 4,
//   },
//   rightActionButton: {
//     alignItems: 'center',
//     paddingHorizontal: 6,
//   },
//   countText: {
//     fontSize: 12,
//     color: '#666',
//     marginLeft: 4,
//   },
//   activeText: {
//     color: '#007AFF',
//   },
//   timestamp: {
//     fontSize: 11,
//     color: '#999',
//     marginLeft: 'auto',
//   },
//   replyInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//     paddingRight: 8,
//   },
//   replyInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 18,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     marginRight: 8,
//     fontSize: 13,
//     backgroundColor: '#fff',
//     maxHeight: 80,
//     minHeight: 36,
//   },
//   replyButton: {
//     padding: 6,
//   },
//   replyButtonDisabled: {
//     opacity: 0.5,
//   },
//   showRepliesButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 6,
//   },
//   showRepliesText: {
//     color: '#666',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   viewNestedButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 4,
//     marginLeft: 32,
//   },
//   viewNestedText: {
//     color: '#666',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   line: {
//     width: 20,
//     height: 1,
//     backgroundColor: '#ddd',
//   }
// });

// export default ReplySection;
