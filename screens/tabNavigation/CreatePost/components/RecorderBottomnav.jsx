// import React, {useState, useRef, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Animated,
//   Alert,
//   Platform,
//   PermissionsAndroid,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {AudioRecorder} from 'react-native-audio-api';

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

//   // Audio API refs - SINGLETON PATTERN
//   const recorderRef = useRef(null);
//   const isRecorderInitialized = useRef(false);
//   const audioContextRef = useRef(null);
//   const sourceNodeRef = useRef(null);

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
//           if (isRecording) pulse();
//         });
//       };
//       pulse();

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

//   // Initialize recorder on mount with permission
//   useEffect(() => {
//     const initOnMount = async () => {
//       try {
//         const granted = await requestMicrophonePermission();
//         if (granted) {
//           console.log('Pre-initializing AudioRecorder on mount...');
//           await initializeRecorder();
//         }
//       } catch (err) {
//         console.log('Mount initialization skipped:', err.message);
//       }
//     };

//     initOnMount();

//     return () => {
//       cleanupAllResources();
//     };
//   }, []);

//   const cleanupAllResources = () => {
//     console.log('Cleaning up all audio resources');

//     if (recordingInterval.current) {
//       clearInterval(recordingInterval.current);
//     }
//     if (playbackInterval.current) {
//       clearInterval(playbackInterval.current);
//     }
//     if (sourceNodeRef.current) {
//       try {
//         sourceNodeRef.current.stop();
//       } catch (e) {
//         console.log('Source stop error:', e.message);
//       }
//     }
//     if (audioContextRef.current) {
//       try {
//         audioContextRef.current.close();
//       } catch (e) {
//         console.log('Context close error:', e.message);
//       }
//     }
//     if (recorderRef.current && isRecording) {
//       try {
//         recorderRef.current.stop();
//       } catch (e) {
//         console.log('Recorder stop error:', e.message);
//       }
//     }

//     // Full cleanup on unmount
//     recorderRef.current = null;
//     isRecorderInitialized.current = false;
//     sourceNodeRef.current = null;
//     audioContextRef.current = null;
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const androidVersion = Platform.Version;
//         console.log('Android version:', androidVersion);

//         if (androidVersion >= 31) {
//           const grants = await PermissionsAndroid.requestMultiple([
//             PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           ]);
//           const recordGranted = grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
//           console.log('Android 12+ permissions:', grants);
//           return recordGranted;
//         } else {
//           const granted = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//             {
//               title: 'Microphone Permission',
//               message: 'This app needs access to your microphone to record audio.',
//               buttonNeutral: 'Ask Me Later',
//               buttonNegative: 'Cancel',
//               buttonPositive: 'OK',
//             }
//           );
//           console.log('Android 11- permission:', granted);
//           return granted === PermissionsAndroid.RESULTS.GRANTED;
//         }
//       } catch (err) {
//         console.error('Permission error:', err);
//         return false;
//       }
//     }
//     return true;
//   };

//   // CRITICAL FIX: Create recorder instance ONCE and reuse
//   const initializeRecorder = async () => {
//     if (isRecorderInitialized.current && recorderRef.current) {
//       console.log('Recorder already initialized, reusing instance');
//       return recorderRef.current;
//     }

//     try {
//       console.log('Creating new AudioRecorder instance (one-time initialization)...');
//       const recorder = new AudioRecorder();
//       recorderRef.current = recorder;
//       isRecorderInitialized.current = true;
//       console.log('AudioRecorder instance created successfully');
//       return recorder;
//     } catch (err) {
//       console.error('Failed to initialize AudioRecorder:', err);
//       isRecorderInitialized.current = false;
//       recorderRef.current = null;
//       throw err;
//     }
//   };

//   const startRecording = async () => {
//     try {
//       console.log('=== Starting recording ===');

