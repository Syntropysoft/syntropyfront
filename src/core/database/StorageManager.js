/**
 * StorageManager - Handles IndexedDB CRUD operations
 * Single responsibility: Manage storage and retrieval operations
 */
export class StorageManager {
  constructor(databaseManager, serializationManager) {
    this.databaseManager = databaseManager;
    this.serializationManager = serializationManager;
  }

  /**
   * Saves items to storage
   * @param {Array} items - Items to save
   * @returns {Promise<number>} Saved item ID
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
   * Retrieves all items from storage
   * @returns {Promise<Array>} Deserialized items
   */
  async retrieve() {
    if (!this.databaseManager.isDatabaseAvailable()) {
      return [];
    }

    const rawItems = await this.executeReadOperation(store => store.getAll());
    return this.deserializeItems(rawItems);
  }

  /**
   * Retrieves a single item by ID
   * @param {number} id - Item ID
   * @returns {Promise<Object|null>} Deserialized item or null
   */
  async retrieveById(id) {
    if (!this.databaseManager.isDatabaseAvailable()) {
      return null;
    }

    const rawItem = await this.executeReadOperation(store => store.get(id));
    return rawItem ? this.deserializeItem(rawItem) : null;
  }

  /**
   * Removes an item from storage
   * @param {number} id - ID of the item to remove
   * @returns {Promise<void>}
   */
  async remove(id) {
    this.ensureDatabaseAvailable();
    return this.executeWriteOperation(store => store.delete(id));
  }

  /**
   * Updates an item in storage
   * @param {number} id - Item ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<number>} Updated item ID
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
   * Clears all storage
   * @returns {Promise<void>}
   */
  async clear() {
    this.ensureDatabaseAvailable();
    return this.executeWriteOperation(store => store.clear());
  }

  // ===== Private declarative methods =====

  /**
   * Ensures the database is available
   * @throws {Error} If the database is not available
   */
  ensureDatabaseAvailable() {
    if (!this.databaseManager.isDatabaseAvailable()) {
      throw new Error('Database not available');
    }
  }

  /**
   * Executes a read operation in a declarative way
   * @param {Function} operation - Operation to run on the store
   * @returns {Promise<*>} Operation result
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
   * Executes a write operation in a declarative way
   * @param {Function} operation - Operation to run on the store
   * @returns {Promise<*>} Operation result
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
   * Deserializes an array of items
   * @param {Array} rawItems - Raw items from the database
   * @returns {Array} Deserialized items
   */
  deserializeItems(rawItems) {
    return rawItems.map(item => this.deserializeItem(item));
  }

  /**
   * Deserializes a single item
   * @param {Object} rawItem - Raw item from the database
   * @returns {Object} Deserialized item
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