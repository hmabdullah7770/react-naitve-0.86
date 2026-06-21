import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MediaMapper from './MediaMapper';
import StoreProductMapper from './StoreProductMapper';
import SocialMediaMapper from './SocialMediaMapper';

/**
 * PostDataCollector - Central service for collecting and validating post creation data
 * Handles data from all UI components and builds FormData for API submission
 */
class PostDataCollector {
  constructor() {
    // All mappers are now static classes, no need to instantiate
  }

  /**
   * Collect all data from components and build complete post data object
   * @param {Object} componentData - Data from all UI components
   * @returns {Promise<Object>} Complete post data object
   */
  async collectAllData(componentData) {
    try {
      const {
        title,
        description,
        selectedMedia,
        selectedLayout,
        videoSettings,
        uploadedAudio,
        appliedStore,
        appliedProduct,
        appliedCategory,
        appliedSocialMedia,
      } = componentData;

      // Collect basic text data
      const postData = {
        title: title || '',
        description: description || '',
        pattern: selectedLayout || '1',
      };

      // Collect media data
      if (selectedMedia && selectedMedia.length > 0) {
        postData.media = selectedMedia.map((media, index) => ({
          ...media,
          position: index,
          thumbnail: videoSettings?.thumbnails?.[index] || null,
          autoplay: media.isVideo ? (videoSettings?.autoPlay || false) : undefined,
        }));
      }

      // Collect audio data
      if (uploadedAudio) {
        postData.audio = uploadedAudio;
      }

      // Collect store data
      if (appliedStore) {
        postData.store = await this._collectStoreData(appliedStore);
      }

      // Collect product data
      if (appliedProduct) {
        postData.product = await this._collectProductData(appliedProduct);
      }

      // Collect category data
      if (appliedCategory) {
        postData.category = appliedCategory.name || appliedCategory;
      }

      // Collect social media data
      if (appliedSocialMedia) {
        postData.socialMedia = await this._collectSocialMediaData(appliedSocialMedia);
      }

      return postData;
    } catch (error) {
      console.error('Error collecting post data:', error);
      throw new Error('Failed to collect post data: ' + error.message);
    }
  }

  /**
   * Validate collected post data
   * @param {Object} postData - Complete post data object
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateData(postData) {
    const errors = [];

    // Validate required fields
    if (!postData.title || postData.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required',
        component: 'title',
      });
    }

    // Validate that there's some content
    const hasContent = postData.title || postData.description ||
                      (postData.media && postData.media.length > 0) ||
                      postData.audio || postData.store || postData.product;

    if (!hasContent) {
      errors.push({
        field: 'content',
        message: 'Please add some content to your post',
        component: 'general',
      });
    }

    // Validate media constraints based on layout
    if (postData.media && postData.media.length > 0) {
      const layoutErrors = this._validateLayoutConstraints(postData.pattern, postData.media);
      errors.push(...layoutErrors);
    }

    // Validate URLs if present
    if (postData.store && postData.store.type === 'url') {
      if (!this._isValidUrl(postData.store.value)) {
        errors.push({
          field: 'storeUrl',
          message: 'Please enter a valid store URL',
          component: 'store',
        });
      }
    }

    if (postData.product && postData.product.type === 'url') {
      if (!this._isValidUrl(postData.product.value)) {
        errors.push({
          field: 'productUrl',
          message: 'Please enter a valid product URL',
          component: 'product',
        });
      }
    }

    // Validate social media URLs
    if (postData.socialMedia) {
      const socialErrors = this._validateSocialMediaUrls(postData.socialMedia);
      errors.push(...socialErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build FormData from validated post data
   * @param {Object} postData - Complete post data object
   * @returns {FormData} Ready-to-submit FormData object
   */
  buildFormData(postData) {
    const formData = new FormData();

    try {
      // Add basic text fields
      this._appendIfExists(formData, 'title', postData.title);
      this._appendIfExists(formData, 'description', postData.description);
      this._appendIfExists(formData, 'pattern', postData.pattern);

      // Add media files using MediaMapper
      if (postData.media && postData.media.length > 0) {
        // Extract video settings for the MediaMapper
        const videoSettings = {
          autoPlay: true, // Default value
          thumbnails: {},
        };

        // Build thumbnails map from media data
        postData.media.forEach((media, index) => {
          if (media.isVideo && media.thumbnail) {
            videoSettings.thumbnails[index] = media.thumbnail;
          }
          if (media.isVideo && media.autoplay !== undefined) {
            videoSettings.autoPlay = media.autoplay;
          }
        });

        MediaMapper.mapMediaToFormData(postData.media, videoSettings, formData);
      }

      // Add audio file
      if (postData.audio) {
        this._appendFile(formData, 'audioFile', postData.audio);
      }

      // Add store data using StoreProductMapper
      if (postData.store) {
        StoreProductMapper.mapStoreToFormData(postData.store, formData);
      }

      // Add product data using StoreProductMapper
      if (postData.product) {
        StoreProductMapper.mapProductToFormData(postData.product, formData);
      }

      // Add category
      this._appendIfExists(formData, 'category', postData.category);

      // Add social media data using SocialMediaMapper
      if (postData.socialMedia) {
        SocialMediaMapper.mapToFormData(postData.socialMedia, formData);
      }

      return formData;
    } catch (error) {
      console.error('Error building FormData:', error);
      throw new Error('Failed to build FormData: ' + error.message);
    }
  }

