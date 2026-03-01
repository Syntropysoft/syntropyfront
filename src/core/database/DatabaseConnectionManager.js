/**
 * DatabaseConnectionManager - Handles IndexedDB connection.
 * Single responsibility: Manage opening and closing of connections. Uses guard clauses (return early).
 */
export class DatabaseConnectionManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.db = null;
    this.isAvailable = false;
  }

  /**
   * Initializes the connection to IndexedDB
   * @returns {Promise<Object>} Init result
   */
  async init() {
    // Guard: validate configuration
    const configValidation = this.configManager.validateConfig();
    if (!configValidation.isValid) {
      return {
        success: false,
        error: `Invalid configuration: ${configValidation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    const availabilityCheck = this.configManager.checkIndexedDBAvailability();
    if (!availabilityCheck.isAvailable) {
      return {
        success: false,
        error: availabilityCheck.reason,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const connectionResult = await this.openConnection();
      if (!connectionResult.success) {
        return {
          success: false,
          error: connectionResult.error,
          timestamp: new Date().toISOString()
        };
      }

      this.db = connectionResult.db;
      this.isAvailable = true;

      return { success: true, error: null, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Opens the connection to IndexedDB
   */
  openConnection() {
    return new Promise((resolve) => {
      const config = this.configManager.getConfig();
      const request = indexedDB.open(config.dbName, config.dbVersion);

      request.onerror = () => {
        resolve({
          success: false,
          error: 'Error opening IndexedDB',
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
   * Closes the database connection
   */
  close() {
    // Guard: no active connection
    if (!this.db) {
      return { success: false, error: 'No active connection to close', timestamp: new Date().toISOString() };
    }

    try {
      this.db.close();
      this.db = null;
      this.isAvailable = false;
      return { success: true, error: null, timestamp: new Date().toISOString() };
    } catch (error) {
      return { success: false, error: `Error closing connection: ${error.message}`, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Returns whether the database is available
   */
  isDatabaseAvailable() {
    return this.isAvailable && this.db !== null;
  }

  /**
   * Returns the database instance
   */
  getDatabase() {
    return this.isDatabaseAvailable() ? this.db : null;
  }
}