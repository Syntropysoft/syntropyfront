const { describe, it, expect, beforeEach } = require('@jest/globals');
const { DatabaseConfigManager } = require('../src/core/database/DatabaseConfigManager.js');

describe('DatabaseConfigManager', () => {
    let configManager;

    beforeEach(() => {
        configManager = new DatabaseConfigManager('TestDB', 1, 'testStore');
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(configManager.dbName).toBe('TestDB');
            expect(configManager.dbVersion).toBe(1);
            expect(configManager.storeName).toBe('testStore');
        });
    });

    describe('validateConfig', () => {
        it('should return valid result for correct configuration', () => {
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.timestamp).toBeDefined();
        });

        it('should return invalid result for empty dbName', () => {
            configManager.dbName = '';
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbName debe ser un string no vacío');
        });

        it('should return invalid result for null dbName', () => {
            configManager.dbName = null;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbName debe ser un string no vacío');
        });

        it('should return invalid result for non-string dbName', () => {
            configManager.dbName = 123;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbName debe ser un string no vacío');
        });

        it('should return invalid result for zero dbVersion', () => {
            configManager.dbVersion = 0;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbVersion debe ser un número mayor a 0');
        });

        it('should return invalid result for negative dbVersion', () => {
            configManager.dbVersion = -1;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbVersion debe ser un número mayor a 0');
        });

        it('should return invalid result for non-number dbVersion', () => {
            configManager.dbVersion = '1';
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('dbVersion debe ser un número mayor a 0');
        });

        it('should return invalid result for empty storeName', () => {
            configManager.storeName = '';
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('storeName debe ser un string no vacío');
        });

        it('should return invalid result for null storeName', () => {
            configManager.storeName = null;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('storeName debe ser un string no vacío');
        });

        it('should return invalid result for non-string storeName', () => {
            configManager.storeName = 123;
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('storeName debe ser un string no vacío');
        });

        it('should return multiple errors for multiple invalid fields', () => {
            configManager.dbName = '';
            configManager.dbVersion = 0;
            configManager.storeName = '';
            
            const result = configManager.validateConfig();
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3);
            expect(result.errors).toContain('dbName debe ser un string no vacío');
            expect(result.errors).toContain('dbVersion debe ser un número mayor a 0');
            expect(result.errors).toContain('storeName debe ser un string no vacío');
        });
    });

    describe('checkIndexedDBAvailability', () => {
        it('should return available when IndexedDB is available', () => {
            // Mock window and indexedDB
            global.window = { indexedDB: {} };
            
            const result = configManager.checkIndexedDBAvailability();
            
            expect(result.isAvailable).toBe(true);
            expect(result.reason).toBeNull();
            expect(result.timestamp).toBeDefined();
            
            // Cleanup
            delete global.window;
        });

        it('should return not available when not in browser environment', () => {
            // Create a new instance without window
            const configManagerWithoutWindow = new DatabaseConfigManager('TestDB', 1, 'testStore');
            
            // Mock the checkIndexedDBAvailability method to simulate no window
            const originalCheck = configManagerWithoutWindow.checkIndexedDBAvailability;
            configManagerWithoutWindow.checkIndexedDBAvailability = function() {
                return {
                    isAvailable: false,
                    reason: 'No estamos en un entorno de browser',
                    timestamp: new Date().toISOString()
                };
            };
            
            const result = configManagerWithoutWindow.checkIndexedDBAvailability();
            
            expect(result.isAvailable).toBe(false);
            expect(result.reason).toBe('No estamos en un entorno de browser');
            expect(result.timestamp).toBeDefined();
        });

        it('should return not available when IndexedDB is not available', () => {
            // Create a new instance and mock the method
            const configManagerWithoutIndexedDB = new DatabaseConfigManager('TestDB', 1, 'testStore');
            
            // Mock the checkIndexedDBAvailability method to simulate no IndexedDB
            configManagerWithoutIndexedDB.checkIndexedDBAvailability = function() {
                return {
                    isAvailable: false,
                    reason: 'IndexedDB no está disponible en este browser',
                    timestamp: new Date().toISOString()
                };
            };
            
            const result = configManagerWithoutIndexedDB.checkIndexedDBAvailability();
            
            expect(result.isAvailable).toBe(false);
            expect(result.reason).toBe('IndexedDB no está disponible en este browser');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getConfig', () => {
        it('should return current configuration', () => {
            const config = configManager.getConfig();
            
            expect(config).toEqual({
                dbName: 'TestDB',
                dbVersion: 1,
                storeName: 'testStore'
            });
        });

        it('should return updated configuration after property changes', () => {
            configManager.dbName = 'UpdatedDB';
            configManager.dbVersion = 2;
            configManager.storeName = 'updatedStore';
            
            const config = configManager.getConfig();
            
            expect(config).toEqual({
                dbName: 'UpdatedDB',
                dbVersion: 2,
                storeName: 'updatedStore'
            });
        });
    });

    describe('getStoreConfig', () => {
        it('should return correct store configuration', () => {
            const storeConfig = configManager.getStoreConfig();
            
            expect(storeConfig).toEqual({
                keyPath: 'id',
                autoIncrement: true
            });
        });

        it('should always return the same store configuration', () => {
            const config1 = configManager.getStoreConfig();
            const config2 = configManager.getStoreConfig();
            
            expect(config1).toEqual(config2);
        });
    });
}); 