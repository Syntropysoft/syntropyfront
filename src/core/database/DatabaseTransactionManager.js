/**
 * DatabaseTransactionManager - Maneja las transacciones de IndexedDB
 * Responsabilidad única: Gestionar transacciones de lectura y escritura
 */
export class DatabaseTransactionManager {
    constructor(connectionManager, configManager) {
        this.connectionManager = connectionManager;
        this.configManager = configManager;
    }

    /**
     * Obtiene una transacción de lectura
     * @returns {IDBTransaction} Transacción de lectura
     * @throws {Error} Si la base de datos no está disponible
     */
    getReadTransaction() {
        this.ensureDatabaseAvailable();
        
        const config = this.configManager.getConfig();
        const db = this.connectionManager.getDatabase();
        
        return db.transaction([config.storeName], 'readonly');
    }

    /**
     * Obtiene una transacción de escritura
     * @returns {IDBTransaction} Transacción de escritura
     * @throws {Error} Si la base de datos no está disponible
     */
    getWriteTransaction() {
        this.ensureDatabaseAvailable();
        
        const config = this.configManager.getConfig();
        const db = this.connectionManager.getDatabase();
        
        return db.transaction([config.storeName], 'readwrite');
    }

    /**
     * Obtiene el object store para una transacción
     * @param {IDBTransaction} transaction - Transacción activa
     * @returns {IDBObjectStore} Object store
     */
    getObjectStore(transaction) {
        const config = this.configManager.getConfig();
        return transaction.objectStore(config.storeName);
    }

    /**
     * Ejecuta una operación de lectura de manera segura
     * @param {Function} operation - Operación a ejecutar
     * @returns {Promise<Object>} Resultado de la operación
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
            operationResult.error = `Error en operación de lectura: ${error.message}`;
            return operationResult;
        }
    }

    /**
     * Ejecuta una operación de escritura de manera segura
     * @param {Function} operation - Operación a ejecutar
     * @returns {Promise<Object>} Resultado de la operación
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
            operationResult.error = `Error en operación de escritura: ${error.message}`;
            return operationResult;
        }
    }

    /**
     * Verifica que la base de datos esté disponible
     * @throws {Error} Si la base de datos no está disponible
     */
    ensureDatabaseAvailable() {
        if (!this.connectionManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }
    }

    /**
     * Obtiene información sobre el estado de las transacciones
     * @returns {Object} Estado de las transacciones
     */
    getTransactionStatus() {
        return {
            isDatabaseAvailable: this.connectionManager.isDatabaseAvailable(),
            storeName: this.configManager.getConfig().storeName,
            timestamp: new Date().toISOString()
        };
    }
} 