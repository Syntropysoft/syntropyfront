const { describe, it, expect, beforeEach } = require('@jest/globals');
const { PersistentBufferManager } = require('../src/core/persistent/PersistentBufferManager.js');
const { ConfigurationManager } = require('../src/core/agent/ConfigurationManager.js');

// Mock RobustSerializer
jest.mock('../src/utils/RobustSerializer.js', () => ({
    robustSerializer: {
        serialize: jest.fn(),
        deserialize: jest.fn()
    }
}));

const { robustSerializer } = require('../src/utils/RobustSerializer.js');

describe('PersistentBufferManager', () => {
    let bufferManager;
    let configManager;
    let mockIndexedDB;
    let mockDB;
    let mockTransaction;
    let mockObjectStore;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock window and indexedDB
        global.window = {
            indexedDB: null
        };
        
        // Mock IndexedDB
        mockObjectStore = {
            add: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn()
        };

        mockTransaction = {
            objectStore: jest.fn().mockReturnValue(mockObjectStore)
        };

        mockDB = {
            transaction: jest.fn().mockReturnValue(mockTransaction),
            close: jest.fn()
        };

        const mockRequest = {
            result: mockDB,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null
        };

        mockIndexedDB = {
            open: jest.fn().mockReturnValue(mockRequest)
        };

        global.indexedDB = mockIndexedDB;
        
        configManager = new ConfigurationManager();
        bufferManager = new PersistentBufferManager(configManager);
    });

    describe('constructor', () => {
        it('should initialize with config manager', () => {
            expect(bufferManager.config).toBe(configManager);
        });

        it('should initialize with default database name', () => {
            expect(bufferManager.dbName).toBe('SyntropyFrontBuffer');
        });

        it('should initialize with default store name', () => {
            expect(bufferManager.storeName).toBe('failedItems');
        });

        it('should initialize with default values', () => {
            expect(bufferManager.dbVersion).toBe(1);
            expect(bufferManager.usePersistentBuffer).toBe(false);
        });
    });

    describe('initPersistentBuffer', () => {
        it('should initialize IndexedDB successfully', async () => {
            const mockRequest = {
                result: mockDB,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null
            };

            mockIndexedDB.open.mockReturnValue(mockRequest);

            // Simulate successful database opening
            mockRequest.onsuccess();
            
            // Wait for the async initialization
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(mockIndexedDB.open).toHaveBeenCalledWith('SyntropyFrontBuffer', 1);
        });

        it('should handle database upgrade', async () => {
            const mockRequest = {
                result: mockDB,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null
            };

            mockIndexedDB.open.mockReturnValue(mockRequest);

            // Simulate database upgrade
            mockRequest.onupgradeneeded();
            
            // Simulate successful database opening
            mockRequest.onsuccess();
            
            // Wait for the async initialization
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(mockIndexedDB.open).toHaveBeenCalledWith('SyntropyFrontBuffer', 1);
        });

        it('should handle database error', async () => {
            const mockRequest = {
                result: null,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null
            };

            mockIndexedDB.open.mockReturnValue(mockRequest);

            // Simulate database error
            mockRequest.onerror();
            
            // Wait for the async initialization
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(mockIndexedDB.open).toHaveBeenCalledWith('SyntropyFrontBuffer', 1);
        });

        it('should handle non-browser environment', async () => {
            delete global.window;
            
            const newBufferManager = new PersistentBufferManager(configManager);
            
            // Wait for the async initialization
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(newBufferManager.db).toBeNull();
        });
    });

    describe('save', () => {
        beforeEach(async () => {
            // Setup database
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should save item to IndexedDB', async () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            mockObjectStore.add.mockReturnValue({
                result: 123,
                onsuccess: null
            });

            robustSerializer.serialize.mockReturnValue('{"serialized": "data"}');

            await bufferManager.save(items);
            
            expect(mockObjectStore.add).toHaveBeenCalledWith({
                items: '{"serialized": "data"}',
                timestamp: expect.any(String),
                retryCount: 0
            });
        });

        it('should handle serialization errors gracefully', async () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            robustSerializer.serialize.mockImplementation(() => {
                throw new Error('Serialization failed');
            });

            await bufferManager.save(items);
            
            expect(mockObjectStore.add).toHaveBeenCalledWith({
                items: expect.stringContaining('__serializationError'),
                timestamp: expect.any(String),
                retryCount: 0
            });
        });

        it('should not save when persistent buffer is disabled', async () => {
            bufferManager.usePersistentBuffer = false;
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            await bufferManager.save(items);
            
            expect(mockObjectStore.add).not.toHaveBeenCalled();
        });

        it('should not save when database is not initialized', async () => {
            bufferManager.db = null;
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            await bufferManager.save(items);
            
            expect(mockObjectStore.add).not.toHaveBeenCalled();
        });
    });

    describe('retrieve', () => {
        beforeEach(async () => {
            // Setup database
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should retrieve items from IndexedDB', async () => {
            const mockItems = [
                { id: 1, items: '{"item1": "data"}', timestamp: '2023-01-01', retryCount: 0 },
                { id: 2, items: '{"item2": "data"}', timestamp: '2023-01-02', retryCount: 1 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            const result = await bufferManager.retrieve();
            
            expect(mockObjectStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(mockItems);
        });

        it('should return empty array when no items', async () => {
            mockObjectStore.getAll.mockReturnValue({
                result: [],
                onsuccess: null
            });

            const result = await bufferManager.retrieve();
            
            expect(result).toEqual([]);
        });

        it('should handle retrieval errors gracefully', async () => {
            mockObjectStore.getAll.mockReturnValue({
                onsuccess: null,
                onerror: null
            });

            // Simulate error
            mockObjectStore.getAll().onerror();
            
            const result = await bufferManager.retrieve();
            
            expect(result).toEqual([]);
        });

        it('should return empty array when persistent buffer is disabled', async () => {
            bufferManager.usePersistentBuffer = false;
            
            const result = await bufferManager.retrieve();
            
            expect(result).toEqual([]);
        });

        it('should return empty array when database is not initialized', async () => {
            bufferManager.db = null;
            
            const result = await bufferManager.retrieve();
            
            expect(result).toEqual([]);
        });
    });

    describe('remove', () => {
        beforeEach(async () => {
            // Setup database
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should remove item from IndexedDB', async () => {
            const mockId = 123;
            
            mockObjectStore.delete.mockReturnValue({
                onsuccess: null
            });

            await bufferManager.remove(mockId);
            
            expect(mockObjectStore.delete).toHaveBeenCalledWith(mockId);
        });

        it('should handle removal errors gracefully', async () => {
            const mockId = 123;
            
            mockObjectStore.delete.mockReturnValue({
                onsuccess: null,
                onerror: null
            });

            // Simulate error
            mockObjectStore.delete().onerror();
            
            await bufferManager.remove(mockId);
            
            expect(mockObjectStore.delete).toHaveBeenCalledWith(mockId);
        });

        it('should not remove when persistent buffer is disabled', async () => {
            bufferManager.usePersistentBuffer = false;
            
            const mockId = 123;
            
            await bufferManager.remove(mockId);
            
            expect(mockObjectStore.delete).not.toHaveBeenCalled();
        });

        it('should not remove when database is not initialized', async () => {
            bufferManager.db = null;
            
            const mockId = 123;
            
            await bufferManager.remove(mockId);
            
            expect(mockObjectStore.delete).not.toHaveBeenCalled();
        });
    });

    describe('retryFailedItems', () => {
        beforeEach(async () => {
            // Setup database
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        it('should retry all failed items', async () => {
            const mockItems = [
                { id: 1, items: '{"item1": "data"}', timestamp: '2023-01-01', retryCount: 0 },
                { id: 2, items: '{"item2": "data"}', timestamp: '2023-01-02', retryCount: 1 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            robustSerializer.deserialize
                .mockReturnValueOnce({ type: 'error', data: { message: 'test1' } })
                .mockReturnValueOnce({ type: 'error', data: { message: 'test2' } });

            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).toHaveBeenCalledTimes(2);
            expect(sendCallback).toHaveBeenCalledWith(
                { type: 'error', data: { message: 'test1' } }, 
                1, 
                1
            );
            expect(sendCallback).toHaveBeenCalledWith(
                { type: 'error', data: { message: 'test2' } }, 
                2, 
                2
            );
        });

        it('should handle deserialization errors', async () => {
            const mockItems = [
                { id: 1, items: '{"item1": "data"}', timestamp: '2023-01-01', retryCount: 0 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            robustSerializer.deserialize.mockImplementation(() => {
                throw new Error('Deserialization failed');
            });

            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).not.toHaveBeenCalled();
        });

        it('should handle items that exceed max retries', async () => {
            configManager.configure({ maxRetries: 3 });
            
            const mockItems = [
                { id: 1, items: '{"item1": "data"}', timestamp: '2023-01-01', retryCount: 3 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).not.toHaveBeenCalled();
        });

        it('should handle empty database', async () => {
            mockObjectStore.getAll.mockReturnValue({
                result: [],
                onsuccess: null
            });

            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).not.toHaveBeenCalled();
        });

        it('should not retry when persistent buffer is disabled', async () => {
            bufferManager.usePersistentBuffer = false;
            
            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).not.toHaveBeenCalled();
        });
    });

    describe('isAvailable', () => {
        it('should return false when persistent buffer is disabled', () => {
            bufferManager.usePersistentBuffer = false;
            bufferManager.db = mockDB;
            
            expect(bufferManager.isAvailable()).toBe(false);
        });

        it('should return false when database is not initialized', () => {
            bufferManager.usePersistentBuffer = true;
            bufferManager.db = null;
            
            expect(bufferManager.isAvailable()).toBe(false);
        });

        it('should return true when both conditions are met', () => {
            bufferManager.usePersistentBuffer = true;
            bufferManager.db = mockDB;
            
            expect(bufferManager.isAvailable()).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle non-string items in retryFailedItems', async () => {
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            const mockItems = [
                { id: 1, items: { direct: 'object' }, timestamp: '2023-01-01', retryCount: 0 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            robustSerializer.deserialize.mockReturnValue({ type: 'error', data: { message: 'test' } });

            const sendCallback = jest.fn();

            await bufferManager.retryFailedItems(sendCallback);
            
            expect(sendCallback).toHaveBeenCalledWith(
                { type: 'error', data: { message: 'test' } }, 
                1, 
                1
            );
        });

        it('should handle null sendCallback in retryFailedItems', async () => {
            bufferManager.db = mockDB;
            bufferManager.usePersistentBuffer = true;
            
            const mockItems = [
                { id: 1, items: '{"item1": "data"}', timestamp: '2023-01-01', retryCount: 0 }
            ];
            
            mockObjectStore.getAll.mockReturnValue({
                result: mockItems,
                onsuccess: null
            });

            robustSerializer.deserialize.mockReturnValue({ type: 'error', data: { message: 'test' } });

            // Should not throw when sendCallback is null
            await expect(bufferManager.retryFailedItems(null)).resolves.not.toThrow();
        });
    });
}); 