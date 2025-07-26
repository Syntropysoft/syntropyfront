/**
 * ProxyObjectTracker - Tracking reactivo de objetos usando Proxy
 * Captura cambios en tiempo real sin necesidad de polling
 */
export class ProxyObjectTracker {
    constructor() {
        this.trackedObjects = new Map(); // Map<objectPath, ProxyInfo>
        this.maxStates = 10; // Estados máximos por objeto
        this.isEnabled = true;
        this.onChangeCallback = null; // Callback cuando cambia un objeto
    }

    /**
     * Configura el tracker
     * @param {Object} config - Configuración
     * @param {number} [config.maxStates] - Máximo número de estados por objeto
     * @param {Function} [config.onChange] - Callback cuando cambia un objeto
     */
    configure(config = {}) {
        this.maxStates = config.maxStates || this.maxStates;
        this.onChangeCallback = config.onChange || null;
        this.isEnabled = config.enabled !== false;
    }

    /**
     * Agrega un objeto para tracking reactivo
     * @param {string} objectPath - Ruta/nombre del objeto
     * @param {Object} targetObject - Objeto a trackear
     * @param {Object} options - Opciones de tracking
     * @returns {Object} Proxy del objeto original
     */
    addObject(objectPath, targetObject, options = {}) {
        if (!this.isEnabled) {
            console.warn('SyntropyFront: ProxyObjectTracker deshabilitado');
            return targetObject;
        }

        if (!targetObject || typeof targetObject !== 'object') {
            console.warn(`SyntropyFront: Objeto inválido para tracking: ${objectPath}`);
            return targetObject;
        }

        // Verificar si ya está siendo trackeado
        if (this.trackedObjects.has(objectPath)) {
            console.warn(`SyntropyFront: Objeto ya está siendo trackeado: ${objectPath}`);
            return this.trackedObjects.get(objectPath).proxy;
        }

        try {
            // Crear estado inicial
            const initialState = {
                value: this.deepClone(targetObject),
                timestamp: new Date().toISOString(),
                changeType: 'initial'
            };

            // Crear info del objeto trackeado
            const proxyInfo = {
                objectPath,
                originalObject: targetObject,
                states: [initialState],
                proxy: null,
                options: {
                    trackNested: options.trackNested !== false,
                    trackArrays: options.trackArrays !== false,
                    trackFunctions: options.trackFunctions !== false,
                    maxDepth: options.maxDepth || 5
                }
            };

            // Crear Proxy
            const proxy = this.createProxy(targetObject, proxyInfo);
            proxyInfo.proxy = proxy;

            // Guardar en el mapa
            this.trackedObjects.set(objectPath, proxyInfo);

            console.log(`SyntropyFront: Objeto agregado para tracking reactivo: ${objectPath}`);
            return proxy;

        } catch (error) {
            console.error(`SyntropyFront: Error creando proxy para ${objectPath}:`, error);
            return targetObject;
        }
    }

    /**
     * Crea un Proxy que intercepta cambios
     * @param {Object} target - Objeto objetivo
     * @param {Object} proxyInfo - Información del proxy
     * @param {number} depth - Profundidad actual
     * @returns {Proxy} Proxy del objeto
     */
    createProxy(target, proxyInfo, depth = 0) {
        const { objectPath, options } = proxyInfo;

        return new Proxy(target, {
            get: (obj, prop) => {
                const value = obj[prop];

                // Si es un objeto/array y queremos trackear anidados
                if (options.trackNested && 
                    depth < options.maxDepth && 
                    value && 
                    typeof value === 'object' && 
                    !(value instanceof Date) && 
                    !(value instanceof RegExp) &&
                    !(value instanceof Error)) {
                    
                    // Crear proxy para objetos anidados
                    if (Array.isArray(value) && options.trackArrays) {
                        return this.createArrayProxy(value, proxyInfo, depth + 1);
                    } else if (!Array.isArray(value)) {
                        return this.createProxy(value, proxyInfo, depth + 1);
                    }
                }

                return value;
            },

            set: (obj, prop, value) => {
                const oldValue = obj[prop];
                
                // Solo registrar si realmente cambió
                if (!this.isEqual(oldValue, value)) {
                    // Guardar estado anterior antes del cambio
                    this.saveState(proxyInfo, 'property_change', {
                        property: prop,
                        oldValue: this.deepClone(oldValue),
                        newValue: this.deepClone(value),
                        path: `${objectPath}.${prop}`
                    });

                    // Aplicar el cambio
                    obj[prop] = value;

                    // Notificar cambio
                    this.notifyChange(proxyInfo, prop, oldValue, value);
                }

                return true;
            },

            deleteProperty: (obj, prop) => {
                const oldValue = obj[prop];
                
                // Guardar estado antes de eliminar
                this.saveState(proxyInfo, 'property_deleted', {
                    property: prop,
                    oldValue: this.deepClone(oldValue),
                    path: `${objectPath}.${prop}`
                });

                // Eliminar la propiedad
                const result = delete obj[prop];

                // Notificar cambio
                this.notifyChange(proxyInfo, prop, oldValue, undefined);

                return result;
            }
        });
    }

