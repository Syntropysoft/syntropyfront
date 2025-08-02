const { describe, it, expect, beforeEach } = require('@jest/globals');
const { PersistentBufferManager } = require('../src/core/persistent/PersistentBufferManager.js');

// Mock the component classes
jest.mock('../src/core/database/DatabaseManager.js');
jest.mock('../src/core/database/StorageManager.js');
jest.mock('../src/core/retry/RetryLogicManager.js');

const { DatabaseManager } = require('../src/core/database/DatabaseManager.js');
const { StorageManager } = require('../src/core/database/StorageManager.js');
const { RetryLogicManager } = require('../src/core/retry/RetryLogicManager.js');

describe('PersistentBufferManager (Refactored)', () => {
    let persistentBufferManager;
    let mockConfigManager;
    let mockDatabaseManager;
    let mockStorageManager;
    let mockRetryLogicManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockConfigManager = {
            usePersistentBuffer: true,
            maxRetries: 3
        };
        
        mockDatabaseManager = {
            init: jest.fn(),
            isDatabaseAvailable: jest.fn(),
            close: jest.fn()
        };
        
        mockStorageManager = {
            save: jest.fn(),
            retrieve: jest.fn(),
            remove: jest.fn(),
            clear: jest.fn()
        };
        
        mockRetryLogicManager = {
            retryFailedItems: jest.fn(),
            cleanupExpiredItems: jest.fn(),
            getRetryStats: jest.fn()
        };
        
        // Mock constructor calls
        DatabaseManager.mockImplementation(() => mockDatabaseManager);
        StorageManager.mockImplementation(() => mockStorageManager);
        RetryLogicManager.mockImplementation(() => mockRetryLogicManager);
        
        persistentBufferManager = new PersistentBufferManager(mockConfigManager);
    });

    describe('constructor', () => {
        it('should initialize with config manager', () => {
            expect(persistentBufferManager.config).toBe(mockConfigManager);
            expect(persistentBufferManager.usePersistentBuffer).toBe(false);
        });

        it('should create component instances', () => {
            expect(DatabaseManager).toHaveBeenCalledWith(
                'SyntropyFrontBuffer',
                1,
                'failedItems'
            );
            expect(StorageManager).toHaveBeenCalledWith(mockDatabaseManager, expect.any(Object));
            expect(RetryLogicManager).toHaveBeenCalledWith(mockStorageManager, mockConfigManager);
        });

        it('should call initPersistentBuffer', () => {
            expect(mockDatabaseManager.init).toHaveBeenCalled();
        });
    });

    describe('initPersistentBuffer', () => {
        it('should initialize database successfully', async () => {
            mockDatabaseManager.init.mockResolvedValue(true);
            
            await persistentBufferManager.initPersistentBuffer();
            
            expect(persistentBufferManager.usePersistentBuffer).toBe(true);
        });

        it('should handle initialization failure', async () => {
            mockDatabaseManager.init.mockResolvedValue(false);
            
            await persistentBufferManager.initPersistentBuffer();
            
            expect(persistentBufferManager.usePersistentBuffer).toBe(false);
        });

        it('should handle initialization error', async () => {
            mockDatabaseManager.init.mockRejectedValue(new Error('DB Error'));
            
            await persistentBufferManager.initPersistentBuffer();
            
            expect(persistentBufferManager.usePersistentBuffer).toBe(false);
        });
    });

    describe('save', () => {
        it('should save items when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            const items = [{ test: 'data' }];
            
            await persistentBufferManager.save(items);
            
            expect(mockStorageManager.save).toHaveBeenCalledWith(items);
        });

        it('should not save when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            await persistentBufferManager.save([{ test: 'data' }]);
            
            expect(mockStorageManager.save).not.toHaveBeenCalled();
        });

        it('should handle save error', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            mockStorageManager.save.mockRejectedValue(new Error('Save failed'));
            
            await expect(persistentBufferManager.save([])).resolves.toBeUndefined();
        });
    });

    describe('retrieve', () => {
        it('should retrieve items when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            const mockItems = [{ id: 1, data: 'test' }];
            mockStorageManager.retrieve.mockResolvedValue(mockItems);
            
            const result = await persistentBufferManager.retrieve();
            
            expect(result).toEqual(mockItems);
            expect(mockStorageManager.retrieve).toHaveBeenCalled();
        });

        it('should return empty array when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            const result = await persistentBufferManager.retrieve();
            
            expect(result).toEqual([]);
            expect(mockStorageManager.retrieve).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should remove item when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            
            await persistentBufferManager.remove(1);
            
            expect(mockStorageManager.remove).toHaveBeenCalledWith(1);
        });

        it('should not remove when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            await persistentBufferManager.remove(1);
            
            expect(mockStorageManager.remove).not.toHaveBeenCalled();
        });
    });

    describe('retryFailedItems', () => {
        it('should retry items when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            const sendCallback = jest.fn();
            const removeCallback = jest.fn();
            
            await persistentBufferManager.retryFailedItems(sendCallback, removeCallback);
            
            expect(mockRetryLogicManager.retryFailedItems).toHaveBeenCalledWith(sendCallback, removeCallback);
        });

        it('should not retry when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            await persistentBufferManager.retryFailedItems();
            
            expect(mockRetryLogicManager.retryFailedItems).not.toHaveBeenCalled();
        });
    });

    describe('cleanupExpiredItems', () => {
        it('should cleanup when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            
            await persistentBufferManager.cleanupExpiredItems();
            
            expect(mockRetryLogicManager.cleanupExpiredItems).toHaveBeenCalled();
        });

        it('should not cleanup when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            await persistentBufferManager.cleanupExpiredItems();
            
            expect(mockRetryLogicManager.cleanupExpiredItems).not.toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return stats when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            const mockStats = { totalItems: 5, averageRetryCount: 2 };
            mockRetryLogicManager.getRetryStats.mockResolvedValue(mockStats);
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const stats = await persistentBufferManager.getStats();
            
            expect(stats).toEqual({
                ...mockStats,
                isAvailable: true
            });
        });

        it('should return default stats when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            const stats = await persistentBufferManager.getStats();
            
            expect(stats).toEqual({
                totalItems: 0,
                itemsByRetryCount: {},
                averageRetryCount: 0,
                isAvailable: false
            });
        });
    });

    describe('isAvailable', () => {
        it('should return true when both conditions are met', () => {
            persistentBufferManager.usePersistentBuffer = true;
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            expect(persistentBufferManager.isAvailable()).toBe(true);
        });

        it('should return false when persistent buffer is disabled', () => {
            persistentBufferManager.usePersistentBuffer = false;
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            expect(persistentBufferManager.isAvailable()).toBe(false);
        });

        it('should return false when database is not available', () => {
            persistentBufferManager.usePersistentBuffer = true;
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            expect(persistentBufferManager.isAvailable()).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear storage when persistent buffer is enabled', async () => {
            persistentBufferManager.usePersistentBuffer = true;
            
            await persistentBufferManager.clear();
            
            expect(mockStorageManager.clear).toHaveBeenCalled();
        });

        it('should not clear when persistent buffer is disabled', async () => {
            persistentBufferManager.usePersistentBuffer = false;
            
            await persistentBufferManager.clear();
            
            expect(mockStorageManager.clear).not.toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should close database and disable persistent buffer', () => {
            persistentBufferManager.usePersistentBuffer = true;
            
            persistentBufferManager.close();
            
            expect(mockDatabaseManager.close).toHaveBeenCalled();
            expect(persistentBufferManager.usePersistentBuffer).toBe(false);
        });
    });
}); 