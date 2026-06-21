import {createThumbnail} from 'react-native-create-thumbnail';
import {Image} from 'react-native-compressor';
import RNFS from 'react-native-fs';
import FormDataAnalyzer from './FormDataAnalyzer';
import ThumbnailExtractor from './ThumbnailExtractor';

/**
 * ThumbnailCreationService - Automatic video thumbnail generation service
 * Extracts thumbnails from video center frames when users don't provide custom thumbnails
 */
class ThumbnailCreationService {
  // Service configuration with feature flag
  static config = {
    // Feature flag - can be toggled without code changes
    ENABLE_AUTO_THUMBNAILS: true,

    // Extraction settings
    THUMBNAIL_QUALITY: 0.8,
    MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024, // 2MB
    MAX_RESOLUTION: {
      width: 1920,
      height: 1080,
    },
    EXTRACTION_TIMEOUT: 30000, // 30 seconds

    // Cleanup settings
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    TEMP_DIR_NAME: 'auto_thumbnails',

    // Fallback settings
    PRIMARY_TIMESTAMP_RATIO: 0.5, // 50% of video duration
    FALLBACK_TIMESTAMPS: [0.25, 0.75], // 25% and 75% fallbacks
  };

  // Track generated thumbnails for cleanup
  static generatedThumbnails = [];

  /**
   * Enable/disable the service
   * @param {boolean} enabled - Service state
   */
  static setEnabled(enabled) {
    this.config.ENABLE_AUTO_THUMBNAILS = enabled;
    console.log(
      `ThumbnailCreationService: Service ${enabled ? 'enabled' : 'disabled'}`,
    );
  }

  /**
   * Check if service is enabled
   * @returns {boolean} Service enabled state
   */
  static isEnabled() {
    return this.config.ENABLE_AUTO_THUMBNAILS;
  }

