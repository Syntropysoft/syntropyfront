import { Environment } from '../../utils/Environment.js';

/**
 * Pure function: Generates a secure ID using an injected crypto provider.
 * Accepts a cryptoApi object so all fallback branches are independently testable.
 * @param {Object|null} cryptoApi - Crypto implementation (e.g. window.crypto or null)
 * @returns {string} Secure random ID
 */
export const createSecureId = (cryptoApi = (typeof crypto !== 'undefined' ? crypto : null)) => {
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const array = new Uint8Array(16);
    cryptoApi.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Functional fragments: pure context providers.
 * Uses Environment.runIf for safe access.
 */
export const CONTEXT_PROVIDERS = {
  device: {
    userAgent: () => Environment.runIf('navigator.userAgent', () => navigator.userAgent),
    language: () => Environment.runIf('navigator.language', () => navigator.language),
    languages: () => Environment.runIf('navigator.languages', () => navigator.languages),
    screen: () => Environment.runIf('window.screen', () => ({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    })),
    timezone: () => Environment.runIf('Intl.DateTimeFormat', () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) { return null; }
    }),
    cookieEnabled: () => Environment.runIf('navigator.cookieEnabled', () => navigator.cookieEnabled),
    doNotTrack: () => Environment.runIf('navigator.doNotTrack', () => navigator.doNotTrack)
  },
  window: {
    url: () => Environment.runIf('window.location.href', () => window.location.href),
    pathname: () => Environment.runIf('window.location.pathname', () => window.location.pathname),
    search: () => Environment.runIf('window.location.search', () => window.location.search),
    hash: () => Environment.runIf('window.location.hash', () => window.location.hash),
    referrer: () => Environment.runIf('document.referrer', () => document.referrer),
    title: () => Environment.runIf('document.title', () => document.title),
    viewport: () => Environment.runIf('window.innerWidth', () => ({
      width: window.innerWidth,
      height: window.innerHeight
    }))
  },
  storage: {
    localStorage: () => Environment.runIf('localStorage', () => {
      try {
        const storage = window.localStorage;
        return {
          keys: Object.keys(storage).length,
          size: JSON.stringify(storage).length,
          keyNames: Object.keys(storage)
        };
      } catch (e) { return null; }
    }),
    sessionStorage: () => Environment.runIf('sessionStorage', () => {
      try {
        const storage = window.sessionStorage;
        return {
          keys: Object.keys(storage).length,
          size: JSON.stringify(storage).length,
          keyNames: Object.keys(storage)
        };
      } catch (e) { return null; }
    })
  },
  network: {
    online: () => Environment.runIf('navigator.onLine', () => navigator.onLine),
    connection: () => Environment.runIf(() => !!(typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection || navigator.webkitConnection)), () => {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    })
  },
  ui: {
    focused: () => Environment.runIf('document.hasFocus', () => document.hasFocus()),
    visibility: () => Environment.runIf('document.visibilityState', () => document.visibilityState),
    activeElement: () => Environment.runIf('document.activeElement', () => ({
      tagName: document.activeElement.tagName,
      id: document.activeElement.id,
      className: document.activeElement.className
    }))
  },
  performance: {
    memory: () => Environment.runIf('performance.memory', () => ({
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
    })),
    timing: () => Environment.runIf('performance.timing', () => ({
      navigationStart: performance.timing.navigationStart,
      loadEventEnd: performance.timing.loadEventEnd
    }))
  },
  session: {
    sessionId: (collector) => collector.generateSessionId(),
    startTime: () => new Date().toISOString(),
    pageLoadTime: () => Environment.runIf('performance.now', () => performance.now())
  }
};

/**
 * Default fields for context collection.
 */
const DEFAULT_CONTEXT_FIELDS = {
  device: ['userAgent', 'language', 'screen', 'timezone'],
  window: ['url', 'viewport', 'title'],
  session: ['sessionId', 'pageLoadTime'],
  ui: ['visibility', 'activeElement'],
  network: ['online', 'connection']
};

/**
 * ContextCollector - Minimal coordinator with no imperative state.
 */
export class ContextCollector {
  constructor() {
    this.sessionId = null;
    this.providers = new Map(Object.entries(CONTEXT_PROVIDERS));
  }

  /**
   * Collects context based on a declarative configuration.
   */
  collect(contextConfig = {}) {
    const config = this.normalizeConfig(contextConfig);

    return Object.entries(config).reduce((ctx, [type, options]) => {
      try {
        const provider = this.providers.get(type);
        if (options !== false && !provider) throw new Error(`Provider for '${type}' not found`);

        const fields = this.resolveFields(type, provider, options);
        if (fields) {
          ctx[type] = this.extractFields(provider, fields);
        }
      } catch (error) {
        console.warn(`SyntropyFront: Error collecting context for ${type}:`, error);
        ctx[type] = { error: 'Collection failed' };
      }
      return ctx;
    }, {});
  }

  /**
   * Field resolution — declarative strategy map by type.
   * Contracts:
   *   boolean true  → default fields for type, or all provider keys
   *   boolean false → null (skip)
   *   array         → explicit field list
   *   plain object  → all provider keys (treated as unstructured custom config)
   *   other         → null (skip)
   */
  resolveFields(type, provider, options) {
    const allProviderKeys = () => Object.keys(provider || {});
    const strategies = {
      boolean: (val) => val ? (DEFAULT_CONTEXT_FIELDS[type] || allProviderKeys()) : null,
      object: (val) => Array.isArray(val) ? val : allProviderKeys(),
    };

    const strategy = strategies[typeof options];
    return strategy ? strategy(options) : null;
  }

  /**
   * Functional normalization of configuration.
   */
  normalizeConfig(config) {
    if (Array.isArray(config)) {
      return config.reduce((acc, type) => ({ ...acc, [type]: true }), {});
    }
    return config || {};
  }

  /**
   * Pure field extraction.
   */
  extractFields(provider, fieldNames) {
    return fieldNames.reduce((result, fieldName) => {
      const getter = provider[fieldName];
      if (typeof getter !== 'function') return result;

      try {
        result[fieldName] = getter(this);
      } catch (e) {
        console.warn(`SyntropyFront: Error collecting field ${fieldName}:`, e);
        result[fieldName] = null;
      }
      return result;
    }, {});
  }

  registerProvider(name, fields) {
    this.providers.set(name, fields);
  }

  generateSessionId() {
    this.sessionId = this.sessionId || `session_${this.generateSecureId()}`;
    return this.sessionId;
  }

  // Delegates to the pure top-level createSecureId (injectable for testing)
  generateSecureId(cryptoApi = (typeof crypto !== 'undefined' ? crypto : null)) {
    return createSecureId(cryptoApi);
  }

  getAvailableTypes() {
    return Array.from(this.providers.keys());
  }

  get allFields() {
    return Array.from(this.providers.entries()).reduce((res, [name, fields]) => {
      res[name] = fields;
      return res;
    }, {});
  }

  get defaultContexts() {
    return this.allFields;
  }
}

export const contextCollector = new ContextCollector();
