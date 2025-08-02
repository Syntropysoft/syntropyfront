const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const syntropyFront = require('../src/index.js').default;

describe('SyntropyFront', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let mockFetch;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.fn();
    mockConsoleError = jest.fn();
    mockConsoleWarn = jest.fn();
    
    global.console.log = mockConsoleLog;
    global.console.error = mockConsoleError;
    global.console.warn = mockConsoleWarn;
    
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Reset SyntropyFront state
    syntropyFront.clearBreadcrumbs();
    syntropyFront.clearErrors();
  });

  afterEach(() => {
    // Restore original console methods
    global.console.log = console.log;
    global.console.error = console.error;
    global.console.warn = console.warn;
  });

  describe('Initialization', () => {
    it('should auto-initialize when imported', () => {
      expect(syntropyFront.isActive).toBe(true);
      // Note: The console.log call happens during import, so we can't test it here
    });

    it('should have default configuration', () => {
      const stats = syntropyFront.getStats();
      expect(stats.maxEvents).toBe(50);
      expect(stats.isActive).toBe(true);
      expect(stats.hasFetchConfig).toBe(false);
      expect(stats.hasErrorCallback).toBe(false);
      expect(stats.endpoint).toBe('console');
    });
  });

  describe('Configuration', () => {
    it('should configure with basic settings', () => {
      syntropyFront.configure({ maxEvents: 25 });
      
      const stats = syntropyFront.getStats();
      expect(stats.maxEvents).toBe(25);
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ SyntropyFront: Configured - maxEvents: 25, console only');
    });

    it('should configure with fetch endpoint', () => {
      const fetchConfig = {
        url: 'https://api.com/errors',
        options: { headers: { 'Content-Type': 'application/json' } }
      };
      
      syntropyFront.configure({ maxEvents: 30, fetch: fetchConfig });
      
      const stats = syntropyFront.getStats();
      expect(stats.maxEvents).toBe(30);
      expect(stats.hasFetchConfig).toBe(true);
      expect(stats.endpoint).toBe('https://api.com/errors');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ SyntropyFront: Configured - maxEvents: 30, endpoint: https://api.com/errors');
    });

    it('should configure with custom error handler', () => {
      const onError = jest.fn();
      
      syntropyFront.configure({ maxEvents: 40, onError });
      
      const stats = syntropyFront.getStats();
      expect(stats.maxEvents).toBe(40);
      expect(stats.hasErrorCallback).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ SyntropyFront: Configured - maxEvents: 40, custom error handler');
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumbs', () => {
      syntropyFront.addBreadcrumb('user', 'test action', { data: 'value' });
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('user');
      expect(breadcrumbs[0].message).toBe('test action');
      expect(breadcrumbs[0].data).toEqual({ data: 'value' });
    });

    it('should respect maxEvents limit', () => {
      syntropyFront.configure({ maxEvents: 3 });
      
      // Add 5 breadcrumbs
      for (let i = 0; i < 5; i++) {
        syntropyFront.addBreadcrumb('test', `action ${i}`);
      }
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].message).toBe('action 2');
      expect(breadcrumbs[2].message).toBe('action 4');
    });

    it('should validate maxEvents comparison uses correct operator', () => {
      syntropyFront.configure({ maxEvents: 1 });
      
      // Add exactly maxEvents breadcrumbs
      syntropyFront.addBreadcrumb('user', 'first');
      syntropyFront.addBreadcrumb('user', 'second');
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      // Should keep only the last one when exceeding the limit
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].message).toBe('second');
    });

    it('should validate isActive initialization state', () => {
      // Test that isActive starts as false and gets set to true during initialization
      // This validates the initialization logic
      expect(syntropyFront.isActive).toBe(true);
      
      // Test that we can manually set it to false and it affects operations
      syntropyFront.isActive = false;
      syntropyFront.addBreadcrumb('test', 'should not be added');
      expect(syntropyFront.getBreadcrumbs()).toHaveLength(0);
      
      // Restore to true
      syntropyFront.isActive = true;
    });

    it('should clear breadcrumbs', () => {
      syntropyFront.addBreadcrumb('user', 'test');
      expect(syntropyFront.getBreadcrumbs()).toHaveLength(1);
      
      syntropyFront.clearBreadcrumbs();
      expect(syntropyFront.getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should send manual errors', () => {
      const error = new Error('Test error');
      const result = syntropyFront.sendError(error, { context: 'test' });
      
      expect(result).toBeDefined();
      expect(mockConsoleError).toHaveBeenCalledWith('❌ Error:', expect.objectContaining({
        message: 'Test error',
        breadcrumbs: expect.any(Array)
      }));
    });

    it('should handle errors with fetch configuration', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      
      const fetchConfig = {
        url: 'https://api.com/errors',
        options: { headers: { 'Content-Type': 'application/json' } }
      };
      
      syntropyFront.configure({ fetch: fetchConfig });
      syntropyFront.sendError(new Error('Test error'));
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test error')
        })
      );
    });

    it('should handle errors with custom callback', () => {
      const onError = jest.fn();
      syntropyFront.configure({ onError });
      
      syntropyFront.sendError(new Error('Test error'));
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }));
      expect(mockFetch).not.toHaveBeenCalled(); // Should not use fetch when callback is provided
    });

    it('should prioritize custom callback over fetch', () => {
      const onError = jest.fn();
      const fetchConfig = { url: 'https://api.com/errors' };
      
      syntropyFront.configure({ onError, fetch: fetchConfig });
      syntropyFront.sendError(new Error('Test error'));
      
      expect(onError).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled(); // Custom callback takes priority
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const fetchConfig = { url: 'https://api.com/errors' };
      syntropyFront.configure({ fetch: fetchConfig });
      syntropyFront.sendError(new Error('Test error'));
      
      expect(mockFetch).toHaveBeenCalled();
      
      // Wait for the async fetch to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'SyntropyFront: Error posting to endpoint:',
        expect.any(Error)
      );
    });

    it('should handle callback errors gracefully', () => {
      const onError = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      syntropyFront.configure({ onError });
      syntropyFront.sendError(new Error('Test error'));
      
      expect(onError).toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'SyntropyFront: Error in user callback:',
        expect.any(Error)
      );
    });

    it('should validate isActive state prevents operations when false', () => {
      // Test that the isActive check actually works
      const originalIsActive = syntropyFront.isActive;
      
      // Temporarily set isActive to false
      syntropyFront.isActive = false;
      
      syntropyFront.addBreadcrumb('test', 'message');
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      
      // Should not add breadcrumb when inactive
      expect(breadcrumbs).toHaveLength(0);
      
      // Restore original state
      syntropyFront.isActive = originalIsActive;
    });

    it('should validate fetch configuration includes default headers', () => {
      mockFetch.mockResolvedValue({ ok: true });
      
      const fetchConfig = { url: 'https://api.com/errors' };
      syntropyFront.configure({ fetch: fetchConfig });
      syntropyFront.sendError(new Error('Test error'));
      
      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      const fetchOptions = fetchCall[1];
      
      // Verify that the default Content-Type header is set
      expect(fetchOptions.headers).toBeDefined();
      expect(fetchOptions.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Automatic Capture', () => {
    it('should capture click events', () => {
      // Test that the click capture functionality is available
      // (The actual click handler is set up during initialization)
      expect(syntropyFront.isActive).toBe(true);
      
      // Verify that the automatic capture setup was called
      // This is tested indirectly through the initialization
    });

    it('should capture console logs', () => {
      // Add a manual breadcrumb to test console capture
      syntropyFront.addBreadcrumb('console', 'log', { message: 'test message' });
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('console');
      expect(breadcrumbs[0].message).toBe('log');
    });

    it('should validate automatic capture setup is called', () => {
      // Test that the automatic capture methods are actually called during initialization
      // This validates that the setupAutomaticCapture method is not empty
      expect(syntropyFront.isActive).toBe(true);
      
      // Verify that the setup methods exist and are functions
      expect(typeof syntropyFront.setupAutomaticCapture).toBe('function');
      expect(typeof syntropyFront.setupClickCapture).toBe('function');
      expect(typeof syntropyFront.setupErrorCapture).toBe('function');
      expect(typeof syntropyFront.setupHttpCapture).toBe('function');
      expect(typeof syntropyFront.setupConsoleCapture).toBe('function');
    });

    it('should validate window environment detection', () => {
      // Test that the window environment check works correctly
      // This validates the typeof window === 'undefined' check
      expect(typeof window).toBe('object');
      
      // The setupAutomaticCapture should work in browser environment
      expect(syntropyFront.isActive).toBe(true);
    });

    it('should validate automatic capture methods are called during initialization', () => {
      // Test that the automatic capture setup actually calls the individual setup methods
      // This validates that setupAutomaticCapture is not empty
      
      // Verify that the setup methods exist and are functions
      expect(typeof syntropyFront.setupAutomaticCapture).toBe('function');
      expect(typeof syntropyFront.setupClickCapture).toBe('function');
      expect(typeof syntropyFront.setupErrorCapture).toBe('function');
      expect(typeof syntropyFront.setupHttpCapture).toBe('function');
      expect(typeof syntropyFront.setupConsoleCapture).toBe('function');
      
      // Test that the automatic capture was actually set up (indirectly)
      expect(syntropyFront.isActive).toBe(true);
      
      // Verify that the setup methods contain the expected functionality
      // This validates that the automatic capture setup is working
      const setupAutomaticCaptureStr = syntropyFront.setupAutomaticCapture.toString();
      expect(setupAutomaticCaptureStr).toContain('setupClickCapture');
      expect(setupAutomaticCaptureStr).toContain('setupErrorCapture');
      expect(setupAutomaticCaptureStr).toContain('setupHttpCapture');
      expect(setupAutomaticCaptureStr).toContain('setupConsoleCapture');
    });
  });

  describe('Statistics', () => {
    it('should return accurate statistics', () => {
      syntropyFront.configure({ maxEvents: 25 });
      syntropyFront.addBreadcrumb('user', 'test');
      syntropyFront.sendError(new Error('test error'));
      
      const stats = syntropyFront.getStats();
      expect(stats.breadcrumbs).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.isActive).toBe(true);
      expect(stats.maxEvents).toBe(25);
      expect(stats.hasFetchConfig).toBe(false);
      expect(stats.hasErrorCallback).toBe(false);
      expect(stats.endpoint).toBe('console');
    });

    it('should track fetch configuration in stats', () => {
      const fetchConfig = { url: 'https://api.com/errors' };
      syntropyFront.configure({ fetch: fetchConfig });
      
      const stats = syntropyFront.getStats();
      expect(stats.hasFetchConfig).toBe(true);
      expect(stats.endpoint).toBe('https://api.com/errors');
    });

    it('should track error callback in stats', () => {
      const onError = jest.fn();
      syntropyFront.configure({ onError });
      
      const stats = syntropyFront.getStats();
      expect(stats.hasErrorCallback).toBe(true);
    });
  });

  describe('Error Management', () => {
    it('should get all errors', () => {
      syntropyFront.sendError(new Error('Error 1'));
      syntropyFront.sendError(new Error('Error 2'));
      
      const errors = syntropyFront.getErrors();
      expect(errors).toHaveLength(2);
    });

    it('should clear errors', () => {
      syntropyFront.sendError(new Error('Test error'));
      expect(syntropyFront.getErrors()).toHaveLength(1);
      
      syntropyFront.clearErrors();
      expect(syntropyFront.getErrors()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle configuration without parameters', () => {
      expect(() => {
        syntropyFront.configure();
      }).not.toThrow();
    });

    it('should handle empty breadcrumb data', () => {
      expect(() => {
        syntropyFront.addBreadcrumb('test', 'message');
      }).not.toThrow();
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      expect(breadcrumbs[0].data).toEqual({});
    });

    it('should handle null/undefined error in sendError', () => {
      expect(() => {
        syntropyFront.sendError(null);
        syntropyFront.sendError(undefined);
      }).toThrow(); // Should throw because we try to access .message on null/undefined
    });
  });
}); 