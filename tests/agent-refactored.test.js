const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { Agent } = require('../src/core/agent/Agent.js');

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();

// Mock fetch
const mockFetch = jest.fn();

// Mock IndexedDB
const mockStore = {
  add: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn().mockReturnValue(mockStore)
};

const mockDB = {
  transaction: jest.fn().mockReturnValue(mockTransaction)
};

const mockRequest = {
  onerror: null,
  onupgradeneeded: null,
  onsuccess: null,
  result: mockDB
};

const mockIndexedDB = {
  open: jest.fn().mockReturnValue(mockRequest)
};

describe('Agent (Refactored)', () => {
  let agent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    global.console = {
      log: mockConsoleLog,
      error: mockConsoleError,
      warn: mockConsoleWarn
    };
    
    global.fetch = mockFetch;
    global.indexedDB = mockIndexedDB;
    global.window = { indexedDB: mockIndexedDB };
    
    // Create new agent instance
    agent = new Agent();
  });

  afterEach(() => {
    agent.disable();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(agent.config.endpoint).toBeNull();
      expect(agent.config.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(agent.config.batchSize).toBe(10);
      expect(agent.config.batchTimeout).toBeNull();
      expect(agent.config.isEnabled).toBe(false);
      expect(agent.config.sendBreadcrumbs).toBe(false);
      expect(agent.config.encrypt).toBeNull();
      expect(agent.config.usePersistentBuffer).toBe(false);
      expect(agent.config.maxRetries).toBe(5);
      expect(agent.config.baseDelay).toBe(1000);
      expect(agent.config.maxDelay).toBe(30000);
    });

    it('should initialize components', () => {
      expect(agent.config).toBeDefined();
      expect(agent.queue).toBeDefined();
      expect(agent.retry).toBeDefined();
      expect(agent.transport).toBeDefined();
      expect(agent.buffer).toBeDefined();
    });
  });

  describe('configure', () => {
    it('should configure with basic settings', () => {
      const config = {
        endpoint: 'https://api.com/errors',
        headers: { 'Authorization': 'Bearer token' },
        batchSize: 20,
        batchTimeout: 100,
        encrypt: jest.fn(),
        usePersistentBuffer: true,
        maxRetries: 3
      };
      
      agent.configure(config);
      
      expect(agent.config.endpoint).toBe('https://api.com/errors');
      expect(agent.config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      });
      expect(agent.config.batchSize).toBe(20);
              expect(agent.config.batchTimeout).toBe(100);
      expect(agent.config.isEnabled).toBe(true);
      expect(agent.config.encrypt).toBe(config.encrypt);
      expect(agent.config.usePersistentBuffer).toBe(true);
      expect(agent.config.maxRetries).toBe(3);
    });

    it('should configure for error-only mode when no batchTimeout', () => {
      const config = {
        endpoint: 'https://api.com/errors',
        batchSize: 15
      };
      
      agent.configure(config);
      
      expect(agent.config.batchTimeout).toBeUndefined();
      expect(agent.config.sendBreadcrumbs).toBe(false);
      expect(agent.config.isEnabled).toBe(true);
    });

    it('should enable breadcrumbs when batchTimeout is provided', () => {
      const config = {
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      };
      
      agent.configure(config);
      
      expect(agent.config.sendBreadcrumbs).toBe(true);
    });
  });

  describe('sendError', () => {
    it('should send error when enabled', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const errorPayload = { message: 'Test error' };
      const context = { userId: '123' };
      
      agent.sendError(errorPayload, context);
      
      expect(agent.queue.getSize()).toBe(1);
      const queueItem = agent.queue.getAll()[0];
      expect(queueItem.type).toBe('error');
      expect(queueItem.data).toEqual({
        ...errorPayload,
        context
      });
    });

    it('should not send error when disabled', () => {
      const errorPayload = { message: 'Test error' };
      
      agent.sendError(errorPayload);
      
      expect(agent.queue.getSize()).toBe(0);
      expect(mockConsoleWarn).toHaveBeenCalledWith('SyntropyFront Agent: No configurado, error no enviado');
    });

    it('should apply encryption when configured', () => {
      const encryptFn = jest.fn().mockReturnValue({ encrypted: true });
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        encrypt: encryptFn 
      });
      
      const errorPayload = { message: 'Test error' };
      agent.sendError(errorPayload);
      
      expect(encryptFn).toHaveBeenCalledWith(errorPayload);
      const queueItem = agent.queue.getAll()[0];
      expect(queueItem.data).toEqual({ encrypted: true });
    });
  });

  describe('sendBreadcrumbs', () => {
    it('should send breadcrumbs when enabled', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100 
      });
      
      const breadcrumbs = [
        { category: 'user', message: 'click' },
        { category: 'http', message: 'fetch' }
      ];
      
      agent.sendBreadcrumbs(breadcrumbs);
      
      expect(agent.queue.getSize()).toBe(1);
      const queueItem = agent.queue.getAll()[0];
      expect(queueItem.type).toBe('breadcrumbs');
      expect(queueItem.data).toEqual(breadcrumbs);
    });

    it('should not send breadcrumbs when disabled', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const breadcrumbs = [{ category: 'user', message: 'click' }];
      agent.sendBreadcrumbs(breadcrumbs);
      
      expect(agent.queue.getSize()).toBe(0);
    });

    it('should not send empty breadcrumbs', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100 
      });
      
      agent.sendBreadcrumbs([]);
      
      expect(agent.queue.getSize()).toBe(0);
    });
  });

  describe('flush', () => {
    it('should send queued items successfully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      agent.queue.add({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(mockFetch).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('SyntropyFront: Datos enviados exitosamente');
    });

    it('should handle send failure and add to retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      agent.queue.add({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(mockConsoleError).toHaveBeenCalledWith('SyntropyFront Agent: Error enviando datos:', expect.any(Error));
      expect(agent.retry.getSize()).toBe(1);
    });

    it('should do nothing when queue is empty', async () => {
      await agent.flush();
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('retry system', () => {
    it('should add items to retry queue', () => {
      const items = [{ type: 'error', data: { message: 'test' } }];
      
      agent.addToRetryQueue(items, 1);
      
      expect(agent.retry.getSize()).toBe(1);
    });

    it('should process retry queue successfully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      // Simular que el item está listo para procesar
      agent.retry.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.processRetryQueue();
      
      expect(mockFetch).toHaveBeenCalled();
      expect(agent.retry.getSize()).toBe(0);
    });
  });

  describe('forceFlush', () => {
    it('should flush queue and retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      agent.queue.add({ type: 'error', data: { message: 'test1' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test2' } }], 1);
      
      // Simular que el item de retry está listo para procesar
      agent.retry.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.forceFlush();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      await agent.forceFlush();
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      agent.queue.add({ type: 'error', data: { message: 'test1' } });
      agent.queue.add({ type: 'error', data: { message: 'test2' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test3' } }], 1);
      
      const stats = agent.getStats();
      
      expect(stats.queueLength).toBe(2);
      expect(stats.retryQueueLength).toBe(1);
      expect(stats.isEnabled).toBe(true);
      expect(stats.usePersistentBuffer).toBe(false);
      expect(stats.maxRetries).toBe(5);
    });

    it('should return correct stats when disabled', () => {
      const stats = agent.getStats();
      
      expect(stats.isEnabled).toBe(false);
      expect(stats.queueLength).toBe(0);
      expect(stats.retryQueueLength).toBe(0);
    });
  });

  describe('disable', () => {
    it('should disable agent and clear queues', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      agent.queue.add({ type: 'error', data: { message: 'test' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test' } }], 1);
      
      agent.disable();
      
      expect(agent.config.isEnabled).toBe(false);
      expect(agent.queue.getSize()).toBe(0);
      expect(agent.retry.getSize()).toBe(0);
    });
  });

  describe('persistent buffer', () => {
    it('should retry failed items from buffer', async () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        usePersistentBuffer: true 
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      // Mock el método retryFailedItems del buffer
      agent.buffer.retryFailedItems = jest.fn().mockResolvedValue(undefined);
      agent.buffer.usePersistentBuffer = true;
      
      await agent.retryFailedItems();
      
      expect(agent.buffer.retryFailedItems).toHaveBeenCalled();
    });
  });
}); 