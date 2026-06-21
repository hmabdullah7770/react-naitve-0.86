/**
 * StoreProductMapper - Handles mapping of store and product data to FormData
 * Converts store/product selections and sizes to API-compatible format
 */
class StoreProductMapper {
  /**
   * Map store data to FormData fields
   * @param {Object} storeData - Store data object with type, value, iconSize
   * @param {FormData} formData - FormData object to append to
   */
  static mapStoreToFormData(storeData, formData) {
    if (!storeData || !formData) {
      console.warn('StoreProductMapper: Invalid storeData or formData provided');
      return;
    }

    try {
      if (storeData.type === 'store' && storeData.value) {
        // Store ID from AsyncStorage/Keychain
        formData.append('storeId', storeData.value);
        formData.append('storeisActive', 'true');
      } else if (storeData.type === 'url' && storeData.value) {
        // Custom store URL
        formData.append('storeUrl', storeData.value);
        formData.append('storeisActive', 'true');
      }

      // Add store icon size (convert 'large'/'small' to 'L'/'S')
      if (storeData.iconSize) {
        const sizeValue = this.getIconSizeValue(storeData.iconSize);
        formData.append('storeIconSize', sizeValue);
      }
    } catch (error) {
      console.error('StoreProductMapper: Error mapping store data:', error);
    }
  }

  /**
   * Map product data to FormData fields
   * @param {Object} productData - Product data object with type, value, iconSize
   * @param {FormData} formData - FormData object to append to
   */
  static mapProductToFormData(productData, formData) {
    if (!productData || !formData) {
      console.warn('StoreProductMapper: Invalid productData or formData provided');
      return;
    }

    try {
      if (productData.type === 'product' && productData.value) {
        // Product ID from dropdown selection
        const productId = this.extractProductId(productData.value);
        if (productId) {
          formData.append('ProductId', productId);
          formData.append('productisActive', 'true');
        }
      } else if (productData.type === 'url' && productData.value) {
        // Custom product URL
        formData.append('productUrl', productData.value);
        formData.append('productisActive', 'true');
      }

      // Add product icon size (convert 'large'/'small' to 'L'/'S')
      if (productData.iconSize) {
        const sizeValue = this.getIconSizeValue(productData.iconSize);
        formData.append('productIconSize', sizeValue);
      }
    } catch (error) {
      console.error('StoreProductMapper: Error mapping product data:', error);
    }
  }

  /**
   * Convert icon size from UI format to API format
   * @param {string} size - Size from UI ('large' or 'small')
   * @returns {string} API format size ('L' or 'S')
   */
  static getIconSizeValue(size) {
    switch (size?.toLowerCase()) {
      case 'large':
        return 'L';
      case 'small':
        return 'S';
      default:
        console.warn(`StoreProductMapper: Unknown size '${size}', defaulting to 'L'`);
        return 'L';
    }
  }

  /**
   * Extract product ID from product object or string
   * @param {Object|string} productValue - Product object or ID string
   * @returns {string|null} Product ID or null if not found
   */
  static extractProductId(productValue) {
    if (!productValue) {
      return null;
    }

    // If it's already a string, assume it's the ID
    if (typeof productValue === 'string') {
      return productValue;
    }

    // If it's an object, try to extract ID
    if (typeof productValue === 'object') {
      return productValue._id || productValue.id || productValue.productId || null;
    }

    console.warn('StoreProductMapper: Unable to extract product ID from:', productValue);
    return null;
  }

  /**
   * Validate store data before mapping
   * @param {Object} storeData - Store data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateStoreData(storeData) {
    const result = {
      isValid: true,
      errors: [],
    };

    if (!storeData) {
      result.isValid = false;
      result.errors.push('Store data is required');
      return result;
    }

    if (!storeData.type) {
      result.isValid = false;
      result.errors.push('Store type is required');
    }

    if (!storeData.value) {
      result.isValid = false;
      result.errors.push('Store value is required');
    }

    if (storeData.type === 'url' && !this.isValidUrl(storeData.value)) {
      result.isValid = false;
      result.errors.push('Invalid store URL format');
    }

    if (storeData.iconSize && !['large', 'small'].includes(storeData.iconSize)) {
      result.errors.push('Invalid icon size, must be "large" or "small"');
    }

    return result;
  }

  /**
   * Validate product data before mapping
   * @param {Object} productData - Product data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateProductData(productData) {
    const result = {
      isValid: true,
      errors: [],
    };

    if (!productData) {
      result.isValid = false;
      result.errors.push('Product data is required');
      return result;
    }

    if (!productData.type) {
      result.isValid = false;
      result.errors.push('Product type is required');
    }

    if (!productData.value) {
      result.isValid = false;
      result.errors.push('Product value is required');
    }

    if (productData.type === 'product' && !this.extractProductId(productData.value)) {
      result.isValid = false;
      result.errors.push('Invalid product selection, missing ID');
    }

    if (productData.type === 'url' && !this.isValidUrl(productData.value)) {
      result.isValid = false;
      result.errors.push('Invalid product URL format');
    }

    if (productData.iconSize && !['large', 'small'].includes(productData.iconSize)) {
      result.errors.push('Invalid icon size, must be "large" or "small"');
    }

    return result;
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

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
   * Get field names that would be used for given store/product data
   * Useful for debugging and validation
   * @param {Object} storeData - Store data
   * @param {Object} productData - Product data
   * @returns {Object} Object with arrays of field names
   */
  static getFieldNamesForData(storeData, productData) {
    const fieldNames = {
      store: [],
      product: [],
    };

    if (storeData) {
      if (storeData.type === 'store') {
        fieldNames.store.push('storeId', 'storeisActive');
      } else if (storeData.type === 'url') {
        fieldNames.store.push('storeUrl', 'storeisActive');
      }
      if (storeData.iconSize) {
        fieldNames.store.push('storeIconSize');
      }
    }

    if (productData) {
      if (productData.type === 'product') {
        fieldNames.product.push('ProductId', 'productisActive');
      } else if (productData.type === 'url') {
        fieldNames.product.push('productUrl', 'productisActive');
      }
      if (productData.iconSize) {
        fieldNames.product.push('productIconSize');
      }
    }

    return fieldNames;
  }
}

export default StoreProductMapper;
