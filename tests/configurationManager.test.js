const { describe, it, expect, beforeEach } = require('@jest/globals');
const { ConfigurationManager } = require('../src/core/agent/ConfigurationManager.js');

describe('ConfigurationManager', () => {
    let configManager;

    beforeEach(() => {
        configManager = new ConfigurationManager();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(configManager.endpoint).toBeNull();
            expect(configManager.headers).toEqual({
                'Content-Type': 'application/json'
            });
            expect(configManager.batchSize).toBe(10);
            expect(configManager.batchTimeout).toBeNull();
            expect(configManager.isEnabled).toBe(false);
            expect(configManager.sendBreadcrumbs).toBe(false);
            expect(configManager.encrypt).toBeNull();
            expect(configManager.usePersistentBuffer).toBe(false);
            expect(configManager.maxRetries).toBe(5);
            expect(configManager.baseDelay).toBe(1000);
            expect(configManager.maxDelay).toBe(30000);
        });
    });

    describe('configure', () => {
        it('should configure with basic settings', () => {
            const config = {
                endpoint: 'https://api.example.com',
                headers: { 'Authorization': 'Bearer token' },
                batchSize: 20,
                batchTimeout: 100,
                encrypt: (data) => data,
                usePersistentBuffer: true,
                maxRetries: 3
            };

            configManager.configure(config);

            expect(configManager.endpoint).toBe('https://api.example.com');
            expect(configManager.headers).toEqual({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token'
            });
            expect(configManager.batchSize).toBe(20);
            expect(configManager.batchTimeout).toBe(100);
            expect(configManager.isEnabled).toBe(true);
            expect(configManager.sendBreadcrumbs).toBe(true);
            expect(configManager.encrypt).toBe(config.encrypt);
            expect(configManager.usePersistentBuffer).toBe(true);
            expect(configManager.maxRetries).toBe(3);
        });

        it('should enable agent when endpoint is provided', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            expect(configManager.isEnabled).toBe(true);
        });

        it('should disable agent when endpoint is null', () => {
            configManager.configure({ endpoint: null });
            expect(configManager.isEnabled).toBe(false);
        });

        it('should enable breadcrumbs when batchTimeout is provided', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 100 
            });
            expect(configManager.sendBreadcrumbs).toBe(true);
        });

        it('should disable breadcrumbs when batchTimeout is not provided', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: null 
            });
            expect(configManager.sendBreadcrumbs).toBe(false);
        });

        it('should use default values when not provided', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            expect(configManager.batchSize).toBe(10);
            expect(configManager.maxRetries).toBe(5);
            expect(configManager.usePersistentBuffer).toBe(false);
        });

        it('should disable persistent buffer by default', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                usePersistentBuffer: undefined 
            });
            expect(configManager.usePersistentBuffer).toBe(false);
        });

        it('should disable persistent buffer when explicitly set to false', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                usePersistentBuffer: false 
            });
            expect(configManager.usePersistentBuffer).toBe(false);
        });
    });

    describe('isAgentEnabled', () => {
        it('should return true when agent is enabled', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            expect(configManager.isAgentEnabled()).toBe(true);
        });

        it('should return false when agent is disabled', () => {
            expect(configManager.isAgentEnabled()).toBe(false);
        });
    });

    describe('shouldSendBreadcrumbs', () => {
        it('should return true when breadcrumbs are enabled', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                batchTimeout: 100 
            });
            expect(configManager.shouldSendBreadcrumbs()).toBe(true);
        });

        it('should return false when breadcrumbs are disabled', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            expect(configManager.shouldSendBreadcrumbs()).toBe(false);
        });
    });

    describe('getConfig', () => {
        it('should return current configuration', () => {
            const config = {
                endpoint: 'https://api.example.com',
                headers: { 'Authorization': 'Bearer token' },
                batchSize: 20,
                batchTimeout: 100,
                encrypt: (data) => data,
                usePersistentBuffer: true,
                maxRetries: 3
            };

            configManager.configure(config);
            const currentConfig = configManager.getConfig();

            expect(currentConfig).toEqual({
                endpoint: 'https://api.example.com',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token'
                },
                batchSize: 20,
                batchTimeout: 100,
                isEnabled: true,
                sendBreadcrumbs: true,
                encrypt: config.encrypt,
                usePersistentBuffer: true,
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 30000
            });
        });
    });
}); 