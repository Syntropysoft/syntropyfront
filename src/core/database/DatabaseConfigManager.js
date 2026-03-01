/**
 * DatabaseConfigManager - Handles IndexedDB configuration
 * Single responsibility: Validate and manage database configuration
 */
export class DatabaseConfigManager {
  constructor(dbName, dbVersion, storeName) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
  }

  /**
   * Validates that the configuration is correct
   * @returns {Object} Validation result
   */
  validateConfig() {
    const validationResult = {
      isValid: true,
      errors: [],
      timestamp: new Date().toISOString()
    };

    if (!this.dbName || typeof this.dbName !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push('dbName must be a non-empty string');
    }

    if (!this.dbVersion || typeof this.dbVersion !== 'number' || this.dbVersion < 1) {
      validationResult.isValid = false;
      validationResult.errors.push('dbVersion must be a number greater than 0');
    }

    if (!this.storeName || typeof this.storeName !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push('storeName must be a non-empty string');
    }

    return validationResult;
  }

  /**
   * Checks if IndexedDB is available in the environment
   * @returns {Object} Availability result
   */
  checkIndexedDBAvailability() {
    const availabilityResult = {
      isAvailable: false,
      reason: null,
      timestamp: new Date().toISOString()
    };

    if (typeof window === 'undefined') {
      availabilityResult.reason = 'Not in a browser environment';
      return availabilityResult;
    }

    if (!window.indexedDB) {
      availabilityResult.reason = 'IndexedDB is not available in this browser';
      return availabilityResult;
    }

    availabilityResult.isAvailable = true;
    return availabilityResult;
  }

  /**
   * Returns the current configuration
   * @returns {Object} Configuration
   */
  getConfig() {
    return {
      dbName: this.dbName,
      dbVersion: this.dbVersion,
      storeName: this.storeName
    };
  }

  /**
   * Returns the object store configuration
   * @returns {Object} Store configuration
   */
  getStoreConfig() {
    return {
      keyPath: 'id',
      autoIncrement: true
    };
  }
} 