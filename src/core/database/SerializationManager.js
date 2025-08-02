import { robustSerializer } from '../../utils/RobustSerializer.js';

/**
 * SerializationManager - Maneja la serialización y deserialización de datos
 * Responsabilidad única: Gestionar la transformación de datos para almacenamiento
 */
export class SerializationManager {
    constructor() {
        this.serializer = robustSerializer;
    }

    /**
     * Serializa items con manejo declarativo de errores
     * @param {Array} items - Items a serializar
     * @returns {Object} Resultado de serialización
     */
    serialize(items) {
        const serializationResult = {
            success: false,
            data: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        try {
            const serializedData = this.serializer.serialize(items);
            return {
                ...serializationResult,
                success: true,
                data: serializedData
            };
        } catch (error) {
            return {
                ...serializationResult,
                error: this.createSerializationError(error),
                data: this.createFallbackData(error)
            };
        }
    }

    /**
     * Deserializa datos con manejo declarativo de errores
     * @param {string} serializedData - Datos serializados
     * @returns {Object} Resultado de deserialización
     */
    deserialize(serializedData) {
        const deserializationResult = {
            success: false,
            data: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        try {
            const deserializedData = this.serializer.deserialize(serializedData);
            return {
                ...deserializationResult,
                success: true,
                data: deserializedData
            };
        } catch (error) {
            return {
                ...deserializationResult,
                error: this.createDeserializationError(error),
                data: []
            };
        }
    }

    /**
     * Crea un error de serialización estructurado
     * @param {Error} error - Error original
     * @returns {Object} Error estructurado
     */
    createSerializationError(error) {
        return {
            type: 'serialization_error',
            message: error.message,
            originalError: error,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Crea un error de deserialización estructurado
     * @param {Error} error - Error original
     * @returns {Object} Error estructurado
     */
    createDeserializationError(error) {
        return {
            type: 'deserialization_error',
            message: error.message,
            originalError: error,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Crea datos de fallback cuando falla la serialización
     * @param {Error} error - Error que causó el fallback
     * @returns {string} Datos de fallback serializados
     */
    createFallbackData(error) {
        const fallbackPayload = {
            __serializationError: true,
            error: error.message,
            timestamp: new Date().toISOString(),
            fallbackData: 'Items no serializables - usando fallback'
        };

        return JSON.stringify(fallbackPayload);
    }

    /**
     * Verifica si un resultado de serialización fue exitoso
     * @param {Object} result - Resultado de serialización/deserialización
     * @returns {boolean} True si fue exitoso
     */
    isSuccessful(result) {
        return Boolean(result && result.success === true);
    }

    /**
     * Obtiene los datos de un resultado, con fallback
     * @param {Object} result - Resultado de serialización/deserialización
     * @param {*} fallback - Valor por defecto si falla
     * @returns {*} Datos o fallback
     */
    getData(result, fallback = null) {
        return this.isSuccessful(result) ? result.data : fallback;
    }
} 