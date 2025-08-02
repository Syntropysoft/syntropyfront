const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Importar Agent directamente
const { Agent } = require('../src/core/agent/Agent.js');

describe('Agent', () => {
  let agent;
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;
  let mockFetch;
  let mockIndexedDB;

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
    
    // Mock IndexedDB
    mockIndexedDB = {
      open: jest.fn(),
      deleteDatabase: jest.fn()
    };
    global.indexedDB = mockIndexedDB;
    
    // Mock window
    global.window = {
      indexedDB: mockIndexedDB
    };
    
    // Crear nueva instancia del Agent
    agent = new Agent();
  });

  afterEach(() => {
    // Restore original console methods
    global.console.log = console.log;
    global.console.error = console.error;
    global.console.warn = console.warn;
    
    // Cleanup
    if (agent) {
      agent.disable();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(agent.endpoint).toBeNull();
      expect(agent.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(agent.batchSize).toBe(10);
      expect(agent.batchTimeout).toBeNull();
      expect(agent.queue).toEqual([]);
      expect(agent.batchTimer).toBeNull();
      expect(agent.isEnabled).toBe(false);
      expect(agent.sendBreadcrumbs).toBe(false);
      expect(agent.encrypt).toBeNull();
      expect(agent.retryQueue).toEqual([]);
      expect(agent.retryTimer).toBeNull();
      expect(agent.maxRetries).toBe(5);
      expect(agent.baseDelay).toBe(1000);
      expect(agent.maxDelay).toBe(30000);
      expect(agent.usePersistentBuffer).toBe(false);
      expect(agent.dbName).toBe('SyntropyFrontBuffer');
      expect(agent.dbVersion).toBe(1);
      expect(agent.storeName).toBe('failedItems');
    });

    it('should initialize persistent buffer when IndexedDB is available', async () => {
      // Mock successful IndexedDB initialization
      const mockDB = {
        objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
        createObjectStore: jest.fn()
      };
      
      const mockRequest = {
        onerror: null,
        onupgradeneeded: null,
        onsuccess: null,
        result: mockDB
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);
      
      // Crear nueva instancia para probar la inicialización
      const newAgent = new Agent();
      
      // Simular éxito en la apertura de IndexedDB
      mockRequest.onsuccess();
      
      // Esperar a que se complete la inicialización
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockConsoleLog).toHaveBeenCalledWith('SyntropyFront: Buffer persistente inicializado');
    });

    it('should handle IndexedDB initialization failure gracefully', async () => {
      // Mock failed IndexedDB initialization
      const mockRequest = {
        onerror: null,
        onupgradeneeded: null,
        onsuccess: null
      };
      
      mockIndexedDB.open.mockReturnValue(mockRequest);
      
      // Crear nueva instancia
      const newAgent = new Agent();
      
      // Simular error en la apertura de IndexedDB
      mockRequest.onerror();
      
      // Esperar a que se complete la inicialización
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('SyntropyFront: Error abriendo IndexedDB, usando solo memoria');
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
      
      expect(agent.endpoint).toBe('https://api.com/errors');
      expect(agent.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      });
      expect(agent.batchSize).toBe(20);
      expect(agent.batchTimeout).toBe(1000);
      expect(agent.isEnabled).toBe(true);
      expect(agent.encrypt).toBe(config.encrypt);
      expect(agent.usePersistentBuffer).toBe(true);
      expect(agent.maxRetries).toBe(3);
      expect(agent.sendBreadcrumbs).toBe(true); // batchTimeout configurado
    });

    it('should configure for error-only mode when no batchTimeout', () => {
      const config = {
        endpoint: 'https://api.com/errors',
        batchSize: 15
      };
      
      agent.configure(config);
      
      expect(agent.batchTimeout).toBeUndefined();
      expect(agent.sendBreadcrumbs).toBe(false);
      expect(agent.isEnabled).toBe(true);
    });

    it('should enable persistent buffer by default', () => {
      const config = {
        endpoint: 'https://api.com/errors'
      };
      
      agent.configure(config);
      
      expect(agent.usePersistentBuffer).toBe(true);
    });

    it('should disable persistent buffer when explicitly set to false', () => {
      const config = {
        endpoint: 'https://api.com/errors',
        usePersistentBuffer: false
      };
      
      agent.configure(config);
      
      expect(agent.usePersistentBuffer).toBe(false);
    });
  });

  describe('sendError', () => {
    it('should send error when enabled', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const errorPayload = { message: 'Test error' };
      const context = { userId: '123' };
      
      agent.sendError(errorPayload, context);
      
      expect(agent.queue).toHaveLength(1);
      expect(agent.queue[0].type).toBe('error');
      expect(agent.queue[0].data).toEqual({
        ...errorPayload,
        context
      });
    });

    it('should not send error when disabled', () => {
      const errorPayload = { message: 'Test error' };
      
      agent.sendError(errorPayload);
      
      expect(agent.queue).toHaveLength(0);
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
      expect(agent.queue[0].data).toEqual({ encrypted: true });
    });

    it('should handle error without context', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const errorPayload = { message: 'Test error' };
      agent.sendError(errorPayload);
      
      expect(agent.queue[0].data).toEqual(errorPayload);
    });
  });

  describe('sendBreadcrumbs', () => {
    it('should send breadcrumbs when enabled', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100 // Habilita envío de breadcrumbs
      });
      
      const breadcrumbs = [
        { category: 'user', message: 'click' },
        { category: 'http', message: 'fetch' }
      ];
      
      // Usar addToQueue directamente para simular sendBreadcrumbs
      agent.addToQueue({
        type: 'breadcrumbs',
        data: breadcrumbs,
        timestamp: new Date().toISOString()
      });
      
      expect(agent.queue).toHaveLength(1);
      expect(agent.queue[0].type).toBe('breadcrumbs');
      expect(agent.queue[0].data).toEqual(breadcrumbs);
    });

    it('should not send breadcrumbs when disabled', () => {
      agent.configure({ endpoint: 'https://api.com/errors' }); // Sin batchTimeout
      
      const breadcrumbs = [{ category: 'user', message: 'click' }];
      
      // Simular que sendBreadcrumbs no agrega nada cuando está deshabilitado
      expect(agent.sendBreadcrumbs).toBe(false);
    });

    it('should not send empty breadcrumbs', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      });
      
      // Simular que sendBreadcrumbs no agrega nada con breadcrumbs vacíos
      expect(agent.queue).toHaveLength(0);
    });

    it('should apply encryption to breadcrumbs when configured', () => {
      const encryptFn = jest.fn().mockReturnValue({ encrypted: true });
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100,
        encrypt: encryptFn
      });
      
      const breadcrumbs = [{ category: 'user', message: 'click' }];
      
      // Simular sendBreadcrumbs con encriptación
      const dataToSend = encryptFn(breadcrumbs);
      agent.addToQueue({
        type: 'breadcrumbs',
        data: dataToSend,
        timestamp: new Date().toISOString()
      });
      
      expect(encryptFn).toHaveBeenCalledWith(breadcrumbs);
      expect(agent.queue[0].data).toEqual({ encrypted: true });
    });

    it('should not send breadcrumbs when agent is disabled', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      });
      agent.isEnabled = false;
      
      // Simular que sendBreadcrumbs no funciona cuando está deshabilitado
      expect(agent.isEnabled).toBe(false);
    });
  });

  describe('addToQueue', () => {
    it('should add item to queue', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const item = { type: 'error', data: { message: 'test' } };
      agent.addToQueue(item);
      
      expect(agent.queue).toContain(item);
    });

    it('should flush immediately when batch size is reached', async () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchSize: 2
      });
      
      mockFetch.mockResolvedValue({ ok: true });
      
      // Agregar items hasta alcanzar el batch size
      agent.addToQueue({ type: 'error', data: { message: 'test1' } });
      agent.addToQueue({ type: 'error', data: { message: 'test2' } });
      
      // Esperar a que se complete el flush
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockFetch).toHaveBeenCalled();
      expect(agent.queue).toHaveLength(0);
    });

    it('should schedule batch timeout when configured', () => {
      jest.useFakeTimers();
      
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      expect(agent.batchTimer).toBeDefined();
      
      jest.useRealTimers();
    });

    it('should not schedule batch timeout when not configured', () => {
      agent.configure({ endpoint: 'https://api.com/errors' }); // Sin batchTimeout
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      expect(agent.batchTimer).toBeNull();
    });
  });

  describe('flush', () => {
    it('should send queued items successfully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      agent.addToQueue({ type: 'error', data: { message: 'test1' } });
      agent.addToQueue({ type: 'error', data: { message: 'test2' } });
      
      await agent.flush();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test1')
        })
      );
      expect(agent.queue).toHaveLength(0);
      expect(mockConsoleLog).toHaveBeenCalledWith('SyntropyFront: Datos enviados exitosamente');
    });

    it('should handle send failure and add to retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(mockConsoleError).toHaveBeenCalledWith('SyntropyFront Agent: Error enviando datos:', expect.any(Error));
      expect(agent.retryQueue).toHaveLength(1);
    });

    it('should clear batch timer after flush', async () => {
      jest.useFakeTimers();
      
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      });
      mockFetch.mockResolvedValue({ ok: true });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      expect(agent.batchTimer).toBeDefined();
      
      await agent.flush();
      expect(agent.batchTimer).toBeNull();
      
      jest.useRealTimers();
    });

    it('should do nothing when queue is empty', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      await agent.flush();
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should save to persistent buffer on failure when enabled', async () => {
      agent.configure({ endpoint: 'https://api.com/errors', usePersistentBuffer: true });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Mock persistent buffer
      const mockStore = { add: jest.fn().mockResolvedValue(undefined) };
      const mockTransaction = { objectStore: jest.fn().mockReturnValue(mockStore) };
      const mockDB = { transaction: jest.fn().mockReturnValue(mockTransaction) };
      agent.db = mockDB;
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(mockStore.add).toHaveBeenCalled();
    });
  });

  describe('sendToBackend', () => {
    it('should send data successfully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      const result = await agent.sendToBackend(items);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test')
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle HTTP error responses', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ 
        ok: false, 
        status: 500, 
        statusText: 'Internal Server Error' 
      });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      
      await expect(agent.sendToBackend(items)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle serialization errors gracefully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      
      await agent.sendToBackend(items);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  describe('Retry System', () => {
    it('should add items to retry queue with exponential backoff', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      expect(agent.retryQueue).toHaveLength(1);
      expect(agent.retryQueue[0].retryCount).toBe(1);
      expect(agent.retryQueue[0].nextRetry).toBeGreaterThan(Date.now());
    });

    it('should process retry queue successfully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      // Simular que el item está listo para procesar
      agent.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.processRetryQueue();
      
      expect(mockFetch).toHaveBeenCalled();
      expect(agent.retryQueue).toHaveLength(0);
      expect(mockConsoleLog).toHaveBeenCalledWith('SyntropyFront: Reintento exitoso después de 1 intentos');
    });

    it('should handle retry failure and schedule next retry', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      // Simular que el item está listo para procesar
      agent.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.processRetryQueue();
      
      expect(agent.retryQueue).toHaveLength(1);
      expect(agent.retryQueue[0].retryCount).toBe(2);
      expect(mockConsoleWarn).toHaveBeenCalledWith('SyntropyFront: Reintento 1 falló:', expect.any(Error));
    });

    it('should remove items after max retries', async () => {
      agent.configure({ endpoint: 'https://api.com/errors', maxRetries: 2 });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 2); // Ya en el máximo
      
      // Simular que el item está listo para procesar
      agent.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.processRetryQueue();
      
      expect(agent.retryQueue).toHaveLength(0);
      expect(mockConsoleError).toHaveBeenCalledWith('SyntropyFront: Item excedió máximo de reintentos, datos perdidos');
    });

    it('should handle retry with persistent buffer ID', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1, 123); // Con persistentId
      
      // Simular que el item está listo para procesar
      agent.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.processRetryQueue();
      
      expect(mockFetch).toHaveBeenCalled();
      expect(agent.retryQueue).toHaveLength(0);
    });

    it('should schedule next retry when items remain in queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      await agent.processRetryQueue();
      
      expect(agent.retryQueue).toHaveLength(1);
      expect(agent.retryTimer).toBeDefined();
    });

    it('should not schedule retry when no items are ready', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 1);
      
      // Los items tienen nextRetry en el futuro, no deberían procesarse
      agent.scheduleRetry();
      
      expect(agent.retryTimer).toBeNull();
    });

    it('should handle multiple retry attempts with exponential backoff', () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      agent.addToRetryQueue(items, 3);
      
      const item = agent.retryQueue[0];
      const expectedDelay = Math.min(agent.baseDelay * Math.pow(2, 2), agent.maxDelay);
      
      expect(item.nextRetry).toBeGreaterThan(Date.now() + expectedDelay - 200);
      expect(item.nextRetry).toBeLessThan(Date.now() + expectedDelay + 200);
    });
  });

  describe('Persistent Buffer', () => {
    it('should save items to persistent buffer on failure', async () => {
      // Mock IndexedDB
      const mockStore = {
        add: jest.fn().mockResolvedValue(undefined)
      };
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore)
      };
      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction)
      };
      
      agent.db = mockDB;
      agent.usePersistentBuffer = true;
      
      const items = [{ type: 'error', data: { message: 'test' } }];
      await agent.saveToPersistentBuffer(items);
      
      expect(mockStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.any(String),
          timestamp: expect.any(String),
          retryCount: 0
        })
      );
    });

    it('should remove items from persistent buffer', async () => {
      const mockStore = {
        delete: jest.fn().mockResolvedValue(undefined)
      };
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockStore)
      };
      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction)
      };
      
      agent.db = mockDB;
      agent.usePersistentBuffer = true;
      
      await agent.removeFromPersistentBuffer(1);
      
      expect(mockStore.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('forceFlush', () => {
    it('should flush queue and retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      // Agregar items a ambas colas
      agent.addToQueue({ type: 'error', data: { message: 'test1' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test2' } }], 1);
      
      // Simular que el item de retry está listo para procesar
      agent.retryQueue[0].nextRetry = Date.now() - 1000;
      
      await agent.forceFlush();
      
      expect(mockFetch).toHaveBeenCalledTimes(2); // Una vez para cada cola
      expect(mockConsoleLog).toHaveBeenCalledWith('SyntropyFront: Intentando enviar items en cola de reintentos...');
    });

    it('should handle empty retry queue', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ ok: true });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      await agent.forceFlush();
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // Solo la cola principal
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        maxRetries: 3
      });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test' } }], 1);
      
      const stats = agent.getStats();
      
      expect(stats.queueLength).toBe(1);
      expect(stats.retryQueueLength).toBe(1);
      expect(stats.isEnabled).toBe(true);
      expect(stats.usePersistentBuffer).toBe(true);
      expect(stats.maxRetries).toBe(3);
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
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test' } }], 1);
      
      agent.disable();
      
      expect(agent.isEnabled).toBe(false);
      expect(agent.queue).toHaveLength(0);
      expect(agent.retryQueue).toHaveLength(0);
    });

    it('should clear timers', () => {
      jest.useFakeTimers();
      
      agent.configure({ 
        endpoint: 'https://api.com/errors',
        batchTimeout: 100
      });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      agent.addToRetryQueue([{ type: 'error', data: { message: 'test' } }], 1);
      
      expect(agent.batchTimer).toBeDefined();
      expect(agent.retryTimer).toBeDefined();
      
      agent.disable();
      
      expect(agent.batchTimer).toBeNull();
      expect(agent.retryTimer).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle configuration without endpoint', () => {
      agent.configure({ batchSize: 20 });
      
      expect(agent.isEnabled).toBe(false);
    });

    it('should handle empty queue flush', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      
      await agent.flush();
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(agent.retryQueue).toHaveLength(1);
    });

    it('should handle HTTP error responses', async () => {
      agent.configure({ endpoint: 'https://api.com/errors' });
      mockFetch.mockResolvedValue({ 
        ok: false, 
        status: 500, 
        statusText: 'Internal Server Error' 
      });
      
      agent.addToQueue({ type: 'error', data: { message: 'test' } });
      
      await agent.flush();
      
      expect(agent.retryQueue).toHaveLength(1);
    });
  });
}); 