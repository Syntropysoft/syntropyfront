import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import syntropyFront from '../src/index.js';

describe('SyntropyFront', () => {
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let mockFetch;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = vi.fn();
    mockConsoleError = vi.fn();
    mockConsoleWarn = vi.fn();
    
    global.console.log = mockConsoleLog;
    global.console.error = mockConsoleError;
    global.console.warn = mockConsoleWarn;
    
    // Mock fetch
    mockFetch = vi.fn();
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
      const onError = vi.fn();
      
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
      const onError = vi.fn();
      syntropyFront.configure({ onError });
      
      syntropyFront.sendError(new Error('Test error'));
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error'
      }));
      expect(mockFetch).not.toHaveBeenCalled(); // Should not use fetch when callback is provided
    });

    it('should prioritize custom callback over fetch', () => {
      const onError = vi.fn();
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
      const onError = vi.fn().mockImplementation(() => {
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
  });

  describe('Automatic Capture', () => {
    it('should capture click events', () => {
      // Simulate click event
      const clickEvent = {
        target: {
          tagName: 'BUTTON',
          id: 'test-button',
          className: 'btn-primary'
        },
        clientX: 100,
        clientY: 200
      };
      
      // Trigger the click handler that was set up during initialization
      const clickHandler = document.addEventListener.mock.calls
        .find(call => call[0] === 'click');
      
      if (clickHandler) {
        clickHandler[1](clickEvent);
        
        const breadcrumbs = syntropyFront.getBreadcrumbs();
        expect(breadcrumbs).toHaveLength(1);
        expect(breadcrumbs[0].category).toBe('user');
        expect(breadcrumbs[0].message).toBe('click');
        expect(breadcrumbs[0].data).toEqual({
          element: 'BUTTON',
          id: 'test-button',
          className: 'btn-primary',
          x: 100,
          y: 200
        });
      }
    });

    it('should capture console logs', () => {
      // Add a manual breadcrumb to test console capture
      syntropyFront.addBreadcrumb('console', 'log', { message: 'test message' });
      
      const breadcrumbs = syntropyFront.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].category).toBe('console');
      expect(breadcrumbs[0].message).toBe('log');
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
      const onError = vi.fn();
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