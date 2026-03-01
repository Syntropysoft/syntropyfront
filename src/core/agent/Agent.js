import { ConfigurationManager } from './ConfigurationManager.js';
import { QueueManager } from './QueueManager.js';
import { RetryManager } from '../retry/RetryManager.js';
import { HttpTransport } from './HttpTransport.js';
import { PersistentBufferManager } from '../persistent/PersistentBufferManager.js';
import { dataMaskingManager } from '../../utils/DataMaskingManager.js';

/**
 * Agent - Coordinates sending traceability data to the backend.
 * DIP: All dependencies (config, queue, retry, transport, buffer, masking) are injectable.
 *
 * @contract
 * - configure(config): updates agent configuration.
 * - sendError(payload, context?): if enabled and not dropped by sampling, enqueues an item of type 'error'.
 * - sendBreadcrumbs(breadcrumbs): if enabled, batchTimeout set and non-empty, enqueues type 'breadcrumbs'.
 * - flush(): drains queue via flushCallback. forceFlush(): flush + processes pending retries.
 * - getStats(): returns { queueLength, retryQueueLength, isEnabled, usePersistentBuffer, maxRetries }.
 */
export class Agent {
  /**
   * @param {Object} [deps] - Injected dependencies (config, queue, retry, transport, buffer, masking). Defaults created if not provided.
   */
  constructor(deps = {}) {
    // Components (Injected or Defaults)
    this.config = deps.config || new ConfigurationManager();
    this.masking = deps.masking || dataMaskingManager;

    // Managers that depend on config
    this.queue = deps.queue || new QueueManager(this.config);
    this.retry = deps.retry || new RetryManager(this.config);
    this.transport = deps.transport || new HttpTransport(this.config);
    this.buffer = deps.buffer || new PersistentBufferManager(this.config);

    // Setup coordination callbacks
    this.setupCallbacks();
  }

  /**
   * Configures callbacks for coordination between components
   */
  setupCallbacks() {
    // QueueManager flush callback
    this.queue.flushCallback = async (items) => {
      try {
        await this.transport.send(items);
        console.log('SyntropyFront: Data sent successfully');
      } catch (error) {
        console.error('SyntropyFront Agent: Error sending data:', error);

        // Add to retry queue
        this.retry.addToRetryQueue(items);

        // Save to persistent buffer
        await this.buffer.save(items);
      }
    };

    // RetryManager send callback
    this.retry.sendCallback = async (items) => {
      return await this.transport.send(items);
    };

    this.retry.removePersistentCallback = async (id) => {
      await this.buffer.remove(id);
    };

    // PersistentBufferManager retry callback
    this.buffer.sendCallback = (items, retryCount, persistentId) => {
      this.retry.addToRetryQueue(items, retryCount, persistentId);
    };
  }

  /**
   * Updates configuration (endpoint, headers, batchSize, batchTimeout, samplingRate, etc.).
   * @param {Object} config - Ver ConfigurationManager.configure
   * @returns {void}
   */
  configure(config) {
    this.config.configure(config);
  }

  /**
   * Enqueues an error for send. Does not send if agent is disabled or sampling discards it.
   * @param {Object} errorPayload - Payload with type, error, breadcrumbs, timestamp
   * @param {Object|null} [context=null] - Additional context (merged into payload)
   * @returns {void}
   */
  sendError(errorPayload, context = null) {
    // 🛡️ Guard: Agent enabled
    if (!this.config.isAgentEnabled()) {
      console.warn('SyntropyFront Agent: Not configured, error not sent');
      return;
    }

    // 🎲 Guard: Sampling
    if (Math.random() > this.config.samplingRate) return;

    // Functional Pipeline: Generate payload with context
    const payloadWithContext = context
      ? { ...errorPayload, context }
      : errorPayload;

    // Apply transformations (Encryption and Obfuscation)
    const dataToSend = this.transport.applyEncryption(payloadWithContext);
    const maskedData = this.masking.process(dataToSend);

    this.queue.add({
      type: 'error',
      data: maskedData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Enqueues breadcrumbs for send. Does not send if disabled, no batchTimeout, or empty array.
   * @param {Array<Object>} breadcrumbs - List of traces (category, message, data, timestamp)
   * @returns {void}
   */
  sendBreadcrumbs(breadcrumbs) {
    // 🛡️ Guard: Enabled and with data
    if (!this.config.isAgentEnabled() || !this.config.shouldSendBreadcrumbs() || !breadcrumbs.length) {
      return;
    }

    // 🎲 Guard: Sampling
    if (Math.random() > this.config.samplingRate) return;

    // Apply transformations
    const dataToSend = this.transport.applyEncryption(breadcrumbs);
    const maskedData = this.masking.process(dataToSend);

    this.queue.add({
      type: 'breadcrumbs',
      data: maskedData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Adds an item to the queue (compatibility)
   */
  addToQueue(item) {
    this.queue.add(item);
  }

  /**
   * Adds to retry queue (compatibility)
   */
  addToRetryQueue(items, retryCount = 1, persistentId = null) {
    this.retry.addToRetryQueue(items, retryCount, persistentId);
  }

  /**
   * Processes retry queue (compatibility)
   */
  async processRetryQueue() {
    await this.retry.processRetryQueue(
      this.retry.sendCallback,
      this.retry.removePersistentCallback
    );
  }

  /**
   * Forces flush of current queue
   */
  async flush() {
    await this.queue.flush(this.queue.flushCallback);
  }

  /**
   * Forces immediate flush of everything
   */
  async forceFlush() {
    await this.flush();

    // Also attempt pending retries
    if (!this.retry.isEmpty()) {
      console.log('SyntropyFront: Attempting to send pending retries...');
      await this.processRetryQueue();
    }
  }

  /**
   * Gets agent stats
   */
  getStats() {
    const config = this.config.getConfig();
    return {
      queueLength: this.queue.getSize(),
      retryQueueLength: this.retry.getSize(),
      isEnabled: this.config.isAgentEnabled(),
      usePersistentBuffer: config.usePersistentBuffer,
      maxRetries: config.maxRetries
    };
  }

  /**
   * Attempts to send failed items from persistent buffer
   */
  async retryFailedItems() {
    await this.buffer.retryFailedItems(this.buffer.sendCallback);
  }

  /**
   * Returns whether the agent is enabled (for consumers that need to check without depending on config shape).
   */
  isEnabled() {
    return this.config.isAgentEnabled();
  }

  /**
   * Returns whether breadcrumbs should be sent (e.g. batch mode with timeout).
   */
  shouldSendBreadcrumbs() {
    return this.config.shouldSendBreadcrumbs();
  }

  /**
   * Disables the agent
   */
  disable() {
    this.config.configure({ endpoint: null });
    this.queue.clear();
    this.retry.clear();
  }
}

// Singleton Instance
export const agent = new Agent();
