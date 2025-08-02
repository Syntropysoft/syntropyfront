import { robustSerializer } from '../utils/RobustSerializer.js';

/**
 * StorageManager - Maneja las operaciones CRUD de IndexedDB
 * Responsabilidad única: Gestionar operaciones de almacenamiento y recuperación
 */
export class StorageManager {
    constructor(databaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Guarda items en el almacenamiento
     * @param {Array} items - Items a guardar
     */
    async save(items) {
        if (!this.databaseManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }

        try {
            const transaction = this.databaseManager.getWriteTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            
            // Serializar items antes de guardar
            let serializedItems;
            try {
                serializedItems = robustSerializer.serialize(items);
            } catch (error) {
                console.error('SyntropyFront: Error serializando items:', error);
                serializedItems = JSON.stringify({
                    __serializationError: true,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    fallbackData: 'Items no serializables'
                });
            }
            
            const item = {
                items: serializedItems,
                timestamp: new Date().toISOString(),
                retryCount: 0
            };
            
            return new Promise((resolve, reject) => {
                const request = store.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error guardando en almacenamiento:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los items del almacenamiento
     */
    async retrieve() {
        if (!this.databaseManager.isDatabaseAvailable()) {
            return [];
        }

        try {
            const transaction = this.databaseManager.getReadTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            const request = store.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo del almacenamiento:', error);
            return [];
        }
    }

    /**
     * Obtiene un item específico por ID
     * @param {number} id - ID del item
     */
    async retrieveById(id) {
        if (!this.databaseManager.isDatabaseAvailable()) {
            return null;
        }

        try {
            const transaction = this.databaseManager.getReadTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            const request = store.get(id);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo item por ID:', error);
            return null;
        }
    }

    /**
     * Remueve un item del almacenamiento
     * @param {number} id - ID del item a remover
     */
    async remove(id) {
        if (!this.databaseManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }

        try {
            const transaction = this.databaseManager.getWriteTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error removiendo del almacenamiento:', error);
            throw error;
        }
    }

    /**
     * Actualiza un item en el almacenamiento
     * @param {number} id - ID del item
     * @param {Object} updates - Campos a actualizar
     */
    async update(id, updates) {
        if (!this.databaseManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }

        try {
            const transaction = this.databaseManager.getWriteTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            
            // Obtener el item actual
            const currentItem = await this.retrieveById(id);
            if (!currentItem) {
                throw new Error('Item not found');
            }

            // Actualizar campos
            const updatedItem = { ...currentItem, ...updates };
            
            return new Promise((resolve, reject) => {
                const request = store.put(updatedItem);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error actualizando en almacenamiento:', error);
            throw error;
        }
    }

    /**
     * Limpia todo el almacenamiento
     */
    async clear() {
        if (!this.databaseManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }

        try {
            const transaction = this.databaseManager.getWriteTransaction();
            const store = transaction.objectStore(this.databaseManager.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error limpiando almacenamiento:', error);
            throw error;
        }
    }
} 