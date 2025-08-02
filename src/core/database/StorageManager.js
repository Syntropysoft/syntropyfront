/**
 * StorageManager - Maneja las operaciones CRUD de IndexedDB
 * Responsabilidad única: Gestionar operaciones de almacenamiento y recuperación
 */
export class StorageManager {
    constructor(databaseManager, serializationManager) {
        this.databaseManager = databaseManager;
        this.serializationManager = serializationManager;
    }

    /**
     * Guarda items en el almacenamiento
     * @param {Array} items - Items a guardar
     * @returns {Promise<number>} ID del item guardado
     */
    async save(items) {
        this.ensureDatabaseAvailable();

        const serializationResult = this.serializationManager.serialize(items);
        const serializedData = this.serializationManager.getData(serializationResult, '[]');

        const item = {
            items: serializedData,
            timestamp: new Date().toISOString(),
            retryCount: 0,
            serializationError: serializationResult.error
        };

        return this.executeWriteOperation(store => store.add(item));
    }

    /**
     * Obtiene todos los items del almacenamiento
     * @returns {Promise<Array>} Items deserializados
     */
    async retrieve() {
        if (!this.databaseManager.isDatabaseAvailable()) {
            return [];
        }

        const rawItems = await this.executeReadOperation(store => store.getAll());
        return this.deserializeItems(rawItems);
    }

    /**
     * Obtiene un item específico por ID
     * @param {number} id - ID del item
     * @returns {Promise<Object|null>} Item deserializado o null
     */
    async retrieveById(id) {
        if (!this.databaseManager.isDatabaseAvailable()) {
            return null;
        }

        const rawItem = await this.executeReadOperation(store => store.get(id));
        return rawItem ? this.deserializeItem(rawItem) : null;
    }

    /**
     * Remueve un item del almacenamiento
     * @param {number} id - ID del item a remover
     * @returns {Promise<void>}
     */
    async remove(id) {
        this.ensureDatabaseAvailable();
        return this.executeWriteOperation(store => store.delete(id));
    }

    /**
     * Actualiza un item en el almacenamiento
     * @param {number} id - ID del item
     * @param {Object} updates - Campos a actualizar
     * @returns {Promise<number>} ID del item actualizado
     */
    async update(id, updates) {
        this.ensureDatabaseAvailable();

        const currentItem = await this.retrieveById(id);
        if (!currentItem) {
            throw new Error('Item not found');
        }

        const updatedItem = { ...currentItem, ...updates };
        return this.executeWriteOperation(store => store.put(updatedItem));
    }

    /**
     * Limpia todo el almacenamiento
     * @returns {Promise<void>}
     */
    async clear() {
        this.ensureDatabaseAvailable();
        return this.executeWriteOperation(store => store.clear());
    }

    // ===== Métodos privados declarativos =====

    /**
     * Verifica que la base de datos esté disponible
     * @throws {Error} Si la base de datos no está disponible
     */
    ensureDatabaseAvailable() {
        if (!this.databaseManager.isDatabaseAvailable()) {
            throw new Error('Database not available');
        }
    }

    /**
     * Ejecuta una operación de lectura de manera declarativa
     * @param {Function} operation - Operación a ejecutar en el store
     * @returns {Promise<*>} Resultado de la operación
     */
    executeReadOperation(operation) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.databaseManager.getReadTransaction();
                const store = transaction.objectStore(this.databaseManager.storeName);
                const request = operation(store);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Ejecuta una operación de escritura de manera declarativa
     * @param {Function} operation - Operación a ejecutar en el store
     * @returns {Promise<*>} Resultado de la operación
     */
    executeWriteOperation(operation) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.databaseManager.getWriteTransaction();
                const store = transaction.objectStore(this.databaseManager.storeName);
                const request = operation(store);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Deserializa un array de items
     * @param {Array} rawItems - Items crudos de la base de datos
     * @returns {Array} Items deserializados
     */
    deserializeItems(rawItems) {
        return rawItems.map(item => this.deserializeItem(item));
    }

    /**
     * Deserializa un item individual
     * @param {Object} rawItem - Item crudo de la base de datos
     * @returns {Object} Item deserializado
     */
    deserializeItem(rawItem) {
        const deserializationResult = this.serializationManager.deserialize(rawItem.items);
        const deserializedItems = this.serializationManager.getData(deserializationResult, []);

        return {
            ...rawItem,
            items: deserializedItems,
            deserializationError: deserializationResult.error
        };
    }
} 