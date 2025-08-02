/**
 * DatabaseManager - Maneja la conexión con IndexedDB
 * Responsabilidad única: Gestionar la conexión y configuración de la base de datos
 */
export class DatabaseManager {
    constructor(dbName, dbVersion, storeName) {
        this.dbName = dbName;
        this.dbVersion = dbVersion;
        this.storeName = storeName;
        this.db = null;
        this.isAvailable = false;
    }

    /**
     * Inicializa la conexión con IndexedDB
     */
    async init() {
        try {
            // Verificar si estamos en el browser y IndexedDB está disponible
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn('SyntropyFront: IndexedDB no disponible');
                return false;
            }

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.warn('SyntropyFront: Error abriendo IndexedDB');
                    reject(new Error('Failed to open IndexedDB'));
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                    }
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.isAvailable = true;
                    console.log('SyntropyFront: Base de datos inicializada');
                    resolve(true);
                };
            });
        } catch (error) {
            console.warn('SyntropyFront: Error inicializando base de datos:', error);
            return false;
        }
    }

    /**
     * Obtiene una transacción de lectura
     */
    getReadTransaction() {
        if (!this.isAvailable || !this.db) {
            throw new Error('Database not available');
        }
        return this.db.transaction([this.storeName], 'readonly');
    }

    /**
     * Obtiene una transacción de escritura
     */
    getWriteTransaction() {
        if (!this.isAvailable || !this.db) {
            throw new Error('Database not available');
        }
        return this.db.transaction([this.storeName], 'readwrite');
    }

    /**
     * Cierra la conexión con la base de datos
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isAvailable = false;
        }
    }

    /**
     * Verifica si la base de datos está disponible
     */
    isDatabaseAvailable() {
        return this.isAvailable && this.db !== null;
    }
} 