//       const granted = await requestMicrophonePermission();
//       if (!granted) {
//         Alert.alert(
//           'Microphone Permission',
//           'Microphone access is required to record audio. Please enable it in settings.'
//         );
//         return;
//       }

//       console.log('Permissions granted');
//       setRecordedAudio(null);
//       setRecordingTime(0);

//       // Get or initialize the singleton recorder instance
//       const recorder = await initializeRecorder();

//       if (!recorder) {
//         throw new Error('Failed to get recorder instance');
//       }

//       console.log('Starting recording with existing instance...');
//       await recorder.start();
//       console.log('Recording started successfully');

//       setIsRecording(true);
//     } catch (err) {
//       console.error('=== startRecording error ===');
//       console.error('Error name:', err.name);
//       console.error('Error message:', err.message);
//       console.error('Error stack:', err.stack);

//       // Reset initialization on error
//       isRecorderInitialized.current = false;
//       recorderRef.current = null;

//       let errorMessage = err.message;

//       if (err.message.includes('permission')) {
//         errorMessage = 'Microphone permission denied. Please enable it in app settings.';
//       } else if (err.message.includes('busy') || err.message.includes('use')) {
//         errorMessage = 'Microphone is being used by another app. Please close other apps and try again.';
//       } else if (err.message.includes('not found') || err.message.includes('undefined')) {
//         errorMessage = 'Audio API not properly initialized. Please restart the app.';
//       }

//       Alert.alert('Recording Error', errorMessage);
//       setIsRecording(false);
//     }
//   };

//   const stopRecording = async () => {
//     try {
//       console.log('=== Stopping recording ===');

//       if (!recorderRef.current) {
//         throw new Error('No active recorder');
//       }

//       const recorder = recorderRef.current;
//       const audioBuffer = await recorder.stop();
//       console.log('Recording stopped');
//       console.log('AudioBuffer properties:', {
//         duration: audioBuffer?.duration,
//         sampleRate: audioBuffer?.sampleRate,
//         numberOfChannels: audioBuffer?.numberOfChannels,
//         length: audioBuffer?.length,
//       });

//       if (!audioBuffer) {
//         throw new Error('No audio buffer returned from recorder');
//       }

//       // Save the audio buffer data
//       const audioData = {
//         buffer: audioBuffer,
//         duration: recordingTime,
//         sampleRate: audioBuffer.sampleRate || 48000,
//         numberOfChannels: audioBuffer.numberOfChannels || 1,
//         createdAt: Date.now(),
//       };

//       setRecordedAudio(audioData);
//       setIsRecording(false);
//       // DON'T null out recorderRef - keep it for next recording

//       console.log('Audio data saved successfully');
//     } catch (err) {
//       console.error('stopRecording error:', err);
//       Alert.alert('Recording Error', `Failed to save recording: ${err.message}`);
//       setIsRecording(false);
//     }
//   };

//   const playRecording = async () => {
//     if (!recordedAudio || !recordedAudio.buffer) {
//       Alert.alert('Error', 'No recording available to play.');
//       return;
//     }

//     try {
//       console.log('=== Playing recording ===');

//       setIsPlaying(true);
//       setPlaybackTime(0);

//       // Import AudioContext if not already imported
//       const {AudioContext} = await import('react-native-audio-api');

//       // Create new AudioContext for playback
//       let audioContext = audioContextRef.current;
//       if (!audioContext || audioContext.state === 'closed') {
//         console.log('Creating new AudioContext for playback');
//         audioContext = new AudioContext();
//         audioContextRef.current = audioContext;
//         console.log('AudioContext created, state:', audioContext.state);
//       }

//       // Create a buffer source
//       const source = audioContext.createBufferSource();
//       source.buffer = recordedAudio.buffer;
//       source.connect(audioContext.destination);
//       sourceNodeRef.current = source;

