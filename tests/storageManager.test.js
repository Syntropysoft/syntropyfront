const { describe, it, expect, beforeEach } = require('@jest/globals');
const { StorageManager } = require('../src/core/StorageManager.js');

// Mock RobustSerializer
jest.mock('../src/utils/RobustSerializer.js', () => ({
    robustSerializer: {
        serialize: jest.fn(),
        deserialize: jest.fn()
    }
}));

const { robustSerializer } = require('../src/utils/RobustSerializer.js');

describe('StorageManager', () => {
    let storageManager;
    let mockDatabaseManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDatabaseManager = {
            isDatabaseAvailable: jest.fn(),
            getReadTransaction: jest.fn(),
            getWriteTransaction: jest.fn(),
            storeName: 'testStore'
        };
        
        storageManager = new StorageManager(mockDatabaseManager);
    });

    describe('constructor', () => {
        it('should initialize with database manager', () => {
            expect(storageManager.databaseManager).toBe(mockDatabaseManager);
        });
    });

    describe('save', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.save([])).rejects.toThrow('Database not available');
        });

        it('should handle serialization error gracefully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            robustSerializer.serialize.mockImplementation(() => {
                throw new Error('Serialization failed');
            });
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue({
                    add: jest.fn().mockReturnValue({
                        onsuccess: null,
                        onerror: null
                    })
                })
            };
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.save([{ test: 'data' }]);
            
            // Simulate successful save
            mockTransaction.objectStore().add().onsuccess();
            
            await promise;
            
            expect(robustSerializer.serialize).toHaveBeenCalled();
        });
    });

    describe('retrieve', () => {
        it('should return empty array when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            const result = await storageManager.retrieve();
            
            expect(result).toEqual([]);
        });
    });

    describe('remove', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.remove(1)).rejects.toThrow('Database not available');
        });
    });
}); 