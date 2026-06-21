/**
 * FormDataAnalyzer - Analyzes FormData to identify videos without thumbnails
 * Handles parsing FormData and extracting video/thumbnail field mappings
 */
class FormDataAnalyzer {
  /**
   * Analyze FormData to find videos without corresponding thumbnails
   * @param {FormData} formData - FormData to analyze
   * @returns {Array} Array of {videoField, thumbnailField, videoFile, position} objects
   */
  static findVideosNeedingThumbnails(formData) {
    try {
      console.log('FormDataAnalyzer: Starting FormData analysis');

      const videosNeedingThumbnails = [];
      const videoFields = this._extractVideoFields(formData);

      console.log(`FormDataAnalyzer: Found ${videoFields.length} video fields`);

      for (const videoField of videoFields) {
        const position = this._extractPositionFromField(videoField.name);
        const thumbnailField = `thumbnail${position}`;

        // Check if corresponding thumbnail exists
        if (!this.hasThumbnail(formData, thumbnailField)) {
          videosNeedingThumbnails.push({
            videoField: videoField.name,
            thumbnailField: thumbnailField,
            videoFile: videoField.value,
            position: position - 1, // Convert to 0-based index
          });

          console.log(`FormDataAnalyzer: Video ${videoField.name} needs thumbnail (${thumbnailField})`);
        } else {
          console.log(`FormDataAnalyzer: Video ${videoField.name} already has thumbnail (${thumbnailField})`);
        }
      }

      console.log(`FormDataAnalyzer: Analysis complete. ${videosNeedingThumbnails.length} videos need thumbnails`);
      return videosNeedingThumbnails;

    } catch (error) {
      console.error('FormDataAnalyzer: Error analyzing FormData:', error);
      return [];
    }
  }

  /**
   * Check if a specific thumbnail field exists in FormData
   * @param {FormData} formData - FormData to check
   * @param {string} thumbnailField - Field name to check (e.g., 'thumbnail1')
   * @returns {boolean} Whether thumbnail exists
   */
  static hasThumbnail(formData, thumbnailField) {
    try {
      // React Native FormData uses _parts instead of entries()
      if (!formData || !formData._parts) {
        return false;
      }

      const parts = formData._parts;

      for (const [key, value] of parts) {
        if (key === thumbnailField) {
          // Check if the value is a valid file object
          return this._isValidFileObject(value);
        }
      }

      return false;
    } catch (error) {
      console.warn(`FormDataAnalyzer: Error checking thumbnail ${thumbnailField}:`, error);
      return false;
    }
  }

  /**
   * Get all video fields from FormData
   * @param {FormData} formData - FormData to analyze
   * @returns {Array} Array of video field objects with name and value
   */
  static getAllVideoFields(formData) {
    return this._extractVideoFields(formData);
  }

  /**
   * Get all thumbnail fields from FormData
   * @param {FormData} formData - FormData to analyze
   * @returns {Array} Array of thumbnail field objects with name and value
   */
  static getAllThumbnailFields(formData) {
    try {
      const thumbnailFields = [];

      // React Native FormData uses _parts instead of entries()
      if (!formData || !formData._parts) {
        return [];
      }

      const parts = formData._parts;

      for (const [key, value] of parts) {
        if (this._isThumbnailField(key) && this._isValidFileObject(value)) {
          thumbnailFields.push({
            name: key,
            value: value,
          });
        }
      }

      return thumbnailFields;
    } catch (error) {
      console.error('FormDataAnalyzer: Error extracting thumbnail fields:', error);
      return [];
    }
  }

  // Private helper methods

  /**
   * Extract video fields from FormData
   * @param {FormData} formData - FormData to analyze
   * @returns {Array} Array of video field objects
   */
  static _extractVideoFields(formData) {
    try {
      const videoFields = [];

      // React Native FormData uses _parts instead of entries()
      if (!formData || !formData._parts) {
        return [];
      }

      const parts = formData._parts;

      for (const [key, value] of parts) {
        if (this._isVideoField(key) && this._isValidFileObject(value)) {
          videoFields.push({
            name: key,
            value: value,
          });
        }
      }

      return videoFields;
    } catch (error) {
      console.error('FormDataAnalyzer: Error extracting video fields:', error);
      return [];
    }
  }

  /**
   * Check if a field name is a video field (videoFile1, videoFile2, etc.)
   * @param {string} fieldName - Field name to check
   * @returns {boolean} Whether it's a video field
   */
  static _isVideoField(fieldName) {
    return /^videoFile\d+$/.test(fieldName);
  }

  /**
   * Check if a field name is a thumbnail field (thumbnail1, thumbnail2, etc.)
   * @param {string} fieldName - Field name to check
   * @returns {boolean} Whether it's a thumbnail field
   */
  static _isThumbnailField(fieldName) {
    return /^thumbnail\d+$/.test(fieldName);
  }

  /**
   * Extract position number from field name (videoFile1 -> 1, thumbnail2 -> 2)
   * @param {string} fieldName - Field name
   * @returns {number} Position number
   */
  static _extractPositionFromField(fieldName) {
    const match = fieldName.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 1;
  }

  /**
   * Check if a value is a valid file object
   * @param {*} value - Value to check
   * @returns {boolean} Whether it's a valid file object
   */
  static _isValidFileObject(value) {
    if (!value || typeof value !== 'object') {
      return false;
    }

    // Check for React Native file object properties
    const hasUri = value.uri && typeof value.uri === 'string';
    const hasType = value.type && typeof value.type === 'string';
    const hasName = value.name && typeof value.name === 'string';

    // For video files, check if it's actually a video
    if (hasType && hasUri) {
      return value.type.startsWith('video/') || value.type.startsWith('image/');
    }

    return hasUri && (hasType || hasName);
  }

  /**
   * Log FormData analysis results for debugging
   * @param {FormData} formData - FormData to analyze
   */
  static logAnalysis(formData) {
    try {
      console.log('=== FormDataAnalyzer: Detailed Analysis ===');

      const videoFields = this.getAllVideoFields(formData);
      const thumbnailFields = this.getAllThumbnailFields(formData);
      const videosNeedingThumbnails = this.findVideosNeedingThumbnails(formData);

      console.log('Video fields found:', videoFields.length);
      videoFields.forEach(field => {
        console.log(`  - ${field.name}: ${field.value.name || 'unnamed'} (${field.value.type || 'unknown type'})`);
      });

      console.log('Thumbnail fields found:', thumbnailFields.length);
      thumbnailFields.forEach(field => {
        console.log(`  - ${field.name}: ${field.value.name || 'unnamed'} (${field.value.type || 'unknown type'})`);
      });

      console.log('Videos needing thumbnails:', videosNeedingThumbnails.length);
      videosNeedingThumbnails.forEach(video => {
        console.log(`  - ${video.videoField} -> ${video.thumbnailField}`);
      });

      console.log('==========================================');
    } catch (error) {
      console.error('FormDataAnalyzer: Error logging analysis:', error);
    }
  }
}

export default FormDataAnalyzer;
