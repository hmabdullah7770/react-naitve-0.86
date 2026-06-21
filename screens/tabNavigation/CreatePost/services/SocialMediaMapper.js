/**
 * SocialMediaMapper - Handles mapping of social media data to FormData
 * Maps platform flags and URLs to API-compatible format
 */
class SocialMediaMapper {
  /**
   * Map complete social media data to FormData
   * @param {Object} socialMediaData - Social media data from MediaBottomnav
   * @param {FormData} formData - FormData object to append to
   */
  static mapToFormData(socialMediaData, formData) {
    if (!socialMediaData || !formData) {
      console.warn('SocialMediaMapper: Invalid socialMediaData or formData provided');
      return;
    }

    try {
      // Map platform flags (boolean values for enabled platforms)
      this.mapPlatformFlags(socialMediaData, formData);

      // Map platform URLs (custom URLs for platforms)
      this.mapPlatformUrls(socialMediaData, formData);
    } catch (error) {
      console.error('SocialMediaMapper: Error mapping social media data:', error);
    }
  }

  /**
   * Map platform enabled flags to FormData
   * @param {Object} socialMediaData - Social media data object
   * @param {FormData} formData - FormData object to append to
   */
  static mapPlatformFlags(socialMediaData, formData) {
    const platformMap = {
      facebook: 'facebook',
      instagram: 'instagram',
      whatsapp: 'whatsapp',
      storeLink: 'storeLink',
    };

    for (const [platform, formField] of Object.entries(platformMap)) {
      const platformData = socialMediaData[platform];

      if (platformData && platformData.enabled && platformData.hasAsyncValue) {
        // Platform is enabled and has AsyncStorage value
        formData.append(formField, 'true');
        console.log(`SocialMediaMapper: Enabled ${platform} with AsyncStorage value`);
      }
    }
  }

  /**
   * Map platform custom URLs to FormData
   * @param {Object} socialMediaData - Social media data object
   * @param {FormData} formData - FormData object to append to
   */
  static mapPlatformUrls(socialMediaData, formData) {
    const urlMap = {
      facebook: 'facebookurl',
      instagram: 'instagramurl',
      whatsapp: 'whatsappnumberurl',
      storeLink: 'storelinkurl',
    };

    for (const [platform, formField] of Object.entries(urlMap)) {
      const platformData = socialMediaData[platform];

      if (platformData && !platformData.enabled) {
        // Platform is not enabled, check for custom URL
        const customUrl = this.getCustomUrl(platform, platformData);
        if (customUrl) {
          formData.append(formField, customUrl);
          console.log(`SocialMediaMapper: Added custom URL for ${platform}: ${customUrl}`);
        }
      }
    }
  }

  /**
   * Get custom URL from platform data
   * @param {string} platform - Platform name (facebook, instagram, whatsapp, storeLink)
   * @param {Object} platformData - Platform data object
   * @returns {string|null} Custom URL or null if not found
   */
  static getCustomUrl(platform, platformData) {
    if (!platformData) {
      return null;
    }

    // Different platforms use different field names for custom URLs
    switch (platform) {
      case 'whatsapp':
        return platformData.number || null;
      case 'storeLink':
        return platformData.url || null;
      case 'facebook':
      case 'instagram':
        return platformData.link || null;
      default:
        console.warn(`SocialMediaMapper: Unknown platform '${platform}'`);
        return null;
    }
  }

