/**
 * QueueManager - Send queue and batching.
 * Contract: add(item) enqueues or triggers flush; flush(cb) passes items to cb and clears queue; getSize/isEmpty/getAll are read-only.
 */
export class QueueManager {
  /** @param {{ batchSize: number, batchTimeout: number|null }} configManager */
  constructor(configManager) {
    this.config = configManager;
    this.queue = [];
    this.batchTimer = null;
    this.flushCallback = null;
  }

  /**
   * Adds an item; may trigger immediate or scheduled flush.
   * @param {Object} item - Item to enqueue (non-null)
   */
  add(item) {
    // Guard: Avoid null items
    if (!item) return;

    this.queue.push(item);

    // Guard: Immediate flush if batchSize is reached
    if (this.queue.length >= this.config.batchSize) {
      return this.flush(this.flushCallback);
    }

    // Guard: Only set Timer if one doesn't exist and we have a timeout configured
    if (!this.config.batchTimeout || this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flush(this.flushCallback);
    }, this.config.batchTimeout);
  }

  /** @returns {Array<Object>} Copy of the queue */
  getAll() {
    return [...this.queue];
  }

  /** Clears the queue and cancels the timer. */
  clear() {
    this.queue = [];
    this.clearTimer();
  }

  /** Cancels the scheduled flush timer. */
  clearTimer() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /** @returns {number} Queue length */
  getSize() {
    return this.queue.length;
  }

  /** @returns {boolean} */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Sends current items to the callback and clears the queue.
   * @param {(items: Array<Object>) => Promise<void>|void} flushCallback
   * @returns {Promise<void>}
   */
  async flush(flushCallback) {
    if (this.queue.length === 0) return;

    const itemsToSend = [...this.queue];
    this.queue = [];
    this.clearTimer();

    if (flushCallback) {
      await flushCallback(itemsToSend);
    }
  }
}
