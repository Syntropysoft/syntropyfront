const { describe, it, expect, beforeEach } = require('@jest/globals');
const { DatabaseConnectionManager } = require('../src/core/database/DatabaseConnectionManager.js');
const { DatabaseConfigManager } = require('../src/core/database/DatabaseConfigManager.js');

describe('DatabaseConnectionManager', () => {
    let connectionManager;
    let mockConfigManager;

    beforeEach(() => {
        mockConfigManager = {
            validateConfig: jest.fn(),
            checkIndexedDBAvailability: jest.fn(),
            getConfig: jest.fn(),
            getStoreConfig: jest.fn()
        };
        
        connectionManager = new DatabaseConnectionManager(mockConfigManager);
    });

    describe('constructor', () => {
        it('should initialize with config manager', () => {
            expect(connectionManager.configManager).toBe(mockConfigManager);
            expect(connectionManager.db).toBeNull();
            expect(connectionManager.isAvailable).toBe(false);
        });
    });

    describe('init', () => {
        it('should initialize successfully with valid configuration', async () => {
            // Mock successful validation
            mockConfigManager.validateConfig.mockReturnValue({
                isValid: true,
                errors: [],
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            // Mock IndexedDB available
            mockConfigManager.checkIndexedDBAvailability.mockReturnValue({
                isAvailable: true,
                reason: null,
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            // Mock config
            mockConfigManager.getConfig.mockReturnValue({
                dbName: 'TestDB',
                dbVersion: 1,
                storeName: 'testStore'
            });

            // Mock successful connection
            const mockDb = { close: jest.fn() };
            const mockRequest = {
                onerror: null,
                onupgradeneeded: null,
                onsuccess: null,
                result: mockDb
            };

            const originalIndexedDB = global.indexedDB;
            global.indexedDB = {
                open: jest.fn().mockReturnValue(mockRequest)
            };

            const promise = connectionManager.init();
            
            // Simulate successful connection immediately
            mockRequest.onsuccess();

            const result = await promise;

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
            expect(connectionManager.db).toBe(mockDb);
            expect(connectionManager.isAvailable).toBe(true);

            // Cleanup
            global.indexedDB = originalIndexedDB;
        });

        it('should fail with invalid configuration', async () => {
            mockConfigManager.validateConfig.mockReturnValue({
                isValid: false,
                errors: ['dbName inválido'],
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = await connectionManager.init();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Configuración inválida');
            expect(result.error).toContain('dbName inválido');
            expect(connectionManager.db).toBeNull();
            expect(connectionManager.isAvailable).toBe(false);
        });

        it('should fail when IndexedDB is not available', async () => {
            mockConfigManager.validateConfig.mockReturnValue({
                isValid: true,
                errors: [],
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            mockConfigManager.checkIndexedDBAvailability.mockReturnValue({
                isAvailable: false,
                reason: 'IndexedDB no disponible',
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            const result = await connectionManager.init();

            expect(result.success).toBe(false);
            expect(result.error).toBe('IndexedDB no disponible');
            expect(connectionManager.db).toBeNull();
            expect(connectionManager.isAvailable).toBe(false);
        });

        it('should fail when connection fails', async () => {
            mockConfigManager.validateConfig.mockReturnValue({
                isValid: true,
                errors: [],
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            mockConfigManager.checkIndexedDBAvailability.mockReturnValue({
                isAvailable: true,
                reason: null,
                timestamp: '2023-01-01T00:00:00.000Z'
            });

            mockConfigManager.getConfig.mockReturnValue({
                dbName: 'TestDB',
                dbVersion: 1,
                storeName: 'testStore'
            });

            // Mock failed connection
            const mockRequest = {
                onerror: null,
                onupgradeneeded: null,
                onsuccess: null
            };

            const originalIndexedDB = global.indexedDB;
            global.indexedDB = {
                open: jest.fn().mockReturnValue(mockRequest)
            };

            const promise = connectionManager.init();
            
            // Simulate connection error immediately
            mockRequest.onerror();

            const result = await promise;

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error abriendo IndexedDB');
            expect(connectionManager.db).toBeNull();
            expect(connectionManager.isAvailable).toBe(false);

            // Cleanup
            global.indexedDB = originalIndexedDB;
        });
    });

    describe('openConnection', () => {
        it('should open connection successfully', async () => {
            mockConfigManager.getConfig.mockReturnValue({
                dbName: 'TestDB',
                dbVersion: 1,
                storeName: 'testStore'
            });

            mockConfigManager.getStoreConfig.mockReturnValue({
                keyPath: 'id',
                autoIncrement: true
            });

            const mockDb = { 
                close: jest.fn(),
                objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
                createObjectStore: jest.fn()
            };

            const mockRequest = {
                onerror: null,
                onupgradeneeded: null,
                onsuccess: null,
                result: mockDb
            };

            const originalIndexedDB = global.indexedDB;
            global.indexedDB = {
                open: jest.fn().mockReturnValue(mockRequest)
            };

            const promise = connectionManager.openConnection();
            
            // Simulate successful connection
            mockRequest.onsuccess();

            const result = await promise;

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.db).toBe(mockDb);

            // Cleanup
            global.indexedDB = originalIndexedDB;
        });

        it('should handle connection error', async () => {
            mockConfigManager.getConfig.mockReturnValue({
                dbName: 'TestDB',
                dbVersion: 1,
                storeName: 'testStore'
            });

            const mockRequest = {
                onerror: null,
                onupgradeneeded: null,
                onsuccess: null
            };

            const originalIndexedDB = global.indexedDB;
            global.indexedDB = {
                open: jest.fn().mockReturnValue(mockRequest)
            };

            const promise = connectionManager.openConnection();
            
            // Simulate connection error
            mockRequest.onerror();

            const result = await promise;

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error abriendo IndexedDB');
            expect(result.db).toBeNull();

            // Cleanup
            global.indexedDB = originalIndexedDB;
        });
    });

    describe('close', () => {
        it('should close database successfully', () => {
            const mockDb = { close: jest.fn() };
            connectionManager.db = mockDb;
            connectionManager.isAvailable = true;

            const result = connectionManager.close();

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
            expect(mockDb.close).toHaveBeenCalled();
            expect(connectionManager.db).toBeNull();
            expect(connectionManager.isAvailable).toBe(false);
        });

        it('should handle close when no database is open', () => {
            connectionManager.db = null;
            connectionManager.isAvailable = false;

            const result = connectionManager.close();

            expect(result.success).toBe(false);
            expect(result.error).toBe('No hay conexión activa para cerrar');
            expect(result.timestamp).toBeDefined();
        });

        it('should handle close error', () => {
            const mockDb = { 
                close: jest.fn().mockImplementation(() => {
                    throw new Error('Close failed');
                })
            };
            connectionManager.db = mockDb;
            connectionManager.isAvailable = true;

            const result = connectionManager.close();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error cerrando conexión: Close failed');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('isDatabaseAvailable', () => {
        it('should return true when database is available', () => {
            connectionManager.isAvailable = true;
            connectionManager.db = {};

            expect(connectionManager.isDatabaseAvailable()).toBe(true);
        });

        it('should return false when database is not available', () => {
            connectionManager.isAvailable = false;
            connectionManager.db = null;

            expect(connectionManager.isDatabaseAvailable()).toBe(false);
        });

        it('should return false when isAvailable is true but db is null', () => {
            connectionManager.isAvailable = true;
            connectionManager.db = null;

            expect(connectionManager.isDatabaseAvailable()).toBe(false);
        });
    });

    describe('getDatabase', () => {
        it('should return database when available', () => {
            const mockDb = { close: jest.fn() };
            connectionManager.isAvailable = true;
            connectionManager.db = mockDb;

            expect(connectionManager.getDatabase()).toBe(mockDb);
        });

        it('should return null when database is not available', () => {
            connectionManager.isAvailable = false;
            connectionManager.db = null;

            expect(connectionManager.getDatabase()).toBeNull();
        });
    });
}); 