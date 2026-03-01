import { DatabaseManager } from '../database/DatabaseManager.js';
import { StorageManager } from '../database/StorageManager.js';
import { RetryLogicManager } from '../retry/RetryLogicManager.js';
import { SerializationManager } from '../database/SerializationManager.js';

const DEFAULT_DB_NAME = 'SyntropyFrontBuffer';
const DEFAULT_DB_VERSION = 1;
const DEFAULT_STORE_NAME = 'failedItems';

/**
 * PersistentBufferManager - Persistent buffer coordinator
 * Single Responsibility: Coordinate persistent storage components
 * DIP: Accepts injected components (databaseManager, serializationManager, storageManager, retryLogicManager) for tests and substitution.
 * @param {Object} configManager - Config (usePersistentBuffer, maxRetries, etc.)
 * @param {Object} [deps] - Injected components; defaults created if not provided
 */
export class PersistentBufferManager {
  constructor(configManager, deps = {}) {
    this.config = configManager;
    this.usePersistentBuffer = false;

    this.databaseManager = deps.databaseManager ?? new DatabaseManager(
      DEFAULT_DB_NAME,
      DEFAULT_DB_VERSION,
      DEFAULT_STORE_NAME
    );
    this.serializationManager = deps.serializationManager ?? new SerializationManager();
    this.storageManager = deps.storageManager ?? new StorageManager(this.databaseManager, this.serializationManager);
    this.retryLogicManager = deps.retryLogicManager ?? new RetryLogicManager(this.storageManager, this.config);

    this.initPersistentBuffer();
  }

  /**
     * Initializes the persistent buffer
     */
  async initPersistentBuffer() {
    try {
      const success = await this.databaseManager.init();
      if (success) {
        this.usePersistentBuffer = this.config.usePersistentBuffer;
        console.log('SyntropyFront: Persistent buffer initialized');
      }
    } catch (error) {
      console.warn('SyntropyFront: Error initializing persistent buffer:', error);
    }
  }

  /**
     * Saves failed items to the persistent buffer
     * @param {Array} items - Items to save
     */
  async save(items) {
    if (!this.usePersistentBuffer) {
      return;
    }

    try {
      await this.storageManager.save(items);
      console.log('SyntropyFront: Items saved to persistent buffer');
    } catch (error) {
      console.error('SyntropyFront: Error saving to persistent buffer:', error);
    }
  }

  /**
     * Retrieves failed items from the persistent buffer
     */
  async retrieve() {
    if (!this.usePersistentBuffer) {
      return [];
    }

    try {
      return await this.storageManager.retrieve();
    } catch (error) {
      console.error('SyntropyFront: Error retrieving from persistent buffer:', error);
      return [];
    }
  }

  /**
     * Removes items from the persistent buffer
     * @param {number} id - ID of the item to remove
     */
  async remove(id) {
    if (!this.usePersistentBuffer) {
      return;
    }

    try {
      await this.storageManager.remove(id);
    } catch (error) {
      console.error('SyntropyFront: Error removing from persistent buffer:', error);
    }
  }

  /**
     * Attempts to send failed items from the persistent buffer
     * @param {Function} sendCallback - Callback to send items
     * @param {Function} removeCallback - Callback to remove successful items
     */
  async retryFailedItems(sendCallback, removeCallback) {
    if (!this.usePersistentBuffer) {
      return;
    }

    await this.retryLogicManager.retryFailedItems(sendCallback, removeCallback);
  }

  /**
     * Cleans up items that have exceeded the maximum retry count
     */
  async cleanupExpiredItems() {
    if (!this.usePersistentBuffer) {
      return;
    }

    await this.retryLogicManager.cleanupExpiredItems();
  }

  /**
     * Gets persistent buffer statistics
     */
  async getStats() {
    if (!this.usePersistentBuffer) {
      return {
        totalItems: 0,
        itemsByRetryCount: {},
        averageRetryCount: 0,
        isAvailable: false
      };
    }

    try {
      const retryStats = await this.retryLogicManager.getRetryStats();
      return {
        ...retryStats,
        isAvailable: this.isAvailable()
      };
    } catch (error) {
      console.error('SyntropyFront: Error getting statistics:', error);
      return {
        totalItems: 0,
        itemsByRetryCount: {},
        averageRetryCount: 0,
        isAvailable: this.isAvailable()
      };
    }
  }

  /**
     * Checks if the persistent buffer is available
     */
  isAvailable() {
    return this.usePersistentBuffer && this.databaseManager.isDatabaseAvailable();
  }

  /**
     * Clears the entire persistent buffer
     */
  async clear() {
    if (!this.usePersistentBuffer) {
      return;
    }

    try {
      await this.storageManager.clear();
      console.log('SyntropyFront: Persistent buffer cleared');
    } catch (error) {
      console.error('SyntropyFront: Error clearing persistent buffer:', error);
    }
  }

  /**
     * Closes the database connection
     */
  close() {
    this.databaseManager.close();
    this.usePersistentBuffer = false;
  }
}
