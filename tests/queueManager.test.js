const { describe, it, expect, beforeEach } = require('@jest/globals');
const { QueueManager } = require('../src/core/QueueManager.js');
const { ConfigurationManager } = require('../src/core/ConfigurationManager.js');

// Mock setTimeout
jest.useFakeTimers();

describe('QueueManager', () => {
    let queueManager;
    let configManager;

    beforeEach(() => {
        configManager = new ConfigurationManager();
        queueManager = new QueueManager(configManager);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('constructor', () => {
        it('should initialize with empty queue', () => {
            expect(queueManager.queue).toEqual([]);
            expect(queueManager.batchTimer).toBeNull();
        });
    });

    describe('add', () => {
        it('should add item to queue', () => {
            const item = { type: 'error', data: 'test' };
            queueManager.add(item);
            
            expect(queueManager.queue).toHaveLength(1);
            expect(queueManager.queue[0]).toBe(item);
        });

        it('should flush immediately when batch size is reached', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchSize: 2 
            });

            const flushCallback = jest.fn();
            queueManager.flushCallback = flushCallback;

            queueManager.add({ type: 'error', data: 'test1' });
            queueManager.add({ type: 'error', data: 'test2' });

            expect(flushCallback).toHaveBeenCalledWith([
                { type: 'error', data: 'test1' },
                { type: 'error', data: 'test2' }
            ]);
            expect(queueManager.queue).toHaveLength(0);
        });

        it('should schedule timeout when batchTimeout is configured', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 1000 
            });

            const flushCallback = jest.fn();
            queueManager.flushCallback = flushCallback;

            queueManager.add({ type: 'error', data: 'test' });

            expect(queueManager.batchTimer).not.toBeNull();
            expect(flushCallback).not.toHaveBeenCalled();

            // Fast-forward time
            jest.advanceTimersByTime(1000);

            expect(flushCallback).toHaveBeenCalledWith([
                { type: 'error', data: 'test' }
            ]);
            expect(queueManager.queue).toHaveLength(0);
            expect(queueManager.batchTimer).toBeNull();
        });

        it('should not schedule timeout when batchTimeout is not configured', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });

            queueManager.add({ type: 'error', data: 'test' });

            expect(queueManager.batchTimer).toBeNull();
        });

        it('should not schedule multiple timeouts', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 1000 
            });

            const flushCallback = jest.fn();
            queueManager.flushCallback = flushCallback;

            queueManager.add({ type: 'error', data: 'test1' });
            const firstTimer = queueManager.batchTimer;
            
            queueManager.add({ type: 'error', data: 'test2' });
            
            expect(queueManager.batchTimer).toBe(firstTimer);
        });
    });

    describe('getAll', () => {
        it('should return copy of queue', () => {
            const item1 = { type: 'error', data: 'test1' };
            const item2 = { type: 'error', data: 'test2' };
            
            queueManager.queue = [item1, item2];
            
            const result = queueManager.getAll();
            
            expect(result).toEqual([item1, item2]);
            expect(result).not.toBe(queueManager.queue); // Should be a copy
        });
    });

    describe('clear', () => {
        it('should clear queue and timer', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 1000 
            });

            queueManager.queue = [{ type: 'error', data: 'test' }];
            queueManager.batchTimer = setTimeout(() => {}, 1000);

            queueManager.clear();

            expect(queueManager.queue).toEqual([]);
            expect(queueManager.batchTimer).toBeNull();
        });
    });

    describe('clearTimer', () => {
        it('should clear timer', () => {
            queueManager.batchTimer = setTimeout(() => {}, 1000);
            
            queueManager.clearTimer();
            
            expect(queueManager.batchTimer).toBeNull();
        });

        it('should handle null timer', () => {
            queueManager.batchTimer = null;
            
            expect(() => queueManager.clearTimer()).not.toThrow();
            expect(queueManager.batchTimer).toBeNull();
        });
    });

    describe('getSize', () => {
        it('should return queue length', () => {
            expect(queueManager.getSize()).toBe(0);
            
            queueManager.queue = [{ type: 'error', data: 'test1' }, { type: 'error', data: 'test2' }];
            
            expect(queueManager.getSize()).toBe(2);
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty queue', () => {
            expect(queueManager.isEmpty()).toBe(true);
        });

        it('should return false for non-empty queue', () => {
            queueManager.queue = [{ type: 'error', data: 'test' }];
            expect(queueManager.isEmpty()).toBe(false);
        });
    });

    describe('flush', () => {
        it('should do nothing when queue is empty', async () => {
            const flushCallback = jest.fn();
            
            await queueManager.flush(flushCallback);
            
            expect(flushCallback).not.toHaveBeenCalled();
        });

        it('should call flush callback with items', async () => {
            const item1 = { type: 'error', data: 'test1' };
            const item2 = { type: 'error', data: 'test2' };
            
            queueManager.queue = [item1, item2];
            const flushCallback = jest.fn();
            
            await queueManager.flush(flushCallback);
            
            expect(flushCallback).toHaveBeenCalledWith([item1, item2]);
            expect(queueManager.queue).toEqual([]);
            expect(queueManager.batchTimer).toBeNull();
        });

        it('should clear timer after flush', async () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 1000 
            });

            queueManager.queue = [{ type: 'error', data: 'test' }];
            queueManager.batchTimer = setTimeout(() => {}, 1000);
            
            await queueManager.flush(() => {});
            
            expect(queueManager.batchTimer).toBeNull();
        });

        it('should handle flush without callback', async () => {
            queueManager.queue = [{ type: 'error', data: 'test' }];
            
            await expect(queueManager.flush()).resolves.not.toThrow();
            
            expect(queueManager.queue).toEqual([]);
        });
    });
}); 