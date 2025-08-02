const { describe, it, expect, beforeEach } = require('@jest/globals');
const { RetryLogicManager } = require('../src/core/RetryLogicManager.js');

// Mock RobustSerializer
jest.mock('../src/utils/RobustSerializer.js', () => ({
    robustSerializer: {
        serialize: jest.fn(),
        deserialize: jest.fn()
    }
}));

const { robustSerializer } = require('../src/utils/RobustSerializer.js');

describe('RetryLogicManager', () => {
    let retryLogicManager;
    let mockStorageManager;
    let mockConfigManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockStorageManager = {
            retrieve: jest.fn(),
            retrieveById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
        };
        
        mockConfigManager = {
            maxRetries: 3
        };
        
        retryLogicManager = new RetryLogicManager(mockStorageManager, mockConfigManager);
    });

    describe('constructor', () => {
        it('should initialize with storage manager and config', () => {
            expect(retryLogicManager.storageManager).toBe(mockStorageManager);
            expect(retryLogicManager.config).toBe(mockConfigManager);
        });
    });

    describe('retryFailedItems', () => {
        it('should handle null storage manager', async () => {
            retryLogicManager.storageManager = null;
            
            await expect(retryLogicManager.retryFailedItems()).resolves.toBeUndefined();
        });

        it('should handle deserialization error', async () => {
            const mockItems = [
                { id: 1, items: 'serialized_data', retryCount: 0 }
            ];
            
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            robustSerializer.deserialize.mockImplementation(() => {
                throw new Error('Deserialization failed');
            });
            
            await retryLogicManager.retryFailedItems();
            
            expect(mockStorageManager.remove).toHaveBeenCalledWith(1);
        });

        it('should increment retry count on send failure', async () => {
            const mockItems = [
                { id: 1, items: 'serialized_data', retryCount: 0 }
            ];
            
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            mockStorageManager.retrieveById.mockResolvedValue({ id: 1, retryCount: 0 });
            robustSerializer.deserialize.mockReturnValue([{ test: 'data' }]);
            
            const sendCallback = jest.fn().mockRejectedValue(new Error('Send failed'));
            
            await retryLogicManager.retryFailedItems(sendCallback);
            
            expect(mockStorageManager.update).toHaveBeenCalledWith(1, { retryCount: 1 });
        });

        it('should remove item when max retries exceeded', async () => {
            const mockItems = [
                { id: 1, items: 'serialized_data', retryCount: 3 }
            ];
            
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            
            await retryLogicManager.retryFailedItems();
            
            expect(mockStorageManager.remove).toHaveBeenCalledWith(1);
        });
    });

    describe('incrementRetryCount', () => {
        it('should increment retry count', async () => {
            const mockItem = { id: 1, retryCount: 2 };
            mockStorageManager.retrieveById.mockResolvedValue(mockItem);
            
            await retryLogicManager.incrementRetryCount(1);
            
            expect(mockStorageManager.update).toHaveBeenCalledWith(1, { retryCount: 3 });
        });

        it('should handle null item', async () => {
            mockStorageManager.retrieveById.mockResolvedValue(null);
            
            await expect(retryLogicManager.incrementRetryCount(1)).resolves.toBeUndefined();
        });
    });

    describe('removeFailedItem', () => {
        it('should remove item from storage', async () => {
            await retryLogicManager.removeFailedItem(1);
            
            expect(mockStorageManager.remove).toHaveBeenCalledWith(1);
        });
    });

    describe('cleanupExpiredItems', () => {
        it('should remove expired items', async () => {
            const mockItems = [
                { id: 1, retryCount: 3 },
                { id: 2, retryCount: 2 },
                { id: 3, retryCount: 3 }
            ];
            
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            
            await retryLogicManager.cleanupExpiredItems();
            
            expect(mockStorageManager.remove).toHaveBeenCalledWith(1);
            expect(mockStorageManager.remove).toHaveBeenCalledWith(3);
            expect(mockStorageManager.remove).not.toHaveBeenCalledWith(2);
        });
    });

    describe('getRetryStats', () => {
        it('should return correct stats', async () => {
            const mockItems = [
                { id: 1, retryCount: 0 },
                { id: 2, retryCount: 1 },
                { id: 3, retryCount: 1 }
            ];
            
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            
            const stats = await retryLogicManager.getRetryStats();
            
            expect(stats.totalItems).toBe(3);
            expect(stats.averageRetryCount).toBe(2/3);
            expect(stats.itemsByRetryCount).toEqual({
                0: 1,
                1: 2
            });
        });

        it('should return default stats when no items', async () => {
            mockStorageManager.retrieve.mockResolvedValue([]);
            
            const stats = await retryLogicManager.getRetryStats();
            
            expect(stats.totalItems).toBe(0);
            expect(stats.averageRetryCount).toBe(0);
            expect(stats.itemsByRetryCount).toEqual({});
        });
    });
}); 