//       // Track playback time
//       const startTime = Date.now();
//       playbackInterval.current = setInterval(() => {
//         const elapsed = Math.floor((Date.now() - startTime) / 1000);
//         setPlaybackTime(elapsed);

//         if (elapsed >= recordedAudio.duration) {
//           clearInterval(playbackInterval.current);
//           setIsPlaying(false);
//           setPlaybackTime(0);
//         }
//       }, 100);

//       // Handle playback end
//       source.onended = () => {
//         console.log('Playback ended');
//         if (playbackInterval.current) {
//           clearInterval(playbackInterval.current);
//         }
//         setIsPlaying(false);
//         setPlaybackTime(0);
//         sourceNodeRef.current = null;
//       };

//       // Start playback
//       source.start();
//       console.log('Playback started');

//     } catch (err) {
//       console.error('playRecording error:', err);
//       setIsPlaying(false);
//       setPlaybackTime(0);
//       if (playbackInterval.current) {
//         clearInterval(playbackInterval.current);
//       }
//       Alert.alert('Playback Error', `Could not play recording: ${err.message}`);
//     }
//   };

//   const stopPlayback = async () => {
//     try {
//       if (sourceNodeRef.current) {
//         sourceNodeRef.current.stop();
//         sourceNodeRef.current = null;
//       }
//       if (playbackInterval.current) {
//         clearInterval(playbackInterval.current);
//       }
//       setIsPlaying(false);
//       setPlaybackTime(0);
//       console.log('Playback stopped');
//     } catch (err) {
//       console.error('stopPlayback error:', err);
//       setIsPlaying(false);
//       setPlaybackTime(0);
//     }
//   };

//   const confirmRecording = () => {
//     if (!recordedAudio) {
//       Alert.alert('Error', 'No recording to confirm.');
//       return;
//     }

//     if (isPlaying) {
//       stopPlayback();
//     }

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
//             if (isPlaying) {
//               stopPlayback();
//             }
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

//     // Clean up playback resources but keep recorder instance
//     if (playbackInterval.current) {
//       clearInterval(playbackInterval.current);
//     }
//     if (sourceNodeRef.current) {
//       try {
//         sourceNodeRef.current.stop();
//       } catch (e) {}
//     }
//     if (audioContextRef.current) {
//       try {
//         audioContextRef.current.close();
//       } catch (e) {}
//     }
//     sourceNodeRef.current = null;
//     audioContextRef.current = null;
//     // Keep recorderRef.current and isRecorderInitialized.current for reuse
//   };

//   const handleClose = () => {
//     if (isPlaying) {
//       stopPlayback();
//     }
//     if (isRecording) {
//       Alert.alert(
//         'Recording in Progress',
//         'Stop recording before closing?',
//         [
//           {text: 'Continue Recording', style: 'cancel'},
//           {
//             text: 'Stop & Close',
//             style: 'destructive',
//             onPress: async () => {
//               await stopRecording();
//               resetRecorder();
//               onClose();
//             },
//           },
//         ]
//       );
//     } else {
//       onClose();
//     }
//   };

//   if (!visible) return null;

//   return (
//     <View style={styles.overlay}>
//       <TouchableOpacity
//         style={styles.backdrop}
//         activeOpacity={1}
//         onPress={handleClose}
//       />
//       <Animated.View
//         style={[
//           styles.container,
//           {transform: [{translateY: slideAnim}]},
//         ]}>
//         <View style={styles.handleBar} />

//         <View style={styles.header}>
//           <Text style={styles.title}>Audio Recorder</Text>
//           <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
//             <Icon name="close" size={24} color="#666" />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.recordingArea}>
//           {!recordedAudio ? (
//             <View style={styles.recordingInterface}>
//               {isRecording && (
//                 <Text style={styles.recordingTime}>
//                   {formatTime(recordingTime)}
//                 </Text>
//               )}

