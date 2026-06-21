/**
 * MediaMapper - Handles position-based media field naming for FormData
 * Maps media files to imageFile1-5, videoFile1-5, thumbnail1-5, autoplay1-5 based on position
 */
class MediaMapper {
  /**
   * Get the field name for image files based on position
   * @param {number} position - Position in media array (0-based)
   * @returns {string} Field name like 'imageFile1', 'imageFile2', etc.
   */
  static getImageFieldName(position) {
    return `imageFile${position + 1}`;
  }

  /**
   * Get the field name for video files based on position
   * @param {number} position - Position in media array (0-based)
   * @returns {string} Field name like 'videoFile1', 'videoFile2', etc.
   */
  static getVideoFieldName(position) {
    return `videoFile${position + 1}`;
  }

  /**
   * Get the field name for thumbnail files based on video position
   * @param {number} videoPosition - Position of the video in media array (0-based)
   * @returns {string} Field name like 'thumbnail1', 'thumbnail2', etc.
   */
  static getThumbnailFieldName(videoPosition) {
    return `thumbnail${videoPosition + 1}`;
  }

  /**
   * Get the field name for autoplay settings based on video position
   * @param {number} videoPosition - Position of the video in media array (0-based)
   * @returns {string} Field name like 'autoplay1', 'autoplay2', etc.
   */
  static getAutoplayFieldName(videoPosition) {
    return `autoplay${videoPosition + 1}`;
  }

  /**
   * Map media array to FormData fields based on position and type
   * @param {Array} mediaArray - Array of media objects with uri, type, isVideo properties
   * @param {Object} videoSettings - Video settings object with thumbnails and autoPlay
   * @param {FormData} formData - FormData object to append to
   */
  static mapMediaToFormData(mediaArray, videoSettings, formData) {
    if (!Array.isArray(mediaArray) || !formData) {
      console.warn('MediaMapper: Invalid mediaArray or formData provided');
      return;
    }

    mediaArray.forEach((media, index) => {
      if (!media || !media.uri) {
        console.warn(`MediaMapper: Invalid media at position ${index}`);
        return;
      }

      try {
        if (media.isVideo) {
          // Map video file
          const videoFieldName = this.getVideoFieldName(index);
          const videoFile = {
            uri: media.uri,
            type: media.type || 'video/mp4',
            name: media.fileName || `video_${index + 1}.mp4`,
          };
          formData.append(videoFieldName, videoFile);

          // Map thumbnail if exists
          if (videoSettings?.thumbnails?.[index]) {
            const thumbnailFieldName = this.getThumbnailFieldName(index);
            const thumbnail = videoSettings.thumbnails[index];
            const thumbnailFile = {
              uri: thumbnail.uri,
              type: thumbnail.type || 'image/jpeg',
              name: thumbnail.fileName || `thumbnail_${index + 1}.jpg`,
            };
            formData.append(thumbnailFieldName, thumbnailFile);
          }

          // Map autoplay setting
          const autoplayFieldName = this.getAutoplayFieldName(index);
          const autoplayValue = videoSettings?.autoPlay !== undefined ? videoSettings.autoPlay : true;
          formData.append(autoplayFieldName, autoplayValue.toString());
        } else {
          // Map image file
          const imageFieldName = this.getImageFieldName(index);
          const imageFile = {
            uri: media.uri,
            type: media.type || 'image/jpeg',
            name: media.fileName || `image_${index + 1}.jpg`,
          };
          formData.append(imageFieldName, imageFile);
        }
      } catch (error) {
        console.error(`MediaMapper: Error processing media at position ${index}:`, error);
      }
    });
  }

  /**
   * Get media field names that would be used for a given media array
   * Useful for debugging and validation
   * @param {Array} mediaArray - Array of media objects
   * @returns {Object} Object with arrays of field names that would be used
   */
  static getFieldNamesForMedia(mediaArray) {
    const fieldNames = {
      images: [],
      videos: [],
      thumbnails: [],
      autoplay: [],
    };

    if (!Array.isArray(mediaArray)) {
      return fieldNames;
    }

    mediaArray.forEach((media, index) => {
      if (media?.isVideo) {
        fieldNames.videos.push(this.getVideoFieldName(index));
        fieldNames.thumbnails.push(this.getThumbnailFieldName(index));
        fieldNames.autoplay.push(this.getAutoplayFieldName(index));
      } else {
        fieldNames.images.push(this.getImageFieldName(index));
      }
    });

    return fieldNames;
  }

  /**
   * Validate media array for API constraints
   * @param {Array} mediaArray - Array of media objects
   * @param {string} pattern - Layout pattern (1, 2, 2x2, 1x2, 1x3, carousel)
   * @returns {Object} Validation result with isValid and errors
   */
  static validateMediaArray(mediaArray, pattern) {
    const result = {
      isValid: true,
      errors: [],
    };

    if (!Array.isArray(mediaArray)) {
      result.isValid = false;
      result.errors.push('Media array is required');
      return result;
    }

    // Check maximum limit (API supports up to 5 files)
    if (mediaArray.length > 5) {
      result.isValid = false;
      result.errors.push('Maximum 5 media files allowed');
    }

    // Pattern-specific validation
    const patternConstraints = {
      '1': { min: 1, max: 1 },
      '2': { min: 1, max: 2 },
      '2x2': { min: 4, max: 4 },
      '1x2': { min: 3, max: 3 },
      '1x3': { min: 4, max: 4 },
      'carousel': { min: 2, max: 5 },
    };

    const constraint = patternConstraints[pattern];
    if (constraint) {
      if (mediaArray.length < constraint.min) {
        result.isValid = false;
        result.errors.push(`Pattern '${pattern}' requires at least ${constraint.min} media files`);
      }
      if (mediaArray.length > constraint.max) {
        result.isValid = false;
        result.errors.push(`Pattern '${pattern}' allows maximum ${constraint.max} media files`);
      }
    }

    // Validate individual media files
    mediaArray.forEach((media, index) => {
      if (!media?.uri) {
        result.isValid = false;
        result.errors.push(`Media at position ${index + 1} is missing URI`);
      }

      if (!media?.type) {
        result.errors.push(`Media at position ${index + 1} is missing type information`);
      }
    });

    return result;
  }
}

export default MediaMapper;
