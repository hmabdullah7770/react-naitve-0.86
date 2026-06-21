import React, { useCallback, useState, useRef, useEffect, createContext, useContext,useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
  Pressable,
  Modal,
   Keyboard,                    // ← ADD THIS
  TouchableWithoutFeedback,
  Dimensions    // ← ADD THIS
  
} from 'react-native';
// import BottomSheet, { BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { ModalBottomSheet } from '@swmansion/react-native-bottom-sheet';
// import RBSheet from 'react-native-raw-bottom-sheet';
import Icon from '@react-native-vector-icons/ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import Sound from 'react-native-nitro-sound';
import { format } from 'date-fns';
import { usegetComments, useAddComment, useAddReply, usePinComment,useUnpinComment, useLikeComment, useDislikeComment, useDeleteComment } from '../../../ReactQuery/TanStackQueryHooks/useComments';
import ReplySection from './ReplySection';
import * as Keychain from 'react-native-keychain';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Create context for managing audio playback across all comments
// const AudioPlaybackContext = createContext(null);


// ✅ Replace with this
const AudioPlaybackContext = createContext({
  currentPlayingUrl: null,
  setCurrentPlayingUrl: () => {},
  stopAllAudio: () => {},
});

// Audio Player Component with fixed playback
const AudioPlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const progressIntervalRef = useRef(null);
  const isPlayerInitialized = useRef(false);
  
  // Get the global audio controller from context
  const { currentPlayingUrl, setCurrentPlayingUrl } = useContext(AudioPlaybackContext);

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
        setCurrentPlayingUrl(null);
      } else {
        // Set this as the current playing URL FIRST (this will stop others via useEffect)
        setCurrentPlayingUrl(audioUrl);
        
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
              setCurrentPlayingUrl(null);
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
      setCurrentPlayingUrl(null);
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
          <Icon name={isPlaying ? "pause" : "play"} size={24} color="#007AFF" />
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
                  height: Math.random() * 24 + 12,
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

const VideoPlayer = ({ videoUrl, thumbnail }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.videoPlayer}
        resizeMode="cover"
        paused={!isPlaying}
        onLoad={(data) => {
          setDuration(data.duration);
          setIsLoading(false);
        }}
        onLoadStart={() => setIsLoading(true)}
        onEnd={() => setIsPlaying(false)}
        poster={thumbnail}
        posterResizeMode="cover"
      />
      <View style={styles.videoOverlay}>
        <TouchableOpacity style={styles.playIconContainer} onPress={() => setIsPlaying(!isPlaying)}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Icon name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
          )}
        </TouchableOpacity>
        {duration > 0 && !isPlaying && (
          <View style={styles.videoDuration}>
            <Text style={styles.videoDurationText}>{formatDuration(duration)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const PDFAttachment = ({ fileUrl }) => {
  const fileName = fileUrl?.split('/').pop()?.split('.')[0] || 'Document';
  return (
    <View style={styles.pdfContainer}>
      <View style={styles.pdfIconContainer}>
        <MaterialIcons name="picture-as-pdf" size={40} color="#FF3B30" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfFileName} numberOfLines={1}>{fileName}.pdf</Text>
        <Text style={styles.pdfFileSize}>PDF Document</Text>
      </View>
      <TouchableOpacity style={styles.downloadButton}>
        <Icon name="download-outline" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const ImageAttachment = ({ imageUrl }) => (
  <Image source={{ uri: imageUrl }} style={styles.imageAttachment} resizeMode="cover" />
);

const StickerAttachment = ({ stickerUrl }) => (
  <Image source={{ uri: stickerUrl }} style={styles.stickerAttachment} resizeMode="contain" />
);

const CommentItem = ({ item, onReply, replyingTo, isOwner , hasPinnedComment }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [commentWriter, setCommentWriter] = useState(false);
  const commentRef = useRef(null);
 


// Local state for like/dislike (DON'T mutate props!)
  const [localLikeState, setLocalLikeState] = useState({
    userHasLiked: item.userHasLiked,
    userHasDisliked: item.userHasDisliked,
    numberOfLikes: item.numberOfLikes,
    numberOfDislikes: item.numberOfDislikes,
  });




// const pendingLikeAction = useRef(null);
// const pendingDislikeAction = useRef(null);


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
   // Get the pin mutation hook
  const { mutate: pinComment, isPending: isPinning } = usePinComment();

  const { mutate: unpinComment, isPending: isUnpinning } = useUnpinComment();

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



  React.useEffect(() => {
    if (!replyingTo) setIsReplying(false);
  }, [replyingTo]);

  const handleReplyPress = () => {
    const newState = !isReplying;
    setIsReplying(newState);
    onReply(newState ? item : null);
  };

  const renderMedia = () => {
    const { commentType, audioUrl, videoUrl, imageUrl, stickerUrl, fileUrl } = item;
    if (commentType === 'audio' || (commentType === 'text_audio' && audioUrl)) return <AudioPlayer audioUrl={audioUrl} />;
    if (commentType === 'video' || (commentType === 'text_video' && videoUrl)) return <VideoPlayer videoUrl={videoUrl} thumbnail={item.videoThumbnail} />;
    if ((commentType === 'file' || commentType === 'text_file') && fileUrl) return <PDFAttachment fileUrl={fileUrl} />;
    if (commentType === 'image' || (commentType === 'text_image' && imageUrl)) return <ImageAttachment imageUrl={imageUrl} />;
    if (commentType === 'sticker' || (commentType === 'text_sticker' && stickerUrl)) return <StickerAttachment stickerUrl={stickerUrl} />;
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

  const handleLongPress = () => {
    setIsLongPressing(true);
    commentRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setModalPosition({ x: pageX, y: pageY + height });
      setModalVisible(true);
    });
  };

  const handlePressOut = () => {
    setIsLongPressing(false);
  };

  useEffect(() => {
    const checkCommentWriter = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: 'userId' }); 
        if (credentials) {
          const userId = credentials.password;

          if (userId === item?.owner?._id) {
            setCommentWriter(true);
          } else {
            setCommentWriter(false);
          }
        }
      } catch (error) {
        console.log('Error checking ownership:', error);
        setCommentWriter(false);
      }
    };

    checkCommentWriter();
  }, [item]);


// Handle pin comment
  const handlePinComment = () => {
    if (!item?._id || !item?.postId) {
      Alert.alert('Error', 'Comment ID or Post ID is missing');
      setModalVisible(false);
      return;
    }

    console.log('📌 Pinning comment:', item._id);
    console.log('📌 Post ID:', item.postId);

    pinComment(
      { 
        commentId: item._id, 
        postId: item.postId 
      },
      {
        onSuccess: () => {
          console.log('✅ Comment pinned successfully');
          setModalVisible(false);
        },
        onError: (error) => {
          console.error('❌ Pin error:', error);
          Alert.alert('Error', 'Failed to pin comment. Please try again.');
          setModalVisible(false);
        }
      }
    );
  };



  // Handle unpin comment
