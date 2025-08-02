const { describe, it, expect, beforeEach } = require('@jest/globals');
const { DatabaseManager } = require('../src/core/DatabaseManager.js');

describe('DatabaseManager', () => {
    let databaseManager;

    beforeEach(() => {
        databaseManager = new DatabaseManager('TestDB', 1, 'testStore');
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(databaseManager.dbName).toBe('TestDB');
            expect(databaseManager.dbVersion).toBe(1);
            expect(databaseManager.storeName).toBe('testStore');
            expect(databaseManager.db).toBeNull();
            expect(databaseManager.isAvailable).toBe(false);
        });
    });

    describe('isDatabaseAvailable', () => {
        it('should return false when database is not initialized', () => {
            expect(databaseManager.isDatabaseAvailable()).toBe(false);
        });

        it('should return true when database is available', () => {
            databaseManager.isAvailable = true;
            databaseManager.db = {};
            expect(databaseManager.isDatabaseAvailable()).toBe(true);
        });
    });

    describe('close', () => {
        it('should close database connection', () => {
            databaseManager.isAvailable = true;
            databaseManager.db = { close: jest.fn() };
            
            databaseManager.close();
            
            expect(databaseManager.db).toBeNull();
            expect(databaseManager.isAvailable).toBe(false);
        });

        it('should handle close when database is null', () => {
            databaseManager.db = null;
            
            expect(() => databaseManager.close()).not.toThrow();
        });
    });
}); 