/**
 * DatabaseConfigManager - Maneja la configuración de IndexedDB
 * Responsabilidad única: Validar y gestionar la configuración de la base de datos
 */
export class DatabaseConfigManager {
  constructor(dbName, dbVersion, storeName) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
  }

  /**
     * Valida que la configuración sea correcta
     * @returns {Object} Resultado de validación
     */
  validateConfig() {
    const validationResult = {
      isValid: true,
      errors: [],
      timestamp: new Date().toISOString()
    };

    if (!this.dbName || typeof this.dbName !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push('dbName debe ser un string no vacío');
    }

    if (!this.dbVersion || typeof this.dbVersion !== 'number' || this.dbVersion < 1) {
      validationResult.isValid = false;
      validationResult.errors.push('dbVersion debe ser un número mayor a 0');
    }

    if (!this.storeName || typeof this.storeName !== 'string') {
      validationResult.isValid = false;
      validationResult.errors.push('storeName debe ser un string no vacío');
    }

    return validationResult;
  }

  /**
     * Verifica si IndexedDB está disponible en el entorno
     * @returns {Object} Resultado de disponibilidad
     */
  checkIndexedDBAvailability() {
    const availabilityResult = {
      isAvailable: false,
      reason: null,
      timestamp: new Date().toISOString()
    };

    if (typeof window === 'undefined') {
      availabilityResult.reason = 'No estamos en un entorno de browser';
      return availabilityResult;
    }

    if (!window.indexedDB) {
      availabilityResult.reason = 'IndexedDB no está disponible en este browser';
      return availabilityResult;
    }

    availabilityResult.isAvailable = true;
    return availabilityResult;
  }

  /**
     * Obtiene la configuración actual
     * @returns {Object} Configuración
     */
  getConfig() {
    return {
      dbName: this.dbName,
      dbVersion: this.dbVersion,
      storeName: this.storeName
    };
  }

  /**
     * Crea la configuración del object store
     * @returns {Object} Configuración del store
     */
  getStoreConfig() {
    return {
      keyPath: 'id',
      autoIncrement: true
    };
  }
} 