const handleUnpinComment = () => {
  if (!item?._id || !item?.postId) {
    Alert.alert('Error', 'Comment ID or Post ID is missing');
    setModalVisible(false);
    return;
  }

  console.log('📍 Unpinning comment:', item._id);
  console.log('📍 Post ID:', item.postId);

  unpinComment(
    { 
      commentId: item._id, 
      postId: item.postId 
    },
    {
      onSuccess: () => {
        console.log('✅ Comment unpinned successfully');
        setModalVisible(false);
      },
      onError: (error) => {
        console.error('❌ Unpin error:', error);
        Alert.alert('Error', 'Failed to unpin comment. Please try again.');
        setModalVisible(false);
      }
    }
  );
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


  const handleReport = () => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => console.log('Report as spam') },
        { text: 'Inappropriate', onPress: () => console.log('Report as inappropriate') }
      ]
    );
    setModalVisible(false);
  };

  const handleCopy = () => {
    // TODO: Implement copy to clipboard
    if (item.content) {
      console.log('Copy comment:', item.content);
      Alert.alert('Copied', 'Comment copied to clipboard');
    }
    setModalVisible(false);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share comment:', item._id);
    setModalVisible(false);
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



  return (
    <>
      <View style={styles.commentItem}>
        <Image source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
        <View style={styles.commentContent}>
          <Pressable 
            ref={commentRef} 
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
            delayLongPress={100}
            style={() => [
              styles.pressableWrapper, 
              isLongPressing && { opacity: 0.5 }
            ]}
          >
          <View style={styles.commentHeader}>
           
           
            <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
            {item.isPinned && (
              <View style={styles.pinnedBadge}>
                <Icon name="pin" size={10} color="#007AFF" />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
          </View>
         
            {item.content && <Text style={styles.commentText}>{item.content}</Text>}
            {renderMedia()}
          </Pressable>
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={handleReplyPress}>
              <Text style={styles.replyButtonText}>{isReplying ? 'Cancel' : 'Reply'}</Text>
            </TouchableOpacity>
          </View>  
          {(isReplying || item.hasReply) && (
            <ReplySection
              commentId={item._id}
              onReplyAdded={() => setIsReplying(false)}
              hasReply={item.hasReply}
              showInput={isReplying}
              onReply={onReply}
              replyingTo={replyingTo}
              isOwner={isOwner}
            />
          )}
        </View>
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

          {/* <TouchableOpacity style={styles.rightActionButton}
           
          >
            <Icon name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"} size={16} color={item.userHasLiked ? "#007AFF" : "#666"} />
            <Text style={[styles.actionText, item.userHasLiked && styles.activeActionText]}>{item.numberOfLikes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rightActionButton}>
            <Icon name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"} size={16} color={item.userHasDisliked ? "#007AFF" : "#666"} />
            <Text style={[styles.actionText, item.userHasDisliked && styles.activeActionText]}>{item.numberOfDislikes || 0}</Text>
          </TouchableOpacity> */}
        </View>
      </View>

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
            {/* {isOwner && !item?.isReply && (
              <TouchableOpacity style={styles.modalOption}
               onPress={
                 handlePinComment
               }
              
              >
                <MaterialIcons name="push-pin" size={20} color="#333" />
                <Text style={styles.modalOptionText}>Pinned</Text>
              </TouchableOpacity>
            )} */}
{isOwner && !item?.isReply && (
  <>
    {/* Show Pin button for unpinned comments */}
    {!item.isPinned && (
      <TouchableOpacity 
        style={[
          styles.modalOption,
          hasPinnedComment && styles.modalOptionDisabled
        ]}
        onPress={handlePinComment}
        disabled={isPinning}
      >
        <MaterialIcons 
          name="push-pin" 
          size={20} 
          color={isPinning ? "#999" : "#333"} 
        />
        <Text style={[
          styles.modalOptionText,
          isPinning && styles.modalOptionTextDisabled
        ]}>
          {isPinning ? 'Pinning...' : 'Pin'}
        </Text>
      </TouchableOpacity>
    )}
    
    {/* Show Unpin button for pinned comments */}
    {item.isPinned && (
      <TouchableOpacity 
        style={[
          styles.modalOption,
          isUnpinning && styles.modalOptionDisabled
        ]}
        onPress={handleUnpinComment}
        disabled={isUnpinning}
      >
        <MaterialIcons 
          name="push-pin" 
          size={20} 
          color={isUnpinning ? "#999" : "#333"} 
        />
        <Text style={[
          styles.modalOptionText,
          isUnpinning && styles.modalOptionTextDisabled
        ]}>
          {isUnpinning ? 'Unpinning...' : 'Unpin'}
        </Text>
      </TouchableOpacity>
    )}
  </>
)}
          
            {(commentWriter || isOwner ) && (
              <TouchableOpacity style={styles.modalOption}
              
                onPress={handleDelete}
                disabled={isDeletingComment}
              >
                <MaterialIcons name="delete-outline" size={20} color="#333" />
                <Text style={styles.modalOptionText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalOption}>
              <Icon name="flag-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption}>
              <Icon name="copy-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Copy</Text>
            </TouchableOpacity>
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
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;


const Comments = ({isVisible, sheetRef, contentId, contentType, isOwner ,onClose }) => {
  const [commentText, setCommentText] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(isVisible ? 1 : 0);

  const [mentionUsername, setMentionUsername] = useState('');
  const recordingIntervalRef = useRef(null);

  
  useEffect(() => {
    setIndex(isVisible ? 1 : 0);
  }, [isVisible]);

//     const [hasPinnedComment, setHasPinnedComment] = useState(false);

// useEffect(() => {
//   // Check if any comment is pinned
//   const pinnedExists = comments.some(comment => comment.isPinned);
//   setHasPinnedComment(pinnedExists);
// }, [comments]);


// Auto-fill @mention when replying
useEffect(() => {
  if (replyingTo) {
    const username = replyingTo?.owner?.username || 'Unknown';
    const mention = `@${username} `;
    setMentionUsername(mention);
    setCommentText(mention);
  } else {
    setMentionUsername('');
    setCommentText('');
  }
}, [replyingTo]);

  // Audio playback management state
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState(null);

  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { mutate: addReply, isPending: isAddingReply } = useAddReply();
   
 
  
  // const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usegetComments(10, contentId, { enabled: isSheetOpen });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
  usegetComments(10, contentId, { enabled: index > 0 });
  // const comments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];
  // ✅ NEW - With deduplication
// const comments = React.useMemo(() => {
//   const allComments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];
  
//   // Remove duplicates using a Map (keeps first occurrence)
//   const uniqueCommentsMap = new Map();
  
//   allComments.forEach(comment => {
//     // Only add if not already present
//     if (!uniqueCommentsMap.has(comment._id)) {
//       uniqueCommentsMap.set(comment._id, comment);
//     }
//   });
  
//   const uniqueComments = Array.from(uniqueCommentsMap.values());
  
//   console.log('📊 Total comments from pages:', allComments.length);
//   console.log('📊 Unique comments after dedup:', uniqueComments.length);
//   if (allComments.length !== uniqueComments.length) {
//     console.warn('⚠️ Duplicates detected and removed!');
//   }
  
//   return uniqueComments;
// }, [data]);
// ✅ FIXED: Calculate both comments and hasPinnedComment together
const { comments, hasPinnedComment } = React.useMemo(() => {
  const allComments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];
  
  // Remove duplicates using a Map (keeps first occurrence)
  const uniqueCommentsMap = new Map();
  
  allComments.forEach(comment => {
    if (!uniqueCommentsMap.has(comment._id)) {
      uniqueCommentsMap.set(comment._id, comment);
    }
  });
  
  const uniqueComments = Array.from(uniqueCommentsMap.values());
  
  console.log('📊 Total comments from pages:', allComments.length);
  console.log('📊 Unique comments after dedup:', uniqueComments.length);
  if (allComments.length !== uniqueComments.length) {
    console.warn('⚠️ Duplicates detected and removed!');
  }
  
  // Calculate hasPinnedComment here
  const hasPinned = uniqueComments.some(comment => comment.isPinned);
  
  return {
    comments: uniqueComments,
    hasPinnedComment: hasPinned
  };
}, [data]);

  
  const totalComments = data?.pages?.[0]?.data?.pagination?.totalComments || 0;

  const emojis = ['😂', '👎', '🔥', '💯'];

  // Function to stop all audio playback
  const stopAllAudio = async () => {
    try {
      await Sound.stopPlayer();
      Sound.removePlayBackListener();
      setIsPlayingPreview(false);
      setCurrentPlayingUrl(null);
    } catch (error) {
      // Silently handle if nothing is playing
      if (!error.message?.includes('IllegalStateException')) {
        console.error('Error stopping all audio:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (isRecording) {
        Sound.stopRecorder().catch(console.error);
        Sound.removeRecordBackListener();
      }
      // Stop any playing audio on unmount
      stopAllAudio();
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  // const handleAddComment = () => {
  //   if (!commentText.trim() && !selectedMedia) return;
  //   const payload = {
  //     content: commentText || null,
  //     postId: contentId,
  //     ...(selectedMedia?.type === 'audio' && { audioComment: selectedMedia.uri }),
  //     ...(selectedMedia?.type === 'video' && { videoComment: selectedMedia.uri }),
  //     ...(selectedMedia?.type === 'file' && { fileUrl: selectedMedia.uri }),
  //     ...(selectedMedia?.type === 'image' && { imageUrl: selectedMedia.uri }),
  //     ...(selectedMedia?.type === 'sticker' && { stickerUrl: selectedMedia.uri }),
  //   };
  //   if (replyingTo) {
  //     addReply({ commentId: replyingTo._id, ...payload }, { 
  //       onSuccess: () => { 
  //         setCommentText(''); 
  //         setSelectedMedia(null); 
  //         setReplyingTo(null); 
  //         setIsPlayingPreview(false);
  //       } 
  //     });
  //   } else {
  //     addComment(payload, { 
  //       onSuccess: () => { 
  //         setCommentText(''); 
  //         setSelectedMedia(null);
  //         setIsPlayingPreview(false);
  //       } 
  //     });
  //   }
  // };

const handleAddComment = () => {
  // Remove the @mention from the content before sending
  let contentToSend = commentText;
  if (replyingTo && mentionUsername) {
    contentToSend = commentText.replace(mentionUsername, '').trim();
  }
  
  if (!contentToSend && !selectedMedia) return;
  
  const payload = {
    content: contentToSend || null,
    postId: contentId,
    ...(selectedMedia?.type === 'audio' && { audioComment: selectedMedia.uri }),
    ...(selectedMedia?.type === 'video' && { videoComment: selectedMedia.uri }),
    ...(selectedMedia?.type === 'file' && { fileUrl: selectedMedia.uri }),
    ...(selectedMedia?.type === 'image' && { imageUrl: selectedMedia.uri }),
    ...(selectedMedia?.type === 'sticker' && { stickerUrl: selectedMedia.uri }),
  };
  
  if (replyingTo) {
    addReply({ commentId: replyingTo._id, ...payload }, { 
      onSuccess: () => { 
        setCommentText(''); 
        setSelectedMedia(null); 
        setReplyingTo(null);
        setMentionUsername(''); // NEW: Clear mention
        setIsPlayingPreview(false);
      } 
    });
  } else {
    addComment(payload, { 
      onSuccess: () => { 
        setCommentText(''); 
        setSelectedMedia(null);
        setMentionUsername(''); // NEW: Clear mention
        setIsPlayingPreview(false);
      } 
    });
  }
};

  
  const handleEmojiPress = (emoji) => {
    setCommentText(prev => prev + emoji);
  };

  const handleMediaPicker = async () => {
    try {
      const result = await launchImageLibrary({ 
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });
      
      if (result.didCancel) return;
      if (result.errorCode) { 
        Alert.alert('Error', result.errorMessage || 'Failed to pick media'); 
        return; 
      }
      
      const asset = result.assets?.[0];
      if (asset?.uri) {
        const mimeType = asset.type || '';
        let mediaType = 'file';
        
        if (mimeType.startsWith('image/')) {
          mediaType = 'image';
        } else if (mimeType.startsWith('video/')) {
          mediaType = 'video';
        } else if (mimeType === 'application/pdf') {
          mediaType = 'file';
        }
        
        setSelectedMedia({ 
          type: mediaType, 
          uri: asset.uri, 
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          thumbnail: asset.uri
        });
      }
    } catch (error) {
      console.error('Media picker error:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const handleAudioRecording = async () => {
    try {
      if (isRecording) {
        const result = await Sound.stopRecorder();
        Sound.removeRecordBackListener();
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setIsRecording(false);
        const finalDuration = recordingTime;
        setRecordingTime(0);
        
        if (result) {
          console.log('🎤 Recording stopped, waiting for file to be ready...');
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('✅ Audio file ready:', result);
          
          setSelectedMedia({ 
            type: 'audio', 
            uri: result, 
            duration: finalDuration 
          });
        }
      } else {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'Microphone permission is required to record audio');
          return;
        }

        const audioSet = {
          AudioEncoderAndroid: Sound.AudioEncoderAndroidType?.AAC,
          AudioSourceAndroid: Sound.AudioSourceAndroidType?.MIC,
          AVEncoderAudioQualityKeyIOS: Sound.AVEncoderAudioQualityIOSType?.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: Sound.AVEncodingOption?.aac,
        };

        await Sound.startRecorder(undefined, audioSet);
        
        Sound.addRecordBackListener((e) => {
          const seconds = Math.floor(e.currentPosition / 1000);
          setRecordingTime(seconds);
        });

        setIsRecording(true);
        setRecordingTime(0);
      }
    } catch (error) {
      console.error('Audio recording error:', error);
      Alert.alert('Error', `Failed to ${isRecording ? 'stop' : 'start'} recording: ${error.message}`);
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      try {
        await Sound.stopRecorder();
        Sound.removeRecordBackListener();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
  };

  const handlePlayPreview = async () => {
    if (!selectedMedia?.uri) return;

    try {
      if (isPlayingPreview) {
        await Sound.stopPlayer();
        Sound.removePlayBackListener();
        setIsPlayingPreview(false);
      } else {
        await Sound.startPlayer(selectedMedia.uri);
        setIsPlayingPreview(true);

        Sound.addPlayBackListener((e) => {
          if (e.currentPosition >= e.duration) {
            setIsPlayingPreview(false);
            Sound.removePlayBackListener();
          }
        });
      }
    } catch (error) {
      console.error('Preview playback error:', error);
      setIsPlayingPreview(false);
      Alert.alert('Error', 'Failed to play audio preview');
    }
  };

  const renderComment = useCallback(({ item }) => (
    <CommentItem item={item} onReply={setReplyingTo} replyingTo={replyingTo} isOwner={isOwner} hasPinnedComment={hasPinnedComment} />
  ), [replyingTo, isOwner, hasPinnedComment]);

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaPreview = () => {
    if (!selectedMedia) return null;
    
    const isSending = isAddingComment || isAddingReply;
     
    


    return (
      <View style={styles.mediaPreviewContainer}>
        <View style={styles.mediaPreview}>
          {selectedMedia.type === 'image' && (
            <>
              <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
              {isSending && (
                <View style={styles.mediaLoadingOverlay}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.sendingText}>Sending...</Text>
                </View>
              )}
            </>
          )}
          {selectedMedia.type === 'video' && (
            <View style={styles.previewVideo}>
              <Icon name="videocam" size={24} color="#666" />
              <Text style={styles.previewText}>Video selected</Text>
              {isSending && (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
              )}
            </View>
          )}
          {selectedMedia.type === 'audio' && (
            <View style={styles.previewAudio}>
              <TouchableOpacity 
                style={styles.previewPlayButton} 
                onPress={handlePlayPreview}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Icon 
                    name={isPlayingPreview ? "pause" : "play"} 
                    size={20} 
                    color="#007AFF" 
                  />
                )}
              </TouchableOpacity>
              <View style={styles.audioWaveformPreview}>
                {isSending ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.uploadingText}>Uploading audio...</Text>
                  </View>
                ) : (
                  <>
                    <Icon name="musical-notes" size={20} color="#666" />
                    <Text style={styles.previewText}>
                      Audio recorded ({formatRecordingTime(selectedMedia.duration)})
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}
          {selectedMedia.type === 'file' && (
            <View style={styles.previewPdf}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#FF3B30" />
              <Text style={styles.previewText}>{selectedMedia.fileName || 'File attached'}</Text>
              {isSending && (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
              )}
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.removeMediaButton} 
          onPress={() => {
            if (isPlayingPreview) {
              Sound.stopPlayer();
              Sound.removePlayBackListener();
              setIsPlayingPreview(false);
            }
            setSelectedMedia(null);
          }}
          disabled={isSending}
        >
          <Icon name="close-circle" size={24} color={isSending ? "#ccc" : "#FF3B30"} />
        </TouchableOpacity>
      </View>
    );
  };

  // Provide audio context to all child components
  const audioContextValue = {
    currentPlayingUrl,
    setCurrentPlayingUrl,
    stopAllAudio
  };

  

  

  return (
    <AudioPlaybackContext.Provider value={audioContextValue}>
      
      <ModalBottomSheet
        index={index}
        onIndexChange={(newIndex) => {
          setIndex(newIndex);
          if (newIndex === 0) {
            // collapsed — mirror your old onChange(-1) cleanup logic here
            setIsSheetOpen(false);
            setReplyingTo(null);
            setSelectedMedia(null);
            if (isRecording) { /* ...stop recorder... */ }
            stopAllAudio();
            onClose?.();
          } else {
            setIsSheetOpen(true);
          }
        }}
        detents={[0, SHEET_HEIGHT]}
        surface={
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
            ]}
          />
        }
      >
      <View style={[styles.sheetContainer, { height: SHEET_HEIGHT, paddingBottom: insets.bottom }]}>
      
          {/* <View style={styles.draggableIcon} /> you supply your own handle now */}


  
          <View style={styles.header}>
            <Text style={styles.title}>Comments ({totalComments})</Text>
            {/* <TouchableOpacity onPress={() => sheetRef.current?.close()}> */}
             <TouchableOpacity onPress={() => setIndex(0)}>
              <Icon name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emojiBar}>
            {emojis.map((emoji, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.emojiButton}
                onPress={() => handleEmojiPress(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
         <FlatList               // ← plain FlatList, no special wrapper
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item._id}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>}
              //  ListFooterComponent={isFetchingNextPage && <ActivityIndicator size="small" color="#007AFF" />}
  ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color="#007AFF" /> : null}
              contentContainerStyle={styles.commentsList}
              style={{ flex: 1 }}                         // ✅ add this
            />
          )}
        
          <View style={styles.inputContainer}>
            {/* {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>Replying to {replyingTo?.owner?.username || 'Unknown'}</Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Icon name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )} */}

            {replyingTo && (
  <View style={styles.replyingToContainer}>
    <Text style={styles.replyingToText}>Replying to @{replyingTo?.owner?.username || 'Unknown'}</Text>
    <TouchableOpacity onPress={() => {
      setReplyingTo(null);
      setMentionUsername('');
      setCommentText('');
    }}>
      <Icon name="close-circle" size={20} color="#666" />
    </TouchableOpacity>
  </View>
)}
            {renderMediaPreview()}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording: {formatRecordingTime(recordingTime)}</Text>
              </View>
            )}
            
            <View style={styles.textInputRow}>
              {(() => {
                const isSending = isAddingComment || isAddingReply;
                return (
                  <>
                    <TouchableOpacity 
                      style={[styles.inputIconButton, isSending && styles.inputIconButtonDisabled]} 
                      onPress={handleMediaPicker}
                      disabled={isRecording || selectedMedia !== null || isSending}
                    >
                      <Icon name="images-outline" size={24} color={(isRecording || selectedMedia || isSending) ? "#ccc" : "#666"} />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[styles.input, isSending && styles.inputDisabled]}
                      // placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                      placeholder={replyingTo ? `Reply to ${replyingTo?.owner?.username || 'Unknown'}...` : "Add a comment..."}
                      multiline
                      value={commentText}
                      onChangeText={setCommentText}
                      maxLength={500}
                      editable={!isRecording && !isSending}
                    />
                    
                    <TouchableOpacity 
                      style={[styles.inputIconButton, isRecording && styles.recordingButton, isSending && styles.inputIconButtonDisabled]} 
                      onPress={handleAudioRecording}
                      disabled={selectedMedia !== null || isSending}
                    >
                      <Icon 
                        name={isRecording ? "stop-circle" : "mic-outline"} 
                        size={24} 
                        color={(selectedMedia || isSending) ? "#ccc" : (isRecording ? "#FF3B30" : "#666")} 
                      />
                    </TouchableOpacity>
                    
                    {/* <TouchableOpacity
                      style={[styles.sendButton, (isSending || isRecording) && styles.sendButtonDisabled]}
                      onPress={handleAddComment}
                      disabled={isSending || isRecording || (!commentText.trim() && !selectedMedia)}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                      ) : (
                        <Icon 
                          name="send" 
                          size={24} 
                          color={(isRecording || (!commentText.trim() && !selectedMedia)) ? '#ccc' : '#007AFF'} 
                        />
                      )}
                    </TouchableOpacity> */}

                    <TouchableOpacity
  style={[styles.sendButton, (isSending || isRecording) && styles.sendButtonDisabled]}
  onPress={handleAddComment}
  disabled={
    isSending || 
    isRecording || 
    (!commentText.trim() && !selectedMedia) ||
    (replyingTo && commentText.trim() === mentionUsername.trim())
  }

>
  {isSending ? (
    <ActivityIndicator size="small" color="#007AFF" />
  ) : (
    <Icon 
      name="send" 
      size={24} 
      color={(isRecording || (!commentText.trim() && !selectedMedia) || (replyingTo && commentText.trim() === mentionUsername.trim())) ? '#ccc' : '#007AFF'} 
    />
  )}
</TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
       </View>
    </ModalBottomSheet>
    </AudioPlaybackContext.Provider>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {   backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  draggableIcon: { backgroundColor: '#000', width: 35 },
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FAFAFA',
  },
  emojiButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emojiText: {
    fontSize: 15,
  },
  
  loader: { marginTop: 40 },
  commentsList: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { fontWeight: 'bold', fontSize: 14, marginRight: 8 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  pinnedText: { fontSize: 10, color: '#007AFF', fontWeight: '600', marginLeft: 2 },
  timestamp: { fontSize: 12, color: '#999' },
  commentText: { fontSize: 14, marginBottom: 8, color: '#333' },
  commentActions: { flexDirection: 'row', marginTop: 4 },
  replyButtonText: { color: '#007AFF', fontSize: 13, fontWeight: '500' },
  rightActions: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 8, paddingLeft: 8, paddingTop: 4 },
  rightActionButton: { alignItems: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 10, color: '#666', marginTop: 2 },
  activeActionText: { color: '#007AFF' },
  audioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 24, padding: 10, marginBottom: 8 },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  waveformContainer: { flex: 1, marginRight: 12 },
  waveform: { flexDirection: 'row', alignItems: 'center', height: 30 },
  waveformBar: { width: 3, marginHorizontal: 1, borderRadius: 2 },
  audioDuration: { fontSize: 13, color: '#666', minWidth: 40 },
  videoContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#000', height: 200 },
  videoPlayer: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
  videoDuration: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  videoDurationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pdfContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 12, borderRadius: 12, marginBottom: 8 },
  pdfIconContainer: { marginRight: 12 },
  pdfInfo: { flex: 1 },
  pdfFileName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  pdfFileSize: { fontSize: 12, color: '#999' },
  downloadButton: { padding: 8 },
  imageAttachment: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  stickerAttachment: { width: 120, height: 120, marginBottom: 8 },
  inputContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 20 : 10, backgroundColor: '#fff' },
  replyingToContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F0F0F0', borderRadius: 8, marginTop: 8 },
  replyingToText: { fontSize: 13, color: '#666' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFF3F3', borderRadius: 8, marginTop: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 8 },
  recordingText: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },
  textInputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 12, paddingBottom: 4 },
  inputIconButton: { 
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  recordingButton: { backgroundColor: '#FFF3F3', borderRadius: 20 },
  input: { 
    flex: 1, 
    minHeight: 40, 
    maxHeight: 100, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    fontSize: 15, 
    marginHorizontal: 8,
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 2,
  },
  sendButtonDisabled: { opacity: 0.5 },
  mediaPreviewContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  mediaPreview: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 8, padding: 8 },
  previewImage: { width: '100%', height: 100, borderRadius: 8 },
  previewVideo: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  previewAudio: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  previewPlayButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#E8F4FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  previewPdf: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  previewSticker: { width: 80, height: 80, alignSelf: 'center' },
  previewText: { fontSize: 14, color: '#666', marginLeft: 8 },
  removeMediaButton: { marginLeft: 8, padding: 4 },
  mediaLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  sendingText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  audioWaveformPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 10,
    fontWeight: '500',
  },
  inputIconButtonDisabled: {
    opacity: 0.5,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
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


  modalOptionDisabled: {
  opacity: 0.5,
},
modalOptionTextDisabled: {
  color: '#999',
},
  pressableWrapper: {
    flex: 1,
  },
});

export default Comments;

// @@@@@@@@@@@@@@@@@@@@@@  new working audio @@@@@@@@@@@@@@

// import React, { useCallback, useState, useRef, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   PermissionsAndroid,
// } from 'react-native';
// import RBSheet from 'react-native-raw-bottom-sheet';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { launchImageLibrary } from 'react-native-image-picker';
// import Video from 'react-native-video';
// import Sound from 'react-native-nitro-sound';
// import { format } from 'date-fns';
// // Optional: Only if you want custom file paths
// // import RNFS from 'react-native-fs';
// import { usegetComments, useAddComment, useAddReply } from '../../../ReactQuery/TanStackQueryHooks/useComments';
// import ReplySection from './ReplySection';

// // Audio Player Component with react-native-nitro-sound
// const AudioPlayer = ({ audioUrl, duration }) => {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [totalDuration, setTotalDuration] = useState(duration || 0);
//   const soundRef = useRef(null);
//   const progressIntervalRef = useRef(null);

//   useEffect(() => {
//     return () => {
//       if (soundRef.current) {
//         soundRef.current.release();
//         soundRef.current = null;
//       }
//       if (progressIntervalRef.current) {
//         clearInterval(progressIntervalRef.current);
//       }
//     };
//   }, []);

//   const handlePlayPause = async () => {
//     try {
//       if (!soundRef.current) {
//         setIsLoading(true);
        
//         // Correct API: Sound.prepare()
//         const sound = await Sound.prepare(audioUrl, {
//           autoDestroy: false,
//         });
//         soundRef.current = sound;
        
//         if (soundRef.current) {
//           const dur = soundRef.current.duration;
//           setTotalDuration(dur);
//           setIsLoading(false);
//         }
//       }

//       if (isPlaying) {
//         soundRef.current.pause();
//         setIsPlaying(false);
//         if (progressIntervalRef.current) {
//           clearInterval(progressIntervalRef.current);
//         }
//       } else {
//         await soundRef.current.play();
//         setIsPlaying(true);

//         // Monitor playback progress
//         progressIntervalRef.current = setInterval(() => {
//           if (soundRef.current) {
//             const current = soundRef.current.currentTime;
//             setCurrentTime(current);
            
//             // Check if playback finished
//             if (current >= soundRef.current.duration) {
//               setIsPlaying(false);
//               setCurrentTime(0);
//               if (progressIntervalRef.current) {
//                 clearInterval(progressIntervalRef.current);
//               }
//             }
//           }
//         }, 100);
//       }
//     } catch (error) {
//       console.error('Audio playback error:', error);
//       setIsLoading(false);
//       Alert.alert('Error', 'Failed to play audio');
//     }
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   return (
//     <View style={styles.audioContainer}>
//       <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
//         {isLoading ? (
//           <ActivityIndicator size="small" color="#007AFF" />
//         ) : (
//           <Icon name={isPlaying ? "pause" : "play"} size={24} color="#007AFF" />
//         )}
//       </TouchableOpacity>
//       <View style={styles.waveformContainer}>
//         <View style={styles.waveform}>
//           {[...Array(20)].map((_, i) => (
//             <View
//               key={i}
//               style={[
//                 styles.waveformBar,
//                 { 
//                   height: Math.random() * 24 + 12,
//                   backgroundColor: (currentTime / totalDuration) * 20 > i ? '#007AFF' : '#D1D1D6'
//                 }
//               ]}
//             />
//           ))}
//         </View>
//       </View>
//       <Text style={styles.audioDuration}>{formatTime(isPlaying ? currentTime : totalDuration)}</Text>
//     </View>
//   );
// };

// const VideoPlayer = ({ videoUrl, thumbnail }) => {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [duration, setDuration] = useState(0);
//   const videoRef = useRef(null);

//   const formatDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   return (
//     <View style={styles.videoContainer}>
//       <Video
//         ref={videoRef}
//         source={{ uri: videoUrl }}
//         style={styles.videoPlayer}
//         resizeMode="cover"
//         paused={!isPlaying}
//         onLoad={(data) => {
//           setDuration(data.duration);
//           setIsLoading(false);
//         }}
//         onLoadStart={() => setIsLoading(true)}
//         onEnd={() => setIsPlaying(false)}
//         poster={thumbnail}
//         posterResizeMode="cover"
//       />
//       <View style={styles.videoOverlay}>
//         <TouchableOpacity style={styles.playIconContainer} onPress={() => setIsPlaying(!isPlaying)}>
//           {isLoading ? (
//             <ActivityIndicator size="large" color="#fff" />
//           ) : (
//             <Icon name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
//           )}
//         </TouchableOpacity>
//         {duration > 0 && !isPlaying && (
//           <View style={styles.videoDuration}>
//             <Text style={styles.videoDurationText}>{formatDuration(duration)}</Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

// const PDFAttachment = ({ fileUrl }) => {
//   const fileName = fileUrl?.split('/').pop()?.split('.')[0] || 'Document';
//   return (
//     <View style={styles.pdfContainer}>
//       <View style={styles.pdfIconContainer}>
//         <MaterialIcons name="picture-as-pdf" size={40} color="#FF3B30" />
//       </View>
//       <View style={styles.pdfInfo}>
//         <Text style={styles.pdfFileName} numberOfLines={1}>{fileName}.pdf</Text>
//         <Text style={styles.pdfFileSize}>PDF Document</Text>
//       </View>
//       <TouchableOpacity style={styles.downloadButton}>
//         <Icon name="download-outline" size={24} color="#666" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// const ImageAttachment = ({ imageUrl }) => (
//   <Image source={{ uri: imageUrl }} style={styles.imageAttachment} resizeMode="cover" />
// );

// const StickerAttachment = ({ stickerUrl }) => (
//   <Image source={{ uri: stickerUrl }} style={styles.stickerAttachment} resizeMode="contain" />
// );

// const CommentItem = ({ item, onReply, replyingTo }) => {
//   const [isReplying, setIsReplying] = useState(false);

//   React.useEffect(() => {
//     if (!replyingTo) setIsReplying(false);
//   }, [replyingTo]);

//   const handleReplyPress = () => {
//     const newState = !isReplying;
//     setIsReplying(newState);
//     onReply(newState ? item : null);
//   };

//   const renderMedia = () => {
//     const { commentType, audioUrl, videoUrl, imageUrl, stickerUrl, fileUrl } = item;
//     if (commentType === 'audio' || (commentType === 'text_audio' && audioUrl)) return <AudioPlayer audioUrl={audioUrl} />;
//     if (commentType === 'video' || (commentType === 'text_video' && videoUrl)) return <VideoPlayer videoUrl={videoUrl} thumbnail={item.videoThumbnail} />;
//     if ((commentType === 'file' || commentType === 'text_file') && fileUrl) return <PDFAttachment fileUrl={fileUrl} />;
//     if (commentType === 'image' || (commentType === 'text_image' && imageUrl)) return <ImageAttachment imageUrl={imageUrl} />;
//     if (commentType === 'sticker' || (commentType === 'text_sticker' && stickerUrl)) return <StickerAttachment stickerUrl={stickerUrl} />;
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
//     <View style={styles.commentItem}>
//       <Image source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
//       <View style={styles.commentContent}>
//         <View style={styles.commentHeader}>
//           <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
//           {item.isPinned && (
//             <View style={styles.pinnedBadge}>
//               <Icon name="pin" size={10} color="#007AFF" />
//               <Text style={styles.pinnedText}>Pinned</Text>
//             </View>
//           )}
//           <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
//         </View>
//         {item.content && <Text style={styles.commentText}>{item.content}</Text>}
//         {renderMedia()}
//         <View style={styles.commentActions}>
//           <TouchableOpacity onPress={handleReplyPress}>
//             <Text style={styles.replyButtonText}>{isReplying ? 'Cancel' : 'Reply'}</Text>
//           </TouchableOpacity>
//         </View>
//         {(isReplying || item.hasReply) && (
//           <ReplySection
//             commentId={item._id}
//             onReplyAdded={() => setIsReplying(false)}
//             hasReply={item.hasReply}
//             showInput={isReplying}
//             onReply={onReply}
//             replyingTo={replyingTo}
//           />
//         )}
//       </View>
//       <View style={styles.rightActions}>
//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"} size={16} color={item.userHasLiked ? "#007AFF" : "#666"} />
//           <Text style={[styles.actionText, item.userHasLiked && styles.activeActionText]}>{item.numberOfLikes || 0}</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"} size={16} color={item.userHasDisliked ? "#007AFF" : "#666"} />
//           <Text style={[styles.actionText, item.userHasDisliked && styles.activeActionText]}>{item.numberOfDislikes || 0}</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const Comments = ({ sheetRef, contentId, contentType }) => {
//   const [commentText, setCommentText] = useState('');
//   const [isSheetOpen, setIsSheetOpen] = useState(false);
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [selectedMedia, setSelectedMedia] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const recordingIntervalRef = useRef(null);

//   const { mutate: addComment, isLoading: isAddingComment } = useAddComment();
//   const { mutate: addReply, isLoading: isAddingReply } = useAddReply();
//   const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usegetComments(10, contentId, { contentType, enabled: isSheetOpen });

//   const comments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];
//   const totalComments = data?.pages?.[0]?.data?.pagination?.totalComments || 0;

//   useEffect(() => {
//     return () => {
//       if (recordingIntervalRef.current) {
//         clearInterval(recordingIntervalRef.current);
//       }
//       // Cleanup recording if still active
//       if (isRecording) {
//         Sound.stopRecorder().catch(console.error);
//         Sound.removeRecordBackListener();
//       }
//     };
//   }, []);

//   // Request microphone permission on Android
//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           {
//             title: 'Microphone Permission',
//             message: 'This app needs access to your microphone to record audio.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.error('Permission error:', err);
//         return false;
//       }
//     }
//     return true; // iOS permissions handled via Info.plist
//   };

//   const handleAddComment = () => {
//     if (!commentText.trim() && !selectedMedia) return;
//     const payload = {
//       content: commentText || null,
//       postId: contentId,
//       ...(selectedMedia?.type === 'audio' && { audioComment: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'video' && { videoComment: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'file' && { fileUrl: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'image' && { imageUrl: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'sticker' && { stickerUrl: selectedMedia.uri }),
//     };
//     if (replyingTo) {
//       addReply({ commentId: replyingTo._id, ...payload }, { onSuccess: () => { setCommentText(''); setSelectedMedia(null); setReplyingTo(null); } });
//     } else {
//       addComment(payload, { onSuccess: () => { setCommentText(''); setSelectedMedia(null); } });
//     }
//   };

//   const handleImagePicker = async () => {
//     try {
//       const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
//       if (result.didCancel) return;
//       if (result.errorCode) { Alert.alert('Error', result.errorMessage || 'Failed to pick image'); return; }
//       const asset = result.assets?.[0];
//       if (asset?.uri) setSelectedMedia({ type: 'image', uri: asset.uri, fileName: asset.fileName });
//     } catch (error) {
//       console.error('Image picker error:', error);
//       Alert.alert('Error', 'Failed to select image');
//     }
//   };

//   const handleVideoPicker = async () => {
//     try {
//       const result = await launchImageLibrary({ mediaType: 'video', videoQuality: 'medium' });
//       if (result.didCancel) return;
//       if (result.errorCode) { Alert.alert('Error', result.errorMessage || 'Failed to pick video'); return; }
//       const asset = result.assets?.[0];
//       if (asset?.uri) setSelectedMedia({ type: 'video', uri: asset.uri, fileName: asset.fileName, thumbnail: asset.uri });
//     } catch (error) {
//       console.error('Video picker error:', error);
//       Alert.alert('Error', 'Failed to select video');
//     }
//   };

//   const handleAudioRecording = async () => {
//     try {
//       if (isRecording) {
//         // Stop recording - CORRECT API
//         const result = await Sound.stopRecorder();
//         Sound.removeRecordBackListener();
        
//         if (recordingIntervalRef.current) {
//           clearInterval(recordingIntervalRef.current);
//           recordingIntervalRef.current = null;
//         }
        
//         setIsRecording(false);
//         const finalDuration = recordingTime;
//         setRecordingTime(0);
        
//         if (result) {
//           setSelectedMedia({ 
//             type: 'audio', 
//             uri: result, 
//             duration: finalDuration 
//           });
//         }
//       } else {
//         // Check permission first
//         const hasPermission = await requestMicrophonePermission();
//         if (!hasPermission) {
//           Alert.alert('Permission Denied', 'Microphone permission is required to record audio');
//           return;
//         }

//         // OPTION 1 (RECOMMENDED): Use default cache directory - NO EXTRA SETUP NEEDED
//         // The library automatically uses {cacheDir}/sound.mp4 (Android) or {cacheDir}/sound.m4a (iOS)
        
//         // OPTION 2 (OPTIONAL): Use custom path with react-native-fs
//         // First install: yarn add react-native-fs && npx pod-install
//         // Then uncomment the import at the top and use:
//         // const customPath = Platform.select({
//         //   ios: `${RNFS.DocumentDirectoryPath}/audio_${Date.now()}.m4a`,
//         //   android: `${RNFS.CachesDirectoryPath}/audio_${Date.now()}.mp4`,
//         // });
        
//         const audioSet = {
//           AudioEncoderAndroid: Sound.AudioEncoderAndroidType?.AAC,
//           AudioSourceAndroid: Sound.AudioSourceAndroidType?.MIC,
//           AVEncoderAudioQualityKeyIOS: Sound.AVEncoderAudioQualityIOSType?.high,
//           AVNumberOfChannelsKeyIOS: 2,
//           AVFormatIDKeyIOS: Sound.AVEncodingOption?.aac,
//         };

//         // Start recording - uses default path (undefined) or customPath if defined
//         await Sound.startRecorder(undefined, audioSet);
//         // Or with custom path: await Sound.startRecorder(customPath, audioSet);
        
//         // Add recording progress listener
//         Sound.addRecordBackListener((e) => {
//           const seconds = Math.floor(e.currentPosition / 1000);
//           setRecordingTime(seconds);
//         });

//         setIsRecording(true);
//         setRecordingTime(0);
//       }
//     } catch (error) {
//       console.error('Audio recording error:', error);
//       Alert.alert('Error', `Failed to ${isRecording ? 'stop' : 'start'} recording: ${error.message}`);
//       setIsRecording(false);
      
//       if (recordingIntervalRef.current) {
//         clearInterval(recordingIntervalRef.current);
//         recordingIntervalRef.current = null;
//       }
      
//       // Cleanup on error
//       try {
//         await Sound.stopRecorder();
//         Sound.removeRecordBackListener();
//       } catch (e) {
//         console.error('Error stopping recorder:', e);
//       }
//     }
//   };

//   const handleFilePicker = async () => {
//     try {
//       const result = await launchImageLibrary({ 
//         mediaType: 'mixed',
//         includeBase64: false,
//         selectionLimit: 1,
//       });
      
//       if (result.didCancel) return;
//       if (result.errorCode) { 
//         Alert.alert('Error', result.errorMessage || 'Failed to select file'); 
//         return; 
//       }
      
//       const asset = result.assets?.[0];
//       if (asset?.uri) {
//         const fileName = asset.fileName || asset.uri.split('/').pop() || 'document.pdf';
//         const fileSize = asset.fileSize || 0;
        
//         setSelectedMedia({ 
//           type: 'file', 
//           uri: asset.uri, 
//           fileName: fileName,
//           fileSize: fileSize 
//         });
//       }
//     } catch (error) {
//       console.error('File picker error:', error);
//       Alert.alert('Error', 'Failed to select file');
//     }
//   };

//   const handleStickerPicker = async () => {
//     try {
//       const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
//       if (result.didCancel) return;
//       if (result.errorCode) return;
//       const asset = result.assets?.[0];
//       if (asset?.uri) setSelectedMedia({ type: 'sticker', uri: asset.uri });
//     } catch (error) {
//       console.error('Sticker picker error:', error);
//     }
//   };

//   const renderComment = useCallback(({ item }) => (
//     <CommentItem item={item} onReply={setReplyingTo} replyingTo={replyingTo} />
//   ), [replyingTo]);

//   const formatRecordingTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   const renderMediaPreview = () => {
//     if (!selectedMedia) return null;
//     return (
//       <View style={styles.mediaPreviewContainer}>
//         <View style={styles.mediaPreview}>
//           {selectedMedia.type === 'image' && <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />}
//           {selectedMedia.type === 'video' && (
//             <View style={styles.previewVideo}>
//               <Icon name="videocam" size={24} color="#666" />
//               <Text style={styles.previewText}>Video selected</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'audio' && (
//             <View style={styles.previewAudio}>
//               <Icon name="musical-notes" size={24} color="#666" />
//               <Text style={styles.previewText}>Audio recorded ({formatRecordingTime(selectedMedia.duration)})</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'file' && (
//             <View style={styles.previewPdf}>
//               <MaterialIcons name="picture-as-pdf" size={24} color="#FF3B30" />
//               <Text style={styles.previewText}>{selectedMedia.fileName || 'File attached'}</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'sticker' && <Image source={{ uri: selectedMedia.uri }} style={styles.previewSticker} />}
//         </View>
//         <TouchableOpacity style={styles.removeMediaButton} onPress={() => setSelectedMedia(null)}>
//           <Icon name="close-circle" size={24} color="#FF3B30" />
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <RBSheet
//       ref={sheetRef}
//       onOpen={() => setIsSheetOpen(true)}
//       onClose={() => {
//         setIsSheetOpen(false);
//         setReplyingTo(null);
//         setSelectedMedia(null);
//         if (isRecording) {
//           Sound.stopRecorder().catch(console.error);
//           Sound.removeRecordBackListener();
//           setIsRecording(false);
//           if (recordingIntervalRef.current) {
//             clearInterval(recordingIntervalRef.current);
//             recordingIntervalRef.current = null;
//           }
//         }
//       }}
//       height={500}
//       openDuration={250}
//       closeOnDragDown
//       customStyles={{ container: styles.sheetContainer, draggableIcon: styles.draggableIcon }}
//       keyboardAvoidingViewEnabled={false}
//     >
//       <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Comments ({totalComments})</Text>
//           <TouchableOpacity onPress={() => sheetRef.current?.close()}>
//             <Icon name="close" size={28} color="#000" />
//           </TouchableOpacity>
//         </View>
//         {isLoading ? (
//           <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
//         ) : (
//           <FlatList
//             data={comments}
//             renderItem={renderComment}
//             keyExtractor={item => item._id}
//             onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
//             onEndReachedThreshold={0.5}
//             ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>}
//             ListFooterComponent={isFetchingNextPage && <ActivityIndicator size="small" color="#007AFF" />}
//             contentContainerStyle={styles.commentsList}
//           />
//         )}
//         <View style={styles.inputContainer}>
//           {replyingTo && (
//             <View style={styles.replyingToContainer}>
//               <Text style={styles.replyingToText}>Replying to {replyingTo?.owner?.username || 'Unknown'}</Text>
//               <TouchableOpacity onPress={() => setReplyingTo(null)}>
//                 <Icon name="close-circle" size={20} color="#666" />
//               </TouchableOpacity>
//             </View>
//           )}
//           {renderMediaPreview()}
//           {isRecording && (
//             <View style={styles.recordingIndicator}>
//               <View style={styles.recordingDot} />
//               <Text style={styles.recordingText}>Recording: {formatRecordingTime(recordingTime)}</Text>
//             </View>
//           )}
//           <View style={styles.inputRow}>
//             <View style={styles.mediaButtons}>
//               <TouchableOpacity style={styles.mediaButton} onPress={handleImagePicker} disabled={isRecording}>
//                 <Icon name="image-outline" size={24} color={isRecording ? "#ccc" : "#666"} />
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.mediaButton, isRecording && styles.recordingButton]} onPress={handleAudioRecording}>
//                 <Icon name={isRecording ? "stop-circle" : "mic-outline"} size={24} color={isRecording ? "#FF3B30" : "#666"} />
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.mediaButton} onPress={handleVideoPicker} disabled={isRecording}>
//                 <Icon name="videocam-outline" size={24} color={isRecording ? "#ccc" : "#666"} />
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.mediaButton} onPress={handleFilePicker} disabled={isRecording}>
//                 <MaterialIcons name="attach-file" size={24} color={isRecording ? "#ccc" : "#666"} />
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.mediaButton} onPress={handleStickerPicker} disabled={isRecording}>
//                 <Icon name="happy-outline" size={24} color={isRecording ? "#ccc" : "#666"} />
//               </TouchableOpacity>
//             </View>
//           </View>
//           <View style={styles.textInputRow}>
//             <TextInput
//               style={styles.input}
//               placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
//               multiline
//               value={commentText}
//               onChangeText={setCommentText}
//               maxLength={500}
//               editable={!isRecording}
//             />
//             <TouchableOpacity
//               style={[styles.sendButton, (isAddingComment || isAddingReply || isRecording) && styles.sendButtonDisabled]}
//               onPress={handleAddComment}
//               disabled={isAddingComment || isAddingReply || isRecording || (!commentText.trim() && !selectedMedia)}
//             >
//               <Icon name="send" size={24} color={(isAddingComment || isAddingReply || isRecording || (!commentText.trim() && !selectedMedia)) ? '#ccc' : '#007AFF'} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </RBSheet>
//   );
// };

