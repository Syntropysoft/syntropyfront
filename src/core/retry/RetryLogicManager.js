import { robustSerializer } from '../../utils/RobustSerializer.js';

/**
 * RetryLogicManager - Handles retry logic and cleanup
 * Single responsibility: Manage retries and cleanup of failed items
 */
export class RetryLogicManager {
  constructor(storageManager, configManager) {
    this.storageManager = storageManager;
    this.config = configManager;
  }

  /**
     * Attempts to send failed items from the persistent buffer
     * @param {Function} sendCallback - Callback to send items
     * @param {Function} removeCallback - Callback to remove successful items
     */
  async retryFailedItems(sendCallback, removeCallback) {
    if (!this.storageManager) {
      console.warn('SyntropyFront: Storage manager not available');
      return;
    }

    try {
      const failedItems = await this.storageManager.retrieve();
            
      for (const item of failedItems) {
        if (item.retryCount < this.config.maxRetries) {
          // Deserialize items from buffer
          let deserializedItems;
          try {
            if (typeof item.items === 'string') {
              deserializedItems = robustSerializer.deserialize(item.items);
            } else {
              deserializedItems = item.items;
            }
          } catch (error) {
            console.error('SyntropyFront: Error deserializing buffer items:', error);
            await this.removeFailedItem(item.id);
            continue;
          }
                    
          if (sendCallback) {
            try {
              await sendCallback(deserializedItems, item.retryCount + 1, item.id);
                            
              // On successful send, remove from buffer
              if (removeCallback) {
                await removeCallback(item.id);
              } else {
                await this.removeFailedItem(item.id);
              }
                            
              console.log(`SyntropyFront: Retry successful for item ${item.id}`);
            } catch (error) {
              console.warn(`SyntropyFront: Retry failed for item ${item.id}:`, error);
                            
              // Increment retry count
              await this.incrementRetryCount(item.id);
            }
          }
        } else {
          console.warn(`SyntropyFront: Item ${item.id} exceeded maximum retries, removing from buffer`);
          await this.removeFailedItem(item.id);
        }
      }
    } catch (error) {
      console.error('SyntropyFront: Error processing retries:', error);
    }
  }

  /**
   * Increments the retry count for an item
   * @param {number} id - Item ID
   */
  async incrementRetryCount(id) {
    try {
      const currentItem = await this.storageManager.retrieveById(id);
      if (currentItem) {
        await this.storageManager.update(id, {
          retryCount: currentItem.retryCount + 1
        });
      }
    } catch (error) {
      console.error('SyntropyFront: Error incrementing retry count:', error);
    }
  }

  /**
   * Removes a failed item from the buffer
   * @param {number} id - Item ID
   */
  async removeFailedItem(id) {
    try {
      await this.storageManager.remove(id);
    } catch (error) {
      console.error('SyntropyFront: Error removing failed item:', error);
    }
  }

  /**
   * Cleans items that have exceeded the maximum retry count
   */
  async cleanupExpiredItems() {
    try {
      const allItems = await this.storageManager.retrieve();
      const expiredItems = allItems.filter(item => item.retryCount >= this.config.maxRetries);
            
      for (const item of expiredItems) {
        await this.removeFailedItem(item.id);
        console.warn(`SyntropyFront: Item ${item.id} removed for exceeding maximum retries`);
      }
            
      if (expiredItems.length > 0) {
        console.log(`SyntropyFront: Cleanup completed, ${expiredItems.length} items removed`);
      }
    } catch (error) {
      console.error('SyntropyFront: Error cleaning up expired items:', error);
    }
  }

  /**
   * Returns retry statistics
   */
  async getRetryStats() {
    try {
      const allItems = await this.storageManager.retrieve();
            
      const stats = {
        totalItems: allItems.length,
        itemsByRetryCount: {},
        averageRetryCount: 0
      };

      if (allItems.length > 0) {
        const totalRetries = allItems.reduce((sum, item) => sum + item.retryCount, 0);
        stats.averageRetryCount = totalRetries / allItems.length;
                
        allItems.forEach(item => {
          const retryCount = item.retryCount;
          stats.itemsByRetryCount[retryCount] = (stats.itemsByRetryCount[retryCount] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      console.error('SyntropyFront: Error getting retry statistics:', error);
      return {
        totalItems: 0,
        itemsByRetryCount: {},
        averageRetryCount: 0
      };
    }
  }
} 