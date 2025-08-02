const { describe, it, expect, beforeEach } = require('@jest/globals');
const { HttpTransport } = require('../src/core/HttpTransport.js');
const { ConfigurationManager } = require('../src/core/ConfigurationManager.js');

// Mock fetch
const mockFetch = jest.fn();

// Mock RobustSerializer
jest.mock('../src/utils/RobustSerializer.js', () => ({
    robustSerializer: {
        serialize: jest.fn(),
        deserialize: jest.fn()
    }
}));

const { robustSerializer } = require('../src/utils/RobustSerializer.js');

describe('HttpTransport', () => {
    let httpTransport;
    let configManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock global fetch
        global.fetch = mockFetch;
        
        configManager = new ConfigurationManager();
        httpTransport = new HttpTransport(configManager);
    });

    describe('constructor', () => {
        it('should initialize with config manager', () => {
            expect(httpTransport.config).toBe(configManager);
        });
    });

    describe('send', () => {
        it('should send data successfully', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            const result = await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{"test": "data"}'
                }
            );
            expect(result).toEqual({ success: true });
        });

        it('should include timestamp in payload', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockImplementation((data) => {
                expect(data).toHaveProperty('timestamp');
                expect(data).toHaveProperty('items');
                return JSON.stringify(data);
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            await httpTransport.send(items);
            
            expect(robustSerializer.serialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    timestamp: expect.any(String),
                    items: items
                })
            );
        });

        it('should handle HTTP error responses', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            await expect(httpTransport.send(items)).rejects.toThrow('HTTP 500: Internal Server Error');
        });

        it('should handle network errors', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            await expect(httpTransport.send(items)).rejects.toThrow('Network error');
        });

        it('should handle serialization errors gracefully', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockImplementation(() => {
                throw new Error('Serialization failed');
            });
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            const result = await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining('__serializationError')
                })
            );
            expect(result).toEqual({ success: true });
        });

        it('should include custom headers when configured', async () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                headers: { 
                    'Authorization': 'Bearer token',
                    'X-Custom-Header': 'value'
                }
            });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer token',
                        'X-Custom-Header': 'value'
                    },
                    body: '{"test": "data"}'
                }
            );
        });

        it('should handle response.json() errors', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockRejectedValue(new Error('JSON parse error'))
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            
            await expect(httpTransport.send(items)).rejects.toThrow('JSON parse error');
        });

        it('should handle empty items array', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"items": []}');
            
            const items = [];
            await httpTransport.send(items);
            
            expect(robustSerializer.serialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: []
                })
            );
        });

        it('should handle complex nested objects', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"complex": "data"}');
            
            const complexItem = {
                type: 'error',
                data: {
                    message: 'Complex error',
                    details: {
                        nested: {
                            array: [1, 2, 3],
                            object: { key: 'value' }
                        }
                    }
                }
            };
            
            const items = [complexItem];
            await httpTransport.send(items);
            
            expect(robustSerializer.serialize).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: [complexItem]
                })
            );
        });
    });

    describe('applyEncryption', () => {
        it('should return data unchanged when no encryption is configured', () => {
            const data = { message: 'test' };
            const result = httpTransport.applyEncryption(data);
            
            expect(result).toBe(data);
        });

        it('should apply encryption when configured', () => {
            const encryptFn = jest.fn().mockReturnValue({ encrypted: true });
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                encrypt: encryptFn 
            });
            
            const data = { message: 'test' };
            const result = httpTransport.applyEncryption(data);
            
            expect(encryptFn).toHaveBeenCalledWith(data);
            expect(result).toEqual({ encrypted: true });
        });

        it('should handle encryption function that returns null', () => {
            const encryptFn = jest.fn().mockReturnValue(null);
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                encrypt: encryptFn 
            });
            
            const data = { message: 'test' };
            const result = httpTransport.applyEncryption(data);
            
            expect(result).toBeNull();
        });

        it('should handle encryption function that throws error', () => {
            const encryptFn = jest.fn().mockImplementation(() => {
                throw new Error('Encryption failed');
            });
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                encrypt: encryptFn 
            });
            
            const data = { message: 'test' };
            
            expect(() => httpTransport.applyEncryption(data)).toThrow('Encryption failed');
        });
    });

    describe('isConfigured', () => {
        it('should return true when endpoint is configured', () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            expect(httpTransport.isConfigured()).toBe(true);
        });

        it('should return false when endpoint is not configured', () => {
            expect(httpTransport.isConfigured()).toBe(false);
        });

        it('should return false when endpoint is null', () => {
            configManager.configure({ endpoint: null });
            
            expect(httpTransport.isConfigured()).toBe(false);
        });

        it('should return false when endpoint is empty string', () => {
            configManager.configure({ endpoint: '' });
            
            expect(httpTransport.isConfigured()).toBe(false);
        });

        it('should return true when endpoint is configured with other options', () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                headers: { 'Authorization': 'Bearer token' },
                batchSize: 20
            });
            
            expect(httpTransport.isConfigured()).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle very large payloads', async () => {
            configManager.configure({ endpoint: 'https://api.example.com' });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            // Create a large payload
            const largeItem = {
                type: 'error',
                data: {
                    message: 'A'.repeat(10000), // 10KB string
                    details: Array(1000).fill({ key: 'value' }) // Large array
                }
            };
            
            robustSerializer.serialize.mockReturnValue('{"large": "payload"}');
            
            const items = [largeItem];
            await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should handle special characters in endpoint URL', async () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com/path with spaces/endpoint?param=value&other=test'
            });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/path with spaces/endpoint?param=value&other=test',
                expect.any(Object)
            );
        });

        it('should handle headers with special characters', async () => {
            configManager.configure({ 
                endpoint: 'https://api.example.com',
                headers: { 
                    'X-Special-Header': 'value with spaces and "quotes"',
                    'Authorization': 'Bearer token with special chars: !@#$%^&*()'
                }
            });
            
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            mockFetch.mockResolvedValue(mockResponse);
            
            robustSerializer.serialize.mockReturnValue('{"test": "data"}');
            
            const items = [{ type: 'error', data: { message: 'test' } }];
            await httpTransport.send(items);
            
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Special-Header': 'value with spaces and "quotes"',
                        'Authorization': 'Bearer token with special chars: !@#$%^&*()'
                    })
                })
            );
        });
    });
}); 