// const styles = StyleSheet.create({
//   sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
//   draggableIcon: { backgroundColor: '#000', width: 35 },
//   container: { flex: 1, backgroundColor: '#fff' },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
//   title: { fontSize: 18, fontWeight: 'bold' },
//   loader: { marginTop: 40 },
//   commentsList: { padding: 16 },
//   emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
//   commentItem: { flexDirection: 'row', marginBottom: 16 },
//   avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
//   commentContent: { flex: 1 },
//   commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
//   username: { fontWeight: 'bold', fontSize: 14, marginRight: 8 },
//   pinnedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
//   pinnedText: { fontSize: 10, color: '#007AFF', fontWeight: '600', marginLeft: 2 },
//   timestamp: { fontSize: 12, color: '#999' },
//   commentText: { fontSize: 14, marginBottom: 8, color: '#333' },
//   commentActions: { flexDirection: 'row', marginTop: 4 },
//   replyButtonText: { color: '#007AFF', fontSize: 13, fontWeight: '500' },
//   rightActions: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 8, paddingLeft: 8, paddingTop: 4 },
//   rightActionButton: { alignItems: 'center', paddingHorizontal: 8 },
//   actionText: { fontSize: 10, color: '#666', marginTop: 2 },
//   activeActionText: { color: '#007AFF' },
//   audioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 24, padding: 10, marginBottom: 8 },
//   playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   waveformContainer: { flex: 1, marginRight: 12 },
//   waveform: { flexDirection: 'row', alignItems: 'center', height: 30 },
//   waveformBar: { width: 3, marginHorizontal: 1, borderRadius: 2 },
//   audioDuration: { fontSize: 13, color: '#666', minWidth: 40 },
//   videoContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#000', height: 200 },
//   videoPlayer: { width: '100%', height: '100%' },
//   videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
//   playIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
//   videoDuration: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
//   videoDurationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
//   pdfContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 12, borderRadius: 12, marginBottom: 8 },
//   pdfIconContainer: { marginRight: 12 },
//   pdfInfo: { flex: 1 },
//   pdfFileName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
//   pdfFileSize: { fontSize: 12, color: '#999' },
//   downloadButton: { padding: 8 },
//   imageAttachment: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
//   stickerAttachment: { width: 120, height: 120, marginBottom: 8 },
//   inputContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 20 : 10, backgroundColor: '#fff' },
//   replyingToContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F0F0F0', borderRadius: 8, marginTop: 8 },
//   replyingToText: { fontSize: 13, color: '#666' },
//   recordingIndicator: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFF3F3', borderRadius: 8, marginTop: 8 },
//   recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 8 },
//   recordingText: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },
//   inputRow: { marginTop: 8 },
//   mediaButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
//   mediaButton: { padding: 8 },
//   recordingButton: { backgroundColor: '#FFF3F3', borderRadius: 20 },
//   textInputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8 },
//   input: { flex: 1, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginRight: 8 },
//   sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
//   sendButtonDisabled: { opacity: 0.5 },
//   mediaPreviewContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
//   mediaPreview: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 8, padding: 8 },
//   previewImage: { width: '100%', height: 100, borderRadius: 8 },
//   previewVideo: { flexDirection: 'row', alignItems: 'center', padding: 12 },
//   previewAudio: { flexDirection: 'row', alignItems: 'center', padding: 12 },
//   previewPdf: { flexDirection: 'row', alignItems: 'center', padding: 12 },
//   previewSticker: { width: 80, height: 80, alignSelf: 'center' },
//   previewText: { fontSize: 14, color: '#666', marginLeft: 8 },
//   removeMediaButton: { marginLeft: 8, padding: 4 },
// });

