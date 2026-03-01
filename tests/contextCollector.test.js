const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { ContextCollector } = require('../src/core/context/ContextCollector.js');

describe('ContextCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new ContextCollector();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default providers', () => {
      expect(collector.providers).toBeDefined();
      expect(collector.providers instanceof Map).toBe(true);
      expect(collector.providers.has('device')).toBe(true);
    });

    it('should provide allFields mapping', () => {
      const all = collector.allFields;
      expect(all.device).toBeDefined();
      expect(typeof all.device.userAgent).toBe('function');
    });
  });

  describe('collect', () => {
    it('should collect requested context', () => {
      const result = collector.collect({ device: true });
      expect(result.device).toBeDefined();
      expect(result.device.userAgent).toBeDefined();
    });

    it('should handle shorthand array config', () => {
      const result = collector.collect(['device', 'window']);
      expect(result.device).toBeDefined();
      expect(result.window).toBeDefined();
    });

    it('should handle field collection errors', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const faultyProvider = {
        fail: () => { throw new Error('Field error'); }
      };
      collector.registerProvider('faulty', faultyProvider);

      const result = collector.collect({ faulty: true });
      expect(result.faulty.fail).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Error collecting field fail'),
        expect.any(Error)
      );

      console.warn = originalWarn;
    });

    it('should handle provider collection failure', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();

      // Register a provider that is NOT an object (will cause error when seeking keys)
      collector.registerProvider('broken', null);

      const result = collector.collect({ broken: true });
      expect(result.broken).toEqual({ error: 'Collection failed' });
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Error collecting context for broken:'),
        expect.any(Error)
      );

      console.warn = originalWarn;
    });
  });

  describe('Secure ID Generation', () => {
    it('should generate consistent session ID', () => {
      const id1 = collector.generateSessionId();
      const id2 = collector.generateSessionId();
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^session_[a-z0-9-]+$/);
    });

    it('should use crypto.randomUUID if available', () => {
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: { randomUUID: jest.fn().mockReturnValue('mock-uuid') },
        configurable: true,
        writable: true
      });

      const local = new ContextCollector();
      const id = local.generateSecureId();
      expect(id).toBe('mock-uuid');

      Object.defineProperty(global, 'crypto', { value: originalCrypto, configurable: true, writable: true });
    });

    it('should fallback if crypto is missing', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      const local = new ContextCollector();
      const id = local.generateSecureId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);

      global.crypto = originalCrypto;
    });
  });

  describe('Environmental Safety', () => {
    it('should handle missing navigator safely', () => {
      const originalNav = global.navigator;
      Object.defineProperty(global, 'navigator', { value: undefined, configurable: true });

      const local = new ContextCollector();
      const result = local.collect({ device: ['userAgent'] });
      expect(result.device.userAgent).toBeNull();

      Object.defineProperty(global, 'navigator', { value: originalNav, configurable: true });
    });
  });
});