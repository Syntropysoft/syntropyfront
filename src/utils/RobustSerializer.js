/**
 * Pure type-specific fragments: serialization/deserialization without state.
 * Testable in isolation; state (circularRefs) is handled by RobustSerializer.
 */

const MAX_STRING_SNIPPET_LENGTH = 200;

export const serializedShapeOfDate = (date) => ({
  __type: 'Date',
  value: date.toISOString()
});

export const serializedShapeOfError = (err, recurse) => ({
  __type: 'Error',
  name: err.name,
  message: err.message,
  stack: err.stack,
  cause: err.cause ? recurse(err.cause) : undefined
});

export const serializedShapeOfRegExp = (re) => ({
  __type: 'RegExp',
  source: re.source,
  flags: re.flags
});

export const serializedShapeOfFunction = (fn) => ({
  __type: 'Function',
  name: fn.name || 'anonymous',
  length: fn.length,
  toString: `${fn.toString().substring(0, MAX_STRING_SNIPPET_LENGTH)}...`
});

export const serializedShapeOfUnknown = (obj) => ({
  __type: 'Unknown',
  constructor: obj.constructor ? obj.constructor.name : 'Unknown',
  toString: `${String(obj).substring(0, MAX_STRING_SNIPPET_LENGTH)}...`
});

export const restoreDate = (obj) => new Date(obj.value);
export const restoreError = (obj, recurse) => {
  const err = new Error(obj.message);
  err.name = obj.name;
  err.stack = obj.stack;
  if (obj.cause) err.cause = recurse(obj.cause);
  return err;
};
export const restoreRegExp = (obj) => new RegExp(obj.source, obj.flags);
export const restoreFunction = (obj) => `[Function: ${obj.name}]`;

/**
 * RobustSerializer - Robust serialization with circular references.
 * Composes pure type-specific fragments; state (seen, circularRefs) only in arrays/objects.
 */
export class RobustSerializer {
  constructor() {
    this.seen = new WeakSet();
    this.circularRefs = new Map();
    this.refCounter = 0;
  }

  serialize(obj) {
    try {
      this.seen = new WeakSet();
      this.circularRefs = new Map();
      this.refCounter = 0;
      return JSON.stringify(this.makeSerializable(obj));
    } catch (error) {
      console.error('SyntropyFront: Error in robust serialization:', error);
      return JSON.stringify({
        __serializationError: true,
        error: error.message,
        originalType: typeof obj,
        isObject: obj !== null && typeof obj === 'object',
        timestamp: new Date().toISOString()
      });
    }
  }

  _serializeKnownType(obj, path) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (obj instanceof Date) return serializedShapeOfDate(obj);
    if (obj instanceof Error) {
      return serializedShapeOfError(obj, (x) => this.makeSerializable(x, `${path}.cause`));
    }
    if (obj instanceof RegExp) return serializedShapeOfRegExp(obj);
    if (typeof obj === 'function') return serializedShapeOfFunction(obj);
    return undefined;
  }

  makeSerializable(obj, path = '') {
    if (obj === null || obj === undefined) return obj;
    const known = this._serializeKnownType(obj, path);
    if (known !== undefined) return known;
    if (Array.isArray(obj)) return this._serializeArray(obj, path);
    if (typeof obj === 'object') return this._serializeObject(obj, path);
    return serializedShapeOfUnknown(obj);
  }

  _serializeArray(obj, path) {
    if (this.seen.has(obj)) return { __circular: true, refId: this.circularRefs.get(obj) };
    this.seen.add(obj);
    this.circularRefs.set(obj, `ref_${++this.refCounter}`);
    return obj.map((item, i) => this.makeSerializable(item, `${path}[${i}]`));
  }

  _serializeObjectKey(result, obj, key, path) {
    try {
      result[key] = this.makeSerializable(obj[key], `${path}.${key}`);
    } catch (error) {
      result[key] = {
        __serializationError: true,
        error: error.message,
        propertyName: key
      };
    }
  }

  _serializeObjectSymbols(obj, path, result) {
    if (!Object.getOwnPropertySymbols) return;
    const symbols = Object.getOwnPropertySymbols(obj);
    for (const symbol of symbols) {
      const symKey = `__symbol_${symbol.description || 'anonymous'}`;
      try {
        result[symKey] = this.makeSerializable(obj[symbol], `${path}[Symbol]`);
      } catch (error) {
        result[symKey] = {
          __serializationError: true,
          error: error.message,
          symbolName: symbol.description || 'anonymous'
        };
      }
    }
  }

  _serializeObject(obj, path) {
    if (this.seen.has(obj)) return { __circular: true, refId: this.circularRefs.get(obj) };
    this.seen.add(obj);
    this.circularRefs.set(obj, `ref_${++this.refCounter}`);
    const result = {};
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      this._serializeObjectKey(result, obj, key, path);
    }
    this._serializeObjectSymbols(obj, path, result);
    return result;
  }

  /**
     * Deserializes a serialized object with circular references
     * @param {string} jsonString - JSON string to deserialize
     * @returns {any} Deserialized object
     */
  deserialize(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return this.restoreCircularRefs(parsed);
    } catch (error) {
      console.error('SyntropyFront: Error in deserialization:', error);
      return null;
    }
  }

  _restoreKnownType(obj, refs) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (obj.__type === 'Date') return restoreDate(obj);
    if (obj.__type === 'Error') return restoreError(obj, (x) => this.restoreCircularRefs(x, refs));
    if (obj.__type === 'RegExp') return restoreRegExp(obj);
    if (obj.__type === 'Function') return restoreFunction(obj);
    return undefined;
  }

  restoreCircularRefs(obj, refs = new Map()) {
    const known = this._restoreKnownType(obj, refs);
    if (known !== undefined) return known;
    if (Array.isArray(obj)) return this._restoreArray(obj, refs);
    if (typeof obj === 'object') return this._restoreObject(obj, refs);
    return obj;
  }

  _restoreArray(obj, refs) {
    const result = [];
    refs.set(obj, result);
    for (let i = 0; i < obj.length; i++) {
      if (obj[i]?.__circular) {
        result[i] = refs.has(obj[i].refId) ? refs.get(obj[i].refId) : null;
      } else {
        result[i] = this.restoreCircularRefs(obj[i], refs);
      }
    }
    return result;
  }

  _restoreObject(obj, refs) {
    const result = {};
    refs.set(obj, result);
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key) || key.startsWith('__')) continue;
      const value = obj[key];
      if (value?.__circular) {
        result[key] = refs.has(value.refId) ? refs.get(value.refId) : null;
      } else {
        result[key] = this.restoreCircularRefs(value, refs);
      }
    }
    return result;
  }

  /**
     * Safely serializes for logging (simplified version)
     * @param {any} obj - Object to serialize
     * @returns {string} Safe JSON string for logs
     */
  serializeForLogging(obj) {
    try {
      return this.serialize(obj);
    } catch (error) {
      return JSON.stringify({
        __logError: true,
        message: 'Error serializing for logging',
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Singleton instance
export const robustSerializer = new RobustSerializer();
