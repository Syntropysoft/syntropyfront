import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SerializationManager } from '../src/core/database/SerializationManager.js';

// Mock del robustSerializer
jest.mock('../src/utils/RobustSerializer.js', () => ({
    robustSerializer: {
        serialize: jest.fn(),
        deserialize: jest.fn()
    }
}));

import { robustSerializer } from '../src/utils/RobustSerializer.js';

describe('SerializationManager', () => {
    let serializationManager;

    beforeEach(() => {
        serializationManager = new SerializationManager();
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with robustSerializer', () => {
            expect(serializationManager.serializer).toBe(robustSerializer);
        });
    });

    describe('serialize', () => {
        it('should successfully serialize items', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            const serializedData = '{"type":"error","data":{"message":"test"}}';
            
            robustSerializer.serialize.mockReturnValue(serializedData);

            const result = serializationManager.serialize(items);

            expect(robustSerializer.serialize).toHaveBeenCalledWith(items);
            expect(result.success).toBe(true);
            expect(result.data).toBe(serializedData);
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
        });

        it('should handle serialization errors gracefully', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            const error = new Error('Serialization failed');
            
            robustSerializer.serialize.mockImplementation(() => {
                throw error;
            });

            const result = serializationManager.serialize(items);

            expect(result.success).toBe(false);
            expect(result.data).toContain('__serializationError');
            expect(result.error.type).toBe('serialization_error');
            expect(result.error.message).toBe('Serialization failed');
            expect(result.timestamp).toBeDefined();
        });

        it('should create fallback data when serialization fails', () => {
            const items = [{ type: 'error', data: { message: 'test' } }];
            const error = new Error('Serialization failed');
            
            robustSerializer.serialize.mockImplementation(() => {
                throw error;
            });

            const result = serializationManager.serialize(items);

            expect(result.data).toContain('__serializationError');
            expect(result.data).toContain('Serialization failed');
            expect(result.data).toContain('Items no serializables - usando fallback');
        });
    });

    describe('deserialize', () => {
        it('should successfully deserialize data', () => {
            const serializedData = '{"type":"error","data":{"message":"test"}}';
            const deserializedData = [{ type: 'error', data: { message: 'test' } }];
            
            robustSerializer.deserialize.mockReturnValue(deserializedData);

            const result = serializationManager.deserialize(serializedData);

            expect(robustSerializer.deserialize).toHaveBeenCalledWith(serializedData);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(deserializedData);
            expect(result.error).toBeNull();
            expect(result.timestamp).toBeDefined();
        });

        it('should handle deserialization errors gracefully', () => {
            const serializedData = 'invalid json';
            const error = new Error('Deserialization failed');
            
            robustSerializer.deserialize.mockImplementation(() => {
                throw error;
            });

            const result = serializationManager.deserialize(serializedData);

            expect(result.success).toBe(false);
            expect(result.data).toEqual([]);
            expect(result.error.type).toBe('deserialization_error');
            expect(result.error.message).toBe('Deserialization failed');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('createSerializationError', () => {
        it('should create structured serialization error', () => {
            const originalError = new Error('Test error');
            const error = serializationManager.createSerializationError(originalError);

            expect(error.type).toBe('serialization_error');
            expect(error.message).toBe('Test error');
            expect(error.originalError).toBe(originalError);
            expect(error.timestamp).toBeDefined();
        });
    });

    describe('createDeserializationError', () => {
        it('should create structured deserialization error', () => {
            const originalError = new Error('Test error');
            const error = serializationManager.createDeserializationError(originalError);

            expect(error.type).toBe('deserialization_error');
            expect(error.message).toBe('Test error');
            expect(error.originalError).toBe(originalError);
            expect(error.timestamp).toBeDefined();
        });
    });

    describe('createFallbackData', () => {
        it('should create fallback data with error information', () => {
            const error = new Error('Test error');
            const fallbackData = serializationManager.createFallbackData(error);

            const parsed = JSON.parse(fallbackData);
            expect(parsed.__serializationError).toBe(true);
            expect(parsed.error).toBe('Test error');
            expect(parsed.timestamp).toBeDefined();
            expect(parsed.fallbackData).toBe('Items no serializables - usando fallback');
        });
    });

    describe('isSuccessful', () => {
        it('should return true for successful result', () => {
            const result = { success: true, data: 'test' };
            expect(serializationManager.isSuccessful(result)).toBe(true);
        });

        it('should return false for failed result', () => {
            const result = { success: false, error: 'test' };
            expect(serializationManager.isSuccessful(result)).toBe(false);
        });

        it('should return false for null result', () => {
            expect(serializationManager.isSuccessful(null)).toBe(false);
        });

        it('should return false for undefined result', () => {
            expect(serializationManager.isSuccessful(undefined)).toBe(false);
        });
    });

    describe('getData', () => {
        it('should return data for successful result', () => {
            const result = { success: true, data: 'test data' };
            expect(serializationManager.getData(result)).toBe('test data');
        });

        it('should return fallback for failed result', () => {
            const result = { success: false, error: 'test' };
            expect(serializationManager.getData(result, 'fallback')).toBe('fallback');
        });

        it('should return default fallback for failed result', () => {
            const result = { success: false, error: 'test' };
            expect(serializationManager.getData(result)).toBeNull();
        });
    });

    describe('edge cases', () => {
        it('should handle empty items array', () => {
            robustSerializer.serialize.mockReturnValue('[]');

            const result = serializationManager.serialize([]);

            expect(result.success).toBe(true);
            expect(result.data).toBe('[]');
        });

        it('should handle null items', () => {
            robustSerializer.serialize.mockReturnValue('null');

            const result = serializationManager.serialize(null);

            expect(result.success).toBe(true);
            expect(result.data).toBe('null');
        });

        it('should handle complex objects', () => {
            const complexObject = {
                circular: null,
                date: new Date(),
                error: new Error('test'),
                array: [1, 2, 3],
                nested: { deep: { value: 'test' } }
            };
            
            robustSerializer.serialize.mockReturnValue('{"complex":"object"}');

            const result = serializationManager.serialize(complexObject);

            expect(result.success).toBe(true);
            expect(robustSerializer.serialize).toHaveBeenCalledWith(complexObject);
        });

        it('should handle special characters in error messages', () => {
            const error = new Error('Error with special chars: áéíóú ñ & < > " \'');
            robustSerializer.serialize.mockImplementation(() => {
                throw error;
            });

            const result = serializationManager.serialize([{ test: 'data' }]);

            expect(result.success).toBe(false);
            expect(result.error.message).toContain('áéíóú');
        });
    });
}); 