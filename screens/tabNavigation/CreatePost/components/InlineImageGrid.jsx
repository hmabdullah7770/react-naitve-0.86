import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import ThumbnailBottomnav from './ThumbnailBottomnav';
import LayoutOptionStyles from './LayoutOptionStyles';

const InlineImageGrid = React.memo(
  ({onClose, onMediaChange, onVideoSettingsOpen, onDataChange}) => {
    const [selectedMedia, setSelectedMedia] = useState([]);
    const [selectedLayout, setSelectedLayout] = useState('1');
    const [layoutLocked, setLayoutLocked] = useState(false);
    const [showLayoutReset, setShowLayoutReset] = useState(false);
    const [videoSettings, setVideoSettings] = useState({
      autoPlay: true,
      thumbnails: {}, // Map of video index to thumbnail data
    });
    const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
    const [showVideoSettings, setShowVideoSettings] = useState(false);
    const [videoSettingsAutoOpened, setVideoSettingsAutoOpened] =
      useState(false);

    // Layout constraint configuration system
    const layoutConstraints = {
      1: {minItems: 1, maxItems: 1, description: 'Single item only'},
      2: {minItems: 1, maxItems: 2, description: '2 items'},
      '2x2': {minItems: 4, maxItems: 4, description: 'Exactly 4 items'},
      '1x2': {minItems: 3, maxItems: 3, description: 'Exactly 3 items'},
      '1x3': {minItems: 4, maxItems: 4, description: 'Exactly 4 items'},
      carousel: {minItems: 2, maxItems: 10, description: '2+ items'},
    };

    // Layout options with validation requirements
    const layoutOptions = [
      {
        id: '1',
        label: '1',
        cols: 1,
        ...layoutConstraints['1'],
      },
      {
        id: '2',
        label: '2',
        cols: 2,
        ...layoutConstraints['2'],
      },
      {
        id: '2x2',
        label: '2x2',
        cols: 2,
        ...layoutConstraints['2x2'],
      },
      {
        id: '1x2',
        label: '1x2',
        cols: 2,
        ...layoutConstraints['1x2'],
      },
      {
        id: '1x3',
        label: '1x3',
        cols: 3,
        ...layoutConstraints['1x3'],
      },
      {
        id: 'carousel',
        label: 'Carousel',
        cols: 'carousel',
        ...layoutConstraints.carousel,
      },
    ];

    // Helper functions for layout constraints
    const validateLayoutConstraints = (layoutId, mediaCount) => {
      const constraints = layoutConstraints[layoutId];
      if (!constraints) {return {isValid: false, message: 'Invalid layout'};}

      const isValid =
        mediaCount >= constraints.minItems &&
        mediaCount <= constraints.maxItems;
      let message = '';

      if (mediaCount < constraints.minItems) {
        message = `${layoutId} layout requires at least ${constraints.minItems} items`;
      } else if (mediaCount > constraints.maxItems) {
        message = `${layoutId} layout accepts maximum ${constraints.maxItems} items`;
      }

      return {isValid, message};
    };

    const checkUploadEligibility = (layoutId, currentMediaCount) => {
      const constraints = layoutConstraints[layoutId];
      if (!constraints) {return {canUpload: false, remainingSlots: 0};}

      const canUpload = currentMediaCount < constraints.maxItems;
      const remainingSlots = constraints.maxItems - currentMediaCount;

      return {canUpload, remainingSlots};
    };

    // Layout validation is now prevented by constraint enforcement
    // No need for reactive validation since layout switching is blocked

    // Cleanup effect to prevent memory leaks
    useEffect(() => {
      return () => {
        // Cleanup when component unmounts
        if (selectedMedia.length > 0) {
          console.log('Cleaning up media resources');
          // Clear media references to help with garbage collection
          setSelectedMedia([]);
        }
      };
    }, []);

    // Notify parent component when media data changes
    useEffect(() => {
      if (onDataChange) {
        const mediaData = {
          selectedMedia,
          selectedLayout,
          videoSettings,
          pattern: selectedLayout,
        };
        onDataChange(mediaData);
      }
    }, [selectedMedia, selectedLayout, videoSettings, onDataChange]);

    const handleMediaUpload = () => {
      // Check upload eligibility based on layout constraints
      const eligibility = checkUploadEligibility(
        selectedLayout,
        selectedMedia.length,
      );

      if (!eligibility.canUpload) {
        const constraints = layoutConstraints[selectedLayout];
        Alert.alert(
          'Maximum Reached',
          `${selectedLayout} layout can only have ${constraints.maxItems} ${
            constraints.maxItems === 1 ? 'item' : 'items'
          }.`,
        );
        return;
      }

      // Configure image picker with remaining slots limit
      const maxSelection = Math.min(eligibility.remainingSlots, 5);
      const options = {
        mediaType: 'mixed',
        quality: 0.7, // Reduced quality to prevent memory issues
        maxWidth: 1920, // Limit image dimensions
        maxHeight: 1920,
        selectionLimit: maxSelection, // Limit based on layout constraints
        includeBase64: false, // Don't include base64 to save memory
        includeExtra: false, // Don't include extra metadata
      };

      try {
        launchImageLibrary(options, response => {
          // Enhanced error handling
          if (response.didCancel) {
            console.log('User cancelled image picker');
            return;
          }

          if (response.error) {
            console.error('ImagePicker Error: ', response.error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
            return;
          }

          if (response.errorMessage) {
            console.error('ImagePicker Error Message: ', response.errorMessage);
            Alert.alert('Error', response.errorMessage);
            return;
          }

          if (!response.assets || response.assets.length === 0) {
            console.log('No assets selected');
            return;
          }

          try {
            // Filter out invalid assets and add size validation
            const validAssets = response.assets.filter(asset => {
              // Check if asset has required properties
              if (!asset.uri || !asset.type) {
                console.warn('Invalid asset detected:', asset);
                return false;
              }

              // Check file size (limit to 50MB per file)
              const maxFileSize = 50 * 1024 * 1024; // 50MB
              if (asset.fileSize && asset.fileSize > maxFileSize) {
                Alert.alert(
                  'File Too Large',
                  `File ${
                    asset.fileName || 'selected'
                  } is too large. Please select files under 50MB.`,
                );
                return false;
              }

              return true;
            });

            if (validAssets.length === 0) {
              Alert.alert(
                'No Valid Files',
                'No valid media files were selected.',
              );
              return;
            }

            const newMedia = validAssets.map(asset => ({
              uri: asset.uri,
              type: asset.type,
              fileName: asset.fileName || 'Unknown',
              fileSize: asset.fileSize || 0,
              isVideo: asset.type?.includes('video') || false,
              width: asset.width || 0,
              height: asset.height || 0,
            }));

            // Check layout constraints for the new total
            const totalMedia = selectedMedia.length + newMedia.length;
            const currentLayout = layoutOptions.find(
              l => l.id === selectedLayout,
            );

            if (totalMedia > 10) {
              Alert.alert(
                'Too Many Files',
                'You can only select up to 10 media files total.',
              );
              return;
            }

            // Check if adding these items would exceed layout maximum
            if (
              currentLayout?.maxItems &&
              totalMedia > currentLayout.maxItems
            ) {
              const allowedCount =
                currentLayout.maxItems - selectedMedia.length;
              if (allowedCount <= 0) {
                Alert.alert(
                  'Layout Limit Reached',
                  `${currentLayout.label} layout can only have ${
                    currentLayout.maxItems
                  } ${currentLayout.maxItems === 1 ? 'item' : 'items'}.`,
                );
                return;
              } else {
                Alert.alert(
                  'Too Many Items',
                  `${
                    currentLayout.label
                  } layout can only accept ${allowedCount} more ${
                    allowedCount === 1 ? 'item' : 'items'
                  }.`,
                );
                return;
              }
            }

            const updatedMedia = [...selectedMedia, ...newMedia];
            setSelectedMedia(updatedMedia);

            // Lock layout once media is uploaded
            if (updatedMedia.length > 0) {
              setLayoutLocked(true);
            }

            // Notify parent component about media changes
            if (onMediaChange) {
              onMediaChange(updatedMedia.length);
            }

            // Auto-show video settings if any video is uploaded and hasn't been auto-opened before
            const hasVideo = newMedia.some(media => media.isVideo);
            if (hasVideo && !videoSettingsAutoOpened) {
              setShowVideoSettings(true);
              setVideoSettingsAutoOpened(true);
            }

            console.log('Successfully added media:', newMedia.length, 'files');
          } catch (processingError) {
            console.error('Error processing selected media:', processingError);
            Alert.alert(
              'Processing Error',
              'Failed to process selected media. Please try again.',
            );
          }
        });
      } catch (launchError) {
        console.error('Error launching image picker:', launchError);
        Alert.alert(
          'Launch Error',
          'Failed to open media picker. Please try again.',
        );
      }
    };

    const handleRemoveMedia = index => {
      try {
        const updatedMedia = selectedMedia.filter((_, i) => i !== index);
        setSelectedMedia(updatedMedia);

        // Unlock layout if no media remaining
        if (updatedMedia.length === 0) {
          setLayoutLocked(false);
          setShowLayoutReset(false);
        }

        // Notify parent component about media changes
        if (onMediaChange) {
          onMediaChange(updatedMedia.length);
        }

        // Clean up thumbnails - shift indices for remaining videos
        setVideoSettings(prev => {
          const newThumbnails = {};

          // Rebuild thumbnails with correct indices
          updatedMedia.forEach((media, newIndex) => {
            if (media.isVideo) {
              // Find the original index of this video
              const originalIndex = selectedMedia.findIndex(
                m => m.uri === media.uri,
              );
              if (originalIndex !== -1 && prev.thumbnails[originalIndex]) {
                newThumbnails[newIndex] = prev.thumbnails[originalIndex];
              }
            }
          });

          return {
            ...prev,
            thumbnails: newThumbnails,
          };
        });

        // Hide video settings if no videos remaining or if current video was removed
        const hasVideo = updatedMedia.some(media => media.isVideo);
        if (!hasVideo) {
          setShowVideoSettings(false);
          setVideoSettingsAutoOpened(false);
          setCurrentVideoIndex(null);
        } else if (currentVideoIndex === index) {
          // If the current video was removed, close settings
          setShowVideoSettings(false);
          setCurrentVideoIndex(null);
        } else if (currentVideoIndex !== null && currentVideoIndex > index) {
          // Adjust current video index if it was after the removed video
          setCurrentVideoIndex(currentVideoIndex - 1);
        }

        console.log(
          'Media removed successfully, remaining:',
          updatedMedia.length,
        );
      } catch (error) {
        console.error('Error removing media:', error);
        Alert.alert('Error', 'Failed to remove media. Please try again.');
      }
    };

    const handleRemoveAllMedia = () => {
      Alert.alert(
        'Remove All Media',
        'Are you sure you want to remove all uploaded media?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove All',
            style: 'destructive',
            onPress: () => {
              setSelectedMedia([]);
              setLayoutLocked(false); // Unlock layout when all media is removed
              setShowLayoutReset(false);
              setShowVideoSettings(false);
              setVideoSettingsAutoOpened(false);
              setVideoSettings({
                autoPlay: true,
                thumbnails: {},
              });
              setCurrentVideoIndex(null);
              // Notify parent component about media changes
              if (onMediaChange) {
                onMediaChange(0);
              }
              // Reset to default layout when all media is removed
              setSelectedLayout('1');
            },
          },
        ],
      );
    };

    const handleThumbnailUpload = (videoIndex = currentVideoIndex) => {
      if (videoIndex === null || videoIndex === undefined) {
        Alert.alert('Error', 'No video selected for thumbnail upload.');
        return;
      }

      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        includeBase64: false,
      };

      try {
        launchImageLibrary(options, response => {
          if (response.didCancel) {
            console.log('User cancelled thumbnail picker');
            return;
          }

          if (response.error) {
            console.error('Thumbnail picker error:', response.error);
            Alert.alert(
              'Error',
              'Failed to select thumbnail. Please try again.',
            );
            return;
          }

          if (!response.assets || response.assets.length === 0) {
            Alert.alert('Error', 'No thumbnail selected.');
            return;
          }

          const thumbnail = response.assets[0];

          // Validate file size (max 10MB for thumbnails)
          const maxFileSize = 10 * 1024 * 1024; // 10MB
          if (thumbnail.fileSize && thumbnail.fileSize > maxFileSize) {
            Alert.alert('File Too Large', 'Thumbnail must be under 10MB.');
            return;
          }

          // Update thumbnail for specific video
          setVideoSettings(prev => ({
            ...prev,
            thumbnails: {
              ...prev.thumbnails,
              [videoIndex]: thumbnail,
            },
          }));

          console.log(
            `Thumbnail uploaded for video ${videoIndex}:`,
            thumbnail.fileName,
          );
        });
      } catch (error) {
        console.error('Error launching thumbnail picker:', error);
        Alert.alert('Error', 'Failed to open thumbnail picker.');
      }
    };

    const handleVideoClick = videoIndex => {
      setCurrentVideoIndex(videoIndex);
      setShowVideoSettings(true);
      // Pass video settings data to parent
      if (onVideoSettingsOpen) {
        onVideoSettingsOpen({
          videoIndex,
          videoSettings,
          setVideoSettings,
          currentVideoIndex: videoIndex,
          setCurrentVideoIndex,
          setShowVideoSettings,
        });
      }
    };

    const handleLayoutChangeRequest = () => {
      Alert.alert(
        'Change Layout',
        'Changing layout will remove all uploaded media. Are you sure you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Change Layout',
            style: 'destructive',
            onPress: () => {
              setSelectedMedia([]);
              setLayoutLocked(false);
              setShowLayoutReset(false);
              setShowVideoSettings(false);
              setVideoSettingsAutoOpened(false);
              setVideoSettings({
                autoPlay: true,
                thumbnails: {},
              });
              setCurrentVideoIndex(null);
              // Notify parent component about media changes
              if (onMediaChange) {
                onMediaChange(0);
              }
            },
          },
        ],
      );
    };

    // VideoThumbnailOverlay component for custom thumbnail display
    const VideoThumbnailOverlay = ({videoIndex, thumbnail, onPress}) => {
      if (thumbnail) {
        return (
          <TouchableOpacity
            style={styles.customThumbnailOverlay}
            onPress={() => onPress(videoIndex)}>
            <Image
              source={{uri: thumbnail.uri}}
              style={styles.thumbnailImage}
            />
            <View style={styles.playIconOverlay}>
              <Icon
                name="play-circle-filled"
                size={24}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          style={styles.videoOverlay}
          onPress={() => onPress(videoIndex)}>
          <Icon
            name="play-circle-filled"
            size={30}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={styles.thumbnailHint}>Click to add thumbnail</Text>
        </TouchableOpacity>
      );
    };

    // Layout constraint utility functions
    const calculateUIState = (selectedLayout, mediaCount, layoutOptions) => {
      const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
      if (!currentLayout) {
        return {
          showAddMore: false,
          showRemoveAll: false,
          removeButtonLabel: 'Remove',
          isMaxReached: false,
          statusMessage: '',
          canUploadMore: false,
        };
      }

      const isMaxReached =
        currentLayout.maxItems && mediaCount >= currentLayout.maxItems;
      const canUploadMore = !isMaxReached && mediaCount < 10; // Global limit
      const showAddMore = canUploadMore && mediaCount > 0;
      const showRemoveAll = mediaCount > 1; // Only show "Remove All" for multiple items
      const removeButtonLabel = mediaCount > 1 ? 'Remove All' : 'Remove';

      let statusMessage = '';
      if (isMaxReached) {
        statusMessage = `Maximum ${currentLayout.maxItems} ${
          currentLayout.maxItems === 1 ? 'item' : 'items'
        } reached`;
      }

      return {
        showAddMore,
        showRemoveAll,
        removeButtonLabel,
        isMaxReached,
        statusMessage,
        canUploadMore,
      };
    };

    const checkLayoutConstraints = (layout, currentMediaCount) => {
      if (!layout) {
        return {
          isValid: false,
          canAddMore: false,
          isAtMaximum: false,
          validationMessage: 'Invalid layout',
        };
      }

      const isValid =
        currentMediaCount >= layout.minItems &&
        (!layout.maxItems || currentMediaCount <= layout.maxItems);
      const canAddMore =
        !layout.maxItems || currentMediaCount < layout.maxItems;
      const isAtMaximum =
        layout.maxItems && currentMediaCount >= layout.maxItems;

      let validationMessage = '';
      if (currentMediaCount < layout.minItems) {
        validationMessage = `${layout.label} layout requires at least ${layout.minItems} items`;
      } else if (layout.maxItems && currentMediaCount > layout.maxItems) {
        validationMessage = `${layout.label} layout accepts maximum ${layout.maxItems} items`;
      }

      return {
        isValid,
        canAddMore,
        isAtMaximum,
        validationMessage,
      };
    };

    // Create items for ThumbnailBottomnav (Video Settings Only)
    const getVideoSettingsItems = () => {
      const currentThumbnail =
        currentVideoIndex !== null
          ? videoSettings.thumbnails[currentVideoIndex]
          : null;

      const items = [
        {
          type: 'button',
          icon: 'photo',
          iconColor: '#2196F3',
          title: currentThumbnail ? 'Change Thumbnail' : 'Upload Thumbnail',
          textColor: '#2196F3',
          showArrow: false,
          onPress: () => handleThumbnailUpload(currentVideoIndex),
        },
        {
          type: 'divider',
        },
        {
          type: 'switch',
          icon: 'play-circle-filled',
          iconColor: '#4CAF50',
          title: 'Auto Play',
          description: 'Videos will play automatically',
          value: videoSettings.autoPlay,
          component: Switch,
          onToggle: value =>
            setVideoSettings(prev => ({...prev, autoPlay: value})),
        },
      ];

      if (currentThumbnail) {
        items.push({
          type: 'divider',
        });
        items.push({
          type: 'info',
          icon: 'check-circle',
          iconColor: '#4CAF50',
          title: 'Custom Thumbnail Active',
          description: `File: ${
            currentThumbnail.fileName || 'Custom thumbnail'
          }`,
        });
        items.push({
          type: 'button',
          icon: 'delete',
          iconColor: '#ff4757',
          title: 'Remove Thumbnail',
          textColor: '#ff4757',
          showArrow: false,
          onPress: () => {
            setVideoSettings(prev => {
              const newThumbnails = {...prev.thumbnails};
              delete newThumbnails[currentVideoIndex];
              return {
                ...prev,
                thumbnails: newThumbnails,
              };
            });
          },
        });
      }

      return items;
    };

    // Layout-specific renderers
    const renderSingleColumn = () => {
      const items = [];
      const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
      const uiState = calculateUIState(
        selectedLayout,
        selectedMedia.length,
        layoutOptions,
      );

      // Show uploaded media first
      selectedMedia.forEach((media, index) => {
        items.push(
          <View
            key={index}
            style={[
              styles.mediaItem,
              {width: '100%', aspectRatio: 1, marginBottom: 8},
            ]}>
            <Image
              source={{uri: media.uri}}
              style={styles.mediaImage}
              onError={error => {
                console.error('Image load error:', error);
                // Optionally remove the problematic media
                handleRemoveMedia(index);
              }}
              resizeMode="cover"
            />
            {media.isVideo && (
              <VideoThumbnailOverlay
                videoIndex={index}
                thumbnail={videoSettings.thumbnails[index]}
                onPress={handleVideoClick}
              />
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMedia(index)}
              activeOpacity={0.7}>
              <Icon name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>,
        );
      });

      // Show upload slot only if we can add more based on layout constraints
      const eligibility = checkUploadEligibility(
        selectedLayout,
        selectedMedia.length,
      );
      if (selectedMedia.length === 0) {
        items.push(
          <TouchableOpacity
            key="first-upload"
            style={[
              styles.mediaItem,
              styles.placeholderItem,
              {width: '100%', aspectRatio: 1, marginBottom: 8},
            ]}
            onPress={handleMediaUpload}>
            <Icon name="add" size={30} color="#666" />
            <Text style={styles.placeholderText}>Add Photo/Video</Text>
          </TouchableOpacity>,
        );
      } else if (eligibility.canUpload) {
        // Only show "Add More" if layout constraints allow it
        items.push(
          <TouchableOpacity
            key="add-more"
            style={[
              styles.mediaItem,
              styles.placeholderItem,
              {width: '100%', aspectRatio: 1, marginBottom: 8},
            ]}
            onPress={handleMediaUpload}>
            <Icon name="add" size={30} color="#666" />
            <Text style={styles.placeholderText}>Add More</Text>
          </TouchableOpacity>,
        );
      }

      return items;
    };

    const renderTwoColumn = () => {
      const items = [];
      const constraints = layoutConstraints[selectedLayout];
      const eligibility = checkUploadEligibility(
        selectedLayout,
        selectedMedia.length,
      );

      // Show slots based on layout constraints
      const minSlots = Math.max(
        2,
        selectedMedia.length + (eligibility.canUpload ? 1 : 0),
      );

      for (let i = 0; i < minSlots; i++) {
        const media = selectedMedia[i];

        if (media) {
          // Show uploaded media
          items.push(
            <View
              key={i}
              style={[
                styles.mediaItem,
                {
                  width: '48%',
                  height: 120,
                  marginBottom: 8,
                  marginRight: (i + 1) % 2 !== 0 ? '4%' : 0,
                },
              ]}>
              <Image
                source={{uri: media.uri}}
                style={styles.mediaImage}
                onError={error => {
                  console.error('Image load error in two-column:', error);
                  handleRemoveMedia(i);
                }}
                resizeMode="cover"
              />
              {media.isVideo && (
                <VideoThumbnailOverlay
                  videoIndex={i}
                  thumbnail={videoSettings.thumbnails[i]}
                  onPress={handleVideoClick}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMedia(i)}
                activeOpacity={0.7}>
                <Icon name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>,
          );
        } else {
          // Show upload placeholder
          items.push(
            <TouchableOpacity
              key={`placeholder-${i}`}
              style={[
                styles.mediaItem,
                styles.placeholderItem,
                {
                  width: '48%',
                  height: 120,
                  marginBottom: 8,
                  marginRight: (i + 1) % 2 !== 0 ? '4%' : 0,
                },
              ]}
              onPress={handleMediaUpload}>
              <Icon name="add" size={30} color="#666" />
              <Text style={styles.placeholderText}>
                {selectedMedia.length === 0 ? 'Add Photo/Video' : 'Add More'}
              </Text>
            </TouchableOpacity>,
          );
        }
      }

      return items;
    };

    const renderGrid = () => {
      const gridItems = [];
      // Always show 4 slots for 2x2 grid
      for (let i = 0; i < 4; i++) {
        const media = selectedMedia[i];
        if (media) {
          gridItems.push(
            <View
              key={i}
              style={[
                styles.mediaItem,
                {
                  width: '48%',
                  height: 140,
                  marginBottom: i < 2 ? 8 : 0,
                  marginRight: (i + 1) % 2 !== 0 ? '4%' : 0,
                },
              ]}>
              <Image source={{uri: media.uri}} style={styles.mediaImage} />
              {media.isVideo && (
                <VideoThumbnailOverlay
                  videoIndex={i}
                  thumbnail={videoSettings.thumbnails[i]}
                  onPress={handleVideoClick}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMedia(i)}
                activeOpacity={0.7}>
                <Icon name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>,
          );
        } else {
          // Show placeholder for missing images
          gridItems.push(
            <TouchableOpacity
              key={`placeholder-${i}`}
              style={[
                styles.mediaItem,
                styles.placeholderItem,
                {
                  width: '48%',
                  height: 140,
                  marginBottom: i < 2 ? 8 : 0,
                  marginRight: (i + 1) % 2 !== 0 ? '4%' : 0,
                },
              ]}
              onPress={handleMediaUpload}>
              <Icon name="add" size={30} color="#666" />
              <Text style={styles.placeholderText}>Add Photo/Video</Text>
            </TouchableOpacity>,
          );
        }
      }
      return gridItems;
    };

    const renderAsymmetric = layoutType => {
      const mainImage = selectedMedia[0];
      const sideImages = selectedMedia.slice(1);
      const maxSideImages = layoutType === '1x2' ? 2 : 3;
      const sideImageHeight = layoutType === '1x2' ? 94 : 62;

      return (
        <View style={styles.specialLayoutContainer}>
          {/* Main large image - always show slot */}
          {mainImage ? (
            <View style={[styles.mediaItem, styles.mainImageContainer]}>
              <Image source={{uri: mainImage.uri}} style={styles.mediaImage} />
              {mainImage.isVideo && (
                <VideoThumbnailOverlay
                  videoIndex={0}
                  thumbnail={videoSettings.thumbnails[0]}
                  onPress={handleVideoClick}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMedia(0)}
                activeOpacity={0.7}>
                <Icon name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.mediaItem,
                styles.mainImageContainer,
                styles.placeholderItem,
              ]}
              onPress={handleMediaUpload}>
              <Icon name="add" size={40} color="#666" />
              <Text style={styles.placeholderText}>Add Main Photo/Video</Text>
            </TouchableOpacity>
          )}

          {/* Side images column - always show all slots */}
          <View style={styles.sideImagesContainer}>
            {Array.from({length: maxSideImages}, (_, index) => {
              const media = sideImages[index];
              if (media) {
                return (
                  <View
                    key={index + 1}
                    style={[
                      styles.mediaItem,
                      {height: sideImageHeight, marginBottom: 4},
                    ]}>
                    <Image
                      source={{uri: media.uri}}
                      style={styles.mediaImage}
                    />
                    {media.isVideo && (
                      <VideoThumbnailOverlay
                        videoIndex={index + 1}
                        thumbnail={videoSettings.thumbnails[index + 1]}
                        onPress={handleVideoClick}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMedia(index + 1)}
                      activeOpacity={0.7}>
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity
                    key={`side-placeholder-${index}`}
                    style={[
                      styles.mediaItem,
                      styles.placeholderItem,
                      {height: sideImageHeight, marginBottom: 4},
                    ]}
                    onPress={handleMediaUpload}>
                    <Icon name="add" size={20} color="#666" />
                    <Text style={[styles.placeholderText, {fontSize: 10}]}>
                      Add Photo/Video
                    </Text>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>
      );
    };

    const renderCarousel = () => {
      const items = [];
      const constraints = layoutConstraints[selectedLayout];
      const eligibility = checkUploadEligibility(
        selectedLayout,
        selectedMedia.length,
      );

      // Always show at least 2 slots for carousel (minimum requirement)
      const minSlots = Math.max(
        2,
        selectedMedia.length + (eligibility.canUpload ? 1 : 0),
      );

      for (let i = 0; i < minSlots; i++) {
        const media = selectedMedia[i];

        if (media) {
          // Show uploaded media
          items.push(
            <View
              key={i}
              style={[
                styles.mediaItem,
                {width: 200, height: 150, marginRight: 8},
              ]}>
              <Image source={{uri: media.uri}} style={styles.mediaImage} />
              {media.isVideo && (
                <VideoThumbnailOverlay
                  videoIndex={i}
                  thumbnail={videoSettings.thumbnails[i]}
                  onPress={handleVideoClick}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMedia(i)}
                activeOpacity={0.7}>
                <Icon name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>,
          );
        } else {
          // Show upload placeholder
          items.push(
            <TouchableOpacity
              key={`placeholder-${i}`}
              style={[
                styles.mediaItem,
                styles.placeholderItem,
                {width: 200, height: 150, marginRight: 8},
              ]}
              onPress={handleMediaUpload}>
              <Icon name="add" size={30} color="#666" />
              <Text style={styles.placeholderText}>
                {selectedMedia.length === 0 ? 'Add Photo/Video' : 'Add More'}
              </Text>
            </TouchableOpacity>,
          );
        }
      }

      return items;
    };

    const renderMediaGrid = () => {
      // Always show the grid structure based on selected layout
      const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
      const hasVideos = selectedMedia.some(media => media.isVideo);

      // Show initial upload placeholder when no media exists
      if (selectedMedia.length === 0) {
        const constraints = layoutConstraints[selectedLayout];
        return (
          <TouchableOpacity
            style={styles.uploadPlaceholder}
            onPress={handleMediaUpload}>
            <Icon name="add" size={40} color="#666" />
            <Text style={styles.uploadText}>
              Upload{' '}
              {constraints.maxItems === 1
                ? '1 item'
                : `${constraints.minItems}${
                    constraints.maxItems === constraints.minItems ? '' : '+'
                  } items`}{' '}
              for {selectedLayout} layout
            </Text>
            <Text style={styles.uploadSubText}>{constraints.description}</Text>
          </TouchableOpacity>
        );
      }

      return (
        <View style={styles.mediaContainer}>
          {/* Media Grid Header - show when media exists */}
          {selectedMedia.length > 0 && (
            <View style={styles.mediaHeader}>
              <View style={styles.mediaCountContainer}>
                <Text style={styles.mediaCount}>
                  {selectedMedia.length} of{' '}
                  {layoutConstraints[selectedLayout].maxItems} items uploaded
                </Text>
                <Text style={styles.layoutIndicator}>
                  Layout: {selectedLayout} (
                  {layoutConstraints[selectedLayout].description})
                </Text>
                {(() => {
                  const constraints = layoutConstraints[selectedLayout];
                  const isComplete =
                    selectedMedia.length >= constraints.minItems;
                  const isMaxReached =
                    selectedMedia.length >= constraints.maxItems;

                  if (isMaxReached) {
                    return (
                      <Text style={styles.completionMessage}>
                        ✓ Layout complete
                      </Text>
                    );
                  } else if (!isComplete) {
                    const needed = constraints.minItems - selectedMedia.length;
                    return (
                      <Text style={styles.progressMessage}>
                        {needed} more {needed === 1 ? 'item' : 'items'} needed
                      </Text>
                    );
                  } else {
                    const remaining =
                      constraints.maxItems - selectedMedia.length;
                    return (
                      <Text style={styles.progressMessage}>
                        {remaining} more {remaining === 1 ? 'item' : 'items'}{' '}
                        can be added
                      </Text>
                    );
                  }
                })()}
              </View>
              {selectedMedia.length > 0 &&
                (() => {
                  const uiState = calculateUIState(
                    selectedLayout,
                    selectedMedia.length,
                    layoutOptions,
                  );
                  return uiState.showRemoveAll ? (
                    <TouchableOpacity
                      style={styles.removeAllButton}
                      onPress={handleRemoveAllMedia}>
                      <Icon name="delete-outline" size={20} color="#ff4757" />
                      <Text style={styles.removeAllText}>
                        {uiState.removeButtonLabel}
                      </Text>
                    </TouchableOpacity>
                  ) : null;
                })()}
            </View>
          )}

          {/* Dynamic Layout Rendering - Always show full grid structure */}
          <ScrollView
            horizontal={selectedLayout === 'carousel'}
            showsHorizontalScrollIndicator={false}
            style={
              selectedLayout === 'carousel' ? styles.carouselContainer : null
            }>
            <View
              style={[
                styles.mediaGrid,
                selectedLayout === '1'
                  ? {flexDirection: 'column'}
                  : selectedLayout === 'carousel'
                  ? {flexDirection: 'row'}
                  : {flexDirection: 'row', flexWrap: 'wrap'},
              ]}>
              {selectedLayout === '1' && renderSingleColumn()}
              {selectedLayout === '2' && renderTwoColumn()}
              {selectedLayout === '2x2' && renderGrid()}
              {selectedLayout === '1x2' && renderAsymmetric('1x2')}
              {selectedLayout === '1x3' && renderAsymmetric('1x3')}
              {selectedLayout === 'carousel' && renderCarousel()}
            </View>
          </ScrollView>

          {/* Validation errors are now prevented by constraint enforcement */}

          {/* Video Settings Hint - Only show when videos are present */}
          {hasVideos && (
            <TouchableOpacity
              style={styles.videoSettingsHint}
              onPress={handleVideoClick}>
              <Icon name="video-settings" size={20} color="#2196F3" />
              <Text style={styles.videoSettingsHintText}>
                Tap to customize video settings (thumbnail, autoplay)
              </Text>
              <Icon name="chevron-right" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>
      );
    };

    const renderLayoutOptions = () => {
      // Hide layout options when media exists and layout is locked
      if (layoutLocked && selectedMedia.length > 0) {
        return (
          <View style={styles.layoutSection}>
            <View style={styles.lockedLayoutHeader}>
              <View style={styles.lockedLayoutInfo}>
                <Text style={styles.sectionTitle}>
                  Layout: {selectedLayout}
                </Text>
                <Text style={styles.lockedLayoutDescription}>
                  {layoutConstraints[selectedLayout]?.description}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeLayoutButton}
                onPress={handleLayoutChangeRequest}>
                <Icon name="refresh" size={16} color="#2196F3" />
                <Text style={styles.changeLayoutText}>Change Layout</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // Show layout options when no media exists or layout is unlocked
      return (
        <View style={styles.layoutSection}>
          <Text style={styles.sectionTitle}>Layout Style</Text>
          <Text style={styles.sectionDescription}>
            Choose how your media will be displayed
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.layoutScrollView}>
            <View style={styles.layoutOptions}>
              {layoutOptions.map(option => {
                const isSelected = selectedLayout === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.layoutButton,
                      isSelected && styles.selectedLayout,
                    ]}
                    onPress={() => setSelectedLayout(option.id)}>
                    {/* Visual representation of layout */}
                    <View style={styles.layoutIconContainer}>
                      <LayoutOptionStyles
                        layoutId={option.id}
                        size={36}
                        isSelected={isSelected}
                      />
                    </View>

                    <Text
                      style={[
                        styles.layoutText,
                        isSelected && styles.selectedLayoutText,
                      ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.layoutHint}>{option.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      );
    };

    // Method to get current media data for external access
    const getMediaData = () => {
      return {
        selectedMedia,
        selectedLayout,
        videoSettings,
        pattern: selectedLayout,
        hasMedia: selectedMedia.length > 0,
        mediaCount: selectedMedia.length,
      };
    };

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Media</Text>
          <View style={styles.headerActions}>
            {selectedMedia.length > 0 && (
              <View style={styles.completionStatus}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
                <Text style={[styles.statusText, {color: '#4CAF50'}]}>
                  Ready
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Grid */}
        <View style={styles.gridContainer}>{renderMediaGrid()}</View>

        {/* Layout Options - Always show (either selection or locked state) */}
        {renderLayoutOptions()}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  gridContainer: {
    padding: 16,
  },
  uploadPlaceholder: {
    minHeight: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    paddingVertical: 20,
  },
  uploadText: {
    marginTop: 8,
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadSubText: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  mediaContainer: {
    minHeight: 200,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  mediaCountContainer: {
    flexDirection: 'column',
  },
  mediaCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  layoutIndicator: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 2,
  },
  statusMessage: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
  },
  removeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  removeAllText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mediaGrid: {
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  carouselContainer: {
    marginBottom: 16,
  },
  mediaItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -12}, {translateY: -12}],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  thumbnailHint: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    borderRadius: 15,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  addMoreButton: {
    width: '48%',
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  carouselAddMore: {
    width: '100%',
    marginTop: 12,
    marginHorizontal: 16,
  },
  // Special layout styles for 1x2 and 1x3
  specialLayoutContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  mainImageContainer: {
    width: '65%',
    height: 200,
    marginRight: 8,
  },
  sideImagesContainer: {
    width: '33%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sideImageItem1x2: {
    height: 94, // For 1x2 layout (2 side images)
    marginBottom: 4,
  },
  sideImageItem1x3: {
    height: 62, // For 1x3 layout (3 side images)
    marginBottom: 4,
  },
  specialLayoutAddMore: {
    width: '100%',
    height: 60,
    marginTop: 8,
  },
  addMoreText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4757',
  },
  validationErrorText: {
    color: '#ff4757',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  videoSettingsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  videoSettingsHintText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
  },
  layoutSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  layoutScrollView: {
    marginHorizontal: -4,
  },
  layoutOptions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  layoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedLayout: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
    shadowColor: '#2196F3',
    shadowOpacity: 0.2,
  },
  disabledLayout: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    opacity: 0.6,
  },
  layoutIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedLayoutText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  disabledLayoutText: {
    color: '#999',
  },
  layoutRequirement: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  layoutHint: {
    fontSize: 9,
    color: '#2196F3',
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  layoutPreview: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderItem: {
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  lockedLayoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedLayoutInfo: {
    flex: 1,
  },
  lockedLayoutDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  changeLayoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  changeLayoutText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressMessage: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
  },
  completionMessage: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default InlineImageGrid;

// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Alert,
//   Switch,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {launchImageLibrary} from 'react-native-image-picker';
// import BottomNav from './bottomnav';

// const InlineImageGrid = ({onClose}) => {
//   const [selectedMedia, setSelectedMedia] = useState([]);
//   const [selectedLayout, setSelectedLayout] = useState('1'); // Default layout
//   const [videoSettings, setVideoSettings] = useState({
//     autoPlay: true,
//     thumbnail: null,
//   });
//   const [showVideoSettings, setShowVideoSettings] = useState(false);
//   const [videoSettingsAutoOpened, setVideoSettingsAutoOpened] = useState(false);
//   const [layoutValidationError, setLayoutValidationError] = useState('');

//   // Layout options with validation requirements
//   const layoutOptions = [
//     {id: '1', label: '1', cols: 1, minItems: 1, maxItems: null},
//     {id: '2', label: '2', cols: 2, minItems: 1, maxItems: null},
//     {id: '2x2', label: '2x2', cols: 2, minItems: 4, maxItems: 4},
//     {id: '1x2', label: '1x2', cols: 2, minItems: 3, maxItems: 3},
//     {id: '1x3', label: '1x3', cols: 3, minItems: 4, maxItems: 4},
//     {id: 'carousel', label: 'Carousel', cols: 'carousel', minItems: 2, maxItems: null},
//   ];

//   // Validate layout based on uploaded media count
//   useEffect(() => {
//     const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
//     if (currentLayout && selectedMedia.length > 0) {
//       if (selectedMedia.length < currentLayout.minItems) {
//         setLayoutValidationError(`${currentLayout.label} layout requires at least ${currentLayout.minItems} items`);
//       } else if (currentLayout.maxItems && selectedMedia.length > currentLayout.maxItems) {
//         setLayoutValidationError(`${currentLayout.label} layout accepts maximum ${currentLayout.maxItems} items`);
//       } else {
//         setLayoutValidationError('');
//       }
//     }
//   }, [selectedMedia, selectedLayout]);

//   const handleMediaUpload = () => {
//     const options = {
//       mediaType: 'mixed',
//       quality: 0.8,
//       selectionLimit: 10,
//     };

//     launchImageLibrary(options, response => {
//       if (response.didCancel || response.error) return;

//       const newMedia = response.assets.map(asset => ({
//         uri: asset.uri,
//         type: asset.type,
//         fileName: asset.fileName,
//         fileSize: asset.fileSize,
//         isVideo: asset.type?.includes('video'),
//       }));

//       setSelectedMedia(prev => [...prev, ...newMedia]);

//       // Auto-show video settings if any video is uploaded and hasn't been auto-opened before
//       const hasVideo = newMedia.some(media => media.isVideo);
//       if (hasVideo && !videoSettingsAutoOpened) {
//         setShowVideoSettings(true);
//         setVideoSettingsAutoOpened(true);
//       }
//     });
//   };

//   const handleRemoveMedia = index => {
//     const updatedMedia = selectedMedia.filter((_, i) => i !== index);
//     setSelectedMedia(updatedMedia);

//     // Hide video settings if no videos remaining
//     const hasVideo = updatedMedia.some(media => media.isVideo);
//     if (!hasVideo) {
//       setShowVideoSettings(false);
//       setVideoSettingsAutoOpened(false);
//       // Reset video settings when no videos
//       setVideoSettings({
//         autoPlay: true,
//         thumbnail: null,
//       });
//     }
//   };

//   const handleRemoveAllMedia = () => {
//     Alert.alert(
//       'Remove All Media',
//       'Are you sure you want to remove all uploaded media?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Remove All',
//           style: 'destructive',
//           onPress: () => {
//             setSelectedMedia([]);
//             setShowVideoSettings(false);
//             setVideoSettingsAutoOpened(false);
//             setVideoSettings({
//               autoPlay: true,
//               thumbnail: null,
//             });
//             // Reset to default layout when all media is removed
//             setSelectedLayout('1');
//             setLayoutValidationError('');
//           },
//         },
//       ]
//     );
//   };

//   const handleThumbnailUpload = () => {
//     const options = {
//       mediaType: 'photo',
//       quality: 0.8,
//     };

//     launchImageLibrary(options, response => {
//       if (response.didCancel || response.error) return;

//       setVideoSettings(prev => ({
//         ...prev,
//         thumbnail: response.assets[0],
//       }));
//     });
//   };

//   const handleVideoClick = () => {
//     setShowVideoSettings(true);
//   };

//   // Create items for ThumbnailBottomnav (Video Settings Only)
//   const getVideoSettingsItems = () => {
//     const items = [
//       {
//         type: 'button',
//         icon: 'photo',
//         iconColor: '#2196F3',
//         title: videoSettings.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail',
//         textColor: '#2196F3',
//         showArrow: false,
//         onPress: handleThumbnailUpload
//       },
//       {
//         type: 'divider'
//       },
//       {
//         type: 'switch',
//         icon: 'play-circle-filled',
//         iconColor: '#4CAF50',
//         title: 'Auto Play',
//         description: 'Videos will play automatically',
//         value: videoSettings.autoPlay,
//         component: Switch,
//         onToggle: (value) => setVideoSettings(prev => ({...prev, autoPlay: value}))
//       }
//     ];

//     if (videoSettings.thumbnail) {
//       items.push({
//         type: 'divider'
//       });
//       items.push({
//         type: 'info',
//         icon: 'check-circle',
//         iconColor: '#4CAF50',
//         title: 'Custom Thumbnail Set',
//         description: 'Thumbnail uploaded successfully',
//       });
//     }

//     return items;
//   };

//   const renderMediaGrid = () => {
//     if (selectedMedia.length === 0) {
//       return (
//         <TouchableOpacity style={styles.uploadPlaceholder} onPress={handleMediaUpload}>
//           <Icon name="add" size={40} color="#666" />
//           <Text style={styles.uploadText}>Tap to upload media</Text>
//           <Text style={styles.uploadSubText}>Photos and videos</Text>
//         </TouchableOpacity>
//       );
//     }

//     const cols = selectedLayout === 'carousel' ? 1 :
//                  layoutOptions.find(l => l.id === selectedLayout)?.cols || 1;
//     const hasVideos = selectedMedia.some(media => media.isVideo);

//     return (
//       <View style={styles.mediaContainer}>
//         {/* Media Grid Header */}
//         <View style={styles.mediaHeader}>
//           <Text style={styles.mediaCount}>
//             {selectedMedia.length} {selectedMedia.length === 1 ? 'item' : 'items'} selected
//           </Text>
//           <TouchableOpacity
//             style={styles.removeAllButton}
//             onPress={handleRemoveAllMedia}
//           >
//             <Icon name="delete-outline" size={20} color="#ff4757" />
//             <Text style={styles.removeAllText}>Remove All</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Media Grid */}
//         <View style={[styles.mediaGrid, {flexDirection: cols === 1 ? 'column' : 'row'}]}>
//           {selectedMedia.map((media, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.mediaItem,
//                 {
//                   width: cols === 1 ? '100%' :
//                          cols === 2 ? '48%' :
//                          cols === 3 ? '31%' : '48%',
//                   marginRight: cols > 1 && (index + 1) % cols !== 0 ? '2%' : 0,
//                 },
//               ]}>
//               <Image source={{uri: media.uri}} style={styles.mediaImage} />
//               {media.isVideo && (
//                 <TouchableOpacity
//                   style={styles.videoOverlay}
//                   onPress={handleVideoClick}
//                 >
//                   <Icon name="play-circle-filled" size={30} color="rgba(255,255,255,0.9)" />
//                   <Text style={styles.thumbnailHint}>Click to add thumbnail</Text>
//                 </TouchableOpacity>
//               )}
//               <TouchableOpacity
//                 style={styles.removeButton}
//                 onPress={() => handleRemoveMedia(index)}
//                 activeOpacity={0.7}>
//                 <Icon name="close" size={18} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           ))}

//           {/* Add More Button */}
//           <TouchableOpacity style={styles.addMoreButton} onPress={handleMediaUpload}>
//             <Icon name="add" size={24} color="#666" />
//             <Text style={styles.addMoreText}>Add More</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Layout Validation Error */}
//         {layoutValidationError ? (
//           <View style={styles.validationError}>
//             <Icon name="error-outline" size={16} color="#ff4757" />
//             <Text style={styles.validationErrorText}>{layoutValidationError}</Text>
//           </View>
//         ) : null}

//         {/* Video Settings Hint - Only show when videos are present */}
//         {hasVideos && (
//           <TouchableOpacity
//             style={styles.videoSettingsHint}
//             onPress={handleVideoClick}
//           >
//             <Icon name="video-settings" size={20} color="#2196F3" />
//             <Text style={styles.videoSettingsHintText}>
//               Tap to customize video settings (thumbnail, autoplay)
//             </Text>
//             <Icon name="chevron-right" size={16} color="#2196F3" />
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   const renderLayoutOptions = () => {
//     // Only show layout options when media is uploaded
//     if (selectedMedia.length === 0) return null;

//     return (
//       <View style={styles.layoutSection}>
//         <Text style={styles.sectionTitle}>Layout Style</Text>
//         <Text style={styles.sectionDescription}>
//           Choose how your media will be displayed
//         </Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           <View style={styles.layoutOptions}>
//             {layoutOptions.map(option => {
//               const isValid = selectedMedia.length >= option.minItems &&
//                             (!option.maxItems || selectedMedia.length <= option.maxItems);

//               return (
//                 <TouchableOpacity
//                   key={option.id}
//                   style={[
//                     styles.layoutButton,
//                     selectedLayout === option.id && styles.selectedLayout,
//                     !isValid && styles.disabledLayout,
//                   ]}
//                   onPress={() => isValid && setSelectedLayout(option.id)}
//                   disabled={!isValid}>
//                   <Text
//                     style={[
//                       styles.layoutText,
//                       selectedLayout === option.id && styles.selectedLayoutText,
//                       !isValid && styles.disabledLayoutText,
//                     ]}>
//                     {option.label}
//                   </Text>
//                   {!isValid && (
//                     <Text style={styles.layoutRequirement}>
//                       {option.minItems === option.maxItems ?
//                         `Needs ${option.minItems}` :
//                         `Min ${option.minItems}`}
//                     </Text>
//                   )}
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </ScrollView>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>Upload Media</Text>
//         <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//           <Icon name="close" size={24} color="#333" />
//         </TouchableOpacity>
//       </View>

//       {/* Media Grid */}
//       <View style={styles.gridContainer}>
//         {renderMediaGrid()}
//       </View>

//       {/* Layout Options - Show only when media is uploaded */}
//       {renderLayoutOptions()}

//       {/* Video Settings Bottom Nav */}
//       <ThumbnailBottomnav
//         visible={showVideoSettings && selectedMedia.some(media => media.isVideo)}
//         onClose={() => setShowVideoSettings(false)}
//         title="Video Settings"
//         items={getVideoSettingsItems()}
//         height={videoSettings.thumbnail ? 280 : 220}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
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
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   gridContainer: {
//     padding: 16,
//   },
//   uploadPlaceholder: {
//     height: 200,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#ddd',
//     borderStyle: 'dashed',
//   },
//   uploadText: {
//     marginTop: 8,
//     color: '#333',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   uploadSubText: {
//     color: '#666',
//     fontSize: 14,
//     marginTop: 4,
//   },
//   mediaContainer: {
//     minHeight: 200,
//   },
//   mediaHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingHorizontal: 4,
//   },
//   mediaCount: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   removeAllButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     backgroundColor: '#fff5f5',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ffe0e0',
//   },
//   removeAllText: {
//     color: '#ff4757',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 4,
//   },
//   mediaGrid: {
//     flexWrap: 'wrap',
//     marginBottom: 16,
//   },
//   mediaItem: {
//     height: 120,
//     marginBottom: 8,
//     borderRadius: 8,
//     overflow: 'hidden',
//     position: 'relative',
//     backgroundColor: '#f0f0f0',
//   },
//   mediaImage: {
//     width: '100%',
//     height: '100%',
//   },
//   videoOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   thumbnailHint: {
//     color: 'white',
//     fontSize: 10,
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   removeButton: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//     backgroundColor: 'rgba(255, 71, 87, 0.9)',
//     borderRadius: 15,
//     width: 28,
//     height: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     elevation: 2,
//   },
//   addMoreButton: {
//     width: '48%',
//     height: 80,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     marginTop: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderStyle: 'dashed',
//   },
//   addMoreText: {
//     color: '#666',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   validationError: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff5f5',
//     padding: 8,
//     borderRadius: 6,
//     marginBottom: 12,
//     borderLeftWidth: 3,
//     borderLeftColor: '#ff4757',
//   },
//   validationErrorText: {
//     color: '#ff4757',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 6,
//   },
//   videoSettingsHint: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e3f2fd',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 12,
//     borderLeftWidth: 3,
//     borderLeftColor: '#2196F3',
//   },
//   videoSettingsHintText: {
//     flex: 1,
//     marginLeft: 8,
//     marginRight: 8,
//     fontSize: 14,
//     color: '#1565c0',
//     fontWeight: '500',
//   },
//   layoutSection: {
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   sectionDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 12,
//   },
//   layoutOptions: {
//     flexDirection: 'row',
//     paddingHorizontal: 4,
//   },
//   layoutButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     minWidth: 60,
//     alignItems: 'center',
//   },
//   selectedLayout: {
//     backgroundColor: '#2196F3',
//     borderColor: '#2196F3',
//   },
//   disabledLayout: {
//     backgroundColor: '#f5f5f5',
//     borderColor: '#ccc',
//   },
//   layoutText: {
//     color: '#666',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   selectedLayoutText: {
//     color: '#fff',
//   },
//   disabledLayoutText: {
//     color: '#999',
//   },
//   layoutRequirement: {
//     fontSize: 10,
//     color: '#999',
//     marginTop: 2,
//   },
// });

// export default  InlineImageGrid;

// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Alert,
//   Switch,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import {launchImageLibrary} from 'react-native-image-picker';
// import ThumbnailBottomnav from './ThumbnailBottomnav'; // Import your ThumbnailBottomnav component

// const ImageGrid = ({visible, onClose}) => {
//   const [selectedMedia, setSelectedMedia] = useState([]);
//   const [selectedLayout, setSelectedLayout] = useState('1'); // Default layout
//   const [videoSettings, setVideoSettings] = useState({
//     autoPlay: true,
//     thumbnail: null,
//   });
//   const [showVideoSettings, setShowVideoSettings] = useState(false);
//   const [videoSettingsAutoOpened, setVideoSettingsAutoOpened] = useState(false);

//   if (!visible) return null;

//   const handleMediaUpload = () => {
//     const options = {
//       mediaType: 'mixed',
//       quality: 0.8,
//       selectionLimit: 10,
//     };

//     launchImageLibrary(options, response => {
//       if (response.didCancel || response.error) return;

//       const newMedia = response.assets.map(asset => ({
//         uri: asset.uri,
//         type: asset.type,
//         fileName: asset.fileName,
//         fileSize: asset.fileSize,
//         isVideo: asset.type?.includes('video'),
//       }));

//       setSelectedMedia(prev => [...prev, ...newMedia]);

//       // Auto-show video settings if any video is uploaded and hasn't been auto-opened before
//       const hasVideo = newMedia.some(media => media.isVideo);
//       if (hasVideo && !videoSettingsAutoOpened) {
//         setShowVideoSettings(true);
//         setVideoSettingsAutoOpened(true);
//       }
//     });
//   };

//   const handleRemoveMedia = index => {
//     const updatedMedia = selectedMedia.filter((_, i) => i !== index);
//     setSelectedMedia(updatedMedia);

//     // Hide video settings if no videos remaining
//     const hasVideo = updatedMedia.some(media => media.isVideo);
//     if (!hasVideo) {
//       setShowVideoSettings(false);
//       setVideoSettingsAutoOpened(false);
//       // Reset video settings when no videos
//       setVideoSettings({
//         autoPlay: true,
//         thumbnail: null,
//       });
//     }
//   };

//   const handleRemoveAllMedia = () => {
//     Alert.alert(
//       'Remove All Media',
//       'Are you sure you want to remove all uploaded media?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Remove All',
//           style: 'destructive',
//           onPress: () => {
//             setSelectedMedia([]);
//             setShowVideoSettings(false);
//             setVideoSettingsAutoOpened(false);
//             setVideoSettings({
//               autoPlay: true,
//               thumbnail: null,
//             });
//             // Reset to default layout when all media is removed
//             setSelectedLayout('1');
//           },
//         },
//       ]
//     );
//   };

//   const handleThumbnailUpload = () => {
//     const options = {
//       mediaType: 'photo',
//       quality: 0.8,
//     };

//     launchImageLibrary(options, response => {
//       if (response.didCancel || response.error) return;

//       setVideoSettings(prev => ({
//         ...prev,
//         thumbnail: response.assets[0],
//       }));
//     });
//   };

//   // Handle video settings access
//   const handleVideoSettingsAccess = () => {
//     setShowVideoSettings(true);
//   };

//   // Create items for ThumbnailBottomnav (Video Settings Only)
//   const getVideoSettingsItems = () => {
//     const items = [
//       {
//         type: 'button',
//         icon: 'photo',
//         iconColor: '#2196F3',
//         title: videoSettings.thumbnail ? 'Change Thumbnail' : 'Click here to upload thumbnail',
//         textColor: '#2196F3',
//         showArrow: false,
//         onPress: handleThumbnailUpload
//       },
//       {
//         type: 'divider'
//       },
//       {
//         type: 'switch',
//         icon: 'play-circle-filled',
//         iconColor: '#4CAF50',
//         title: 'Auto Play',
//         description: 'Videos will play automatically',
//         value: videoSettings.autoPlay,
//         component: Switch,
//         onToggle: (value) => setVideoSettings(prev => ({...prev, autoPlay: value}))
//       }
//     ];

//     // Add thumbnail preview info if thumbnail exists
//     if (videoSettings.thumbnail) {
//       items.push({
//         type: 'divider'
//       });
//       items.push({
//         type: 'info',
//         icon: 'check-circle',
//         iconColor: '#4CAF50',
//         title: 'Custom Thumbnail Set',
//         description: 'Thumbnail uploaded successfully',
//       });
//     }

//     return items;
//   };

//   const layoutOptions = [
//     {id: '1', label: '1', cols: 1},
//     {id: '2', label: '2', cols: 2},
//     {id: '2x2', label: '2x2', cols: 2, special: true},
//     {id: 'carousel', label: 'Carousel', cols: 'carousel'},
//     {id: '1x3', label: '1x3', cols: 3},
//     {id: '1x2', label: '1x2', cols: 2, rows: 1},
//   ];

//   const renderMediaGrid = () => {
//     if (selectedMedia.length === 0) {
//       return (
//         <TouchableOpacity style={styles.uploadPlaceholder} onPress={handleMediaUpload}>
//           <Icon name="add" size={40} color="#666" />
//           <Text style={styles.uploadText}>Tap to upload media</Text>
//           <Text style={styles.uploadSubText}>Photos and videos</Text>
//         </TouchableOpacity>
//       );
//     }

//     const cols = selectedLayout === 'carousel' ? 1 :
//                  layoutOptions.find(l => l.id === selectedLayout)?.cols || 1;
//     const hasVideos = selectedMedia.some(media => media.isVideo);

//     return (
//       <View style={styles.mediaContainer}>
//         {/* Media Grid Header with Remove All Button */}
//         <View style={styles.mediaHeader}>
//           <Text style={styles.mediaCount}>
//             {selectedMedia.length} {selectedMedia.length === 1 ? 'item' : 'items'} selected
//           </Text>
//           <TouchableOpacity
//             style={styles.removeAllButton}
//             onPress={handleRemoveAllMedia}
//           >
//             <Icon name="delete-outline" size={20} color="#ff4757" />
//             <Text style={styles.removeAllText}>Remove All</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={[styles.mediaGrid, {flexDirection: cols === 1 ? 'column' : 'row'}]}>
//           {selectedMedia.map((media, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.mediaItem,
//                 {
//                   width: cols === 1 ? '100%' : cols === 2 ? '48%' : '31%',
//                   marginRight: cols > 1 && (index + 1) % cols !== 0 ? '2%' : 0,
//                 },
//               ]}>
//               <Image source={{uri: media.uri}} style={styles.mediaImage} />
//               {media.isVideo && (
//                 <View style={styles.videoOverlay}>
//                   <Icon name="play-circle-filled" size={30} color="rgba(255,255,255,0.9)" />
//                 </View>
//               )}
//               {/* Enhanced Remove Button */}
//               <TouchableOpacity
//                 style={styles.removeButton}
//                 onPress={() => handleRemoveMedia(index)}
//                 activeOpacity={0.7}>
//                 <Icon name="close" size={18} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           ))}

//           {/* Add More Button */}
//           <TouchableOpacity style={styles.addMoreButton} onPress={handleMediaUpload}>
//             <Icon name="add" size={24} color="#666" />
//             <Text style={styles.addMoreText}>Add More</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Layout Options - Show directly under media grid */}
//         <View style={styles.layoutSection}>
//           <Text style={styles.sectionTitle}>Layout Style</Text>
//           <Text style={styles.sectionDescription}>
//             Choose how your media will be displayed
//           </Text>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View style={styles.layoutOptions}>
//               {layoutOptions.map(option => (
//                 <TouchableOpacity
//                   key={option.id}
//                   style={[
//                     styles.layoutButton,
//                     selectedLayout === option.id && styles.selectedLayout,
//                   ]}
//                   onPress={() => setSelectedLayout(option.id)}>
//                   <Text
//                     style={[
//                       styles.layoutText,
//                       selectedLayout === option.id && styles.selectedLayoutText,
//                     ]}>
//                     {option.label}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </ScrollView>
//         </View>

//         {/* Video Settings Access - Only show when videos are present */}
//         {hasVideos && (
//           <TouchableOpacity
//             style={styles.videoSettingsHint}
//             onPress={handleVideoSettingsAccess}
//           >
//             <Icon name="video-settings" size={20} color="#2196F3" />
//             <Text style={styles.videoSettingsHintText}>
//               Click here to customize video settings (thumbnail, autoplay)
//             </Text>
//             <Icon name="chevron-right" size={16} color="#2196F3" />
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.overlay}>
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.title}>Upload Media</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Icon name="close" size={24} color="#333" />
//           </TouchableOpacity>
//         </View>

//         <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//           {/* Media Grid with Layout Options Inline */}
//           <View style={styles.gridContainer}>
//             {renderMediaGrid()}
//           </View>

//           {/* Empty state message when no media */}
//           {selectedMedia.length === 0 && (
//             <View style={styles.emptyStateInfo}>
//               <Icon name="info-outline" size={20} color="#666" />
//               <Text style={styles.emptyStateText}>
//                 Upload photos or videos to see layout options and settings
//               </Text>
//             </View>
//           )}
//         </ScrollView>

//         {/* Done Button */}
//         <TouchableOpacity
//           style={[
//             styles.doneButton,
//             selectedMedia.length === 0 && styles.doneButtonDisabled
//           ]}
//           onPress={onClose}
//           disabled={selectedMedia.length === 0}>
//           <Text style={[
//             styles.doneButtonText,
//             selectedMedia.length === 0 && styles.doneButtonTextDisabled
//           ]}>
//             {selectedMedia.length === 0 ? 'Upload Media First' : `Done (${selectedMedia.length})`}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Video Settings Bottom Nav - Only for video settings */}
//       <ThumbnailBottomnav
//         visible={showVideoSettings && selectedMedia.some(media => media.isVideo)}
//         onClose={() => setShowVideoSettings(false)}
//         title="Video Settings"
//         items={getVideoSettingsItems()}
//         height={videoSettings.thumbnail ? 280 : 220}
//       />
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
//     zIndex: 1000,
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     marginTop: 50,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
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
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//   },
//   gridContainer: {
//     marginBottom: 20,
//   },
//   uploadPlaceholder: {
//     height: 200,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#ddd',
//     borderStyle: 'dashed',
//   },
//   uploadText: {
//     marginTop: 8,
//     color: '#333',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   uploadSubText: {
//     color: '#666',
//     fontSize: 14,
//     marginTop: 4,
//   },
//   mediaContainer: {
//     minHeight: 200,
//   },
//   mediaHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingHorizontal: 4,
//   },
//   mediaCount: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   removeAllButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     backgroundColor: '#fff5f5',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ffe0e0',
//   },
//   removeAllText: {
//     color: '#ff4757',
//     fontSize: 12,
//     fontWeight: '500',
//     marginLeft: 4,
//   },
//   mediaGrid: {
//     flexWrap: 'wrap',
//     marginBottom: 20, // Space between media grid and layout options
//   },
//   mediaItem: {
//     height: 120,
//     marginBottom: 8,
//     borderRadius: 8,
//     overflow: 'hidden',
//     position: 'relative',
//     backgroundColor: '#f0f0f0',
//   },
//   mediaImage: {
//     width: '100%',
//     height: '100%',
//   },
//   videoOverlay: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: [{translateX: -15}, {translateY: -15}],
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 20,
//     padding: 8,
//   },
//   removeButton: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//     backgroundColor: 'rgba(255, 71, 87, 0.9)',
//     borderRadius: 15,
//     width: 28,
//     height: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     elevation: 2,
//   },
//   addMoreButton: {
//     width: '48%',
//     height: 80,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     marginTop: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderStyle: 'dashed',
//   },
//   addMoreText: {
//     color: '#666',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   // Layout section directly under media grid
//   layoutSection: {
//     marginBottom: 16,
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 12,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   sectionDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 12,
//   },
//   layoutOptions: {
//     flexDirection: 'row',
//     paddingHorizontal: 4,
//   },
//   layoutButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//   },
//   selectedLayout: {
//     backgroundColor: '#2196F3',
//     borderColor: '#2196F3',
//   },
//   layoutText: {
//     color: '#666',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   selectedLayoutText: {
//     color: '#fff',
//   },
//   // Video settings access hint
//   videoSettingsHint: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e3f2fd',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 12,
//     borderLeftWidth: 3,
//     borderLeftColor: '#2196F3',
//   },
//   videoSettingsHintText: {
//     flex: 1,
//     marginLeft: 8,
//     marginRight: 8,
//     fontSize: 14,
//     color: '#1565c0',
//     fontWeight: '500',
//   },
//   emptyStateInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     marginTop: 20,
//   },
//   emptyStateText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: '#666',
//     flex: 1,
//   },
//   doneButton: {
//     margin: 16,
//     backgroundColor: '#2196F3',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   doneButtonDisabled: {
//     backgroundColor: '#f0f0f0',
//   },
//   doneButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   doneButtonTextDisabled: {
//     color: '#999',
//   },
// });

// export default ImageGrid;
