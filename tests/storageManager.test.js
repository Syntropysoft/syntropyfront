const { describe, it, expect, beforeEach } = require('@jest/globals');
const { StorageManager } = require('../src/core/database/StorageManager.js');

// Mock SerializationManager
jest.mock('../src/core/database/SerializationManager.js', () => ({
    SerializationManager: jest.fn().mockImplementation(() => ({
        serialize: jest.fn().mockReturnValue({
            success: true,
            data: 'serialized_data',
            error: null,
            timestamp: '2023-01-01T00:00:00.000Z'
        }),
        deserialize: jest.fn().mockReturnValue({
            success: true,
            data: [{ test: 'data' }],
            error: null,
            timestamp: '2023-01-01T00:00:00.000Z'
        }),
        isSuccessful: jest.fn().mockReturnValue(true),
        getData: jest.fn().mockImplementation((result, fallback) => {
            return result.success ? result.data : fallback;
        })
    }))
}));

const { SerializationManager } = require('../src/core/database/SerializationManager.js');

describe('StorageManager', () => {
    let storageManager;
    let mockDatabaseManager;
    let mockSerializationManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock por defecto para transacciones
        const defaultMockRequest = {
            onsuccess: null,
            onerror: null,
            result: []
        };
        
        const defaultMockStore = {
            add: jest.fn().mockReturnValue(defaultMockRequest),
            getAll: jest.fn().mockReturnValue(defaultMockRequest),
            get: jest.fn().mockReturnValue(defaultMockRequest),
            delete: jest.fn().mockReturnValue(defaultMockRequest),
            put: jest.fn().mockReturnValue(defaultMockRequest),
            clear: jest.fn().mockReturnValue(defaultMockRequest)
        };
        
        const defaultMockTransaction = {
            objectStore: jest.fn().mockReturnValue(defaultMockStore)
        };
        
        mockDatabaseManager = {
            isDatabaseAvailable: jest.fn(),
            getReadTransaction: jest.fn().mockReturnValue(defaultMockTransaction),
            getWriteTransaction: jest.fn().mockReturnValue(defaultMockTransaction),
            storeName: 'testStore'
        };
        
        mockSerializationManager = new SerializationManager();
        storageManager = new StorageManager(mockDatabaseManager, mockSerializationManager);
    });

    describe('constructor', () => {
        it('should initialize with database manager and serialization manager', () => {
            expect(storageManager.databaseManager).toBe(mockDatabaseManager);
            expect(storageManager.serializationManager).toBe(mockSerializationManager);
        });
    });

    describe('save', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.save([])).rejects.toThrow('Database not available');
        });

        it('should save items successfully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null
            };
            
            const mockStore = {
                add: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.save([{ test: 'data' }]);
            
            // Simulate successful save
            mockRequest.onsuccess();
            
            await promise;
            
            expect(mockSerializationManager.serialize).toHaveBeenCalledWith([{ test: 'data' }]);
        });

        it('should handle serialization error gracefully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            mockSerializationManager.serialize.mockReturnValue({
                success: false,
                data: 'fallback_data',
                error: { type: 'serialization_error', message: 'Serialization failed' },
                timestamp: '2023-01-01T00:00:00.000Z'
            });
            
            const mockRequest = {
                onsuccess: null,
                onerror: null
            };
            
            const mockStore = {
                add: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.save([{ test: 'data' }]);
            
            // Simulate successful save
            mockRequest.onsuccess();
            
            await promise;
            
            expect(mockSerializationManager.serialize).toHaveBeenCalled();
        });
    });

    describe('retrieve', () => {
        it('should return empty array when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            const result = await storageManager.retrieve();
            
            expect(result).toEqual([]);
        });

        it('should retrieve and deserialize items successfully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null,
                result: [{ id: 1, items: 'serialized_data' }]
            };
            
            const mockStore = {
                getAll: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getReadTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.retrieve();
            
            // Simulate successful retrieval
            mockRequest.onsuccess();
            
            const result = await promise;
            
            expect(mockSerializationManager.deserialize).toHaveBeenCalled();
        });
    });

    describe('retrieveById', () => {
        it('should return null when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            const result = await storageManager.retrieveById(1);
            
            expect(result).toBeNull();
        });

        it('should retrieve and deserialize item by id', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null,
                result: { id: 1, items: 'serialized_data' }
            };
            
            const mockStore = {
                get: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getReadTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.retrieveById(1);
            
            // Simulate successful retrieval
            mockRequest.onsuccess();
            
            await promise;
            
            expect(mockSerializationManager.deserialize).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.remove(1)).rejects.toThrow('Database not available');
        });

        it('should remove item successfully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null
            };
            
            const mockStore = {
                delete: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.remove(1);
            
            // Simulate successful removal
            mockRequest.onsuccess();
            
            await promise;
        });
    });

    describe('update', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.update(1, {})).rejects.toThrow('Database not available');
        });

        it.skip('should update item successfully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null
            };
            
            const mockStore = {
                put: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            // Override the default mock for this specific test
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            mockDatabaseManager.getReadTransaction.mockReturnValue(mockTransaction);
            
            // Mock retrieveById to return an existing item
            mockSerializationManager.deserialize.mockReturnValue({
                success: true,
                data: [{ id: 1, test: 'original' }],
                error: null,
                timestamp: '2023-01-01T00:00:00.000Z'
            });
            
            const promise = storageManager.update(1, { test: 'updated' });
            
            // Simulate successful update
            mockRequest.onsuccess();
            
            await promise;
        });
    });

    describe('clear', () => {
        it('should throw error when database is not available', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(false);
            
            await expect(storageManager.clear()).rejects.toThrow('Database not available');
        });

        it('should clear storage successfully', async () => {
            mockDatabaseManager.isDatabaseAvailable.mockReturnValue(true);
            
            const mockRequest = {
                onsuccess: null,
                onerror: null
            };
            
            const mockStore = {
                clear: jest.fn().mockReturnValue(mockRequest)
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue(mockStore)
            };
            
            mockDatabaseManager.getWriteTransaction.mockReturnValue(mockTransaction);
            
            const promise = storageManager.clear();
            
            // Simulate successful clear
            mockRequest.onsuccess();
            
            await promise;
        });
    });
}); 