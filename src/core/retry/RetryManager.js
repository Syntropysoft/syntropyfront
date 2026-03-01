/**
 * RetryManager - Retries with exponential backoff.
 * Contract: addToRetryQueue enqueues and schedules; processRetryQueue(sendCb, removeCb) processes ready items.
 */
export class RetryManager {
  /** @param {{ baseDelay: number, maxDelay: number, maxRetries: number }} configManager */
  constructor(configManager) {
    this.config = configManager;
    this.retryQueue = [];
    this.retryTimer = null;
  }

  /**
   * Enqueues items for retry (delay = min(baseDelay*2^(retryCount-1), maxDelay)).
   * @param {Array<Object>} items
   * @param {number} [retryCount=1]
   * @param {number|null} [persistentId=null]
   */
  addToRetryQueue(items, retryCount = 1, persistentId = null) {
    // Guard: Avoid empty items
    if (!items || items.length === 0) return;

    const delay = Math.min(this.config.baseDelay * Math.pow(2, retryCount - 1), this.config.maxDelay);

    this.retryQueue.push({
      items,
      retryCount,
      persistentId,
      nextRetry: Date.now() + delay
    });

    this.scheduleRetry();
  }

  /**
   * Processes items with nextRetry <= now; calls sendCallback and removePersistentCallback on success.
   * @param {(items: Array<Object>) => Promise<void>} sendCallback
   * @param {(id: number) => Promise<void>} removePersistentCallback
   * @returns {Promise<void>}
   */
  async processRetryQueue(sendCallback, removePersistentCallback) {
    this.retryTimer = null;
    if (this.retryQueue.length === 0) return;

    const now = Date.now();
    const itemsToRetry = this.retryQueue.filter(item => item.nextRetry <= now);

    for (const item of itemsToRetry) {
      await this.handleRetryItem(item, sendCallback, removePersistentCallback);
    }

    // Schedule next retry if items remain (Functional)
    if (this.retryQueue.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Schedules the next retry (Guard Clause style)
   */
  scheduleRetry() {
    // Guard: Avoid multiple simultaneous timers
    if (this.retryTimer) return;

    // Functional: Find the first item that needs a retry
    const nextItem = this.retryQueue.find(item => item.nextRetry <= Date.now());
    if (!nextItem) return;

    // Guard: Calculate delay and schedule
    const delay = Math.max(0, nextItem.nextRetry - Date.now());
    this.retryTimer = setTimeout(() => {
      this.processRetryQueue(this.sendCallback, this.removePersistentCallback);
    }, delay);
  }

  /**
   * Handles an individual retry item (SOLID: Single Responsibility)
   * @private
   */
  async handleRetryItem(item, sendCallback, removePersistentCallback) {
    try {
      if (sendCallback) await sendCallback(item.items);

      // Success: Clear state
      this.retryQueue = this.retryQueue.filter(q => q !== item);
      if (item.persistentId && removePersistentCallback) {
        await removePersistentCallback(item.persistentId);
      }
      console.log(`SyntropyFront: Successful retry (${item.retryCount})`);
    } catch (error) {
      this.handleRetryFailure(item, error);
    }
  }

  /**
   * Manages a retry failure
   * @private
   */
  handleRetryFailure(item, error) {
    console.warn(`SyntropyFront: Retry ${item.retryCount} failed:`, error);

    // Guard: Maximum retries reached
    if (item.retryCount >= this.config.maxRetries) {
      this.retryQueue = this.retryQueue.filter(q => q !== item);
      console.error('SyntropyFront: Item exceeded maximum retries, data lost');
      return;
    }

    // Increment and reschedule
    item.retryCount++;
    item.nextRetry = Date.now() + Math.min(
      this.config.baseDelay * Math.pow(2, item.retryCount - 1),
      this.config.maxDelay
    );
  }

  /**
     * Clears the retry queue
     */
  clear() {
    this.retryQueue = [];
    this.clearTimer();
  }

  /**
     * Clears the timer
     */
  clearTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
     * Gets the retry queue size
     */
  getSize() {
    return this.retryQueue.length;
  }

  /**
     * Checks if the retry queue is empty
     */
  isEmpty() {
    return this.retryQueue.length === 0;
  }
}