    /**
     * Crea un Proxy especial para arrays
     * @param {Array} target - Array objetivo
     * @param {Object} proxyInfo - Información del proxy
     * @param {number} depth - Profundidad actual
     * @returns {Proxy} Proxy del array
     */
    createArrayProxy(target, proxyInfo, depth = 0) {
        const { objectPath, options } = proxyInfo;

        return new Proxy(target, {
            get: (obj, prop) => {
                const value = obj[prop];

                // Si es un método de array que modifica
                if (typeof value === 'function' && this.isArrayMutator(prop)) {
                    return (...args) => {
                        // Guardar estado antes de la mutación
                        this.saveState(proxyInfo, 'array_mutation', {
                            method: prop,
                            arguments: args,
                            oldArray: this.deepClone(obj),
                            path: objectPath
                        });

                        // Ejecutar el método
                        const result = value.apply(obj, args);

                        // Notificar cambio
                        this.notifyChange(proxyInfo, prop, null, obj);

                        return result;
                    };
                }

                // Si es un elemento del array y es un objeto
                if (options.trackNested && 
                    depth < options.maxDepth && 
                    value && 
                    typeof value === 'object' && 
                    !Array.isArray(value) &&
                    !(value instanceof Date) && 
                    !(value instanceof RegExp) &&
                    !(value instanceof Error)) {
                    
                    return this.createProxy(value, proxyInfo, depth + 1);
                }

                return value;
            },

            set: (obj, prop, value) => {
                const oldValue = obj[prop];
                
                // Solo registrar si realmente cambió
                if (!this.isEqual(oldValue, value)) {
                    // Guardar estado anterior
                    this.saveState(proxyInfo, 'array_element_change', {
                        index: prop,
                        oldValue: this.deepClone(oldValue),
                        newValue: this.deepClone(value),
                        path: `${objectPath}[${prop}]`
                    });

                    // Aplicar el cambio
                    obj[prop] = value;

                    // Notificar cambio
                    this.notifyChange(proxyInfo, prop, oldValue, value);
                }

                return true;
            }
        });
    }

    /**
     * Verifica si un método de array es mutador
     * @param {string} method - Nombre del método
     * @returns {boolean} True si es mutador
     */
    isArrayMutator(method) {
        const mutators = [
            'push', 'pop', 'shift', 'unshift', 'splice', 
            'reverse', 'sort', 'fill', 'copyWithin'
        ];
        return mutators.includes(method);
    }

    /**
     * Guarda un estado en el historial
     * @param {Object} proxyInfo - Información del proxy
     * @param {string} changeType - Tipo de cambio
     * @param {Object} changeData - Datos del cambio
     */
    saveState(proxyInfo, changeType, changeData = {}) {
        const state = {
            value: this.deepClone(proxyInfo.originalObject),
            timestamp: new Date().toISOString(),
            changeType,
            changeData
        };

        // Agregar al historial
        proxyInfo.states.push(state);

        // Mantener solo los últimos maxStates
        if (proxyInfo.states.length > this.maxStates) {
            proxyInfo.states.shift();
        }
    }