  // Private helper methods

  async _collectStoreData(appliedStore) {
    if (appliedStore.type === 'store') {
      // Get store ID from AsyncStorage/Keychain
      try {
        const creds = await Keychain.getGenericPassword({service: 'storeId'});
        return {
          type: 'store',
          value: creds ? (creds.password || creds.username) : null,
          iconSize: appliedStore.iconSize || 'large',
        };
      } catch (error) {
        console.warn('Error getting store ID from keychain:', error);
        return null;
      }
    } else {
      return {
        type: 'url',
        value: appliedStore.value,
        iconSize: appliedStore.iconSize || 'large',
      };
    }
  }

  async _collectProductData(appliedProduct) {
    return {
      type: appliedProduct.type,
      value: appliedProduct.value,
      iconSize: appliedProduct.iconSize || 'small',
    };
  }

  async _collectSocialMediaData(appliedSocialMedia) {
    const socialData = {};

    // Process each platform
    for (const [platform, data] of Object.entries(appliedSocialMedia)) {
      if (data.enabled && data.hasAsyncValue) {
        // Use AsyncStorage value
        socialData[platform] = {
          enabled: true,
          asyncValue: data.asyncValue,
        };
      } else if (!data.enabled && data.link) {
        // Use custom URL
        const urlField = platform === 'whatsapp' ? 'number' :
                        platform === 'storeLink' ? 'url' : 'link';
        socialData[platform] = {
          enabled: false,
          customUrl: data[urlField],
        };
      }
    }

    return socialData;
  }

  _validateLayoutConstraints(pattern, media) {
    const errors = [];
    const layoutConstraints = {
      '1': { minItems: 1, maxItems: 1 },
      '2': { minItems: 1, maxItems: 2 },
      '2x2': { minItems: 4, maxItems: 4 },
      '1x2': { minItems: 3, maxItems: 3 },
      '1x3': { minItems: 4, maxItems: 4 },
      'carousel': { minItems: 2, maxItems: 10 },
    };

    const constraints = layoutConstraints[pattern];
    if (constraints) {
      if (media.length < constraints.minItems) {
        errors.push({
          field: 'media',
          message: `${pattern} layout requires at least ${constraints.minItems} items`,
          component: 'media',
        });
      }
      if (media.length > constraints.maxItems) {
        errors.push({
          field: 'media',
          message: `${pattern} layout accepts maximum ${constraints.maxItems} items`,
          component: 'media',
        });
      }
    }

    return errors;
  }

  _validateSocialMediaUrls(socialMedia) {
    const errors = [];

    for (const [platform, data] of Object.entries(socialMedia)) {
      if (data.customUrl && !this._isValidUrl(data.customUrl)) {
        errors.push({
          field: `${platform}Url`,
          message: `Please enter a valid ${platform} URL`,
          component: 'social',
        });
      }
    }

    return errors;
  }

  _isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // Try with http prefix
      try {
        new URL('http://' + string);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  _appendIfExists(formData, key, value) {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  }

  _appendFile(formData, key, file) {
    if (file && (file.uri || file.path)) {
      formData.append(key, {
        uri: file.uri || file.path,
        type: file.type || file.mimeType || 'application/octet-stream',
        name: file.fileName || file.name || key,
      });
    }
  }
}







export default PostDataCollector;
