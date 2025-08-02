const { describe, it, expect, beforeEach } = require('@jest/globals');
const { DatabaseManager } = require('../src/core/database/DatabaseManager.js');

// Mock the new managers
jest.mock('../src/core/database/DatabaseConfigManager.js', () => ({
    DatabaseConfigManager: jest.fn().mockImplementation(() => ({
        dbName: 'TestDB',
        dbVersion: 1,
        storeName: 'testStore',
        validateConfig: jest.fn(),
        checkIndexedDBAvailability: jest.fn(),
        getConfig: jest.fn(),
        getStoreConfig: jest.fn()
    }))
}));

jest.mock('../src/core/database/DatabaseConnectionManager.js', () => ({
    DatabaseConnectionManager: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        close: jest.fn(),
        isDatabaseAvailable: jest.fn(),
        getDatabase: jest.fn()
    }))
}));

jest.mock('../src/core/database/DatabaseTransactionManager.js', () => ({
    DatabaseTransactionManager: jest.fn().mockImplementation(() => ({
        getReadTransaction: jest.fn(),
        getWriteTransaction: jest.fn(),
        getObjectStore: jest.fn(),
        executeReadOperation: jest.fn(),
        executeWriteOperation: jest.fn(),
        ensureDatabaseAvailable: jest.fn(),
        getTransactionStatus: jest.fn()
    }))
}));

describe('DatabaseManager', () => {
    let databaseManager;
    let mockConfigManager;
    let mockConnectionManager;
    let mockTransactionManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        databaseManager = new DatabaseManager('TestDB', 1, 'testStore');
        
        // Get references to the mocked instances
        mockConfigManager = databaseManager.configManager;
        mockConnectionManager = databaseManager.connectionManager;
        mockTransactionManager = databaseManager.transactionManager;
    });

    describe('constructor', () => {
        it('should initialize with correct managers', () => {
            expect(databaseManager.configManager).toBeDefined();
            expect(databaseManager.connectionManager).toBeDefined();
            expect(databaseManager.transactionManager).toBeDefined();
        });
    });

    describe('init', () => {
        it('should initialize successfully', async () => {
            mockConnectionManager.init.mockResolvedValue({
                success: true,
                error: null,
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = await databaseManager.init();

            expect(result).toBe(true);
            expect(mockConnectionManager.init).toHaveBeenCalled();
        });

        it('should handle initialization failure', async () => {
            mockConnectionManager.init.mockResolvedValue({
                success: false,
                error: 'Connection failed',
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = await databaseManager.init();

            expect(result).toBe(false);
            expect(mockConnectionManager.init).toHaveBeenCalled();
        });
    });

    describe('getReadTransaction', () => {
        it('should delegate to transaction manager', () => {
            const mockTransaction = { type: 'readonly' };
            mockTransactionManager.getReadTransaction.mockReturnValue(mockTransaction);

            const result = databaseManager.getReadTransaction();

            expect(result).toBe(mockTransaction);
            expect(mockTransactionManager.getReadTransaction).toHaveBeenCalled();
        });
    });

    describe('getWriteTransaction', () => {
        it('should delegate to transaction manager', () => {
            const mockTransaction = { type: 'readwrite' };
            mockTransactionManager.getWriteTransaction.mockReturnValue(mockTransaction);

            const result = databaseManager.getWriteTransaction();

            expect(result).toBe(mockTransaction);
            expect(mockTransactionManager.getWriteTransaction).toHaveBeenCalled();
        });
    });

    describe('close', () => {
        it('should close successfully', () => {
            mockConnectionManager.close.mockReturnValue({
                success: true,
                error: null,
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = databaseManager.close();

            expect(result).toBe(true);
            expect(mockConnectionManager.close).toHaveBeenCalled();
        });

        it('should handle close failure', () => {
            mockConnectionManager.close.mockReturnValue({
                success: false,
                error: 'Close failed',
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = databaseManager.close();

            expect(result).toBe(false);
            expect(mockConnectionManager.close).toHaveBeenCalled();
        });
    });

    describe('isDatabaseAvailable', () => {
        it('should delegate to connection manager', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);

            const result = databaseManager.isDatabaseAvailable();

            expect(result).toBe(true);
            expect(mockConnectionManager.isDatabaseAvailable).toHaveBeenCalled();
        });

        it('should return false when database is not available', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(false);

            const result = databaseManager.isDatabaseAvailable();

            expect(result).toBe(false);
            expect(mockConnectionManager.isDatabaseAvailable).toHaveBeenCalled();
        });
    });

    // ===== Compatibility Properties =====

    describe('compatibility properties', () => {
        it('should provide dbName property', () => {
            expect(databaseManager.dbName).toBe('TestDB');
        });

        it('should provide dbVersion property', () => {
            expect(databaseManager.dbVersion).toBe(1);
        });

        it('should provide storeName property', () => {
            expect(databaseManager.storeName).toBe('testStore');
        });

        it('should provide db property', () => {
            const mockDb = { close: jest.fn() };
            mockConnectionManager.getDatabase.mockReturnValue(mockDb);

            expect(databaseManager.db).toBe(mockDb);
            expect(mockConnectionManager.getDatabase).toHaveBeenCalled();
        });

        it('should provide isAvailable property', () => {
            mockConnectionManager.isDatabaseAvailable.mockReturnValue(true);

            expect(databaseManager.isAvailable).toBe(true);
            expect(mockConnectionManager.isDatabaseAvailable).toHaveBeenCalled();
        });
    });
}); 