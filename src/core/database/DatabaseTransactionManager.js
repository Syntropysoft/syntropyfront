/**
 * DatabaseTransactionManager - Handles IndexedDB transactions
 * Single responsibility: Manage read and write transactions
 */
export class DatabaseTransactionManager {
  constructor(connectionManager, configManager) {
    this.connectionManager = connectionManager;
    this.configManager = configManager;
  }

  /**
   * Returns a read transaction
   * @returns {IDBTransaction} Read transaction
   * @throws {Error} If the database is not available
   */
  getReadTransaction() {
    this.ensureDatabaseAvailable();
        
    const config = this.configManager.getConfig();
    const db = this.connectionManager.getDatabase();
        
    return db.transaction([config.storeName], 'readonly');
  }

  /**
   * Returns a write transaction
   * @returns {IDBTransaction} Write transaction
   * @throws {Error} If the database is not available
   */
  getWriteTransaction() {
    this.ensureDatabaseAvailable();
        
    const config = this.configManager.getConfig();
    const db = this.connectionManager.getDatabase();
        
    return db.transaction([config.storeName], 'readwrite');
  }

  /**
   * Returns the object store for a transaction
   * @param {IDBTransaction} transaction - Active transaction
   * @returns {IDBObjectStore} Object store
   */
  getObjectStore(transaction) {
    const config = this.configManager.getConfig();
    return transaction.objectStore(config.storeName);
  }

  /**
   * Executes a read operation safely
   * @param {Function} operation - Operation to execute
   * @returns {Promise<Object>} Operation result
   */
  async executeReadOperation(operation) {
    const operationResult = {
      success: false,
      data: null,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      const transaction = this.getReadTransaction();
      const store = this.getObjectStore(transaction);
            
      const result = await operation(store);
            
      operationResult.success = true;
      operationResult.data = result;
            
      return operationResult;
    } catch (error) {
      operationResult.error = `Error in read operation: ${error.message}`;
      return operationResult;
    }
  }

  /**
   * Executes a write operation safely
   * @param {Function} operation - Operation to execute
   * @returns {Promise<Object>} Operation result
   */
  async executeWriteOperation(operation) {
    const operationResult = {
      success: false,
      data: null,
      error: null,
      timestamp: new Date().toISOString()
    };

    try {
      const transaction = this.getWriteTransaction();
      const store = this.getObjectStore(transaction);
            
      const result = await operation(store);
            
      operationResult.success = true;
      operationResult.data = result;
            
      return operationResult;
    } catch (error) {
      operationResult.error = `Error in write operation: ${error.message}`;
      return operationResult;
    }
  }

  /**
   * Ensures the database is available
   * @throws {Error} If the database is not available
   */
  ensureDatabaseAvailable() {
    if (!this.connectionManager.isDatabaseAvailable()) {
      throw new Error('Database not available');
    }
  }

  /**
   * Returns transaction status information
   * @returns {Object} Transaction status
   */
  getTransactionStatus() {
    return {
      isDatabaseAvailable: this.connectionManager.isDatabaseAvailable(),
      storeName: this.configManager.getConfig().storeName,
      timestamp: new Date().toISOString()
    };
  }
} 