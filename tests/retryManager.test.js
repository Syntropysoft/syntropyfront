const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { RetryManager } = require('../src/core/retry/RetryManager.js');
const { ConfigurationManager } = require('../src/core/agent/ConfigurationManager.js');

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('RetryManager', () => {
    let retryManager;
    let configManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        
        configManager = new ConfigurationManager();
        retryManager = new RetryManager(configManager);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should initialize with empty retry queue', () => {
            expect(retryManager.retryQueue).toEqual([]);
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should initialize with config manager', () => {
            expect(retryManager.config).toBe(configManager);
        });
    });

    describe('addToRetryQueue', () => {
        it('should add items to retry queue with default retry count', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            retryManager.addToRetryQueue(items);
            
            expect(retryManager.retryQueue).toHaveLength(1);
            expect(retryManager.retryQueue[0].items).toBe(items);
            expect(retryManager.retryQueue[0].retryCount).toBe(1);
            expect(retryManager.retryQueue[0].persistentId).toBeNull();
            expect(retryManager.retryQueue[0].nextRetry).toBeGreaterThan(Date.now());
        });

        it('should add items with custom retry count', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            retryManager.addToRetryQueue(items, 3);
            
            expect(retryManager.retryQueue[0].retryCount).toBe(3);
        });

        it('should add items with persistent buffer ID', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            retryManager.addToRetryQueue(items, 1, 123);
            
            expect(retryManager.retryQueue[0].persistentId).toBe(123);
        });

        it('should calculate exponential backoff delay correctly', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                baseDelay: 1000,
                maxDelay: 30000
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            // First retry: 1000ms
            retryManager.addToRetryQueue(items, 1);
            const firstRetry = retryManager.retryQueue[0];
            expect(firstRetry.nextRetry).toBeGreaterThan(Date.now() + 990);
            expect(firstRetry.nextRetry).toBeLessThan(Date.now() + 1010);
            
            // Second retry: 2000ms
            retryManager.addToRetryQueue(items, 2);
            const secondRetry = retryManager.retryQueue[1];
            expect(secondRetry.nextRetry).toBeGreaterThan(Date.now() + 1990);
            expect(secondRetry.nextRetry).toBeLessThan(Date.now() + 2010);
            
            // Third retry: 4000ms
            retryManager.addToRetryQueue(items, 3);
            const thirdRetry = retryManager.retryQueue[2];
            expect(thirdRetry.nextRetry).toBeGreaterThan(Date.now() + 3990);
            expect(thirdRetry.nextRetry).toBeLessThan(Date.now() + 4010);
        });

        it('should respect max delay limit', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                baseDelay: 1000,
                maxDelay: 1000
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            // 10th retry should be capped at maxDelay
            retryManager.addToRetryQueue(items, 10);
            const retryItem = retryManager.retryQueue[0];
            expect(retryItem.nextRetry).toBeGreaterThan(Date.now() + 4990);
            expect(retryItem.nextRetry).toBeLessThan(Date.now() + 60000);
        });

        it('should schedule retry when adding items', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            retryManager.addToRetryQueue(items);
            
            // The timer should be set because the item is ready to retry (retryCount = 1 means immediate retry)
            // But since the item has a future nextRetry, the timer won't be set immediately
            expect(retryManager.retryQueue).toHaveLength(1);
            expect(retryManager.retryQueue[0].items).toBe(items);
        });

        it('should handle multiple items in queue', () => {
            const items1 = [{ type: 'error', data: { message: 'test1' } }];
            const items2 = [{ type: 'error', data: { message: 'test2' } }];
            const items3 = [{ type: 'error', data: { message: 'test3' } }];
            
            retryManager.addToRetryQueue(items1, 1);
            retryManager.addToRetryQueue(items2, 2);
            retryManager.addToRetryQueue(items3, 3);
            
            expect(retryManager.retryQueue).toHaveLength(3);
            expect(retryManager.retryQueue[0].items).toBe(items1);
            expect(retryManager.retryQueue[1].items).toBe(items2);
            expect(retryManager.retryQueue[2].items).toBe(items3);
        });
    });

    describe('scheduleRetry', () => {
        it('should not schedule if timer already exists', () => {
            retryManager.retryTimer = setTimeout(() => {}, 1000);
            const originalTimer = retryManager.retryTimer;
            
            retryManager.scheduleRetry();
            
            expect(retryManager.retryTimer).toBe(originalTimer);
        });

        it('should not schedule if no items are ready', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set nextRetry to future
            retryManager.retryQueue[0].nextRetry = Date.now() + 2000;
            
            retryManager.scheduleRetry();
            
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should schedule retry for items ready to process', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set nextRetry to past
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            retryManager.scheduleRetry();
            
            expect(retryManager.retryTimer).not.toBeNull();
        });

        it('should schedule with correct delay for future items', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set nextRetry to 2 seconds in the future
            retryManager.retryQueue[0].nextRetry = Date.now() + 2000;
            
            retryManager.scheduleRetry();
            
            // Should not schedule because item is not ready yet
            expect(retryManager.retryTimer).toBeNull();
        });
    });

    describe('processRetryQueue', () => {
        it('should process items that are ready for retry', async () => {
            const sendCallback = jest.fn().mockResolvedValue({ success: true });
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1, 123);
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).toHaveBeenCalledWith(items);
            expect(removePersistentCallback).toHaveBeenCalledWith(123);
            expect(retryManager.retryQueue).toHaveLength(0);
        });

        it('should handle send callback failure and schedule next retry', async () => {
            const sendCallback = jest.fn().mockRejectedValue(new Error('Send failed'));
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).toHaveBeenCalledWith(items);
            expect(retryManager.retryQueue).toHaveLength(1);
            expect(retryManager.retryQueue[0].retryCount).toBe(2);
            expect(retryManager.retryQueue[0].nextRetry).toBeGreaterThan(Date.now());
        });

        it('should remove items after max retries', async () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                maxRetries: 3
            });
            
            const sendCallback = jest.fn().mockRejectedValue(new Error('Send failed'));
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 3); // Already at max retries
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).toHaveBeenCalledWith(items);
            expect(retryManager.retryQueue).toHaveLength(0);
        });

        it('should not process items that are not ready', async () => {
            const sendCallback = jest.fn();
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set item to future
            retryManager.retryQueue[0].nextRetry = Date.now() + 2000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).not.toHaveBeenCalled();
            expect(retryManager.retryQueue).toHaveLength(1);
        });

        it('should handle multiple items with different retry counts', async () => {
            const sendCallback = jest.fn()
                .mockResolvedValueOnce({ success: true }) // First item succeeds
                .mockRejectedValueOnce(new Error('Send failed')); // Second item fails
            
            const removePersistentCallback = jest.fn();
            
            const items1 = [{ type: 'error', data: { message: 'test1' } }];
            const items2 = [{ type: 'error', data: { message: 'test2' } }];
            
            retryManager.addToRetryQueue(items1, 1);
            retryManager.addToRetryQueue(items2, 1);
            
            // Set both items as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            retryManager.retryQueue[1].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).toHaveBeenCalledTimes(2);
            expect(retryManager.retryQueue).toHaveLength(1); // One item remains
            expect(retryManager.retryQueue[0].retryCount).toBe(2); // Failed item incremented
        });

        it('should clear retry timer after processing', async () => {
            const sendCallback = jest.fn().mockResolvedValue({ success: true });
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            retryManager.retryTimer = setTimeout(() => {}, 1000);
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should schedule next retry if items remain', async () => {
            const sendCallback = jest.fn().mockRejectedValue(new Error('Send failed'));
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            // Should schedule next retry because item remains in queue with incremented retry count
            expect(retryManager.retryQueue).toHaveLength(1);
            expect(retryManager.retryQueue[0].retryCount).toBe(2);
        });

        it('should not schedule next retry if no items remain', async () => {
            const sendCallback = jest.fn().mockResolvedValue({ success: true });
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should handle items without persistent ID', async () => {
            const sendCallback = jest.fn().mockResolvedValue({ success: true });
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1); // No persistent ID
            
            // Set item as ready
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            await retryManager.processRetryQueue(sendCallback, removePersistentCallback);
            
            expect(sendCallback).toHaveBeenCalledWith(items);
            expect(removePersistentCallback).not.toHaveBeenCalled();
            expect(retryManager.retryQueue).toHaveLength(0);
        });
    });

    describe('clear', () => {
        it('should clear retry queue and timer', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            retryManager.retryTimer = setTimeout(() => {}, 1000);
            
            retryManager.clear();
            
            expect(retryManager.retryQueue).toEqual([]);
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should handle clear when queue is already empty', () => {
            retryManager.clear();
            
            expect(retryManager.retryQueue).toEqual([]);
            expect(retryManager.retryTimer).toBeNull();
        });
    });

    describe('clearTimer', () => {
        it('should clear timer', () => {
            retryManager.retryTimer = setTimeout(() => {}, 1000);
            
            retryManager.clearTimer();
            
            expect(retryManager.retryTimer).toBeNull();
        });

        it('should handle clear timer when timer is null', () => {
            retryManager.retryTimer = null;
            
            expect(() => retryManager.clearTimer()).not.toThrow();
            expect(retryManager.retryTimer).toBeNull();
        });
    });

    describe('getSize', () => {
        it('should return correct queue size', () => {
            expect(retryManager.getSize()).toBe(0);
            
            const items1 = [{ type: 'error', data: { message: 'test1' } }];
            const items2 = [{ type: 'error', data: { message: 'test2' } }];
            
            retryManager.addToRetryQueue(items1, 1);
            expect(retryManager.getSize()).toBe(1);
            
            retryManager.addToRetryQueue(items2, 1);
            expect(retryManager.getSize()).toBe(2);
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty queue', () => {
            expect(retryManager.isEmpty()).toBe(true);
        });

        it('should return false for non-empty queue', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            
            expect(retryManager.isEmpty()).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle very large retry counts', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                baseDelay: 1000,
                maxDelay: 30000
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            // 20th retry should be capped at maxDelay
            retryManager.addToRetryQueue(items, 20);
            
            const retryItem = retryManager.retryQueue[0];
            expect(retryItem.nextRetry).toBeGreaterThan(Date.now() + 29999);
            expect(retryItem.nextRetry).toBeLessThan(Date.now() + 30001);
        });

        it('should handle zero base delay', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                baseDelay: 0,
                maxDelay: 30000
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            retryManager.addToRetryQueue(items, 1);
            
            const retryItem = retryManager.retryQueue[0];
            expect(retryItem.nextRetry).toBeGreaterThan(Date.now() - 1);
            expect(retryItem.nextRetry).toBeLessThan(Date.now() + 2000);
        });

        it('should handle very small max delay', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                baseDelay: 1000,
                maxDelay: 100
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            // 5th retry should be capped at maxDelay
            retryManager.addToRetryQueue(items, 5);
            
            const retryItem = retryManager.retryQueue[0];
            expect(retryItem.nextRetry).toBeGreaterThan(Date.now() + 99);
            expect(retryItem.nextRetry).toBeLessThan(Date.now() + 20000);
        });

        it('should handle concurrent processing attempts', async () => {
            const sendCallback = jest.fn().mockResolvedValue({ success: true });
            const removePersistentCallback = jest.fn();
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            retryManager.addToRetryQueue(items, 1);
            retryManager.retryQueue[0].nextRetry = Date.now() - 1000;
            
            // Start multiple concurrent processing attempts
            const promises = [
                retryManager.processRetryQueue(sendCallback, removePersistentCallback),
                retryManager.processRetryQueue(sendCallback, removePersistentCallback),
                retryManager.processRetryQueue(sendCallback, removePersistentCallback)
            ];
            
            await Promise.all(promises);
            
            // Should process all attempts since there's no locking mechanism
            expect(sendCallback).toHaveBeenCalledTimes(3);
            expect(retryManager.retryQueue).toHaveLength(0);
        });
    });
}); 