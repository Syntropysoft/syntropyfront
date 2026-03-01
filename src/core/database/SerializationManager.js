import { robustSerializer } from '../../utils/RobustSerializer.js';
import { dataMaskingManager } from '../../utils/DataMaskingManager.js';

/**
 * SerializationManager - Handles serialization and deserialization of data.
 * Single responsibility: Manage data transformation for storage.
 * DIP: Accepts serializer and masking via constructor for testability and substitution.
 * @param {Object} [deps] - Injected dependencies
 * @param {{ serialize: function(*): string, deserialize: function(string): * }} [deps.serializer] - Serializer (circular ref handling)
 * @param {{ process: function(*): * }} [deps.masking] - Object with process(data) for PII obfuscation
 */
export class SerializationManager {
  constructor(deps = {}) {
    this.serializer = deps.serializer ?? robustSerializer;
    this.masking = deps.masking ?? dataMaskingManager;
  }

  /**
     * Serializes items with declarative error handling
     * @param {Array} items - Items to serialize
     * @returns {Object} Serialization result
     */
  serialize(items) {
    try {
      // Guard: Validate basic input
      if (items === null || items === undefined) {
        return { success: true, data: this.serializer.serialize([]), error: null, timestamp: new Date().toISOString() };
      }

      // Apply masking before store/send
      const maskedItems = this.masking.process(items);
      const serializedData = this.serializer.serialize(maskedItems);

      return {
        success: true,
        data: serializedData,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        data: this.createFallbackData(error),
        error: this.createSerializationError(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
     * Deserializes data with declarative error handling
     * @param {string} serializedData - Datos serializados
     * @returns {Object} Deserialization result
     */
  deserialize(serializedData) {
    try {
      // Guard: Empty or null data
      if (!serializedData) {
        return { success: true, data: [], error: null, timestamp: new Date().toISOString() };
      }

      const deserializedData = this.serializer.deserialize(serializedData);

      return {
        success: true,
        data: deserializedData,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: this.createDeserializationError(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Creates a structured serialization error
   * @param {Error} error - Original error
   * @returns {Object} Structured error
   */
  createSerializationError(error) {
    return {
      type: 'serialization_error',
      message: error.message,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a structured deserialization error
   * @param {Error} error - Original error
   * @returns {Object} Structured error
   */
  createDeserializationError(error) {
    return {
      type: 'deserialization_error',
      message: error.message,
      originalError: error,
      timestamp: new Date().toISOString()
    };
  }

  /**
     * Creates fallback data when serialization fails
     * @param {Error} error - Error that caused the fallback
     * @returns {string} Serialized fallback data
     */
  createFallbackData(error) {
    const fallbackPayload = {
      __serializationError: true,
      error: error.message,
      timestamp: new Date().toISOString(),
      fallbackData: 'Items not serializable - using fallback'
    };

    return JSON.stringify(fallbackPayload);
  }

  /**
   * Checks if a serialization result was successful
   * @param {Object} result - Serialization/deserialization result
   * @returns {boolean} True if successful
   */
  isSuccessful(result) {
    return Boolean(result && result.success === true);
  }

  /**
     * Gets data from a result, with fallback
     * @param {Object} result - Serialization/deserialization result
     * @param {*} fallback - Default value if failed
     * @returns {*} Data or fallback
     */
  getData(result, fallback = null) {
    return this.isSuccessful(result) ? result.data : fallback;
  }
} 