  /**
   * Validate social media data before mapping
   * @param {Object} socialMediaData - Social media data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateSocialMediaData(socialMediaData) {
    const result = {
      isValid: true,
      errors: [],
    };

    if (!socialMediaData || typeof socialMediaData !== 'object') {
      result.isValid = false;
      result.errors.push('Social media data must be an object');
      return result;
    }

    const supportedPlatforms = ['facebook', 'instagram', 'whatsapp', 'storeLink'];

    for (const [platform, platformData] of Object.entries(socialMediaData)) {
      if (!supportedPlatforms.includes(platform)) {
        result.errors.push(`Unsupported platform: ${platform}`);
        continue;
      }

      if (platformData && typeof platformData !== 'object') {
        result.errors.push(`Platform data for ${platform} must be an object`);
        continue;
      }

      // Validate custom URLs if present
      if (platformData && !platformData.enabled) {
        const customUrl = this.getCustomUrl(platform, platformData);
        if (customUrl && !this.isValidUrl(customUrl, platform)) {
          result.isValid = false;
          result.errors.push(`Invalid URL format for ${platform}: ${customUrl}`);
        }
      }

      // Validate AsyncStorage values for enabled platforms
      if (platformData && platformData.enabled && !platformData.hasAsyncValue) {
        result.errors.push(`Platform ${platform} is enabled but has no AsyncStorage value`);
      }
    }

    return result;
  }

  /**
   * Validate URL format for specific platform
   * @param {string} url - URL to validate
   * @param {string} platform - Platform name for specific validation
   * @returns {boolean} True if valid URL for the platform
   */
  static isValidUrl(url, platform) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // WhatsApp number validation (can be just numbers or with + prefix)
    if (platform === 'whatsapp') {
      return /^(\+)?[1-9]\d{1,14}$/.test(url.replace(/\s/g, ''));
    }

    // General URL validation for other platforms
    try {
      new URL(url);
      return true;
    } catch {
      // Try with http prefix
      try {
        new URL('http://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get field names that would be used for given social media data
   * Useful for debugging and validation
   * @param {Object} socialMediaData - Social media data
   * @returns {Object} Object with arrays of field names
   */
  static getFieldNamesForData(socialMediaData) {
    const fieldNames = {
      flags: [],
      urls: [],
    };

    if (!socialMediaData) {
      return fieldNames;
    }

    const platformMap = {
      facebook: { flag: 'facebook', url: 'facebookurl' },
      instagram: { flag: 'instagram', url: 'instagramurl' },
      whatsapp: { flag: 'whatsapp', url: 'whatsappnumberurl' },
      storeLink: { flag: 'storeLink', url: 'storelinkurl' },
    };

    for (const [platform, fields] of Object.entries(platformMap)) {
      const platformData = socialMediaData[platform];

      if (platformData) {
        if (platformData.enabled && platformData.hasAsyncValue) {
          fieldNames.flags.push(fields.flag);
        }

        if (!platformData.enabled && this.getCustomUrl(platform, platformData)) {
          fieldNames.urls.push(fields.url);
        }
      }
    }

    return fieldNames;
  }

  /**
   * Get summary of social media data for debugging
   * @param {Object} socialMediaData - Social media data
   * @returns {Object} Summary object with counts and details
   */
  static getSummary(socialMediaData) {
    const summary = {
      totalPlatforms: 0,
      enabledPlatforms: 0,
      customUrls: 0,
      platforms: {},
    };

    if (!socialMediaData) {
      return summary;
    }

    for (const [platform, platformData] of Object.entries(socialMediaData)) {
      summary.totalPlatforms++;

      const platformSummary = {
        enabled: false,
        hasAsyncValue: false,
        hasCustomUrl: false,
        customUrl: null,
      };

      if (platformData) {
        platformSummary.enabled = !!platformData.enabled;
        platformSummary.hasAsyncValue = !!platformData.hasAsyncValue;

        const customUrl = this.getCustomUrl(platform, platformData);
        if (customUrl) {
          platformSummary.hasCustomUrl = true;
          platformSummary.customUrl = customUrl;
          summary.customUrls++;
        }

        if (platformData.enabled && platformData.hasAsyncValue) {
          summary.enabledPlatforms++;
        }
      }

      summary.platforms[platform] = platformSummary;
    }

    return summary;
  }
}

export default SocialMediaMapper;
