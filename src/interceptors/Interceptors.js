/**
 * Copyright 2024 Syntropysoft
 */

import { ClickInterceptor } from './ClickInterceptor.js';
import { FetchInterceptor } from './FetchInterceptor.js';
import { ErrorInterceptor } from './ErrorInterceptor.js';

/**
 * Interceptors - Coordinator for modular interceptors.
 * Follows SOLID principles by treating interceptors as an extensible collection.
 * Registry pattern architecture.
 */
export class Interceptors {
  constructor() {
    this.isInitialized = false;
    this.config = {
      captureClicks: true,
      captureFetch: true,
      captureErrors: true,
      captureUnhandledRejections: true
    };

    this.registry = new Map();
    this.initializeRegistry();
  }

  /**
   * Declarative registration of standard interceptors.
   */
  initializeRegistry() {
    this.registry.set('clicks', new ClickInterceptor());
    this.registry.set('fetch', new FetchInterceptor());
    this.registry.set('errors', new ErrorInterceptor());
  }

  /**
   * Decoupled configuration.
   */
  configure(config = {}) {
    this.config = { ...this.config, ...config };
    // Inject config and optional callbacks into interceptors that need them
    this.registry.get('errors')?.configure?.(this.config, config.context || [], config.onError);
  }

  /**
   * Initialization via functional pipeline.
   */
  init() {
    // Guard: already initialized
    if (this.isInitialized) return;

    this.runLifecycle('init');

    this.isInitialized = true;
    console.log('SyntropyFront: Interceptors initialized (Refactored architecture)');
  }

  /**
   * Teardown via functional pipeline.
   */
  destroy() {
    // Guard: not initialized
    if (!this.isInitialized) return;

    this.runLifecycle('destroy');

    this.isInitialized = false;
    console.log('SyntropyFront: Interceptors destroyed');
  }

  /**
   * Runs a lifecycle method across the registry based on config.
   * Functional pipeline: filter -> map -> filter -> forEach.
   */
  runLifecycle(method) {
    const lifecycleMap = [
      { key: 'clicks', enabled: this.config.captureClicks },
      { key: 'fetch', enabled: this.config.captureFetch },
      { key: 'errors', enabled: this.config.captureErrors || this.config.captureUnhandledRejections }
    ];

    lifecycleMap
      .filter(item => item.enabled)
      .map(item => this.registry.get(item.key))
      .filter(interceptor => interceptor && typeof interceptor[method] === 'function')
      .forEach(interceptor => interceptor[method]());
  }

  // Compatibility accessors for tests or controlled direct access
  get clickInterceptor() { return this.registry.get('clicks'); }
  get fetchInterceptor() { return this.registry.get('fetch'); }
  get errorInterceptor() { return this.registry.get('errors'); }
}

export const interceptors = new Interceptors();