  /**
   * Update service configuration with validation
   * @param {Object} newConfig - Configuration updates
   */
  static updateConfig(newConfig) {
    try {
      // Validate configuration values
      const validatedConfig = this._validateConfig(newConfig);

      this.config = {
        ...this.config,
        ...validatedConfig,
      };

      console.log(
        'ThumbnailCreationService: Configuration updated',
        validatedConfig,
      );
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Invalid configuration:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current service configuration
   */
  static getConfig() {
    return {...this.config};
  }

  /**
   * Reset configuration to defaults
   */
  static resetConfig() {
    this.config = {
      ENABLE_AUTO_THUMBNAILS: true,
      THUMBNAIL_QUALITY: 0.8,
      MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024,
      MAX_RESOLUTION: {
        width: 1920,
        height: 1080,
      },
      EXTRACTION_TIMEOUT: 30000,
      CLEANUP_INTERVAL: 24 * 60 * 60 * 1000,
      TEMP_DIR_NAME: 'auto_thumbnails',
      PRIMARY_TIMESTAMP_RATIO: 0.5,
      FALLBACK_TIMESTAMPS: [0.25, 0.75],
    };
    console.log('ThumbnailCreationService: Configuration reset to defaults');
  }

  /**
   * Main entry point - processes FormData before API submission
   * @param {FormData} formData - The FormData to process
   * @returns {Promise<FormData>} Enhanced FormData with generated thumbnails
   */
  static async processFormData(formData) {
    try {
      console.log(
        '=== ThumbnailCreationService: Starting FormData processing ===',
      );

      // Check if service is enabled
      if (!this.isEnabled()) {
        console.log(
          'ThumbnailCreationService: Service disabled, returning original FormData',
        );
        return formData;
      }

      // Quick check: Do we have any video files at all?
      const hasVideoFiles = this._hasVideoFiles(formData);
      if (!hasVideoFiles) {
        console.log(
          'ThumbnailCreationService: No video files found in FormData, skipping processing',
        );
        return formData;
      }

      // Clear previous generation tracking
      this.generatedThumbnails = [];

      // Process FormData and return enhanced version
      const enhancedFormData = await this._processFormDataInternal(formData);

      console.log(
        `ThumbnailCreationService: Processing complete. Generated ${this.generatedThumbnails.length} thumbnails`,
      );
      return enhancedFormData;
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Error processing FormData:',
        error,
      );
      // Return original FormData on error to not break post creation
      return formData;
    }
  }

  /**
   * Cleanup generated thumbnails after API response
   * @param {Array} generatedThumbnails - List of generated thumbnail paths (optional, uses internal tracking if not provided)
   * @param {boolean} apiSuccess - Whether API call succeeded
   */
  static async cleanup(generatedThumbnails = null, apiSuccess = false) {
    try {
      const thumbnailsToClean = generatedThumbnails || this.generatedThumbnails;

      if (!thumbnailsToClean || thumbnailsToClean.length === 0) {
        console.log('ThumbnailCreationService: No thumbnails to cleanup');
        return {success: true, cleaned: 0, errors: []};
      }

      console.log(
        `ThumbnailCreationService: Cleaning up ${
          thumbnailsToClean.length
        } thumbnails (API ${apiSuccess ? 'success' : 'failure'})`,
      );

      const filePaths = thumbnailsToClean
        .map(thumb => {
          if (typeof thumb === 'string') {
            return thumb;
          }
          if (thumb && typeof thumb === 'object') {
            return thumb.uri || thumb.path || thumb.filePath;
          }
          return null;
        })
        .filter(Boolean);

      console.log(
        `ThumbnailCreationService: Attempting to delete ${filePaths.length} files`,
      );

      const cleanupResults = await this._deleteFilesWithResults(filePaths);

      // Clear internal tracking
      this.generatedThumbnails = [];

      console.log(
        `ThumbnailCreationService: Cleanup completed. Success: ${cleanupResults.success}, Errors: ${cleanupResults.errors.length}`,
      );

      return cleanupResults;
    } catch (error) {
      console.error('ThumbnailCreationService: Error during cleanup:', error);
      return {success: false, cleaned: 0, errors: [error.message]};
    }
  }

  /**
   * Enhanced cleanup for app startup - removes orphaned files
   */
  static async startupCleanup() {
    try {
      console.log('ThumbnailCreationService: Starting startup cleanup...');

      // Clean up old files
      await this.cleanupOldFiles();

      // Clean up any remaining files in temp directory that might be orphaned
      const tempDir = await this._getTempDirectory();
      const files = await RNFS.readDir(tempDir);

      if (files.length > 0) {
        console.log(
          `ThumbnailCreationService: Found ${files.length} files in temp directory during startup`,
        );
        const filePaths = files.map(file => file.path);
        await this._deleteFiles(filePaths);
        console.log('ThumbnailCreationService: Startup cleanup completed');
      } else {
        console.log(
          'ThumbnailCreationService: No files to clean up during startup',
        );
      }
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Error during startup cleanup:',
        error,
      );
    }
  }