// export default Comments; 


// >>>>>>>>>>>>>>>>>>>>>old code




// import React, { useCallback, useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import RBSheet from 'react-native-raw-bottom-sheet';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { format } from 'date-fns';
// import { usegetComments, useAddComment, useAddReply } from '../../../ReactQuery/TanStackQueryHooks/useComments';
// import ReplySection from './ReplySection';

// // Media Components
// const AudioPlayer = ({ audioUrl, duration }) => (
//   <View style={styles.audioContainer}>
//     <TouchableOpacity style={styles.playButton}>
//       <Icon name="play" size={24} color="#007AFF" />
//     </TouchableOpacity>
//     <View style={styles.waveformContainer}>
//       <View style={styles.waveform}>
//         {[...Array(20)].map((_, i) => (
//           <View
//             key={i}
//             style={[
//               styles.waveformBar,
//               { height: Math.random() * 24 + 12 }
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
//       source={{ uri: thumbnail || videoUrl || 'https://via.placeholder.com/400x250' }}
//       style={styles.videoThumbnail}
//     />
//     <View style={styles.videoOverlay}>
//       <View style={styles.playIconContainer}>
//         <Icon name="play" size={40} color="#fff" />
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
//         <MaterialIcons name="picture-as-pdf" size={40} color="#FF3B30" />
//       </View>
//       <View style={styles.pdfInfo}>
//         <Text style={styles.pdfFileName} numberOfLines={1}>{fileName}.pdf</Text>
//         <Text style={styles.pdfFileSize}>PDF Document</Text>
//       </View>
//       <TouchableOpacity style={styles.downloadButton}>
//         <Icon name="download-outline" size={24} color="#666" />
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

