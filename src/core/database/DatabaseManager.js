import { DatabaseConfigManager } from './DatabaseConfigManager.js';
import { DatabaseConnectionManager } from './DatabaseConnectionManager.js';
import { DatabaseTransactionManager } from './DatabaseTransactionManager.js';

/**
 * DatabaseManager - Coordinador de la gestión de IndexedDB
 * Responsabilidad única: Coordinar los managers especializados
 */
export class DatabaseManager {
  constructor(dbName, dbVersion, storeName) {
    this.configManager = new DatabaseConfigManager(dbName, dbVersion, storeName);
    this.connectionManager = new DatabaseConnectionManager(this.configManager);
    this.transactionManager = new DatabaseTransactionManager(this.connectionManager, this.configManager);
  }

  /**
     * Inicializa la conexión con IndexedDB
     */
  async init() {
    const initResult = await this.connectionManager.init();
        
    if (initResult.success) {
      console.log('SyntropyFront: Base de datos inicializada');
    } else {
      console.warn('SyntropyFront: Error inicializando base de datos:', initResult.error);
    }
        
    return initResult.success;
  }

  /**
     * Obtiene una transacción de lectura
     */
  getReadTransaction() {
    return this.transactionManager.getReadTransaction();
  }

  /**
     * Obtiene una transacción de escritura
     */
  getWriteTransaction() {
    return this.transactionManager.getWriteTransaction();
  }

  /**
     * Cierra la conexión con la base de datos
     */
  close() {
    const closeResult = this.connectionManager.close();
        
    if (!closeResult.success) {
      console.warn('SyntropyFront: Error cerrando base de datos:', closeResult.error);
    }
        
    return closeResult.success;
  }

  /**
     * Verifica si la base de datos está disponible
     */
  isDatabaseAvailable() {
    return this.connectionManager.isDatabaseAvailable();
  }

  // ===== Propiedades de compatibilidad =====
    
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
