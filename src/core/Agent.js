import { robustSerializer } from '../utils/RobustSerializer.js';

/**
 * Agent - Envía datos de trazabilidad al backend
 * Implementa reintentos con backoff exponencial y buffer persistente
 */
export class Agent {
    constructor() {
        this.endpoint = null;
        this.headers = {
            'Content-Type': 'application/json'
        };
        this.batchSize = 10;
        this.batchTimeout = null; // Por defecto = solo errores
        this.queue = [];
        this.batchTimer = null;
        this.isEnabled = false;
        this.sendBreadcrumbs = false; // Por defecto = solo errores
        this.encrypt = null; // Callback de encriptación opcional
        
        // Sistema de reintentos
        this.retryQueue = []; // Cola de reintentos
        this.retryTimer = null;
        this.maxRetries = 5;
        this.baseDelay = 1000; // 1 segundo
        this.maxDelay = 30000; // 30 segundos
        
        // Buffer persistente
        this.usePersistentBuffer = false;
        this.dbName = 'SyntropyFrontBuffer';
        this.dbVersion = 1;
        this.storeName = 'failedItems';
        
        // Inicializar buffer persistente si está disponible
        this.initPersistentBuffer();
    }

    /**
     * Inicializa el buffer persistente (IndexedDB)
     */
    async initPersistentBuffer() {
        try {
            // Verificar si estamos en el browser y IndexedDB está disponible
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn('SyntropyFront: IndexedDB no disponible, usando solo memoria');
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.warn('SyntropyFront: Error abriendo IndexedDB, usando solo memoria');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.usePersistentBuffer = true;
                console.log('SyntropyFront: Buffer persistente inicializado');
                
                // Intentar enviar items fallidos al inicializar
                this.retryFailedItems();
            };
        } catch (error) {
            console.warn('SyntropyFront: Error inicializando buffer persistente:', error);
        }
    }

    /**
     * Guarda items fallidos en el buffer persistente
     */
    async saveToPersistentBuffer(items) {
        if (!this.usePersistentBuffer || !this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // ✅ SERIALIZACIÓN ROBUSTA: Serializar items antes de guardar
            let serializedItems;
            try {
                serializedItems = robustSerializer.serialize(items);
            } catch (error) {
                console.error('SyntropyFront: Error serializando items para buffer:', error);
                serializedItems = JSON.stringify({
                    __serializationError: true,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    fallbackData: 'Items no serializables'
                });
            }
            
            const item = {
                items: serializedItems, // Guardar como string serializado
                timestamp: new Date().toISOString(),
                retryCount: 0
            };
            
            await store.add(item);
            console.log('SyntropyFront: Items guardados en buffer persistente');
        } catch (error) {
            console.error('SyntropyFront: Error guardando en buffer persistente:', error);
        }
    }

    /**
     * Obtiene items fallidos del buffer persistente
     */
    async getFromPersistentBuffer() {
        if (!this.usePersistentBuffer || !this.db) return [];

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('SyntropyFront: Error obteniendo del buffer persistente:', error);
            return [];
        }
    }

    /**
     * Remueve items del buffer persistente
     */
    async removeFromPersistentBuffer(id) {
        if (!this.usePersistentBuffer || !this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            await store.delete(id);
        } catch (error) {
            console.error('SyntropyFront: Error removiendo del buffer persistente:', error);
        }
    }

    /**
     * Intenta enviar items fallidos del buffer persistente
     */
    async retryFailedItems() {
        if (!this.usePersistentBuffer) return;

        const failedItems = await this.getFromPersistentBuffer();
        
        for (const item of failedItems) {
            if (item.retryCount < this.maxRetries) {
                // ✅ DESERIALIZACIÓN ROBUSTA: Deserializar items del buffer
                let deserializedItems;
                try {
                    if (typeof item.items === 'string') {
                        deserializedItems = robustSerializer.deserialize(item.items);
                    } else {
                        deserializedItems = item.items; // Ya deserializado
                    }
                } catch (error) {
                    console.error('SyntropyFront: Error deserializando items del buffer:', error);
                    // Saltar este item y removerlo del buffer
                    await this.removeFromPersistentBuffer(item.id);
                    continue;
                }
                
                this.addToRetryQueue(deserializedItems, item.retryCount + 1, item.id);
            } else {
                console.warn('SyntropyFront: Item excedió máximo de reintentos, removiendo del buffer');
                await this.removeFromPersistentBuffer(item.id);
            }
        }
    }

    /**
     * Configura el agent
     * @param {Object} config - Configuración del agent
     * @param {string} config.endpoint - URL del endpoint para enviar datos
     * @param {Object} [config.headers] - Headers adicionales
     * @param {number} [config.batchSize] - Tamaño del batch
     * @param {number} [config.batchTimeout] - Timeout del batch en ms (si existe = modo completo)
     * @param {Function} [config.encrypt] - Callback para encriptar datos antes de enviar
     * @param {boolean} [config.usePersistentBuffer] - Usar buffer persistente (default: true)
     * @param {number} [config.maxRetries] - Máximo número de reintentos (default: 5)
     */
    configure(config) {
        this.endpoint = config.endpoint;
        this.headers = { ...this.headers, ...config.headers };
        this.batchSize = config.batchSize || this.batchSize;
        this.batchTimeout = config.batchTimeout; // Si existe = modo completo
        this.isEnabled = !!config.endpoint;
        this.encrypt = config.encrypt || null; // Callback de encriptación
        this.usePersistentBuffer = config.usePersistentBuffer !== false; // Por defecto: true
        this.maxRetries = config.maxRetries || this.maxRetries;
        
        // Lógica simple: si hay batchTimeout = enviar breadcrumbs, sino = solo errores
        this.sendBreadcrumbs = !!config.batchTimeout;
    }

    /**
     * Envía un error al backend
     * @param {Object} errorPayload - Payload del error
     * @param {Object} context - Contexto adicional (opcional)
     */
    sendError(errorPayload, context = null) {
        if (!this.isEnabled) {
            console.warn('SyntropyFront Agent: No configurado, error no enviado');
            return;
        }

        // Agregar contexto si está disponible
        const payloadWithContext = context ? {
            ...errorPayload,
            context
        } : errorPayload;

        // Aplicar encriptación si está configurada
        const dataToSend = this.encrypt ? this.encrypt(payloadWithContext) : payloadWithContext;

        this.addToQueue({
            type: 'error',
            data: dataToSend,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Envía breadcrumbs al backend
     * @param {Array} breadcrumbs - Lista de breadcrumbs
     */
    sendBreadcrumbs(breadcrumbs) {
        // Solo enviar breadcrumbs si está habilitado (batchTimeout configurado)
        if (!this.isEnabled || !this.sendBreadcrumbs || !breadcrumbs.length) {
            return;
        }

        // Aplicar encriptación si está configurada
        const dataToSend = this.encrypt ? this.encrypt(breadcrumbs) : breadcrumbs;

        this.addToQueue({
            type: 'breadcrumbs',
            data: dataToSend,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Añade un item a la cola de envío
     * @param {Object} item - Item a añadir
     */
    addToQueue(item) {
        this.queue.push(item);

        // Enviar inmediatamente si alcanza el tamaño del batch
        if (this.queue.length >= this.batchSize) {
            this.flush();
        } else if (this.batchTimeout && !this.batchTimer) {
            // Solo programar timeout si batchTimeout está configurado
            this.batchTimer = setTimeout(() => {
                this.flush();
            }, this.batchTimeout);
        }
    }

    /**
     * Añade items a la cola de reintentos
     * @param {Array} items - Items a reintentar
     * @param {number} retryCount - Número de reintento
     * @param {number} persistentId - ID en buffer persistente (opcional)
     */
    addToRetryQueue(items, retryCount = 1, persistentId = null) {
        const delay = Math.min(this.baseDelay * Math.pow(2, retryCount - 1), this.maxDelay);
        
        this.retryQueue.push({
            items,
            retryCount,
            persistentId,
            nextRetry: Date.now() + delay
        });

        this.scheduleRetry();
    }

    /**
     * Programa el próximo reintento
     */
    scheduleRetry() {
        if (this.retryTimer) return;

        const nextItem = this.retryQueue.find(item => item.nextRetry <= Date.now());
        if (!nextItem) return;

        this.retryTimer = setTimeout(() => {
            this.processRetryQueue();
        }, Math.max(0, nextItem.nextRetry - Date.now()));
    }

    /**
     * Procesa la cola de reintentos
     */
    async processRetryQueue() {
        this.retryTimer = null;

        const now = Date.now();
        const itemsToRetry = this.retryQueue.filter(item => item.nextRetry <= now);
        
        for (const item of itemsToRetry) {
            try {
                await this.sendToBackend(item.items);
                
                // ✅ Éxito: remover de cola de reintentos
                this.retryQueue = this.retryQueue.filter(q => q !== item);
                
                // Remover del buffer persistente si existe
                if (item.persistentId) {
                    await this.removeFromPersistentBuffer(item.persistentId);
                }
                
                console.log(`SyntropyFront: Reintento exitoso después de ${item.retryCount} intentos`);
            } catch (error) {
                console.warn(`SyntropyFront: Reintento ${item.retryCount} falló:`, error);
                
                if (item.retryCount >= this.maxRetries) {
                    // ❌ Máximo de reintentos alcanzado
                    this.retryQueue = this.retryQueue.filter(q => q !== item);
                    console.error('SyntropyFront: Item excedió máximo de reintentos, datos perdidos');
                } else {
                    // Programar próximo reintento
                    item.retryCount++;
                    item.nextRetry = Date.now() + Math.min(
                        this.baseDelay * Math.pow(2, item.retryCount - 1), 
                        this.maxDelay
                    );
                }
            }
        }

        // Programar próximo reintento si quedan items
        if (this.retryQueue.length > 0) {
            this.scheduleRetry();
        }
    }

    /**
     * Envía todos los items en cola
     */
    async flush() {
        if (this.queue.length === 0) return;

        const itemsToSend = [...this.queue];
        this.queue = [];

        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        try {
            await this.sendToBackend(itemsToSend);
            console.log('SyntropyFront: Datos enviados exitosamente');
        } catch (error) {
            console.error('SyntropyFront Agent: Error enviando datos:', error);
            
            // ✅ REINTENTOS: Agregar a cola de reintentos
            this.addToRetryQueue(itemsToSend);
            
            // ✅ BUFFER PERSISTENTE: Guardar en IndexedDB
            if (this.usePersistentBuffer) {
                await this.saveToPersistentBuffer(itemsToSend);
            }
        }
    }

    /**
     * Envía datos al backend
     * @param {Array} items - Items a enviar
     */
    async sendToBackend(items) {
        const payload = {
            timestamp: new Date().toISOString(),
            items
        };

        // ✅ SERIALIZACIÓN ROBUSTA: Usar serializador que maneja referencias circulares
        let serializedPayload;
        try {
            serializedPayload = robustSerializer.serialize(payload);
        } catch (error) {
            console.error('SyntropyFront: Error en serialización del payload:', error);
            
            // Fallback: intentar serialización básica con información de error
            serializedPayload = JSON.stringify({
                __serializationError: true,
                error: error.message,
                timestamp: new Date().toISOString(),
                itemsCount: items.length,
                fallbackData: 'Serialización falló, datos no enviados'
            });
        }

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: this.headers,
            body: serializedPayload
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Fuerza el envío inmediato de todos los datos pendientes
     */
    async forceFlush() {
        await this.flush();
        
        // También intentar enviar items en cola de reintentos
        if (this.retryQueue.length > 0) {
            console.log('SyntropyFront: Intentando enviar items en cola de reintentos...');
            await this.processRetryQueue();
        }
    }

    /**
     * Obtiene estadísticas del agent
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            queueLength: this.queue.length,
            retryQueueLength: this.retryQueue.length,
            isEnabled: this.isEnabled,
            usePersistentBuffer: this.usePersistentBuffer,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Desactiva el agent
     */
    disable() {
        this.isEnabled = false;
        this.queue = [];
        this.retryQueue = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }
}

// Instancia singleton
export const agent = new Agent(); 