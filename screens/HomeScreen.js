import {StyleSheet, Text, View, ScrollView} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import sseService from '../../services/SSEprogressbar';
import ProgressBar from './components/ProgressBar';
import SearchBar from './components/SearchBar';
import ProfileImage from './components/Profilepicture';
import Categourylist from './components/CategouryList';
import Feed from './components/Feed';
import Banner from './components/Banner';

const HomeScreen = () => {
  const [progressState, setProgressState] = useState({
    progress: 0,
    message: '',
    indeterminate: false,
    visible: false,
  });

  const handleOpen = useCallback(() => {
    console.log('🟢 [HomeScreen] SSE Connection opened');
    setProgressState({
      progress: 0,
      message: 'Connecting...',
      indeterminate: true,
      visible: true,
    });
  }, []);

  const handleProgress = useCallback(data => {
    console.log('📊 [HomeScreen] Progress received:', data);

    if (!data || typeof data.progress !== 'number') {
      console.warn('⚠️ [HomeScreen] Invalid progress data:', data);
      return;
    }

    setProgressState({
      progress: data.progress,
      message: data.message || '',
      indeterminate: false,
      visible: true,
    });

    if (data.progress >= 100) {
      console.log('✅ [HomeScreen] Upload complete!');
      // Show 100% for 2 seconds before hiding
      setTimeout(() => {
        setProgressState(prev => ({...prev, visible: false}));
      }, 2000);
    }
  }, []);

  const handleError = useCallback(error => {
    console.error('❌ [HomeScreen] SSE Error:', error);
    // Hide progress bar on error
    setProgressState({
      progress: 0,
      message: error.error || 'Connection error',
      indeterminate: false,
      visible: false,
    });
  }, []);

  const handleClose = useCallback(() => {
    console.log('🔴 [HomeScreen] SSE Connection closed');
    const latest = sseService.getLatestProgress?.();

    if (latest && latest.progress >= 100) {
      // Show completed state briefly
      setProgressState({
        progress: 100,
        message: latest.message || 'Completed',
        indeterminate: false,
        visible: true,
      });

      // Hide after 1.5 seconds
      setTimeout(() => {
        setProgressState(prev => ({...prev, visible: false}));
      }, 1500);
    } else {
      // Connection closed before completion
      setProgressState(prev => ({...prev, visible: false}));
    }
  }, []);

  useEffect(() => {
    console.log('🏠 [HomeScreen] Mounted, subscribing to SSE events');

    // Subscribe to SSE events
    sseService.addEventListener('open', handleOpen);
    sseService.addEventListener('progress', handleProgress);
    sseService.addEventListener('error', handleError);
    sseService.addEventListener('close', handleClose);

    // Check if there's already a connection with progress
    if (sseService.isActive()) {
      console.log(
        '🔄 [HomeScreen] SSE already active, checking for cached progress',
      );
      const latest = sseService.getLatestProgress();
      if (latest && latest.progress > 0) {
        handleProgress(latest);
      }
    }

    return () => {
      console.log('🏠 [HomeScreen] Unmounting, unsubscribing from SSE events');
      sseService.removeEventListener('open', handleOpen);
      sseService.removeEventListener('progress', handleProgress);
      sseService.removeEventListener('error', handleError);
      sseService.removeEventListener('close', handleClose);
    };
  }, [handleOpen, handleProgress, handleError, handleClose]);

  // Show progress bar if visible and progress is between 0-100
  const showProgress =
    progressState.visible &&
    (progressState.indeterminate || progressState.progress >= 0) &&
    progressState.progress <= 100;

  return (
    <View style={styles.container}>
      {/* Progress bar at the top */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progressState.progress}
            message={progressState.message}
            visible={true}
            variant="minimal"
            showPercentage={true}
            showMessage={true}
            indeterminate={progressState.indeterminate}
          />
        </View>
      )}

      {/* Main content */}
      <ScrollView style={styles.content}>
        <Text style={styles.headerText}>Home Screen</Text>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
// import { StyleSheet, View } from 'react-native'
// import React from 'react'
// import CategouryList from './components/CategouryList'
// import Feed from './components/Feed'

// const HomeScreen = () => {
//   return (
//     <View style={styles.container}>
//       <View style={styles.categoryContainer}>
//         <CategouryList/>
//       </View>
//       <View style={styles.feedContainer}>
//         <Feed/>
//       </View>
//     </View>
//   )
// }

// export default HomeScreen

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff'
//   },
//   categoryContainer: {
//     zIndex: 1
//   },
//   feedContainer: {
//     flex: 1
//   }
// })
