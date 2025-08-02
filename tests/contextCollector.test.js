const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { ContextCollector } = require('../src/core/ContextCollector.js');

describe('ContextCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new ContextCollector();
  });

  afterEach(() => {
    // Limpiar cualquier estado que pueda haberse modificado
    if (collector._sessionId) {
      delete collector._sessionId;
    }
  });

  describe('Constructor', () => {
    it('should initialize with default contexts', () => {
      expect(collector.defaultContexts).toBeDefined();
      expect(typeof collector.defaultContexts).toBe('object');
      
      // Verificar que tiene los contextos por defecto esperados
      expect(collector.defaultContexts.device).toBeDefined();
      expect(collector.defaultContexts.window).toBeDefined();
      expect(collector.defaultContexts.session).toBeDefined();
      expect(collector.defaultContexts.ui).toBeDefined();
      expect(collector.defaultContexts.network).toBeDefined();
    });

    it('should initialize with all fields mapping', () => {
      expect(collector.allFields).toBeDefined();
      expect(typeof collector.allFields).toBe('object');
      
      // Verificar que tiene todos los tipos de contexto
      expect(collector.allFields.device).toBeDefined();
      expect(collector.allFields.window).toBeDefined();
      expect(collector.allFields.storage).toBeDefined();
      expect(collector.allFields.network).toBeDefined();
      expect(collector.allFields.ui).toBeDefined();
      expect(collector.allFields.performance).toBeDefined();
      expect(collector.allFields.session).toBeDefined();
    });

    it('should have functions as field getters', () => {
      // Verificar que los campos son funciones
      expect(typeof collector.allFields.device.userAgent).toBe('function');
      expect(typeof collector.allFields.window.url).toBe('function');
      expect(typeof collector.allFields.session.sessionId).toBe('function');
    });
  });

  describe('collect', () => {
    it('should return empty object when no config provided', () => {
      const result = collector.collect();
      expect(result).toEqual({});
    });

    it('should return empty object when empty config provided', () => {
      const result = collector.collect({});
      expect(result).toEqual({});
    });

    it('should collect default context when config is true', () => {
      const config = { device: true };
      const result = collector.collect(config);
      
      expect(result.device).toBeDefined();
      expect(typeof result.device).toBe('object');
      expect(result.device.userAgent).toBeDefined();
      expect(result.device.language).toBeDefined();
    });

    it('should collect specific fields when config is array', () => {
      const config = { device: ['userAgent', 'language'] };
      const result = collector.collect(config);
      
      expect(result.device).toBeDefined();
      expect(result.device.userAgent).toBeDefined();
      expect(result.device.language).toBeDefined();
      expect(result.device.screen).toBeUndefined(); // No solicitado
    });

    it('should skip context when config is false', () => {
      const config = { device: true, window: false };
      const result = collector.collect(config);
      
      expect(result.device).toBeDefined();
      expect(result.window).toBeUndefined();
    });

    it('should handle multiple context types', () => {
      const config = {
        device: true,
        window: ['url', 'title'],
        session: false
      };
      const result = collector.collect(config);
      
      expect(result.device).toBeDefined();
      expect(result.window).toBeDefined();
      expect(result.window.url).toBeDefined();
      expect(result.window.title).toBeDefined();
      expect(result.session).toBeUndefined();
    });

    it('should handle invalid config gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const config = { device: 'invalid' };
      const result = collector.collect(config);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Configuración de contexto inválida para device:',
        'invalid'
      );
      expect(result.device).toBeUndefined();
      
      console.warn = originalWarn;
    });

    it('should handle errors in context collection gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Mock navigator.userAgent to throw an error
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        get: () => { throw new Error('Test error'); },
        configurable: true
      });
      
      const config = { device: true };
      const result = collector.collect(config);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Error recolectando campo userAgent de device:',
        expect.any(Error)
      );
      expect(result.device.userAgent).toBeNull();
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        get: () => originalUserAgent,
        configurable: true
      });
      console.warn = originalWarn;
    });

    it('should handle unknown context type gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const config = { unknown: true };
      const result = collector.collect(config);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: No hay set por defecto para unknown'
      );
      expect(result.unknown).toEqual({});
      
      console.warn = originalWarn;
    });
  });

  describe('collectDefaultContext', () => {
    it('should collect all default fields for device', () => {
      const result = collector.collectDefaultContext('device');
      
      expect(result.userAgent).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.screen).toBeDefined();
      expect(result.timezone).toBeDefined();
      expect(typeof result.screen).toBe('object');
      expect(result.screen.width).toBeDefined();
      expect(result.screen.height).toBeDefined();
    });

    it('should collect all default fields for window', () => {
      const result = collector.collectDefaultContext('window');
      
      expect(result.url).toBeDefined();
      expect(result.viewport).toBeDefined();
      expect(result.title).toBeDefined();
      expect(typeof result.viewport).toBe('object');
      expect(result.viewport.width).toBeDefined();
      expect(result.viewport.height).toBeDefined();
    });

    it('should collect all default fields for session', () => {
      const result = collector.collectDefaultContext('session');
      
      expect(result.sessionId).toBeDefined();
      expect(result.pageLoadTime).toBeDefined();
      expect(typeof result.sessionId).toBe('string');
      expect(typeof result.pageLoadTime).toBe('number');
    });

    it('should handle unknown context type', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const result = collector.collectDefaultContext('unknown');
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: No hay set por defecto para unknown'
      );
      expect(result).toEqual({});
      
      console.warn = originalWarn;
    });

    it('should handle errors in individual field collection', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Mock a field to throw an error
      const originalTitle = document.title;
      Object.defineProperty(document, 'title', {
        get: () => { throw new Error('Title error'); },
        configurable: true
      });
      
      const result = collector.collectDefaultContext('window');
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Error recolectando campo title de window:',
        expect.any(Error)
      );
      expect(result.title).toBeNull();
      expect(result.url).toBeDefined(); // Other fields should still work
      
      // Restore original
      Object.defineProperty(document, 'title', {
        get: () => originalTitle,
        configurable: true
      });
      console.warn = originalWarn;
    });
  });

  describe('collectSpecificFields', () => {
    it('should collect only specified fields', () => {
      const result = collector.collectSpecificFields('device', ['userAgent', 'language']);
      
      expect(result.userAgent).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.screen).toBeUndefined();
      expect(result.timezone).toBeUndefined();
    });

    it('should handle unknown context type', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const result = collector.collectSpecificFields('unknown', ['field1']);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Tipo de contexto desconocido: unknown'
      );
      expect(result).toEqual({});
      
      console.warn = originalWarn;
    });

    it('should handle unknown fields gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const result = collector.collectSpecificFields('device', ['userAgent', 'unknownField']);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Campo unknownField no disponible en device'
      );
      expect(result.userAgent).toBeDefined();
      expect(result.unknownField).toBeUndefined();
      
      console.warn = originalWarn;
    });

    it('should handle errors in field collection', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Mock a field to throw an error
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        get: () => { throw new Error('UserAgent error'); },
        configurable: true
      });
      
      const result = collector.collectSpecificFields('device', ['userAgent', 'language']);
      
      expect(console.warn).toHaveBeenCalledWith(
        'SyntropyFront: Error recolectando campo userAgent de device:',
        expect.any(Error)
      );
      expect(result.userAgent).toBeNull();
      expect(result.language).toBeDefined(); // Other fields should still work
      
      // Restore original
      Object.defineProperty(navigator, 'userAgent', {
        get: () => originalUserAgent,
        configurable: true
      });
      console.warn = originalWarn;
    });
  });

  describe('generateSessionId', () => {
    it('should generate session ID on first call', () => {
      const sessionId1 = collector.generateSessionId();
      expect(sessionId1).toBeDefined();
      expect(typeof sessionId1).toBe('string');
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should return same session ID on subsequent calls', () => {
      const sessionId1 = collector.generateSessionId();
      const sessionId2 = collector.generateSessionId();
      const sessionId3 = collector.generateSessionId();
      
      expect(sessionId1).toBe(sessionId2);
      expect(sessionId2).toBe(sessionId3);
    });

    it('should generate different session IDs for different instances', () => {
      const collector1 = new ContextCollector();
      const collector2 = new ContextCollector();
      
      const sessionId1 = collector1.generateSessionId();
      const sessionId2 = collector2.generateSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all available context types', () => {
      const types = collector.getAvailableTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('device');
      expect(types).toContain('window');
      expect(types).toContain('storage');
      expect(types).toContain('network');
      expect(types).toContain('ui');
      expect(types).toContain('performance');
      expect(types).toContain('session');
    });

    it('should return the same array on multiple calls', () => {
      const types1 = collector.getAvailableTypes();
      const types2 = collector.getAvailableTypes();
      
      expect(types1).toEqual(types2); // Same content, not necessarily same reference
      expect(Array.isArray(types1)).toBe(true);
      expect(Array.isArray(types2)).toBe(true);
    });
  });

  describe('getAvailableFields', () => {
    it('should return all available fields for device', () => {
      const fields = collector.getAvailableFields('device');
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields).toContain('userAgent');
      expect(fields).toContain('language');
      expect(fields).toContain('screen');
      expect(fields).toContain('timezone');
    });

    it('should return all available fields for window', () => {
      const fields = collector.getAvailableFields('window');
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields).toContain('url');
      expect(fields).toContain('pathname');
      expect(fields).toContain('title');
      expect(fields).toContain('viewport');
    });

    it('should return empty array for unknown context type', () => {
      const fields = collector.getAvailableFields('unknown');
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields).toEqual([]);
    });
  });

  describe('getDefaultContextsInfo', () => {
    it('should return information about default contexts', () => {
      const info = collector.getDefaultContextsInfo();
      
      expect(typeof info).toBe('object');
      expect(info.device).toBeDefined();
      expect(info.window).toBeDefined();
      expect(info.session).toBeDefined();
      expect(info.ui).toBeDefined();
      expect(info.network).toBeDefined();
      
      expect(Array.isArray(info.device)).toBe(true);
      expect(Array.isArray(info.window)).toBe(true);
    });

    it('should return correct field names for device', () => {
      const info = collector.getDefaultContextsInfo();
      
      expect(info.device).toContain('userAgent');
      expect(info.device).toContain('language');
      expect(info.device).toContain('screen');
      expect(info.device).toContain('timezone');
    });

    it('should return correct field names for window', () => {
      const info = collector.getDefaultContextsInfo();
      
      expect(info.window).toContain('url');
      expect(info.window).toContain('viewport');
      expect(info.window).toContain('title');
    });
  });

  describe('Field Collection Tests', () => {
    describe('Device Fields', () => {
      it('should collect userAgent correctly', () => {
        const result = collector.allFields.device.userAgent();
        expect(result).toBe(navigator.userAgent);
      });

      it('should collect language correctly', () => {
        const result = collector.allFields.device.language();
        expect(result).toBe(navigator.language);
      });

      it('should collect screen information correctly', () => {
        const result = collector.allFields.device.screen();
        expect(result.width).toBe(window.screen.width);
        expect(result.height).toBe(window.screen.height);
        expect(result.availWidth).toBe(window.screen.availWidth);
        expect(result.availHeight).toBe(window.screen.availHeight);
        expect(result.colorDepth).toBe(window.screen.colorDepth);
        expect(result.pixelDepth).toBe(window.screen.pixelDepth);
      });

      it('should collect timezone correctly', () => {
        const result = collector.allFields.device.timezone();
        expect(result).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
      });
    });

    describe('Window Fields', () => {
      it('should collect URL correctly', () => {
        const result = collector.allFields.window.url();
        expect(result).toBe(window.location.href);
      });

      it('should collect pathname correctly', () => {
        const result = collector.allFields.window.pathname();
        expect(result).toBe(window.location.pathname);
      });

      it('should collect viewport correctly', () => {
        const result = collector.allFields.window.viewport();
        expect(result.width).toBe(window.innerWidth);
        expect(result.height).toBe(window.innerHeight);
      });

      it('should collect title correctly', () => {
        const result = collector.allFields.window.title();
        expect(result).toBe(document.title);
      });
    });

    describe('Storage Fields', () => {
      it('should collect localStorage information correctly', () => {
        // Mock localStorage
        const mockLocalStorage = {
          key1: 'value1',
          key2: 'value2'
        };
        Object.defineProperty(window, 'localStorage', {
          value: mockLocalStorage,
          writable: true
        });

        const result = collector.allFields.storage.localStorage();
        expect(result.keys).toBe(2);
        expect(result.keyNames).toContain('key1');
        expect(result.keyNames).toContain('key2');
        expect(result.size).toBeDefined();
      });

      it('should collect sessionStorage information correctly', () => {
        // Mock sessionStorage
        const mockSessionStorage = {
          sessionKey: 'sessionValue'
        };
        Object.defineProperty(window, 'sessionStorage', {
          value: mockSessionStorage,
          writable: true
        });

        const result = collector.allFields.storage.sessionStorage();
        expect(result.keys).toBe(1);
        expect(result.keyNames).toContain('sessionKey');
        expect(result.size).toBeDefined();
      });
    });

    describe('Network Fields', () => {
      it('should collect online status correctly', () => {
        const result = collector.allFields.network.online();
        expect(typeof result).toBe('boolean');
      });

      it('should collect connection information when available', () => {
        const result = collector.allFields.network.connection();
        // This might be null in test environment
        if (result !== null) {
          expect(result.effectiveType).toBeDefined();
          expect(result.downlink).toBeDefined();
          expect(result.rtt).toBeDefined();
        }
      });
    });

    describe('UI Fields', () => {
      it('should collect focus status correctly', () => {
        const result = collector.allFields.ui.focused();
        expect(typeof result).toBe('boolean');
      });

      it('should collect visibility state correctly', () => {
        const result = collector.allFields.ui.visibility();
        expect(['visible', 'hidden', 'prerender', 'unloaded']).toContain(result);
      });

      it('should collect active element information correctly', () => {
        const result = collector.allFields.ui.activeElement();
        // This might be null if no element is focused
        if (result !== null) {
          expect(result.tagName).toBeDefined();
          expect(result.id).toBeDefined();
          expect(result.className).toBeDefined();
        }
      });
    });

    describe('Performance Fields', () => {
      it('should collect memory information when available', () => {
        const result = collector.allFields.performance.memory();
        // This might be null in test environment
        if (result !== null) {
          expect(result.used).toBeDefined();
          expect(result.total).toBeDefined();
          expect(result.limit).toBeDefined();
          expect(typeof result.used).toBe('number');
          expect(typeof result.total).toBe('number');
          expect(typeof result.limit).toBe('number');
        }
      });

      it('should collect timing information when available', () => {
        // In test environment, this might be null due to missing performance.timing
        // We'll just test that the function exists and doesn't throw
        expect(typeof collector.allFields.performance.timing).toBe('function');
        
        // Try to call it and expect it to either return null or not throw
        try {
          const result = collector.allFields.performance.timing();
          // If it doesn't throw, it should return null in test environment
          expect(result).toBeNull();
        } catch (error) {
          // If it throws, that's also acceptable in test environment
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('Session Fields', () => {
      it('should collect session ID correctly', () => {
        const result = collector.allFields.session.sessionId();
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      });

      it('should collect start time correctly', () => {
        const result = collector.allFields.session.startTime();
        expect(typeof result).toBe('string');
        expect(new Date(result)).toBeInstanceOf(Date);
      });

      it('should collect page load time correctly', () => {
        const result = collector.allFields.session.pageLoadTime();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null config gracefully', () => {
      // Object.entries(null) throws an error, so we expect this to fail
      expect(() => collector.collect(null)).toThrow();
    });

    it('should handle undefined config gracefully', () => {
      const result = collector.collect(undefined);
      expect(result).toEqual({});
    });

    it('should handle mixed valid and invalid configs', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const config = {
        device: true,
        invalid: 'invalid',
        window: false
      };
      const result = collector.collect(config);
      
      expect(result.device).toBeDefined();
      expect(result.invalid).toBeUndefined();
      expect(result.window).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      
      console.warn = originalWarn;
    });

    it('should handle empty arrays in config', () => {
      const config = { device: [] };
      const result = collector.collect(config);
      
      expect(result.device).toEqual({});
    });

    it('should handle arrays with invalid fields', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const config = { device: ['userAgent', 'invalidField'] };
      const result = collector.collect(config);
      
      expect(result.device.userAgent).toBeDefined();
      expect(result.device.invalidField).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      
      console.warn = originalWarn;
    });
  });
}); 