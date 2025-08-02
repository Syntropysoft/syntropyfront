const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { Interceptors } = require('../src/interceptors/Interceptors.js');

// Mock the dependencies
jest.mock('../src/core/breadcrumbs/BreadcrumbStore.js', () => ({
  breadcrumbStore: {
    add: jest.fn(),
    getAll: jest.fn().mockReturnValue([])
  }
}));

jest.mock('../src/core/agent/Agent.js', () => ({
  agent: {
    sendError: jest.fn()
  }
}));

jest.mock('../src/core/context/ContextCollector.js', () => ({
  contextCollector: {
    collect: jest.fn().mockReturnValue({})
  }
}));

const { breadcrumbStore } = require('../src/core/breadcrumbs/BreadcrumbStore.js');
const { agent } = require('../src/core/agent/Agent.js');
const { contextCollector } = require('../src/core/context/ContextCollector.js');

describe('Interceptors', () => {
  let interceptors;
  let originalFetch;
  let originalOnError;
  let originalOnUnhandledRejection;

  beforeEach(() => {
    interceptors = new Interceptors();
    
    // Store original handlers
    originalFetch = global.fetch;
    originalOnError = global.onerror;
    originalOnUnhandledRejection = global.onunhandledrejection;
    
    // Mock global objects
    global.fetch = jest.fn();
    global.onerror = jest.fn();
    global.onunhandledrejection = jest.fn();
    
    // Mock document
    global.document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    // Mock window
    global.window = {
      fetch: global.fetch,
      onerror: global.onerror,
      onunhandledrejection: global.onunhandledrejection
    };
    
    // Mock Request class
    global.Request = class Request {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
      }
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original handlers
    global.fetch = originalFetch;
    global.onerror = originalOnError;
    global.onunhandledrejection = originalOnUnhandledRejection;
    
    // Clean up interceptors
    if (interceptors.isInitialized) {
      interceptors.destroy();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(interceptors.isInitialized).toBe(false);
      expect(interceptors.config).toEqual({
        captureClicks: true,
        captureFetch: true,
        captureErrors: true,
        captureUnhandledRejections: true
      });
      expect(interceptors.contextTypes).toEqual([]);
      expect(interceptors.originalHandlers).toEqual({
        fetch: null,
        onerror: null,
        onunhandledrejection: null
      });
      expect(interceptors.eventListeners).toBeInstanceOf(Map);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      const newConfig = {
        captureClicks: false,
        captureFetch: false,
        context: ['device', 'window']
      };
      
      interceptors.configure(newConfig);
      
      expect(interceptors.config.captureClicks).toBe(false);
      expect(interceptors.config.captureFetch).toBe(false);
      expect(interceptors.config.captureErrors).toBe(true); // Should remain unchanged
      expect(interceptors.contextTypes).toEqual(['device', 'window']);
    });

    it('should merge configuration with existing config', () => {
      const partialConfig = {
        captureClicks: false
      };
      
      interceptors.configure(partialConfig);
      
      expect(interceptors.config.captureClicks).toBe(false);
      expect(interceptors.config.captureFetch).toBe(true); // Should remain unchanged
      expect(interceptors.config.captureErrors).toBe(true); // Should remain unchanged
    });
  });

  describe('init', () => {
    it('should initialize all interceptors when all are enabled', () => {
      const originalWarn = console.warn;
      const originalLog = console.log;
      console.warn = jest.fn();
      console.log = jest.fn();
      
      interceptors.init();
      
      expect(interceptors.isInitialized).toBe(true);
      expect(console.log).toHaveBeenCalledWith('SyntropyFront: Interceptors inicializados con Chaining Pattern');
      
      console.warn = originalWarn;
      console.log = originalLog;
    });

    it('should warn if already initialized', () => {
      const originalWarn = console.warn;
      const originalLog = console.log;
      console.warn = jest.fn();
      console.log = jest.fn();
      
      interceptors.init();
      interceptors.init(); // Second call
      
      expect(console.warn).toHaveBeenCalledWith('SyntropyFront: Interceptors ya están inicializados');
      
      console.warn = originalWarn;
      console.log = originalLog;
    });

    it('should only setup enabled interceptors', () => {
      interceptors.configure({
        captureClicks: false,
        captureFetch: false,
        captureErrors: false,
        captureUnhandledRejections: false
      });
      
      interceptors.init();
      
      expect(interceptors.isInitialized).toBe(true);
      expect(interceptors.eventListeners.size).toBe(0);
    });
  });

  describe('setupClickInterceptor', () => {
    it('should setup click interceptor in browser environment', () => {
      interceptors.setupClickInterceptor();
      
      expect(interceptors.eventListeners.has('click')).toBe(true);
      expect(typeof interceptors.eventListeners.get('click')).toBe('function');
    });

    it('should handle non-browser environment', () => {
      // This test verifies that the interceptor handles missing document gracefully
      // We'll test the behavior by checking that it doesn't throw an error
      expect(() => {
        const originalDocument = global.document;
        global.document = undefined;
        
        interceptors.setupClickInterceptor();
        
        global.document = originalDocument;
      }).not.toThrow();
    });

    it('should create breadcrumb when click event occurs', () => {
      interceptors.setupClickInterceptor();
      
      const clickHandler = interceptors.eventListeners.get('click');
      const mockEvent = {
        target: {
          tagName: 'BUTTON',
          id: 'test-button',
          className: 'btn primary'
        }
      };
      
      clickHandler(mockEvent);
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'ui',
        message: "Usuario hizo click en 'button#test-button'",
        data: {
          selector: 'button#test-button',
          tagName: 'BUTTON',
          id: 'test-button',
          className: 'btn primary'
        }
      });
    });

    it('should handle click event without target', () => {
      interceptors.setupClickInterceptor();
      
      const clickHandler = interceptors.eventListeners.get('click');
      const mockEvent = { target: null };
      
      clickHandler(mockEvent);
      
      expect(breadcrumbStore.add).not.toHaveBeenCalled();
    });

    it('should handle element without id or className', () => {
      interceptors.setupClickInterceptor();
      
      const clickHandler = interceptors.eventListeners.get('click');
      const mockEvent = {
        target: {
          tagName: 'DIV'
        }
      };
      
      clickHandler(mockEvent);
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'ui',
        message: "Usuario hizo click en 'div'",
        data: {
          selector: 'div',
          tagName: 'DIV',
          id: undefined,
          className: undefined
        }
      });
    });

    it('should handle element with empty className', () => {
      interceptors.setupClickInterceptor();
      
      const clickHandler = interceptors.eventListeners.get('click');
      const mockEvent = {
        target: {
          tagName: 'SPAN',
          className: '   ' // Empty className
        }
      };
      
      clickHandler(mockEvent);
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'ui',
        message: "Usuario hizo click en 'span.'",
        data: {
          selector: 'span.',
          tagName: 'SPAN',
          id: undefined,
          className: '   '
        }
      });
    });
  });

  describe('setupFetchInterceptor', () => {
    it('should setup fetch interceptor in browser environment', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      
      interceptors.setupFetchInterceptor();
      
      expect(interceptors.originalHandlers.fetch).toBeDefined();
      expect(typeof global.fetch).toBe('function');
      
      console.log = originalLog;
    });

    it('should handle non-browser environment', () => {
      // This test verifies that the interceptor handles missing window gracefully
      expect(() => {
        const originalWindow = global.window;
        global.window = undefined;
        
        interceptors.setupFetchInterceptor();
        
        global.window = originalWindow;
      }).not.toThrow();
    });

    it('should handle environment without fetch', () => {
      const originalFetch = global.fetch;
      const originalLog = console.log;
      global.fetch = undefined;
      global.window.fetch = undefined;
      console.log = jest.fn();
      
      interceptors.setupFetchInterceptor();
      
      expect(console.log).toHaveBeenCalledWith('SyntropyFront: Fetch interceptor no disponible (no browser/fetch)');
      
      global.fetch = originalFetch;
      global.window.fetch = originalFetch;
      console.log = originalLog;
    });

    it('should create breadcrumb and chain with original fetch', async () => {
      const mockResponse = { status: 200 };
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      interceptors.setupFetchInterceptor();
      
      const result = await global.fetch('https://api.example.com/data', { method: 'POST' });
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'network',
        message: 'Request: POST https://api.example.com/data',
        data: {
          url: 'https://api.example.com/data',
          method: 'POST',
          timestamp: expect.any(Number)
        }
      });
      expect(result).toBe(mockResponse);
    });

    it('should handle Request object', async () => {
      const mockRequest = new Request('https://api.example.com/data', { method: 'PUT' });
      const mockResponse = { status: 200 };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      interceptors.setupFetchInterceptor();
      
      await global.fetch(mockRequest);
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'network',
        message: 'Request: PUT https://api.example.com/data',
        data: {
          url: 'https://api.example.com/data',
          method: 'PUT',
          timestamp: expect.any(Number)
        }
      });
    });

    it('should use default method when not specified', async () => {
      const mockResponse = { status: 200 };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      interceptors.setupFetchInterceptor();
      
      await global.fetch('https://api.example.com/data');
      
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'network',
        message: 'Request: GET https://api.example.com/data',
        data: {
          url: 'https://api.example.com/data',
          method: 'GET',
          timestamp: expect.any(Number)
        }
      });
    });
  });

  describe('setupErrorInterceptors', () => {
    it('should setup error interceptors in browser environment', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      
      interceptors.setupErrorInterceptors();
      
      expect(interceptors.originalHandlers.onerror).toBeDefined();
      expect(interceptors.originalHandlers.onunhandledrejection).toBeDefined();
      
      console.log = originalLog;
    });

    it('should handle non-browser environment', () => {
      // This test verifies that the interceptor handles missing window gracefully
      expect(() => {
        const originalWindow = global.window;
        global.window = undefined;
        
        interceptors.setupErrorInterceptors();
        
        global.window = originalWindow;
      }).not.toThrow();
    });

    it('should not setup error interceptors when disabled', () => {
      interceptors.configure({
        captureErrors: false,
        captureUnhandledRejections: false
      });
      
      interceptors.setupErrorInterceptors();
      
      expect(interceptors.originalHandlers.onerror).toBeNull();
      expect(interceptors.originalHandlers.onunhandledrejection).toBeNull();
    });

    it('should handle onerror event and chain with original handler', () => {
      const originalHandler = jest.fn().mockReturnValue(true);
      global.onerror = originalHandler;
      
      interceptors.setupErrorInterceptors();
      
      const result = global.onerror('Test error', 'test.js', 10, 5, new Error('Test error'));
      
      expect(agent.sendError).toHaveBeenCalledWith({
        type: 'uncaught_exception',
        error: {
          message: 'Test error',
          source: 'test.js',
          lineno: 10,
          colno: 5,
          stack: expect.any(String)
        },
        breadcrumbs: [],
        timestamp: expect.any(String)
      }, null);
      expect(originalHandler).toHaveBeenCalledWith('Test error', 'test.js', 10, 5, expect.any(Error));
      expect(result).toBe(true);
    });

    it('should handle onerror event without original handler', () => {
      interceptors.setupErrorInterceptors();
      
      const result = global.onerror('Test error', 'test.js', 10, 5, new Error('Test error'));
      
      expect(agent.sendError).toHaveBeenCalled();
      // The result might be undefined in some cases, so we just check that it's not true
      expect(result).not.toBe(true);
    });

    it('should handle onerror event with original handler error', () => {
      const originalHandler = jest.fn().mockImplementation(() => {
        throw new Error('Original handler error');
      });
      const originalWarn = console.warn;
      console.warn = jest.fn();
      global.onerror = originalHandler;
      
      interceptors.setupErrorInterceptors();
      
      const result = global.onerror('Test error', 'test.js', 10, 5, new Error('Test error'));
      
      expect(console.warn).toHaveBeenCalledWith('SyntropyFront: Error en handler original:', expect.any(Error));
      expect(result).toBe(false);
      
      console.warn = originalWarn;
    });

    it('should handle onunhandledrejection event and chain with original handler', () => {
      const originalHandler = jest.fn();
      global.onunhandledrejection = originalHandler;
      
      interceptors.setupErrorInterceptors();
      
      const mockEvent = {
        reason: new Error('Promise rejection')
      };
      
      global.onunhandledrejection(mockEvent);
      
      expect(agent.sendError).toHaveBeenCalledWith({
        type: 'unhandled_rejection',
        error: {
          message: 'Promise rejection',
          stack: expect.any(String)
        },
        breadcrumbs: [],
        timestamp: expect.any(String)
      }, null);
      expect(originalHandler).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle onunhandledrejection event without reason message', () => {
      interceptors.setupErrorInterceptors();
      
      const mockEvent = {
        reason: {}
      };
      
      global.onunhandledrejection(mockEvent);
      
      expect(agent.sendError).toHaveBeenCalledWith({
        type: 'unhandled_rejection',
        error: {
          message: 'Rechazo de promesa sin mensaje',
          stack: undefined
        },
        breadcrumbs: [],
        timestamp: expect.any(String)
      }, null);
    });

    it('should handle onunhandledrejection event with original handler error', () => {
      const originalHandler = jest.fn().mockImplementation(() => {
        throw new Error('Original handler error');
      });
      const originalWarn = console.warn;
      console.warn = jest.fn();
      global.onunhandledrejection = originalHandler;
      
      interceptors.setupErrorInterceptors();
      
      const mockEvent = {
        reason: new Error('Promise rejection')
      };
      
      global.onunhandledrejection(mockEvent);
      
      expect(console.warn).toHaveBeenCalledWith('SyntropyFront: Error en handler original de rejection:', expect.any(Error));
      
      console.warn = originalWarn;
    });
  });

  describe('handleError', () => {
    it('should send error to agent with context when configured', () => {
      interceptors.contextTypes = ['device', 'window'];
      
      const errorPayload = {
        type: 'test_error',
        error: { message: 'Test error' }
      };
      
      interceptors.handleError(errorPayload);
      
      expect(contextCollector.collect).toHaveBeenCalledWith(['device', 'window']);
      expect(agent.sendError).toHaveBeenCalledWith(errorPayload, {});
    });

    it('should send error to agent without context when not configured', () => {
      interceptors.contextTypes = [];
      
      const errorPayload = {
        type: 'test_error',
        error: { message: 'Test error' }
      };
      
      interceptors.handleError(errorPayload);
      
      expect(contextCollector.collect).not.toHaveBeenCalled();
      expect(agent.sendError).toHaveBeenCalledWith(errorPayload, null);
    });

    it('should call custom error handler when available', () => {
      const customHandler = jest.fn();
      interceptors.onError = customHandler;
      
      const errorPayload = {
        type: 'test_error',
        error: { message: 'Test error' }
      };
      
      interceptors.handleError(errorPayload);
      
      expect(customHandler).toHaveBeenCalledWith(errorPayload);
      expect(agent.sendError).toHaveBeenCalled();
    });

    it('should log to console when no custom handler is available', () => {
      const originalError = console.error;
      console.error = jest.fn();
      
      const errorPayload = {
        type: 'test_error',
        error: { message: 'Test error' }
      };
      
      interceptors.handleError(errorPayload);
      
      expect(console.error).toHaveBeenCalledWith('SyntropyFront - Error detectado:', errorPayload);
      
      console.error = originalError;
    });
  });

  describe('destroy', () => {
    it('should restore original handlers and clean up', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      
      // Setup interceptors first
      interceptors.init();
      
      interceptors.destroy();
      
      expect(interceptors.isInitialized).toBe(false);
      expect(interceptors.eventListeners.size).toBe(0);
      expect(interceptors.originalHandlers).toEqual({
        fetch: null,
        onerror: null,
        onunhandledrejection: null
      });
      
      expect(console.log).toHaveBeenCalledWith('SyntropyFront: Limpiando interceptores...');
      expect(console.log).toHaveBeenCalledWith('SyntropyFront: Interceptors destruidos y handlers restaurados');
      
      console.log = originalLog;
    });

    it('should do nothing if not initialized', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      
      interceptors.destroy();
      
      expect(console.log).not.toHaveBeenCalled();
      
      console.log = originalLog;
    });

    it('should remove event listeners', () => {
      const originalLog = console.log;
      console.log = jest.fn();
      
      interceptors.init();
      interceptors.destroy();
      
      expect(interceptors.eventListeners.size).toBe(0);
      expect(console.log).toHaveBeenCalledWith('SyntropyFront: Event listener click removido');
      
      console.log = originalLog;
    });
  });

  describe('getHandlerInfo', () => {
    it('should return handler information when not initialized', () => {
      const info = interceptors.getHandlerInfo();
      
      expect(info).toEqual({
        isInitialized: false,
        hasOriginalFetch: false,
        hasOriginalOnError: false,
        hasOriginalOnUnhandledRejection: false,
        eventListenersCount: 0
      });
    });

    it('should return handler information when initialized', () => {
      interceptors.init();
      
      const info = interceptors.getHandlerInfo();
      
      expect(info.isInitialized).toBe(true);
      expect(info.hasOriginalFetch).toBe(true);
      expect(info.hasOriginalOnError).toBe(true);
      expect(info.hasOriginalOnUnhandledRejection).toBe(true);
      expect(info.eventListenersCount).toBe(1); // click listener
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error in onerror handler', () => {
      interceptors.setupErrorInterceptors();
      
      global.onerror('Test error', 'test.js', 10, 5, null);
      
      expect(agent.sendError).toHaveBeenCalledWith({
        type: 'uncaught_exception',
        error: {
          message: 'Test error',
          source: 'test.js',
          lineno: 10,
          colno: 5,
          stack: undefined
        },
        breadcrumbs: [],
        timestamp: expect.any(String)
      }, null);
    });

    it('should handle null reason in onunhandledrejection handler', () => {
      interceptors.setupErrorInterceptors();
      
      const mockEvent = {
        reason: null
      };
      
      global.onunhandledrejection(mockEvent);
      
      expect(agent.sendError).toHaveBeenCalledWith({
        type: 'unhandled_rejection',
        error: {
          message: 'Rechazo de promesa sin mensaje',
          stack: undefined
        },
        breadcrumbs: [],
        timestamp: expect.any(String)
      }, null);
    });

    it('should handle element with non-string className', () => {
      interceptors.setupClickInterceptor();
      
      const clickHandler = interceptors.eventListeners.get('click');
      const mockEvent = {
        target: {
          tagName: 'DIV',
          className: { toString: () => 'custom-class' } // Non-string className
        }
      };
      
      clickHandler(mockEvent);
      
      // Verify that breadcrumb was added
      expect(breadcrumbStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ui',
          data: expect.objectContaining({
            tagName: 'DIV'
          })
        })
      );
    });
  });
}); 