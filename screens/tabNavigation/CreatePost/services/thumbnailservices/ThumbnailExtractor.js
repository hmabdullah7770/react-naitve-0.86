import {createThumbnail} from 'react-native-create-thumbnail';
import {Image} from 'react-native-compressor';
import RNFS from 'react-native-fs';

/**
 * ThumbnailExtractor - Handles video frame extraction using react-native-create-thumbnail
 * Extracts thumbnails from video center frames with fallback strategies
 */
class ThumbnailExtractor {
  /**
   * Extract thumbnail from video file
   * @param {Object} videoFile - Video file object with uri, type, name
   * @param {number} position - Video position for naming (0-based)
   * @param {Object} config - Service configuration
   * @returns {Promise<Object>} Generated thumbnail file object
   */
  static async extractThumbnail(videoFile, position, config) {
    try {
      console.log(
        `ThumbnailExtractor: Starting extraction for video at position ${position}`,
      );
      console.log('ThumbnailExtractor: Video file:', {
        uri: videoFile.uri,
        type: videoFile.type,
        name: videoFile.name,
      });

      // Validate video file
      if (!this._isValidVideoFile(videoFile)) {
        throw new Error('Invalid video file object');
      }

      // Get optimal timestamp for extraction
      const timestamp = await this.getOptimalTimestamp(videoFile.uri, config);
      console.log(
        `ThumbnailExtractor: Using timestamp ${timestamp}ms for extraction`,
      );

      // Extract thumbnail with primary timestamp
      let thumbnail = await this._extractAtTimestamp(
        videoFile,
        timestamp,
        position,
        config,
      );

      if (thumbnail) {
        console.log(
          'ThumbnailExtractor: Successfully extracted thumbnail at primary timestamp',
        );
        return thumbnail;
      }

      // Try fallback timestamps if primary failed
      console.log(
        'ThumbnailExtractor: Primary extraction failed, trying fallbacks',
      );
      thumbnail = await this._extractWithFallbacks(videoFile, position, config);

      if (thumbnail) {
        console.log(
          'ThumbnailExtractor: Successfully extracted thumbnail with fallback',
        );
        return thumbnail;
      }

      throw new Error('All thumbnail extraction attempts failed');
    } catch (error) {
      console.error(
        `ThumbnailExtractor: Failed to extract thumbnail for position ${position}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get optimal timestamp for thumbnail extraction (center of video)
   * @param {string} videoUri - Video file URI
   * @param {Object} config - Service configuration
   * @returns {Promise<number>} Timestamp in milliseconds
   */
  static async getOptimalTimestamp(videoUri, config) {
    try {
      // For now, we'll use a default approach since getting video duration
      // requires additional native modules or metadata extraction
      // We'll extract at a reasonable default time (2 seconds) for most videos

      const defaultTimestamp = 2000; // 2 seconds
      const primaryRatio = config.PRIMARY_TIMESTAMP_RATIO || 0.5;

      // TODO: In a future enhancement, we could use react-native-video-info
      // or similar to get actual video duration and calculate precise timestamp

      console.log(
        `ThumbnailExtractor: Using default timestamp approach: ${defaultTimestamp}ms`,
      );
      return defaultTimestamp;
    } catch (error) {
      console.warn(
        'ThumbnailExtractor: Error calculating optimal timestamp, using default:',
        error,
      );
      return 2000; // 2 seconds fallback
    }
  }

  /**
   * Extract thumbnail at specific timestamp with compression
   * @param {Object} videoFile - Video file object
   * @param {number} timestamp - Timestamp in milliseconds
   * @param {number} position - Video position for naming
   * @param {Object} config - Service configuration
   * @returns {Promise<Object|null>} Generated thumbnail or null if failed
   */
  static async _extractAtTimestamp(videoFile, timestamp, position, config) {
    try {
      // Create thumbnail using react-native-create-thumbnail
      const thumbnailResult = await Promise.race([
        createThumbnail({
          url: videoFile.uri,
          timeStamp: timestamp,
          format: 'jpeg',
          quality: config.THUMBNAIL_QUALITY || 0.8,
        }),
        this._createTimeoutPromise(config.EXTRACTION_TIMEOUT || 30000),
      ]);

      if (!thumbnailResult || !thumbnailResult.path) {
        console.warn('ThumbnailExtractor: No thumbnail result or path');
        return null;
      }

      console.log(
        'ThumbnailExtractor: Raw thumbnail created:',
        thumbnailResult,
      );

      // Compress and optimize the thumbnail
      const optimizedThumbnail = await this._compressAndOptimize(
        thumbnailResult,
        position,
        config,
      );

      return optimizedThumbnail;
    } catch (error) {
      if (error.message === 'Extraction timeout') {
        console.warn(
          `ThumbnailExtractor: Extraction timed out at timestamp ${timestamp}ms`,
        );
      } else {
        console.warn(
          `ThumbnailExtractor: Extraction failed at timestamp ${timestamp}ms:`,
          error,
        );
      }
      return null;
    }
  }

  /**
   * Try extraction with fallback timestamps
   * @param {Object} videoFile - Video file object
   * @param {number} position - Video position
   * @param {Object} config - Service configuration
   * @returns {Promise<Object|null>} Generated thumbnail or null
   */
  static async _extractWithFallbacks(videoFile, position, config) {
    const fallbackTimestamps = [1000, 3000, 5000]; // 1s, 3s, 5s fallbacks

    for (const timestamp of fallbackTimestamps) {
      try {
        console.log(
          `ThumbnailExtractor: Trying fallback timestamp ${timestamp}ms`,
        );
        const thumbnail = await this._extractAtTimestamp(
          videoFile,
          timestamp,
          position,
          config,
        );

        if (thumbnail) {
          return thumbnail;
        }
      } catch (error) {
        console.warn(
          `ThumbnailExtractor: Fallback at ${timestamp}ms failed:`,
          error,
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Compress and optimize thumbnail
   * @param {Object} thumbnailResult - Raw thumbnail result from createThumbnail
   * @param {number} position - Video position for naming
   * @param {Object} config - Service configuration
   * @returns {Promise<Object>} Optimized thumbnail file object
   */
  static async _compressAndOptimize(thumbnailResult, position, config) {
    try {
      // Generate unique filename
      const filename = this._generateThumbnailFilename(position);

      // For now, use the raw thumbnail without compression to avoid API issues
      console.log('ThumbnailExtractor: Using raw thumbnail (compression disabled to avoid API issues)');

      // Create file object compatible with FormData using the raw thumbnail
      const thumbnailFile = {
        uri: thumbnailResult.path,
        type: 'image/jpeg',
        name: filename,
        fileSize: thumbnailResult.size || 1024000, // Use size from result or estimate
        width: thumbnailResult.width,
        height: thumbnailResult.height,
        position: position,
        originalVideoUri: thumbnailResult.path,
        timestamp: Date.now(),
      };

      console.log('ThumbnailExtractor: Raw thumbnail prepared:', {
        name: thumbnailFile.name,
        size: thumbnailFile.fileSize,
        dimensions: `${thumbnailFile.width}x${thumbnailFile.height}`,
      });

      return thumbnailFile;
    } catch (error) {
      console.error('ThumbnailExtractor: Error preparing thumbnail:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate video file object
   * @param {Object} videoFile - Video file to validate
   * @returns {boolean} Whether video file is valid
   */
  static _isValidVideoFile(videoFile) {
    if (!videoFile || typeof videoFile !== 'object') {
      return false;
    }

    const hasUri = videoFile.uri && typeof videoFile.uri === 'string';
    const hasValidType = videoFile.type && videoFile.type.startsWith('video/');

    return hasUri && hasValidType;
  }

  /**
   * Create timeout promise for extraction
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that rejects after timeout
   */
  static _createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Extraction timeout')), timeout);
    });
  }

  /**
   * Generate unique filename for thumbnail
   * @param {number} position - Video position
   * @returns {string} Unique filename
   */
  static _generateThumbnailFilename(position) {
    const timestamp = Date.now();
    return `thumbnail_${position + 1}_${timestamp}.jpg`;
  }

  /**
   * Get temporary directory for thumbnail storage
   * @param {Object} config - Service configuration
   * @returns {Promise<string>} Temporary directory path
   */
  static async _getTempDirectory(config) {
    const tempDir = `${RNFS.CachesDirectoryPath}/${
      config.TEMP_DIR_NAME || 'auto_thumbnails'
    }`;

    // Ensure directory exists
    const exists = await RNFS.exists(tempDir);
    if (!exists) {
      await RNFS.mkdir(tempDir);
    }

    return tempDir;
  }
}

export default ThumbnailExtractor;
