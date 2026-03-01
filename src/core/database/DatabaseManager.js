import { DatabaseConfigManager } from './DatabaseConfigManager.js';
import { DatabaseConnectionManager } from './DatabaseConnectionManager.js';
import { DatabaseTransactionManager } from './DatabaseTransactionManager.js';

/**
 * DatabaseManager - Coordinates IndexedDB access.
 * Single responsibility: Coordinate specialized managers. Uses guard clauses.
 */
export class DatabaseManager {
  constructor(dbName, dbVersion, storeName) {
    this.configManager = new DatabaseConfigManager(dbName, dbVersion, storeName);
    this.connectionManager = new DatabaseConnectionManager(this.configManager);
    this.transactionManager = new DatabaseTransactionManager(this.connectionManager, this.configManager);
  }

  /**
   * Initializes the connection to IndexedDB
   */
  async init() {
    const initResult = await this.connectionManager.init();

    if (!initResult.success) {
      console.warn('SyntropyFront: Error initializing database:', initResult.error);
      return false;
    }

    console.log('SyntropyFront: Database initialized');
    return true;
  }

  /**
   * Returns a read transaction
   */
  getReadTransaction() {
    return this.transactionManager.getReadTransaction();
  }

  /**
   * Returns a write transaction
   */
  getWriteTransaction() {
    return this.transactionManager.getWriteTransaction();
  }

  /**
   * Closes the database connection
   */
  close() {
    const closeResult = this.connectionManager.close();

    if (!closeResult.success) {
      console.warn('SyntropyFront: Error closing database:', closeResult.error);
      return false;
    }

    return true;
  }

  /**
   * Returns whether the database is available
   */
  isDatabaseAvailable() {
    return this.connectionManager.isDatabaseAvailable();
  }

  // ===== Compatibility properties =====

  /**
     * @deprecated Usar configManager.getConfig().dbName
     */
  get dbName() {
    return this.configManager.dbName;
  }

  /**
     * @deprecated Usar configManager.getConfig().dbVersion
     */
  get dbVersion() {
    return this.configManager.dbVersion;
  }

  /**
     * @deprecated Usar configManager.getConfig().storeName
     */
  get storeName() {
    return this.configManager.storeName;
  }

  /**
     * @deprecated Usar connectionManager.getDatabase()
     */
  get db() {
    return this.connectionManager.getDatabase();
  }

  /**
     * @deprecated Usar connectionManager.isDatabaseAvailable()
     */
  get isAvailable() {
    return this.connectionManager.isDatabaseAvailable();
  }
}