  /**
   * Cleanup old thumbnail files (older than 24 hours)
   */
  static async cleanupOldFiles() {
    try {
      const tempDir = await this._getTempDirectory();
      const files = await RNFS.readDir(tempDir);
      const now = Date.now();
      const maxAge = this.config.CLEANUP_INTERVAL;

      const oldFiles = files.filter(file => {
        const fileAge = now - new Date(file.mtime).getTime();
        return fileAge > maxAge;
      });

      if (oldFiles.length > 0) {
        console.log(
          `ThumbnailCreationService: Cleaning up ${oldFiles.length} old thumbnail files`,
        );
        const filePaths = oldFiles.map(file => file.path);
        await this._deleteFiles(filePaths);
      }
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Error cleaning up old files:',
        error,
      );
    }
  }

  // Private helper methods

  /**
   * Internal FormData processing logic
   * @param {FormData} formData - FormData to process
   * @returns {Promise<FormData>} Enhanced FormData
   */
  static async _processFormDataInternal(formData) {
    try {
      // Analyze FormData to find videos needing thumbnails
      const videosNeedingThumbnails =
        FormDataAnalyzer.findVideosNeedingThumbnails(formData);

      if (videosNeedingThumbnails.length === 0) {
        console.log('ThumbnailCreationService: No videos need thumbnails');
        return formData;
      }

      console.log(
        `ThumbnailCreationService: Processing ${videosNeedingThumbnails.length} videos for thumbnail generation`,
      );

      // Log detailed analysis for debugging
      if (__DEV__) {
        FormDataAnalyzer.logAnalysis(formData);
      }

      // Generate thumbnails for each video
      const generatedThumbnails = await this._generateThumbnailsForVideos(
        videosNeedingThumbnails,
      );

      // Add generated thumbnails to FormData
      const enhancedFormData = this._addThumbnailsToFormData(
        formData,
        generatedThumbnails,
      );

      // Track generated thumbnails for cleanup
      this.generatedThumbnails = generatedThumbnails.filter(
        thumb => thumb !== null,
      );

      console.log(
        `ThumbnailCreationService: Successfully generated ${this.generatedThumbnails.length} thumbnails`,
      );
      return enhancedFormData;
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Error in internal processing:',
        error,
      );
      return formData;
    }
  }

  /**
   * Generate thumbnails for multiple videos
   * @param {Array} videosNeedingThumbnails - Array of video analysis results
   * @returns {Promise<Array>} Array of generated thumbnails (or null for failed extractions)
   */
  static async _generateThumbnailsForVideos(videosNeedingThumbnails) {
    const thumbnailPromises = videosNeedingThumbnails.map(async videoInfo => {
      try {
        console.log(
          `ThumbnailCreationService: Generating thumbnail for ${videoInfo.videoField}`,
        );

        // Extract thumbnail using ThumbnailExtractor
        const thumbnail = await ThumbnailExtractor.extractThumbnail(
          videoInfo.videoFile,
          videoInfo.position,
          this.config,
        );

        if (thumbnail) {
          // Add metadata for tracking
          thumbnail.videoField = videoInfo.videoField;
          thumbnail.thumbnailField = videoInfo.thumbnailField;

          console.log(
            `ThumbnailCreationService: Successfully generated thumbnail for ${videoInfo.videoField}`,
          );
          return thumbnail;
        } else {
          console.warn(
            `ThumbnailCreationService: Failed to generate thumbnail for ${videoInfo.videoField}`,
          );
          return null;
        }
      } catch (error) {
        console.error(
          `ThumbnailCreationService: Error generating thumbnail for ${videoInfo.videoField}:`,
          error,
        );
        return null;
      }
    });

    // Wait for all thumbnail generation to complete
    const results = await Promise.all(thumbnailPromises);

    const successCount = results.filter(result => result !== null).length;
    const failCount = results.length - successCount;

    console.log(
      `ThumbnailCreationService: Thumbnail generation complete. Success: ${successCount}, Failed: ${failCount}`,
    );

    return results;
  }

  /**
   * Add generated thumbnails to FormData
   * @param {FormData} formData - Original FormData
   * @param {Array} generatedThumbnails - Array of generated thumbnails
   * @returns {FormData} Enhanced FormData with thumbnails
   */
  static _addThumbnailsToFormData(formData, generatedThumbnails) {
    try {
      // Create a new FormData to avoid modifying the original
      const enhancedFormData = new FormData();

      // Copy all existing entries from original FormData using _parts
      if (formData && formData._parts) {
        const parts = formData._parts;
        for (const [key, value] of parts) {
          enhancedFormData.append(key, value);
        }
      }

      // Add generated thumbnails
      generatedThumbnails.forEach(thumbnail => {
        if (thumbnail && thumbnail.thumbnailField) {
          console.log(
            `ThumbnailCreationService: Adding ${thumbnail.thumbnailField} to FormData`,
          );

          enhancedFormData.append(thumbnail.thumbnailField, {
            uri: thumbnail.uri,
            type: thumbnail.type,
            name: thumbnail.name,
          });
        }
      });

      return enhancedFormData;
    } catch (error) {
      console.error(
        'ThumbnailCreationService: Error adding thumbnails to FormData:',
        error,
      );
      return formData; // Return original on error
    }
  }

  /**
   * Get temporary directory for thumbnail storage
   * @returns {Promise<string>} Temporary directory path
   */
  static async _getTempDirectory() {
    const tempDir = `${RNFS.CachesDirectoryPath}/${this.config.TEMP_DIR_NAME}`;

    // Ensure directory exists
    const exists = await RNFS.exists(tempDir);
    if (!exists) {
      await RNFS.mkdir(tempDir);
    }

    return tempDir;
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
   * Delete thumbnail files
   * @param {Array} filePaths - Array of file paths to delete
   */
  static async _deleteFiles(filePaths) {
    const deletePromises = filePaths.map(async filePath => {
      try {
        const exists = await RNFS.exists(filePath);
        if (exists) {
          await RNFS.unlink(filePath);
          console.log(`ThumbnailCreationService: Deleted file: ${filePath}`);
        }
      } catch (error) {
        console.warn(
          `ThumbnailCreationService: Failed to delete file ${filePath}:`,
          error,
        );
      }
    });

    await Promise.all(deletePromises);
  }

  /**
   * Delete thumbnail files with detailed results tracking
   * @param {Array} filePaths - Array of file paths to delete
   * @returns {Object} Results object with success count and errors
   */
  static async _deleteFilesWithResults(filePaths) {
    const results = {
      success: true,
      cleaned: 0,
      errors: [],
    };

    const deletePromises = filePaths.map(async filePath => {
      try {
        const exists = await RNFS.exists(filePath);
        if (exists) {
          await RNFS.unlink(filePath);
          console.log(`ThumbnailCreationService: Deleted file: ${filePath}`);
          results.cleaned++;
        } else {
          console.log(
            `ThumbnailCreationService: File already deleted: ${filePath}`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to delete file ${filePath}: ${error.message}`;
        console.warn(`ThumbnailCreationService: ${errorMsg}`);
        results.errors.push(errorMsg);
        results.success = false;
      }
    });

    await Promise.all(deletePromises);
    return results;
  }

  /**
   * Validate configuration values
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validated configuration
   */
  static _validateConfig(config) {
    const validated = {};

    // Validate boolean values
    if (config.ENABLE_AUTO_THUMBNAILS !== undefined) {
      if (typeof config.ENABLE_AUTO_THUMBNAILS !== 'boolean') {
        throw new Error('ENABLE_AUTO_THUMBNAILS must be a boolean');
      }
      validated.ENABLE_AUTO_THUMBNAILS = config.ENABLE_AUTO_THUMBNAILS;
    }

    // Validate quality (0-1)
    if (config.THUMBNAIL_QUALITY !== undefined) {
      if (
        typeof config.THUMBNAIL_QUALITY !== 'number' ||
        config.THUMBNAIL_QUALITY < 0 ||
        config.THUMBNAIL_QUALITY > 1
      ) {
        throw new Error('THUMBNAIL_QUALITY must be a number between 0 and 1');
      }
      validated.THUMBNAIL_QUALITY = config.THUMBNAIL_QUALITY;
    }

    // Validate max file size (positive number)
    if (config.MAX_THUMBNAIL_SIZE !== undefined) {
      if (
        typeof config.MAX_THUMBNAIL_SIZE !== 'number' ||
        config.MAX_THUMBNAIL_SIZE <= 0
      ) {
        throw new Error('MAX_THUMBNAIL_SIZE must be a positive number');
      }
      validated.MAX_THUMBNAIL_SIZE = config.MAX_THUMBNAIL_SIZE;
    }

    // Validate resolution object
    if (config.MAX_RESOLUTION !== undefined) {
      if (
        !config.MAX_RESOLUTION ||
        typeof config.MAX_RESOLUTION.width !== 'number' ||
        typeof config.MAX_RESOLUTION.height !== 'number' ||
        config.MAX_RESOLUTION.width <= 0 ||
        config.MAX_RESOLUTION.height <= 0
      ) {
        throw new Error(
          'MAX_RESOLUTION must have positive width and height numbers',
        );
      }
      validated.MAX_RESOLUTION = config.MAX_RESOLUTION;
    }

    // Validate timeout (positive number)
    if (config.EXTRACTION_TIMEOUT !== undefined) {
      if (
        typeof config.EXTRACTION_TIMEOUT !== 'number' ||
        config.EXTRACTION_TIMEOUT <= 0
      ) {
        throw new Error('EXTRACTION_TIMEOUT must be a positive number');
      }
      validated.EXTRACTION_TIMEOUT = config.EXTRACTION_TIMEOUT;
    }

    // Validate cleanup interval (positive number)
    if (config.CLEANUP_INTERVAL !== undefined) {
      if (
        typeof config.CLEANUP_INTERVAL !== 'number' ||
        config.CLEANUP_INTERVAL <= 0
      ) {
        throw new Error('CLEANUP_INTERVAL must be a positive number');
      }
      validated.CLEANUP_INTERVAL = config.CLEANUP_INTERVAL;
    }

    // Validate temp directory name (non-empty string)
    if (config.TEMP_DIR_NAME !== undefined) {
      if (
        typeof config.TEMP_DIR_NAME !== 'string' ||
        config.TEMP_DIR_NAME.trim() === ''
      ) {
        throw new Error('TEMP_DIR_NAME must be a non-empty string');
      }
      validated.TEMP_DIR_NAME = config.TEMP_DIR_NAME.trim();
    }

    // Validate timestamp ratio (0-1)
    if (config.PRIMARY_TIMESTAMP_RATIO !== undefined) {
      if (
        typeof config.PRIMARY_TIMESTAMP_RATIO !== 'number' ||
        config.PRIMARY_TIMESTAMP_RATIO < 0 ||
        config.PRIMARY_TIMESTAMP_RATIO > 1
      ) {
        throw new Error(
          'PRIMARY_TIMESTAMP_RATIO must be a number between 0 and 1',
        );
      }
      validated.PRIMARY_TIMESTAMP_RATIO = config.PRIMARY_TIMESTAMP_RATIO;
    }

    // Validate fallback timestamps array
    if (config.FALLBACK_TIMESTAMPS !== undefined) {
      if (
        !Array.isArray(config.FALLBACK_TIMESTAMPS) ||
        !config.FALLBACK_TIMESTAMPS.every(
          t => typeof t === 'number' && t >= 0 && t <= 1,
        )
      ) {
        throw new Error(
          'FALLBACK_TIMESTAMPS must be an array of numbers between 0 and 1',
        );
      }
      validated.FALLBACK_TIMESTAMPS = config.FALLBACK_TIMESTAMPS;
    }

    return validated;
  }

  /**
   * Quick check if FormData contains any video files
   * @param {FormData} formData - FormData to check
   * @returns {boolean} Whether any video files exist
   */
  static _hasVideoFiles(formData) {
    try {
      // React Native FormData uses _parts instead of entries()
      if (!formData || !formData._parts) {
        console.log(
          'ThumbnailCreationService: FormData has no _parts property',
        );
        return false;
      }

      const parts = formData._parts;
      console.log(
        `ThumbnailCreationService: Checking ${parts.length} FormData parts for video files`,
      );

      // Debug: Log all field names to see what we have
      const fieldNames = parts.map(([key]) => key);
      console.log(
        'ThumbnailCreationService: FormData field names:',
        fieldNames,
      );

      for (const [key, value] of parts) {
        // Check if field name matches video pattern (videoFile1, videoFile2, etc.)
        if (/^videoFile\d+$/.test(key)) {
          // Check if value is a valid file object
          if (value && typeof value === 'object' && value.uri && value.type) {
            console.log(`ThumbnailCreationService: Found video file: ${key}`);
            return true;
          }
        }
      }

      console.log('ThumbnailCreationService: No video files found in FormData');
      return false;
    } catch (error) {
      console.warn(
        'ThumbnailCreationService: Error checking for video files:',
        error,
      );
      return false;
    }
  }

  /**
   * Check if required libraries are available
   * @returns {boolean} Whether required libraries are installed
   */
  static _areLibrariesAvailable() {
    try {
      // Check if the imported libraries are available
      return !!(createThumbnail && Image && RNFS);
    } catch (error) {
      console.warn(
        'ThumbnailCreationService: Required libraries not available:',
        error.message,
      );
      return false;
    }
  }

  /**
   * Log service status and configuration
   */
  static logStatus() {
    console.log('=== ThumbnailCreationService Status ===');
    console.log('Enabled:', this.isEnabled());
    console.log('Libraries available:', this._areLibrariesAvailable());
    console.log(
      'Generated thumbnails tracked:',
      this.generatedThumbnails.length,
    );
    console.log('Configuration:', this.config);
    console.log('=====================================');
  }
}

export default ThumbnailCreationService;
