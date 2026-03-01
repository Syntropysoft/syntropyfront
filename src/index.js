/**
 * Copyright 2024 Syntropysoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * SyntropyFront - Observability library with automatic capture
 * Acts as a Facade connecting the Agent and modular Interceptors
 */
import { breadcrumbStore } from './core/breadcrumbs/BreadcrumbStore.js';
import { agent } from './core/agent/Agent.js';
import { interceptors } from './interceptors/Interceptors.js';

class SyntropyFront {
  constructor() {
    this.isActive = false;
    this.config = {
      maxEvents: 50,
      endpoint: null,
      headers: {},
      usePersistentBuffer: true,
      captureClicks: true,
      captureFetch: true,
      captureErrors: true,
      captureUnhandledRejections: true,
      samplingRate: 1.0,
      onError: null
    };

    // Auto-initialize
    this.init();
  }

  /**
   * Initializes the library and activates interceptors
   */
  init() {
    if (this.isActive) return;

    this._applyConfig();
    interceptors.init();

    // Retry failed items from previous sessions
    agent.retryFailedItems().catch(err => {
      console.warn('SyntropyFront: Error attempting to recover persistent items:', err);
    });

    this.isActive = true;
    console.log('🚀 SyntropyFront: Initialized with modular resilient architecture');
  }

  /**
   * Private: applies current config to agent and interceptors.
   */
  _applyConfig() {
    agent.configure({
      endpoint: this.config.endpoint,
      headers: this.config.headers,
      usePersistentBuffer: this.config.usePersistentBuffer,
      samplingRate: this.config.samplingRate,
      batchTimeout: this.config.batchTimeout ?? (this.config.captureClicks || this.config.captureFetch ? 5000 : null)
    });

    breadcrumbStore.onBreadcrumbAdded = (crumb) => {
      if (agent.isEnabled() && agent.shouldSendBreadcrumbs()) {
        agent.sendBreadcrumbs([crumb]);
      }
    };

    interceptors.configure({
      captureClicks: this.config.captureClicks,
      captureFetch: this.config.captureFetch,
      captureErrors: this.config.captureErrors,
      captureUnhandledRejections: this.config.captureUnhandledRejections,
      onError: this.config.onError
    });
  }

  /**
   * Configures SyntropyFront
   * @param {Object} config - Configuration
   */
  configure(config = {}) {
    this.config = { ...this.config, ...config };

    // If 'fetch' is passed, extract endpoint and headers for compatibility
    if (config.fetch) {
      this.config.endpoint = config.fetch.url;
      this.config.headers = config.fetch.options?.headers || {};
    }

    this._applyConfig();

    const mode = this.config.endpoint ? `endpoint: ${this.config.endpoint}` : 'console only';
    console.log(`✅ SyntropyFront: Configured - ${mode}`);
  }

  /**
   * Adds a breadcrumb manually
   */
  addBreadcrumb(category, message, data = {}) {
    return breadcrumbStore.add({ category, message, data });
  }

  /**
   * Gets all breadcrumbs
   */
  getBreadcrumbs() {
    return breadcrumbStore.getAll();
  }

  /**
   * Clears breadcrumbs
   */
  clearBreadcrumbs() {
    breadcrumbStore.clear();
  }

  /**
   * Sends an error manually with context
   */
  sendError(error, context = {}) {
    const errorPayload = {
      type: 'manual_error',
      error: {
        message: error.message || String(error),
        name: error.name || 'Error',
        stack: error.stack
      },
      breadcrumbs: this.getBreadcrumbs(),
      timestamp: new Date().toISOString()
    };

    agent.sendError(errorPayload, context);
    return errorPayload;
  }

  /**
   * Forces sending pending data
   */
  async flush() {
    await agent.forceFlush();
  }

  /**
   * Gets usage statistics
   */
  getStats() {
    return {
      isActive: this.isActive,
      breadcrumbs: breadcrumbStore.count(),
      agent: agent.getStats(),
      config: { ...this.config }
    };
  }

  /**
   * Deactivates the library and restores original hooks
   */
  destroy() {
    interceptors.destroy();
    agent.disable();
    this.isActive = false;
    console.log('SyntropyFront: Deactivated');
  }
}

// Singleton instance
const syntropyFront = new SyntropyFront();

// Export the default instance
export default syntropyFront;