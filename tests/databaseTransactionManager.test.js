const { describe, it, expect, beforeEach } = require('@jest/globals');
const { DatabaseTransactionManager } = require('../src/core/database/DatabaseTransactionManager.js');

describe('DatabaseTransactionManager', () => {
    let transactionManager;
    let mockConnectionManager;
    let mockConfigManager;

    beforeEach(() => {
        mockConnectionManager = {
            isDatabaseAvailable: jest.fn(),
            getDatabase: jest.fn()
        };

        mockConfigManager = {
            getConfig: jest.fn()
        };

        transactionManager = new DatabaseTransactionManager(mockConnectionManager, mockConfigManager);
    });

    describe('constructor', () => {
        it('should initialize with connection and config managers', () => {
            expect(transactionManager.connectionManager).toBe(mockConnectionManager);
            expect(transactionManager.configManager).toBe(mockConfigManager);
        });
    });

    describe('getReadTransaction', () => {
        it('should return read transaction when database is available', () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('readTransaction')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            const result = transactionManager.getReadTransaction();

            expect(result).toBe('readTransaction');
            expect(mockDb.transaction).toHaveBeenCalledWith(['testStore'], 'readonly');
        });

        it('should throw error when database is not available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            expect(() => transactionManager.getReadTransaction()).toThrow('Database not available');
        });
    });

    describe('getWriteTransaction', () => {
        it('should return write transaction when database is available', () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('writeTransaction')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            const result = transactionManager.getWriteTransaction();

            expect(result).toBe('writeTransaction');
            expect(mockDb.transaction).toHaveBeenCalledWith(['testStore'], 'readwrite');
        });

        it('should throw error when database is not available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            expect(() => transactionManager.getWriteTransaction()).toThrow('Database not available');
        });
    });

    describe('getObjectStore', () => {
        it('should return object store for transaction', () => {
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue('objectStore')
            };
            
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            const result = transactionManager.getObjectStore(mockTransaction);

            expect(result).toBe('objectStore');
            expect(mockTransaction.objectStore).toHaveBeenCalledWith('testStore');
        });
    });

    describe('executeReadOperation', () => {
        it('should execute read operation successfully', async () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('readTransaction')
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue('objectStore')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            // Mock the transaction manager's internal methods
            transactionManager.getReadTransaction = jest.fn().mockReturnValue(mockTransaction);
            transactionManager.getObjectStore = jest.fn().mockReturnValue('objectStore');

            const mockOperation = jest.fn().mockResolvedValue('operationResult');

            const result = await transactionManager.executeReadOperation(mockOperation);

            expect(result.success).toBe(true);
            expect(result.data).toBe('operationResult');
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
            expect(mockOperation).toHaveBeenCalledWith('objectStore');
        });

        it('should handle read operation error', async () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('readTransaction')
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue('objectStore')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            // Mock the transaction manager's internal methods
            transactionManager.getReadTransaction = jest.fn().mockReturnValue(mockTransaction);
            transactionManager.getObjectStore = jest.fn().mockReturnValue('objectStore');

            const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

            const result = await transactionManager.executeReadOperation(mockOperation);

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Error en operación de lectura: Operation failed');
            expect(result.timestamp).toBeDefined();
        });

        it('should handle database not available error', async () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            const mockOperation = jest.fn();

            const result = await transactionManager.executeReadOperation(mockOperation);

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Error en operación de lectura: Database not available');
            expect(result.timestamp).toBeDefined();
            expect(mockOperation).not.toHaveBeenCalled();
        });
    });

    describe('executeWriteOperation', () => {
        it('should execute write operation successfully', async () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('writeTransaction')
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue('objectStore')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            // Mock the transaction manager's internal methods
            transactionManager.getWriteTransaction = jest.fn().mockReturnValue(mockTransaction);
            transactionManager.getObjectStore = jest.fn().mockReturnValue('objectStore');

            const mockOperation = jest.fn().mockResolvedValue('operationResult');

            const result = await transactionManager.executeWriteOperation(mockOperation);

            expect(result.success).toBe(true);
            expect(result.data).toBe('operationResult');
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
            expect(mockOperation).toHaveBeenCalledWith('objectStore');
        });

        it('should handle write operation error', async () => {
            const mockDb = {
                transaction: jest.fn().mockReturnValue('writeTransaction')
            };
            
            const mockTransaction = {
                objectStore: jest.fn().mockReturnValue('objectStore')
            };
            
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            // Mock the transaction manager's internal methods
            transactionManager.getWriteTransaction = jest.fn().mockReturnValue(mockTransaction);
            transactionManager.getObjectStore = jest.fn().mockReturnValue('objectStore');

            const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

            const result = await transactionManager.executeWriteOperation(mockOperation);

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Error en operación de escritura: Operation failed');
            expect(result.timestamp).toBeDefined();
        });

        it('should handle database not available error', async () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            const mockOperation = jest.fn();

            const result = await transactionManager.executeWriteOperation(mockOperation);

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
            expect(result.error).toBe('Error en operación de escritura: Database not available');
            expect(result.timestamp).toBeDefined();
            expect(mockOperation).not.toHaveBeenCalled();
        });
    });

    describe('ensureDatabaseAvailable', () => {
        it('should not throw when database is available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);

            expect(() => transactionManager.ensureDatabaseAvailable()).not.toThrow();
        });

        it('should throw when database is not available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            expect(() => transactionManager.ensureDatabaseAvailable()).toThrow('Database not available');
        });
    });

    describe('getTransactionStatus', () => {
        it('should return transaction status', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            const result = transactionManager.getTransactionStatus();

            expect(result).toEqual({
                isDatabaseAvailable: true,
                storeName: 'testStore',
                timestamp: expect.any(String)
            });
        });

        it('should return status with database not available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);
            mockConfigManager.getConfig.mockReturnValue({
                storeName: 'testStore'
            });

            const result = transactionManager.getTransactionStatus();

            expect(result).toEqual({
                isDatabaseAvailable: false,
                storeName: 'testStore',
                timestamp: expect.any(String)
            });
        });
    });
}); 