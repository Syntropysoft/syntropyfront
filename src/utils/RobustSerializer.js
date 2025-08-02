/**
 * RobustSerializer - Serializador robusto que maneja referencias circulares
 * Implementa una solución similar a flatted pero sin dependencias externas
 */
export class RobustSerializer {
  constructor() {
    this.seen = new WeakSet();
    this.circularRefs = new Map();
    this.refCounter = 0;
  }

  /**
     * Serializa un objeto de forma segura, manejando referencias circulares
     * @param {any} obj - Objeto a serializar
     * @returns {string} JSON string seguro
     */
  serialize(obj) {
    try {
      // Reset state
      this.seen = new WeakSet();
      this.circularRefs = new Map();
      this.refCounter = 0;

      // Serializar con manejo de referencias circulares
      const safeObj = this.makeSerializable(obj);
            
      // Convertir a JSON
      return JSON.stringify(safeObj);
    } catch (error) {
      console.error('SyntropyFront: Error en serialización robusta:', error);
            
      // Fallback: intentar serialización básica con información de error
      return JSON.stringify({
        __serializationError: true,
        error: error.message,
        originalType: typeof obj,
        isObject: obj !== null && typeof obj === 'object',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
     * Hace un objeto serializable, manejando referencias circulares
     * @param {any} obj - Objeto a procesar
     * @param {string} path - Ruta actual en el objeto
     * @returns {any} Objeto serializable
     */
  makeSerializable(obj, path = '') {
    // Casos primitivos
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    // Casos especiales
    if (obj instanceof Date) {
      return {
        __type: 'Date',
        value: obj.toISOString()
      };
    }

    if (obj instanceof Error) {
      return {
        __type: 'Error',
        name: obj.name,
        message: obj.message,
        stack: obj.stack,
        cause: obj.cause ? this.makeSerializable(obj.cause, `${path}.cause`) : undefined
      };
    }

    if (obj instanceof RegExp) {
      return {
        __type: 'RegExp',
        source: obj.source,
        flags: obj.flags
      };
    }

    // Arrays
    if (Array.isArray(obj)) {
      // Verificar referencia circular
      if (this.seen.has(obj)) {
        const refId = this.circularRefs.get(obj);
        return {
          __circular: true,
          refId
        };
      }

      this.seen.add(obj);
      const refId = `ref_${++this.refCounter}`;
      this.circularRefs.set(obj, refId);

      return obj.map((item, index) => 
        this.makeSerializable(item, `${path}[${index}]`)
      );
    }

    // Objetos
    if (typeof obj === 'object') {
      // Verificar referencia circular
      if (this.seen.has(obj)) {
        const refId = this.circularRefs.get(obj);
        return {
          __circular: true,
          refId
        };
      }

      this.seen.add(obj);
      const refId = `ref_${++this.refCounter}`;
      this.circularRefs.set(obj, refId);

      const result = {};

      // Procesar propiedades del objeto
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          try {
            const value = obj[key];
            const safeValue = this.makeSerializable(value, `${path}.${key}`);
            result[key] = safeValue;
          } catch (error) {
            // Si falla la serialización de una propiedad, la omitimos
            result[key] = {
              __serializationError: true,
              error: error.message,
              propertyName: key
            };
          }
        }
      }

      // Procesar símbolos si están disponibles
      if (Object.getOwnPropertySymbols) {
        const symbols = Object.getOwnPropertySymbols(obj);
        for (const symbol of symbols) {
          try {
            const value = obj[symbol];
            const safeValue = this.makeSerializable(value, `${path}[Symbol(${symbol.description})]`);
            result[`__symbol_${symbol.description || 'anonymous'}`] = safeValue;
          } catch (error) {
            result[`__symbol_${symbol.description || 'anonymous'}`] = {
              __serializationError: true,
              error: error.message,
              symbolName: symbol.description || 'anonymous'
            };
          }
        }
      }

      return result;
    }

    // Funciones y otros tipos
    if (typeof obj === 'function') {
      return {
        __type: 'Function',
        name: obj.name || 'anonymous',
        length: obj.length,
        toString: `${obj.toString().substring(0, 200)  }...`
      };
    }

    // Fallback para otros tipos
    return {
      __type: 'Unknown',
      constructor: obj.constructor ? obj.constructor.name : 'Unknown',
      toString: `${String(obj).substring(0, 200)  }...`
    };
  }

  /**
     * Deserializa un objeto serializado con referencias circulares
     * @param {string} jsonString - JSON string a deserializar
     * @returns {any} Objeto deserializado
     */
  deserialize(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return this.restoreCircularRefs(parsed);
    } catch (error) {
      console.error('SyntropyFront: Error en deserialización:', error);
      return null;
    }
  }

  /**
     * Restaura referencias circulares en un objeto deserializado
     * @param {any} obj - Objeto a restaurar
     * @param {Map} refs - Mapa de referencias
     * @returns {any} Objeto con referencias restauradas
     */
  restoreCircularRefs(obj, refs = new Map()) {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    // Restaurar tipos especiales
    if (obj.__type === 'Date') {
      return new Date(obj.value);
    }

    if (obj.__type === 'Error') {
      const error = new Error(obj.message);
      error.name = obj.name;
      error.stack = obj.stack;
      if (obj.cause) {
        error.cause = this.restoreCircularRefs(obj.cause, refs);
      }
      return error;
    }

    if (obj.__type === 'RegExp') {
      return new RegExp(obj.source, obj.flags);
    }

    if (obj.__type === 'Function') {
      // No podemos restaurar funciones completamente, devolvemos info
      return `[Function: ${obj.name}]`;
    }

    // Arrays
    if (Array.isArray(obj)) {
      const result = [];
      refs.set(obj, result);

      for (let i = 0; i < obj.length; i++) {
        if (obj[i] && obj[i].__circular) {
          const refId = obj[i].refId;
          if (refs.has(refId)) {
            result[i] = refs.get(refId);
          } else {
            result[i] = null; // Referencia no encontrada
          }
        } else {
          result[i] = this.restoreCircularRefs(obj[i], refs);
        }
      }

      return result;
    }

    // Objetos
    if (typeof obj === 'object') {
      const result = {};
      refs.set(obj, result);

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key.startsWith('__')) {
            // Propiedades especiales
            continue;
          }

          const value = obj[key];
          if (value && value.__circular) {
            const refId = value.refId;
            if (refs.has(refId)) {
              result[key] = refs.get(refId);
            } else {
              result[key] = null; // Referencia no encontrada
            }
          } else {
            result[key] = this.restoreCircularRefs(value, refs);
          }
        }
      }

      return result;
    }

    return obj;
  }

  /**
     * Serializa de forma segura para logging (versión simplificada)
     * @param {any} obj - Objeto a serializar
     * @returns {string} JSON string seguro para logs
     */
  serializeForLogging(obj) {
    try {
      return this.serialize(obj);
    } catch (error) {
      return JSON.stringify({
        __logError: true,
        message: 'Error serializando para logging',
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Instancia singleton
export const robustSerializer = new RobustSerializer(); 