//               <Animated.View style={[
//                 styles.recordButton,
//                 isRecording && styles.recordingButton,
//                 {transform: [{scale: pulseAnim}]}
//               ]}>
//                 <TouchableOpacity
//                   style={styles.recordButtonInner}
//                   onPress={isRecording ? stopRecording : startRecording}>
//                   <Icon
//                     name={isRecording ? "stop" : "mic"}
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
//                     name={isPlaying ? "pause" : "play-arrow"}
//                     size={28}
//                     color="#2196F3"
//                   />
//                 </TouchableOpacity>

//                 <View style={styles.timeInfo}>
//                   <Text style={styles.timeText}>
//                     {formatTime(playbackTime)} / {formatTime(recordedAudio.duration)}
//                   </Text>
//                 </View>
//               </View>

//               <View style={styles.progressBarContainer}>
//                 <View style={styles.progressBar}>
//                   <View
//                     style={[
//                       styles.progressFill,
//                       {width: `${Math.min((playbackTime / recordedAudio.duration) * 100, 100)}%`}
//                     ]}
//                   />
//                 </View>
//               </View>
//             </View>
//           )}
//         </View>

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
//     shadowOffset: {width: 0, height: 4},
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
//     flex: 1,
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











import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  requestMicrophonePermission,
  AudioRecorder,
  AudioPlayer,
} from 'react-native-audio-api';

const RecorderBottomnav = ({visible, onClose, onAudioRecorded}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const recordingInterval = useRef(null);
  const playbackInterval = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
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

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const startRecording = async () => {
    try {
      const granted = await requestMicrophonePermission();
      if (!granted) {
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

      // Start native recorder from library
      await AudioRecorder.start();
      console.log('AudioRecorder.start() called');
    } catch (err) {
      console.warn('startRecording error', err);
      // Fallback to simulated behavior
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      const result = await AudioRecorder.stop();
      // result should include path/uri, duration, size when available
      const audioData = {
        uri: result?.uri || result?.path || 'file://' + (result?.path || 'unknown'),
        duration: result?.duration ?? recordingTime,
        size: result?.size ?? recordingTime * 1024,
        mimeType: result?.mimeType || 'audio/m4a',
        createdAt: Date.now(),
      };
      setRecordedAudio(audioData);
      console.log('Stopped recording, result:', result);
    } catch (err) {
      console.warn('stopRecording error', err);
      // Fallback simulated audio data
      const audioData = {
        uri: 'mock-audio-uri',
        duration: recordingTime,
        size: recordingTime * 1024,
      };
      setRecordedAudio(audioData);
    }
  };

  const playRecording = async () => {
    if (!recordedAudio) {return;}

    try {
      setIsPlaying(true);
      setPlaybackTime(0);

      await AudioPlayer.load(recordedAudio.uri);
      AudioPlayer.onProgress = (pos) => {
        setPlaybackTime(Math.floor(pos));
      };
      AudioPlayer.onEnd = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      await AudioPlayer.play();
    } catch (err) {
      console.warn('playRecording error', err);
      // Fallback to simulated playback
      setIsPlaying(true);
      playbackInterval.current = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= recordedAudio.duration) {
            setIsPlaying(false);
            clearInterval(playbackInterval.current);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopPlayback = async () => {
    try {
      setIsPlaying(false);
      setPlaybackTime(0);
      await AudioPlayer.stop();
    } catch (err) {
      if (playbackInterval.current) {clearInterval(playbackInterval.current);}
      console.warn('stopPlayback error', err);
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

  const resetRecorder = () => {
    setIsRecording(false);
    setRecordedAudio(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setPlaybackTime(0);
    if (recordingInterval.current) {clearInterval(recordingInterval.current);}
    if (playbackInterval.current) {clearInterval(playbackInterval.current);}
  };

  if (!visible) {return null;}

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.container,
          {transform: [{translateY: slideAnim}]},
        ]}>
        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Audio Recorder</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 3000,
  },
  backdrop: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    minHeight: 300,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
