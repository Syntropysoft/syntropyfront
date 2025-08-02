/**
 * DatabaseConnectionManager - Maneja la conexión con IndexedDB
 * Responsabilidad única: Gestionar la apertura y cierre de conexiones
 */
export class DatabaseConnectionManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.db = null;
    this.isAvailable = false;
  }

  /**
     * Inicializa la conexión con IndexedDB
     * @returns {Promise<Object>} Resultado de la inicialización
     */
  async init() {
    const initResult = {
      success: false,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Validar configuración
      const configValidation = this.configManager.validateConfig();
      if (!configValidation.isValid) {
        initResult.error = `Configuración inválida: ${configValidation.errors.join(', ')}`;
        return initResult;
      }

      // Verificar disponibilidad de IndexedDB
      const availabilityCheck = this.configManager.checkIndexedDBAvailability();
      if (!availabilityCheck.isAvailable) {
        initResult.error = availabilityCheck.reason;
        return initResult;
      }

      // Abrir conexión
      const connectionResult = await this.openConnection();
      if (!connectionResult.success) {
        initResult.error = connectionResult.error;
        return initResult;
      }

      this.db = connectionResult.db;
      this.isAvailable = true;
      initResult.success = true;

      return initResult;
    } catch (error) {
      initResult.error = `Error inesperado: ${error.message}`;
      return initResult;
    }
  }

  /**
     * Abre la conexión con IndexedDB
     * @returns {Promise<Object>} Resultado de la conexión
     */
  openConnection() {
    return new Promise((resolve) => {
      const config = this.configManager.getConfig();
      const request = indexedDB.open(config.dbName, config.dbVersion);

      request.onerror = () => {
        resolve({
          success: false,
          error: 'Error abriendo IndexedDB',
          db: null
        });
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const storeConfig = this.configManager.getStoreConfig();
                
        if (!db.objectStoreNames.contains(config.storeName)) {
          db.createObjectStore(config.storeName, storeConfig);
        }
      };

      request.onsuccess = () => {
        resolve({
          success: true,
          error: null,
          db: request.result
        });
      };
    });
  }

  /**
     * Cierra la conexión con la base de datos
     * @returns {Object} Resultado del cierre
     */
  close() {
    const closeResult = {
      success: false,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      if (this.db) {
        this.db.close();
        this.db = null;
        this.isAvailable = false;
        closeResult.success = true;
      } else {
        closeResult.error = 'No hay conexión activa para cerrar';
      }
    } catch (error) {
      closeResult.error = `Error cerrando conexión: ${error.message}`;
    }

    return closeResult;
  }

  /**
     * Verifica si la base de datos está disponible
     * @returns {boolean} True si está disponible
     */
  isDatabaseAvailable() {
    return this.isAvailable && this.db !== null;
  }

  /**
     * Obtiene la instancia de la base de datos
     * @returns {IDBDatabase|null} Instancia de la base de datos
     */
  getDatabase() {
    return this.isDatabaseAvailable() ? this.db : null;
  }
} 