// const CommentItem = ({ item, onReply, replyingTo }) => {
//   const [isReplying, setIsReplying] = useState(false);

//   // Reset isReplying when replyingTo is cleared from parent
//   React.useEffect(() => {
//     if (!replyingTo) {
//       setIsReplying(false);
//     }
//   }, [replyingTo]);

//   const handleReplyPress = () => {
//     const newState = !isReplying;
//     setIsReplying(newState);
//     onReply(newState ? item : null);
//   };

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
//     <View style={styles.commentItem}>
//       <Image
//         source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }}
//         style={styles.avatar}
//       />
//       <View style={styles.commentContent}>
//         <View style={styles.commentHeader}>
//           <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
//           {item.isPinned && (
//             <View style={styles.pinnedBadge}>
//               <Icon name="pin" size={10} color="#007AFF" />
//               <Text style={styles.pinnedText}>Pinned</Text>
//             </View>
//           )}
//           <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
//         </View>

//         {item.content && <Text style={styles.commentText}>{item.content}</Text>}

//         {renderMedia()}

//         <View style={styles.commentActions}>
//           <TouchableOpacity onPress={handleReplyPress}>
//             <Text style={styles.replyButtonText}>
//               {isReplying ? 'Cancel' : 'Reply'}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {(isReplying || item.hasReply) && (
//           <ReplySection
//             commentId={item._id}
//             onReplyAdded={() => setIsReplying(false)}
//             hasReply={item.hasReply}
//             showInput={isReplying}
//             onReply={onReply}
//             replyingTo={replyingTo}
//           />
//         )}
//       </View>

