import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
  
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-nitro-sound';
import { ModalBottomSheet } from '@swmansion/react-native-bottom-sheet';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

const RecorderBottomnav = ({visible, onClose, onAudioRecorded}) => {
  const [index, setIndex] = useState(visible ? 1 : 0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isPlayerInitialized = useRef(false);
  const isRecorderInitialized = useRef(false);

  // Keep sheet index in sync with the visible prop
  useEffect(() => {
    setIndex(visible ? 1 : 0);
  }, [visible]);

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRecording) {pulse();}
        });
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecorderInitialized.current) {
        Sound.stopRecorder().catch(() => {});
        Sound.removeRecordBackListener();
      }
      if (isPlayerInitialized.current) {
        Sound.stopPlayer().catch(() => {});
        Sound.removePlayBackListener();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission',
          'Microphone access is required to record audio. Please enable it in settings.'
        );
        return;
      }

      // Reset state
      setRecordedAudio(null);
      setRecordingTime(0);
      setIsRecording(true);

      const audioSet = {
        AudioEncoderAndroid: Sound.AudioEncoderAndroidType?.AAC,
        AudioSourceAndroid: Sound.AudioSourceAndroidType?.MIC,
        AVEncoderAudioQualityKeyIOS: Sound.AVEncoderAudioQualityIOSType?.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: Sound.AVEncodingOption?.aac,
      };

      await Sound.startRecorder(undefined, audioSet);
      isRecorderInitialized.current = true;

      Sound.addRecordBackListener((e) => {
        const seconds = Math.floor(e.currentPosition / 1000);
        setRecordingTime(seconds);
      });

      console.log('Sound.startRecorder() called');
    } catch (err) {
      console.warn('startRecording error', err);
      setIsRecording(false);
      isRecorderInitialized.current = false;
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await Sound.stopRecorder();
      Sound.removeRecordBackListener();
      isRecorderInitialized.current = false;

      setIsRecording(false);
      const finalDuration = recordingTime;

      if (result) {
        console.log('🎤 Recording stopped, waiting for file to be ready...');
        await new Promise(resolve => setTimeout(resolve, 300));

        const audioData = {
          uri: result,
          duration: finalDuration,
          size: finalDuration * 1024,
          mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
          createdAt: Date.now(),
        };
        setRecordedAudio(audioData);
        console.log('Stopped recording, result:', result);
      }
    } catch (err) {
      console.warn('stopRecording error', err);
      setIsRecording(false);
      isRecorderInitialized.current = false;
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const playRecording = async () => {
    if (!recordedAudio?.uri) {return;}

    try {
      setIsPlaying(true);
      setPlaybackTime(0);

      try {
        // Stop any existing player first
        await Sound.stopPlayer();
        Sound.removePlayBackListener();
      } catch (e) {
        // Ignore if nothing was playing
      }

      await Sound.startPlayer(recordedAudio.uri);
      isPlayerInitialized.current = true;

      Sound.addPlayBackListener((e) => {
        if (e.currentPosition && e.duration) {
          const current = e.currentPosition / 1000;
          const total = e.duration / 1000;

          setPlaybackTime(Math.floor(current));

          if (current >= total - 0.1) {
            setIsPlaying(false);
            setPlaybackTime(0);
            isPlayerInitialized.current = false;
            Sound.stopPlayer().catch(() => {});
            Sound.removePlayBackListener();
          }
        }
      });
    } catch (err) {
      console.warn('playRecording error', err);
      setIsPlaying(false);
      isPlayerInitialized.current = false;
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  const stopPlayback = async () => {
    try {
      await Sound.stopPlayer();
      Sound.removePlayBackListener();
      isPlayerInitialized.current = false;
      setIsPlaying(false);
      setPlaybackTime(0);
    } catch (err) {
      console.warn('stopPlayback error', err);
      setIsPlaying(false);
      setPlaybackTime(0);
    }
  };

  const confirmRecording = () => {
    if (!recordedAudio) {return;}

    onAudioRecorded(recordedAudio);
    resetRecorder();
    onClose();
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            resetRecorder();
          },
        },
      ]
    );
  };

  const resetRecorder = async () => {
    if (isPlayerInitialized.current) {
      try {
        await Sound.stopPlayer();
        Sound.removePlayBackListener();
      } catch (e) {
        // ignore
      }
      isPlayerInitialized.current = false;
    }
    if (isRecorderInitialized.current) {
      try {
        await Sound.stopRecorder();
        Sound.removeRecordBackListener();
      } catch (e) {
        // ignore
      }
      isRecorderInitialized.current = false;
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setPlaybackTime(0);
  };

  // Shared close handler — used by the X button AND the sheet's onIndexChange
  // (swipe-to-dismiss / detent-0 case). This is the fix: previously the X
  // button only called setIndex(0), which never notified the parent, so
  // `visible` stayed true forever and the sheet couldn't be reopened.
  const handleClose = () => {
    if (isPlaying) {
      stopPlayback();
    }
    if (isRecording) {
      stopRecording();
    }
    setIndex(0);
    onClose && onClose();
  };

  const renderContent = () => (
    <SafeAreaView style={[styles.container, {height: SHEET_HEIGHT}]} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audio Recorder</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Recording Area */}
      <View style={styles.recordingArea}>
        {!recordedAudio ? (
          // Recording Interface
          <View style={styles.recordingInterface}>
            {isRecording && (
              <Text style={styles.recordingTime}>
                {formatTime(recordingTime)}
              </Text>
            )}

            <Animated.View style={[
              styles.recordButton,
              isRecording && styles.recordingButton,
              {transform: [{scale: pulseAnim}]},
            ]}>
              <TouchableOpacity
                style={styles.recordButtonInner}
                onPress={isRecording ? stopRecording : startRecording}>
                <Icon
                  name={isRecording ? 'stop' : 'mic'}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.recordingHint}>
              {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
            </Text>
          </View>
        ) : (
          // Playback Interface
          <View style={styles.playbackInterface}>
            <View style={styles.audioInfo}>
              <Icon name="audiotrack" size={24} color="#666" />
              <Text style={styles.audioTitle}>
                Audio Recording ({formatTime(recordedAudio.duration)})
              </Text>
            </View>

            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={isPlaying ? stopPlayback : playRecording}>
                <Icon
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={28}
                  color="#2196F3"
                />
              </TouchableOpacity>

              <View style={styles.timeInfo}>
                <Text style={styles.timeText}>
                  {isPlaying ? formatTime(playbackTime) : '00:00'} / {formatTime(recordedAudio.duration)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${(playbackTime / recordedAudio.duration) * 100}%`},
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {recordedAudio && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteRecording}>
            <Icon name="delete" size={20} color="#ff4757" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmRecording}>
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Use Audio</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recording Instructions */}
      {!recordedAudio && !isRecording && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            • Tap the microphone to start recording
          </Text>
          <Text style={styles.instructionText}>
            • Tap stop when you're finished
          </Text>
          <Text style={styles.instructionText}>
            • You can play back and confirm your recording
          </Text>
        </View>
      )}
    </SafeAreaView>
  );

  return (
    <ModalBottomSheet
      index={index}
      onIndexChange={(newIndex) => {
        setIndex(newIndex);
        if (newIndex === 0) {
          if (isPlaying) {
            stopPlayback();
          }
          if (isRecording) {
            stopRecording();
          }
          onClose && onClose();
        }
      }}
      detents={[0, SHEET_HEIGHT]}
      surface={
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.sheetContainer,
          ]}
        />
      }
    >
      {renderContent()}
    </ModalBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  draggableIcon: {
    backgroundColor: '#ddd',
  },
  container: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  recordingArea: {
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  recordingInterface: {
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4757',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#ff4757',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#ff6b7a',
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  recordingHint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  playbackInterface: {
    width: '100%',
    alignItems: 'center',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  audioTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  deleteButtonText: {
    marginLeft: 8,
    color: '#ff4757',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  confirmButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '500',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default RecorderBottomnav;

// import React, {useState, useRef, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Animated,
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {
//   requestMicrophonePermission,
//   AudioRecorder,
//   AudioPlayer,
// } from 'react-native-audio-api';

// const RecorderBottomnav = ({visible, onClose, onAudioRecorded}) => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordedAudio, setRecordedAudio] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [playbackTime, setPlaybackTime] = useState(0);

//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const slideAnim = useRef(new Animated.Value(300)).current;
//   const recordingInterval = useRef(null);
//   const playbackInterval = useRef(null);

//   useEffect(() => {
//     if (visible) {
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(slideAnim, {
//         toValue: 300,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [visible]);

//   useEffect(() => {
//     if (isRecording) {
//       // Start pulsing animation
//       const pulse = () => {
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1.2,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }),
//         ]).start(() => {
//           if (isRecording) {pulse();}
//         });
//       };
//       pulse();

//       // Start recording timer
//       recordingInterval.current = setInterval(() => {
//         setRecordingTime(prev => prev + 1);
//       }, 1000);
//     } else {
//       pulseAnim.setValue(1);
//       if (recordingInterval.current) {
//         clearInterval(recordingInterval.current);
//       }
//     }

//     return () => {
//       if (recordingInterval.current) {
//         clearInterval(recordingInterval.current);
//       }
//     };
//   }, [isRecording]);

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };
//   const startRecording = async () => {
//     try {
//       const granted = await requestMicrophonePermission();
//       if (!granted) {
//         Alert.alert(
//           'Microphone Permission',
//           'Microphone access is required to record audio. Please enable it in settings.'
//         );
//         return;
//       }

//       // Reset state
//       setRecordedAudio(null);
//       setRecordingTime(0);
//       setIsRecording(true);

//       // Start native recorder from library
//       await AudioRecorder.start();
//       console.log('AudioRecorder.start() called');
//     } catch (err) {
//       console.warn('startRecording error', err);
//       // Fallback to simulated behavior
//       setIsRecording(true);
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       setIsRecording(false);

//       const result = await AudioRecorder.stop();
//       // result should include path/uri, duration, size when available
//       const audioData = {
//         uri: result?.uri || result?.path || 'file://' + (result?.path || 'unknown'),
//         duration: result?.duration ?? recordingTime,
//         size: result?.size ?? recordingTime * 1024,
//         mimeType: result?.mimeType || 'audio/m4a',
//         createdAt: Date.now(),
//       };
//       setRecordedAudio(audioData);
//       console.log('Stopped recording, result:', result);
//     } catch (err) {
//       console.warn('stopRecording error', err);
//       // Fallback simulated audio data
//       const audioData = {
//         uri: 'mock-audio-uri',
//         duration: recordingTime,
//         size: recordingTime * 1024,
//       };
//       setRecordedAudio(audioData);
//     }
//   };

//   const playRecording = async () => {
//     if (!recordedAudio) {return;}

//     try {
//       setIsPlaying(true);
//       setPlaybackTime(0);

//       await AudioPlayer.load(recordedAudio.uri);
//       AudioPlayer.onProgress = (pos) => {
//         setPlaybackTime(Math.floor(pos));
//       };
//       AudioPlayer.onEnd = () => {
//         setIsPlaying(false);
//         setPlaybackTime(0);
//       };
//       await AudioPlayer.play();
//     } catch (err) {
//       console.warn('playRecording error', err);
//       // Fallback to simulated playback
//       setIsPlaying(true);
//       playbackInterval.current = setInterval(() => {
//         setPlaybackTime(prev => {
//           if (prev >= recordedAudio.duration) {
//             setIsPlaying(false);
//             clearInterval(playbackInterval.current);
//             return 0;
//           }
//           return prev + 1;
//         });
//       }, 1000);
//     }
//   };

//   const stopPlayback = async () => {
//     try {
//       setIsPlaying(false);
//       setPlaybackTime(0);
//       await AudioPlayer.stop();
//     } catch (err) {
//       if (playbackInterval.current) {clearInterval(playbackInterval.current);}
//       console.warn('stopPlayback error', err);
//     }
//   };

//   const confirmRecording = () => {
//     if (!recordedAudio) {return;}

//     onAudioRecorded(recordedAudio);
//     resetRecorder();
//     onClose();
//   };

//   const deleteRecording = () => {
//     Alert.alert(
//       'Delete Recording',
//       'Are you sure you want to delete this recording?',
//       [
//         {text: 'Cancel', style: 'cancel'},
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: () => {
//             resetRecorder();
//           },
//         },
//       ]
//     );
//   };

//   const resetRecorder = () => {
//     setIsRecording(false);
//     setRecordedAudio(null);
//     setIsPlaying(false);
//     setRecordingTime(0);
//     setPlaybackTime(0);
//     if (recordingInterval.current) {clearInterval(recordingInterval.current);}
//     if (playbackInterval.current) {clearInterval(playbackInterval.current);}
//   };

//   if (!visible) {return null;}

//   return (
//     <View style={styles.overlay}>
//       <TouchableOpacity
//         style={styles.backdrop}
//         activeOpacity={1}
//         onPress={onClose}
//       />
//       <Animated.View
//         style={[
//           styles.container,
//           {transform: [{translateY: slideAnim}]},
//         ]}>
//         {/* Handle Bar */}
//         <View style={styles.handleBar} />

//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.title}>Audio Recorder</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Icon name="close" size={24} color="#666" />
//           </TouchableOpacity>
//         </View>

//         {/* Recording Area */}
//         <View style={styles.recordingArea}>
//           {!recordedAudio ? (
//             // Recording Interface
//             <View style={styles.recordingInterface}>
//               {isRecording && (
//                 <Text style={styles.recordingTime}>
//                   {formatTime(recordingTime)}
//                 </Text>
//               )}

//               <Animated.View style={[
//                 styles.recordButton,
//                 isRecording && styles.recordingButton,
//                 {transform: [{scale: pulseAnim}]},
//               ]}>
//                 <TouchableOpacity
//                   style={styles.recordButtonInner}
//                   onPress={isRecording ? stopRecording : startRecording}>
//                   <Icon
//                     name={isRecording ? 'stop' : 'mic'}
//                     size={32}
//                     color="#fff"
//                   />
//                 </TouchableOpacity>
//               </Animated.View>

//               <Text style={styles.recordingHint}>
//                 {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
//               </Text>
//             </View>
//           ) : (
//             // Playback Interface
//             <View style={styles.playbackInterface}>
//               <View style={styles.audioInfo}>
//                 <Icon name="audiotrack" size={24} color="#666" />
//                 <Text style={styles.audioTitle}>
//                   Audio Recording ({formatTime(recordedAudio.duration)})
//                 </Text>
//               </View>

//               <View style={styles.playbackControls}>
//                 <TouchableOpacity
//                   style={styles.playButton}
//                   onPress={isPlaying ? stopPlayback : playRecording}>
//                   <Icon
//                     name={isPlaying ? 'pause' : 'play-arrow'}
//                     size={28}
//                     color="#2196F3"
//                   />
//                 </TouchableOpacity>

//                 <View style={styles.timeInfo}>
//                   <Text style={styles.timeText}>
//                     {isPlaying ? formatTime(playbackTime) : '00:00'} / {formatTime(recordedAudio.duration)}
//                   </Text>
//                 </View>
//               </View>

//               {/* Progress Bar */}
//               <View style={styles.progressBarContainer}>
//                 <View style={styles.progressBar}>
//                   <View
//                     style={[
//                       styles.progressFill,
//                       {width: `${(playbackTime / recordedAudio.duration) * 100}%`},
//                     ]}
//                   />
//                 </View>
//               </View>
//             </View>
//           )}
//         </View>

//         {/* Action Buttons */}
//         {recordedAudio && (
//           <View style={styles.actionButtons}>
//             <TouchableOpacity
//               style={styles.deleteButton}
//               onPress={deleteRecording}>
//               <Icon name="delete" size={20} color="#ff4757" />
//               <Text style={styles.deleteButtonText}>Delete</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.confirmButton}
//               onPress={confirmRecording}>
//               <Icon name="check" size={20} color="#fff" />
//               <Text style={styles.confirmButtonText}>Use Audio</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Recording Instructions */}
//         {!recordedAudio && !isRecording && (
//           <View style={styles.instructions}>
//             <Text style={styles.instructionText}>
//               • Tap the microphone to start recording
//             </Text>
//             <Text style={styles.instructionText}>
//               • Tap stop when you're finished
//             </Text>
//             <Text style={styles.instructionText}>
//               • You can play back and confirm your recording
//             </Text>
//           </View>
//         )}
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     zIndex: 3000,
//   },
//   backdrop: {
//     flex: 1,
//   },
//   container: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 20,
//     minHeight: 300,
//   },
//   handleBar: {
//     width: 40,
//     height: 4,
//     backgroundColor: '#ddd',
//     borderRadius: 2,
//     alignSelf: 'center',
//     marginTop: 8,
//     marginBottom: 12,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   recordingArea: {
//     padding: 20,
//     alignItems: 'center',
//     minHeight: 200,
//     justifyContent: 'center',
//   },
//   recordingInterface: {
//     alignItems: 'center',
//   },
//   recordingTime: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#ff4757',
//     marginBottom: 20,
//     fontFamily: 'monospace',
//   },
//   recordButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#ff4757',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#ff4757',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   recordingButton: {
//     backgroundColor: '#ff6b7a',
//   },
//   recordButtonInner: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 40,
//   },
//   recordingHint: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//   },
//   playbackInterface: {
//     width: '100%',
//     alignItems: 'center',
//   },
//   audioInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     padding: 12,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     width: '100%',
//   },
//   audioTitle: {
//     marginLeft: 12,
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#333',
//   },
//   playbackControls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   playButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#e3f2fd',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//     borderWidth: 2,
//     borderColor: '#2196F3',
//   },
//   timeInfo: {
//     alignItems: 'center',
//   },
//   timeText: {
//     fontSize: 14,
//     color: '#666',
//     fontFamily: 'monospace',
//   },
//   progressBarContainer: {
//     width: '100%',
//     paddingHorizontal: 20,
//   },
//   progressBar: {
//     height: 4,
//     backgroundColor: '#e0e0e0',
//     borderRadius: 2,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#2196F3',
//     borderRadius: 2,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     gap: 12,
//   },
//   deleteButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 12,
//     backgroundColor: '#fff5f5',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ffebee',
//   },
//   deleteButtonText: {
//     marginLeft: 8,
//     color: '#ff4757',
//     fontWeight: '500',
//   },
//   confirmButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 12,
//     backgroundColor: '#4CAF50',
//     borderRadius: 8,
//   },
//   confirmButtonText: {
//     marginLeft: 8,
//     color: '#fff',
//     fontWeight: '500',
//   },
//   instructions: {
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//     marginHorizontal: 16,
//     marginTop: 16,
//     borderRadius: 8,
//   },
//   instructionText: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 4,
//   },
// });

// export default RecorderBottomnav;
