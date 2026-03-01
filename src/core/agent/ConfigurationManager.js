/**
 * ConfigurationManager - Handles Agent configuration
 * Single Responsibility: Manage configuration and validation
 */
export class ConfigurationManager {
  constructor() {
    this.endpoint = null;
    this.headers = {
      'Content-Type': 'application/json'
    };
    this.batchSize = 10;
    this.batchTimeout = null;
    this.isEnabled = false;
    this.sendBreadcrumbs = false;
    this.encrypt = null;
    this.usePersistentBuffer = false;
    this.maxRetries = 5;
    this.baseDelay = 1000;
    this.maxDelay = 30000;
    this.samplingRate = 1.0; // 100% by default
  }

  /**
     * Configures the manager
     * @param {Object} config - Configuration
     */
  configure(config) {
    this.endpoint = config.endpoint;
    this.headers = { ...this.headers, ...config.headers };
    this.batchSize = config.batchSize || this.batchSize;
    this.batchTimeout = config.batchTimeout;
    this.isEnabled = !!config.endpoint;
    this.encrypt = config.encrypt || null;
    this.usePersistentBuffer = config.usePersistentBuffer === true;
    this.maxRetries = config.maxRetries || this.maxRetries;
    this.samplingRate = typeof config.samplingRate === 'number' ? config.samplingRate : this.samplingRate;

    // Simple logic: if batchTimeout exists = send breadcrumbs, else = errors only
    this.sendBreadcrumbs = !!config.batchTimeout;
  }

  /**
     * Checks if the agent is enabled
     */
  isAgentEnabled() {
    return this.isEnabled;
  }

  /**
     * Checks if it should send breadcrumbs
     */
  shouldSendBreadcrumbs() {
    return this.sendBreadcrumbs;
  }

  /**
     * Gets the current configuration
     */
  getConfig() {
    return {
      endpoint: this.endpoint,
      headers: this.headers,
      batchSize: this.batchSize,
      batchTimeout: this.batchTimeout,
      isEnabled: this.isEnabled,
      sendBreadcrumbs: this.sendBreadcrumbs,
      encrypt: this.encrypt,
      usePersistentBuffer: this.usePersistentBuffer,
      maxRetries: this.maxRetries,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      samplingRate: this.samplingRate
    };
  }
}