//       <View style={styles.rightActions}>
//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon
//             name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"}
//             size={16}
//             color={item.userHasLiked ? "#007AFF" : "#666"}
//           />
//           <Text style={[styles.actionText, item.userHasLiked && styles.activeActionText]}>
//             {item.numberOfLikes || 0}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon
//             name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"}
//             size={16}
//             color={item.userHasDisliked ? "#007AFF" : "#666"}
//           />
//           <Text style={[styles.actionText, item.userHasDisliked && styles.activeActionText]}>
//             {item.numberOfDislikes || 0}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const Comments = ({ sheetRef, contentId, contentType }) => {
//   const [commentText, setCommentText] = useState('');
//   const [isSheetOpen, setIsSheetOpen] = useState(false);
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'image|video|audio|file|sticker', uri: '...' }

//   const { mutate: addComment, isLoading: isAddingComment } = useAddComment();
//   const { mutate: addReply, isLoading: isAddingReply } = useAddReply();

//   const {
//     data,
//     isLoading,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = usegetComments(10, contentId, { contentType, enabled: isSheetOpen });

//   const comments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];
//   const totalComments = data?.pages?.[0]?.data?.pagination?.totalComments || 0;

//   const handleAddComment = () => {
//     if (!commentText.trim() && !selectedMedia) { return; }