    /**
     * Notifica un cambio
     * @param {Object} proxyInfo - Información del proxy
     * @param {string} property - Propiedad que cambió
     * @param {any} oldValue - Valor anterior
     * @param {any} newValue - Valor nuevo
     */
    notifyChange(proxyInfo, property, oldValue, newValue) {
        if (this.onChangeCallback) {
            try {
                this.onChangeCallback({
                    objectPath: proxyInfo.objectPath,
                    property,
                    oldValue,
                    newValue,
                    timestamp: new Date().toISOString(),
                    states: proxyInfo.states.length
                });
            } catch (error) {
                console.error('SyntropyFront: Error en callback de cambio:', error);
            }
        }
    }

    /**
     * Obtiene el historial de estados de un objeto
     * @param {string} objectPath - Ruta del objeto
     * @returns {Array} Historial de estados
     */
    getObjectHistory(objectPath) {
        const proxyInfo = this.trackedObjects.get(objectPath);
        if (!proxyInfo) {
            console.warn(`SyntropyFront: Objeto no encontrado: ${objectPath}`);
            return [];
        }

        return [...proxyInfo.states];
    }

    /**
     * Obtiene el estado actual de un objeto
     * @param {string} objectPath - Ruta del objeto
     * @returns {Object|null} Estado actual
     */
    getCurrentState(objectPath) {
        const proxyInfo = this.trackedObjects.get(objectPath);
        if (!proxyInfo) {
            return null;
        }

        return {
            value: this.deepClone(proxyInfo.originalObject),
            timestamp: new Date().toISOString(),
            statesCount: proxyInfo.states.length
        };
    }

    /**
     * Obtiene todos los objetos trackeados
     * @returns {Array} Lista de objetos trackeados
     */
    getTrackedObjects() {
        return Array.from(this.trackedObjects.keys());
    }

    /**
     * Remueve un objeto del tracking
     * @param {string} objectPath - Ruta del objeto
     * @returns {Object|null} Objeto original (sin proxy)
     */
    removeObject(objectPath) {
        const proxyInfo = this.trackedObjects.get(objectPath);
        if (!proxyInfo) {
            return null;
        }

        this.trackedObjects.delete(objectPath);
        console.log(`SyntropyFront: Objeto removido del tracking: ${objectPath}`);
        
        return proxyInfo.originalObject;
    }

    /**
     * Limpia todos los objetos trackeados
     */
    clear() {
        this.trackedObjects.clear();
        console.log('SyntropyFront: Todos los objetos removidos del tracking');
    }

    /**
     * Obtiene estadísticas del tracker
     * @returns {Object} Estadísticas
     */
    getStats() {
        const stats = {
            trackedObjects: this.trackedObjects.size,
            totalStates: 0,
            isEnabled: this.isEnabled,
            maxStates: this.maxStates
        };

        for (const proxyInfo of this.trackedObjects.values()) {
            stats.totalStates += proxyInfo.states.length;
        }

        return stats;
    }

    /**
     * Clona profundamente un objeto
     * @param {any} obj - Objeto a clonar
     * @returns {any} Objeto clonado
     */
    deepClone(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof RegExp) {
            return new RegExp(obj.source, obj.flags);
        }

        if (obj instanceof Error) {
            const error = new Error(obj.message);
            error.name = obj.name;
            error.stack = obj.stack;
            if (obj.cause) {
                error.cause = this.deepClone(obj.cause);
            }
            return error;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    }

    /**
     * Compara dos valores para verificar si son iguales
     * @param {any} a - Primer valor
     * @param {any} b - Segundo valor
     * @returns {boolean} True si son iguales
     */
    isEqual(a, b) {
        if (a === b) return true;
        if (a === null || b === null) return a === b;
        if (typeof a !== typeof b) return false;
        if (typeof a !== 'object') return a === b;

        // Para objetos, comparación superficial
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (a[key] !== b[key]) return false;
        }
        
        return true;
    }
}

// Instancia singleton
export const proxyObjectTracker = new ProxyObjectTracker(); 