import { DatabaseManager } from './DatabaseManager.js';
import { StorageManager } from './StorageManager.js';
import { RetryLogicManager } from './RetryLogicManager.js';

/**
 * PersistentBufferManager - Coordinador del buffer persistente
 * Responsabilidad única: Coordinar los componentes de almacenamiento persistente
 */
export class PersistentBufferManager {
    constructor(configManager) {
        this.config = configManager;
        this.usePersistentBuffer = false;
        
        // Inicializar componentes especializados
        this.databaseManager = new DatabaseManager(
            'SyntropyFrontBuffer',
            1,
            'failedItems'
        );
        
        this.storageManager = new StorageManager(this.databaseManager);
        this.retryLogicManager = new RetryLogicManager(this.storageManager, this.config);
        
        // Inicializar buffer persistente si está disponible
        this.initPersistentBuffer();
    }

    /**
     * Inicializa el buffer persistente
     */
    async initPersistentBuffer() {
        try {
            const success = await this.databaseManager.init();
            if (success) {
                this.usePersistentBuffer = this.config.usePersistentBuffer;
                console.log('SyntropyFront: Buffer persistente inicializado');
            }
        } catch (error) {
            console.warn('SyntropyFront: Error inicializando buffer persistente:', error);
        }
    }

    /**
     * Guarda items fallidos en el buffer persistente
     * @param {Array} items - Items a guardar
     */
    async save(items) {
        if (!this.usePersistentBuffer) {
            return;
        }

        try {
            await this.storageManager.save(items);
            console.log('SyntropyFront: Items guardados en buffer persistente');
        } catch (error) {
            console.error('SyntropyFront: Error guardando en buffer persistente:', error);
        }
    }

    /**
     * Obtiene items fallidos del buffer persistente
     */
    async retrieve() {
        if (!this.usePersistentBuffer) {
            return [];
        }

        try {
            return await this.storageManager.retrieve();
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo del buffer persistente:', error);
            return [];
        }
    }

    /**
     * Remueve items del buffer persistente
     * @param {number} id - ID del item a remover
     */
    async remove(id) {
        if (!this.usePersistentBuffer) {
            return;
        }

        try {
            await this.storageManager.remove(id);
        } catch (error) {
            console.error('SyntropyFront: Error removiendo del buffer persistente:', error);
        }
    }

    /**
     * Intenta enviar items fallidos del buffer persistente
     * @param {Function} sendCallback - Callback para enviar items
     * @param {Function} removeCallback - Callback para remover items exitosos
     */
    async retryFailedItems(sendCallback, removeCallback) {
        if (!this.usePersistentBuffer) {
            return;
        }

        await this.retryLogicManager.retryFailedItems(sendCallback, removeCallback);
    }

    /**
     * Limpia items que han excedido el máximo de reintentos
     */
    async cleanupExpiredItems() {
        if (!this.usePersistentBuffer) {
            return;
        }

        await this.retryLogicManager.cleanupExpiredItems();
    }

    /**
     * Obtiene estadísticas del buffer persistente
     */
    async getStats() {
        if (!this.usePersistentBuffer) {
            return {
                totalItems: 0,
                itemsByRetryCount: {},
                averageRetryCount: 0,
                isAvailable: false
            };
        }

        try {
            const retryStats = await this.retryLogicManager.getRetryStats();
            return {
                ...retryStats,
                isAvailable: this.isAvailable()
            };
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo estadísticas:', error);
            return {
                totalItems: 0,
                itemsByRetryCount: {},
                averageRetryCount: 0,
                isAvailable: this.isAvailable()
            };
        }
    }

    /**
     * Verifica si el buffer persistente está disponible
     */
    isAvailable() {
        return this.usePersistentBuffer && this.databaseManager.isDatabaseAvailable();
    }

    /**
     * Limpia todo el buffer persistente
     */
    async clear() {
        if (!this.usePersistentBuffer) {
            return;
        }

        try {
            await this.storageManager.clear();
            console.log('SyntropyFront: Buffer persistente limpiado');
        } catch (error) {
            console.error('SyntropyFront: Error limpiando buffer persistente:', error);
        }
    }

    /**
     * Cierra la conexión con la base de datos
     */
    close() {
        this.databaseManager.close();
        this.usePersistentBuffer = false;
    }
} 