//     const payload = {
//       content: commentText || null,
//       postId: contentId,
//       ...(selectedMedia?.type === 'audio' && { audioComment: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'video' && { videoComment: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'file' && { fileUrl: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'image' && { imageUrl: selectedMedia.uri }),
//       ...(selectedMedia?.type === 'sticker' && { stickerUrl: selectedMedia.uri }),
//     };

//     if (replyingTo) {
//       addReply(
//         {
//           commentId: replyingTo._id,
//           ...payload,
//         },
//         {
//           onSuccess: () => {
//             setCommentText('');
//             setSelectedMedia(null);
//             setReplyingTo(null);
//           },
//         }
//       );
//     } else {
//       addComment(
//         payload,
//         {
//           onSuccess: () => {
//             setCommentText('');
//             setSelectedMedia(null);
//           },
//         }
//       );
//     }
//   };

//   const handleMediaSelect = (type) => {
//     // This would open image picker, file picker, etc.
//     // For now, just a placeholder
//     console.log('Select media:', type);
//     // Example: 
//     // const result = await ImagePicker.launchImageLibrary();
//     // setSelectedMedia({ type, uri: result.uri });
//   };

//   const loadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   const renderComment = useCallback(({ item }) => (
//     <CommentItem item={item} onReply={setReplyingTo} replyingTo={replyingTo} />
//   ), [replyingTo]);

//   const renderMediaPreview = () => {
//     if (!selectedMedia) return null;

//     return (
//       <View style={styles.mediaPreviewContainer}>
//         <View style={styles.mediaPreview}>
//           {selectedMedia.type === 'image' && (
//             <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
//           )}
//           {selectedMedia.type === 'video' && (
//             <View style={styles.previewVideo}>
//               <Icon name="videocam" size={24} color="#666" />
//               <Text style={styles.previewText}>Video selected</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'audio' && (
//             <View style={styles.previewAudio}>
//               <Icon name="musical-notes" size={24} color="#666" />
//               <Text style={styles.previewText}>Audio recorded</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'file' && (
//             <View style={styles.previewPdf}>
//               <MaterialIcons name="picture-as-pdf" size={24} color="#FF3B30" />
//               <Text style={styles.previewText}>PDF attached</Text>
//             </View>
//           )}
//           {selectedMedia.type === 'sticker' && (
//             <Image source={{ uri: selectedMedia.uri }} style={styles.previewSticker} />
//           )}
//         </View>
//         <TouchableOpacity
//           style={styles.removeMediaButton}
//           onPress={() => setSelectedMedia(null)}
//         >
//           <Icon name="close-circle" size={24} color="#FF3B30" />
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <RBSheet
//       ref={sheetRef}
//       onOpen={() => setIsSheetOpen(true)}
//       onClose={() => {
//         setIsSheetOpen(false);
//         setReplyingTo(null);
//         setSelectedMedia(null);
//       }}
//       height={500}
//       openDuration={250}
//       closeOnDragDown
//       customStyles={{
//         container: styles.sheetContainer,
//         draggableIcon: styles.draggableIcon,
//       }}
//       keyboardAvoidingViewEnabled={false}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.container}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Comments ({totalComments})</Text>
//           <TouchableOpacity onPress={() => sheetRef.current?.close()}>
//             <Icon name="close" size={28} color="#000" />
//           </TouchableOpacity>
//         </View>

//         {isLoading ? (
//           <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
//         ) : (
//           <FlatList
//             data={comments}
//             renderItem={renderComment}
//             keyExtractor={item => item._id}
//             onEndReached={loadMore}
//             onEndReachedThreshold={0.5}
//             ListEmptyComponent={
//               <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
//             }
//             ListFooterComponent={
//               isFetchingNextPage &&
//               <ActivityIndicator size="small" color="#007AFF" />
//             }
//             contentContainerStyle={styles.commentsList}
//           />
//         )}

//         <View style={styles.inputContainer}>
//           {replyingTo && (
//             <View style={styles.replyingToContainer}>
//               <Text style={styles.replyingToText}>
//                 Replying to {replyingTo?.owner?.username || 'Unknown'}
//               </Text>
//               <TouchableOpacity onPress={() => setReplyingTo(null)}>
//                 <Icon name="close-circle" size={20} color="#666" />
//               </TouchableOpacity>
//             </View>
//           )}

//           {renderMediaPreview()}

//           <View style={styles.inputRow}>
//             <View style={styles.mediaButtons}>
//               <TouchableOpacity
//                 style={styles.mediaButton}
//                 onPress={() => handleMediaSelect('image')}
//               >
//                 <Icon name="image-outline" size={24} color="#666" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.mediaButton}
//                 onPress={() => handleMediaSelect('audio')}
//               >
//                 <Icon name="mic-outline" size={24} color="#666" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.mediaButton}
//                 onPress={() => handleMediaSelect('video')}
//               >
//                 <Icon name="videocam-outline" size={24} color="#666" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.mediaButton}
//                 onPress={() => handleMediaSelect('file')}
//               >
//                 <MaterialIcons name="attach-file" size={24} color="#666" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.mediaButton}
//                 onPress={() => handleMediaSelect('sticker')}
//               >
//                 <Icon name="happy-outline" size={24} color="#666" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.textInputRow}>
//             <TextInput
//               style={styles.input}
//               placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
//               multiline
//               value={commentText}
//               onChangeText={setCommentText}
//               maxLength={500}
//             />
//             <TouchableOpacity
//               style={[
//                 styles.sendButton,
//                 (isAddingComment || isAddingReply) && styles.sendButtonDisabled,
//               ]}
//               onPress={handleAddComment}
//               disabled={isAddingComment || isAddingReply || (!commentText.trim() && !selectedMedia)}
//             >
//               <Icon
//                 name="send"
//                 size={24}
//                 color={(isAddingComment || isAddingReply || (!commentText.trim() && !selectedMedia)) ? '#ccc' : '#007AFF'}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </RBSheet>
//   );
// };

// const styles = StyleSheet.create({
//   sheetContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   draggableIcon: {
//     backgroundColor: '#000',
//     width: 35,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loader: {
//     marginTop: 40,
//   },
//   commentsList: {
//     padding: 16,
//   },
//   commentItem: {
//     flexDirection: 'row',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   commentContent: {
//     flex: 1,
//   },
//   commentHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   username: {
//     fontWeight: 'bold',
//     fontSize: 14,
//     marginRight: 8,
//   },
//   pinnedBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#E8F4FF',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   pinnedText: {
//     fontSize: 10,
//     color: '#007AFF',
//     fontWeight: '600',
//     marginLeft: 2,
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#999',
//   },
//   commentText: {
//     fontSize: 14,
//     marginBottom: 8,
//     color: '#333',
//   },
//   commentActions: {
//     flexDirection: 'row',
//     marginTop: 4,
//   },
//   replyButtonText: {
//     color: '#007AFF',
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   rightActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginLeft: 8,
//     paddingLeft: 8,
//     paddingTop: 4,
//   },
//   rightActionButton: {
//     alignItems: 'center',
//     paddingHorizontal: 8,
//   },
//   actionText: {
//     fontSize: 10,
//     color: '#666',
//     marginTop: 2,
//   },
//   activeActionText: {
//     color: '#007AFF',
//   },
//   // Audio Player
//   audioContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F0F0F0',
//     borderRadius: 24,
//     padding: 10,
//     marginBottom: 8,
//   },
//   playButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   waveformContainer: {
//     flex: 1,
//     marginRight: 12,
//   },
//   waveform: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     height: 30,
//   },
//   waveformBar: {
//     width: 3,
//     backgroundColor: '#007AFF',
//     marginHorizontal: 1,
//     borderRadius: 2,
//   },
//   audioDuration: {
//     fontSize: 13,
//     color: '#666',
//     minWidth: 40,
//   },
//   // Video Player
//   videoContainer: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginBottom: 8,
//     backgroundColor: '#000',
//   },
//   videoThumbnail: {
//     width: '100%',
//     height: 200,
//   },
//   videoOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   playIconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoDuration: {
//     position: 'absolute',
//     bottom: 12,
//     right: 12,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   videoDurationText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   // PDF
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
//     width: 56,
//     height: 56,
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
//     marginBottom: 4,
//   },
//   pdfFileSize: {
//     fontSize: 13,
//     color: '#666',
//   },
//   downloadButton: {
//     padding: 8,
//   },
//   // Image
//   imageAttachment: {
//     width: '100%',
//     height: 240,
//     borderRadius: 12,
//     marginBottom: 8,
//   },
//   // Sticker
//   stickerAttachment: {
//     width: 150,
//     height: 150,
//     marginBottom: 8,
//   },
//   // Input Container
//   inputContainer: {
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     backgroundColor: '#fff',
//     paddingBottom: Platform.OS === 'ios' ? 20 : 8,
//   },
//   replyingToContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingTop: 8,
//     paddingBottom: 4,
//     backgroundColor: '#f8f8f8',
//   },
//   replyingToText: {
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   mediaPreviewContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: '#F8F8F8',
//     marginHorizontal: 12,
//     marginTop: 8,
//     borderRadius: 8,
//   },
//   mediaPreview: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   previewImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//   },
//   previewSticker: {
//     width: 50,
//     height: 50,
//   },
//   previewVideo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   previewAudio: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   previewPdf: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   previewText: {
//     marginLeft: 8,
//     fontSize: 13,
//     color: '#666',
//   },
//   removeMediaButton: {
//     marginLeft: 8,
//   },
//   inputRow: {
//     paddingHorizontal: 12,
//     paddingTop: 8,
//   },
//   mediaButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   mediaButton: {
//     padding: 8,
//   },
//   textInputRow: {
//     flexDirection: 'row',
//     padding: 12,
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     maxHeight: 100,
//     fontSize: 14,
//   },
//   sendButton: {
//     padding: 8,
//     borderRadius: 20,
//   },
//   sendButtonDisabled: {
//     opacity: 0.5,
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: '#666',
//     marginTop: 40,
//     fontSize: 14,
//   },
// });

// export default Comments;












// ==============very old code 


// import React, { useCallback, useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import RBSheet from 'react-native-raw-bottom-sheet';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { format } from 'date-fns';
// import { usegetComments, useAddComment, useAddReply } from '../../../ReactQuery/TanStackQueryHooks/useComments';
// import ReplySection from './ReplySection';

// const CommentItem = ({ item, onReply }) => {
//   const [isReplying, setIsReplying] = useState(false);

//   const handleReplyPress = () => {
//     setIsReplying(!isReplying);
//     onReply(item);
//   };

//   return (
//     <View style={styles.commentItem}>
//       <Image
//         source={{ uri: item?.owner?.avatar || 'https://via.placeholder.com/150' }}
//         style={styles.avatar}
//       />
//       <View style={styles.commentContent}>
//         <Text style={styles.username}>{item?.owner?.username || 'Unknown'}</Text>
//         <Text style={styles.commentText}>{item.content}</Text>
//         <View style={styles.commentActions}>
//           {/* <Text style={styles.timestamp}>
//             {format(new Date(item.createdAt), 'MMM dd, yyyy')}
//           </Text> */}

//           <TouchableOpacity onPress={handleReplyPress}>
//             <Text style={styles.replyButtonText}>
//               {isReplying ? 'Cancel' : 'Reply'}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {(isReplying || item.hasReply) && (
//           <ReplySection
//             commentId={item._id}
//             onReplyAdded={() => setIsReplying(false)}
//             hasReply={item.hasReply}
//             showInput={isReplying}
//             onReply={onReply}
//           />
//         )}
//       </View>

//       <View style={styles.rightActions}>
//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon
//             name={item.userHasLiked ? "thumbs-up" : "thumbs-up-outline"}
//             size={16}
//             color={item.userHasLiked ? "#007AFF" : "#666"}
//           />
//           <Text style={[styles.actionText, item.userHasLiked && styles.activeActionText]}>
//             {item.numberOfLikes || 0}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.rightActionButton}>
//           <Icon
//             name={item.userHasDisliked ? "thumbs-down" : "thumbs-down-outline"}
//             size={16}
//             color={item.userHasDisliked ? "#007AFF" : "#666"}
//           />
//           <Text style={[styles.actionText, item.userHasDisliked && styles.activeActionText]}>
//             {item.numberOfDislikes || 0}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>


//   );
// };

// const Comments = ({ sheetRef, contentId, contentType }) => {
//   const [commentText, setCommentText] = useState('');
//   const [isSheetOpen, setIsSheetOpen] = useState(false);
//   const [replyingTo, setReplyingTo] = useState(null);
//   const { mutate: addComment, isLoading: isAddingComment } = useAddComment();
//   const { mutate: addReply, isLoading: isAddingReply } = useAddReply();

//   const {
//     data,
//     isLoading,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = usegetComments(10, contentId, { contentType, enabled: isSheetOpen });

//   const comments = data?.pages?.flatMap(page => page?.data?.comments || []) || [];

//   const handleAddComment = () => {
//     if (!commentText.trim()) { return; }

//     if (replyingTo) {
//       addReply(
//         {
//           commentId: replyingTo._id,
//           content: commentText,
//         },
//         {
//           onSuccess: () => {
//             setCommentText('');
//             setReplyingTo(null);
//           },
//         }
//       );
//     } else {
//       addComment(
//         {
//           content: commentText,
//           // audioComment,
//           // videoComment,
//           // sticker,

//           postId: contentId,
//           // contentType
//         },
//         {
//           onSuccess: () => {
//             setCommentText('');
//           },
//         }
//       );
//     }
//   };

//   const loadMore = () => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   };

//   const renderComment = useCallback(({ item }) => (
//     <CommentItem item={item} onReply={setReplyingTo} />
//   ), []);

//   return (
//     <RBSheet
//       ref={sheetRef}
//       onOpen={() => setIsSheetOpen(true)}
//       onClose={() => setIsSheetOpen(false)}
//       height={500}
//       openDuration={250}
//       closeOnDragDown
//       customStyles={{
//         container: styles.sheetContainer,
//         draggableIcon: styles.draggableIcon,
//       }}
//       keyboardAvoidingViewEnabled={false}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.container}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Comments</Text>
//           <Text style={styles.commentCount}>
//             {comments.length > 0 ? `${comments.length} comments` : ''}
//           </Text>
//         </View>

//         {isLoading ? (
//           <ActivityIndicator size="large" color="#007AFF" />
//         ) : (
//           <FlatList
//             data={comments}
//             renderItem={renderComment}
//             keyExtractor={item => item._id}
//             onEndReached={loadMore}
//             onEndReachedThreshold={0.5}
//             ListEmptyComponent={
//               <Text style={styles.emptyText}>No comments yet</Text>
//             }
//             ListFooterComponent={
//               isFetchingNextPage &&
//               <ActivityIndicator size="small" color="#007AFF" />
//             }
//             contentContainerStyle={styles.commentsList}
//           />
//         )}

//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder={replyingTo ? `Add a reply...` : "Add a comment..."}
//             multiline
//             value={commentText}
//             onChangeText={setCommentText}
//             maxLength={500}
//           />
//           <TouchableOpacity
//             style={[
//               styles.sendButton,
//               (isAddingComment || isAddingReply) && styles.sendButtonDisabled,
//             ]}
//             onPress={handleAddComment}
//             disabled={isAddingComment || isAddingReply || !commentText.trim()}
//           >
//             <Icon
//               name="send"
//               size={24}
//               color={(isAddingComment || isAddingReply) ? '#ccc' : '#007AFF'}
//             />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </RBSheet>
//   );
// };

// const styles = StyleSheet.create({
//   sheetContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   draggableIcon: {
//     backgroundColor: '#000',
//     width: 35,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   commentCount: {
//     color: '#666',
//     fontSize: 14,
//   },
//   commentsList: {
//     padding: 16,
//   },
//   commentItem: {
//     flexDirection: 'row',
//     marginBottom: 16,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   commentContent: {
//     flex: 1,
//   },
//   username: {
//     fontWeight: 'bold',
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   commentText: {
//     fontSize: 14,
//     marginBottom: 4,
//     color: '#333',
//   },
//   commentActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 4,
//   },
//   timestamp: {
//     fontSize: 12,
//     color: '#666',
//   },
//   replyButtonText: {
//     color: '#007AFF',
//     fontSize: 13,
//     fontWeight: '500',
//     fontWeight: '500',
//     marginTop: 4,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 0,
//   },
//   rightActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'center',
//     marginLeft: 8,
//     paddingLeft: 8,
//     paddingTop: 4,
//   },
//   rightActionButton: {
//     alignItems: 'center',
//     paddingHorizontal: 8,
//   },
//   actionText: {
//     fontSize: 10,
//     color: '#666',
//     marginTop: 2,
//     marginLeft: 0,
//   },

//   activeActionText: {
//     color: '#007AFF',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     maxHeight: 100,
//     fontSize: 14,
//   },
//   sendButton: {
//     padding: 8,
//     borderRadius: 20,
//   },
//   sendButtonDisabled: {
//     opacity: 0.5,
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: '#666',
//     marginTop: 20,
//     fontSize: 14,
//   },
// });

// export default Comments;
