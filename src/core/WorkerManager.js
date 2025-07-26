/**
 * WorkerManager - Maneja comunicación con SyntropyWorker
 * Proporciona API para interactuar con el worker desde el main thread
 * 
 * @author SyntropyFront Team
 * @version 1.0.0
 */

class WorkerManager {
    constructor() {
        this.worker = null;
        this.pendingRequests = new Map();
        this.requestId = 0;
        this.isInitialized = false;
        this.config = {};
        
        // Setup worker communication
        this.setupWorker();
    }

    /**
     * Inicializa el worker
     */
    setupWorker() {
        try {
            // Crear worker
            this.worker = new Worker('./src/workers/SyntropyWorker.js');
            
            // Setup message handling
            this.worker.addEventListener('message', (event) => {
                this.handleWorkerMessage(event.data);
            });
            
            // Setup error handling
            this.worker.addEventListener('error', (error) => {
                console.error('SyntropyWorker error:', error);
                this.handleWorkerError(error);
            });
            
            console.log('🔄 WorkerManager: Worker inicializado');
        } catch (error) {
            console.error('WorkerManager: Error inicializando worker:', error);
            this.handleWorkerUnavailable();
        }
    }

    /**
     * Inicializa el worker con configuración
     */
    async init(config) {
        try {
            this.config = config;
            
            const response = await this.sendMessage('INIT', config);
            
            if (response.success) {
                this.isInitialized = true;
                console.log('✅ WorkerManager: Worker inicializado correctamente');
                return true;
            } else {
                throw new Error(response.error || 'Error inicializando worker');
            }
        } catch (error) {
            console.error('WorkerManager: Error en init:', error);
            return false;
        }
    }

    /**
     * Envía mensaje al worker y espera respuesta
     */
    sendMessage(type, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker no disponible'));
                return;
            }

            const id = this.generateRequestId();
            
            // Guardar callback para la respuesta
            this.pendingRequests.set(id, { resolve, reject });
            
            // Enviar mensaje al worker
            this.worker.postMessage({
                type,
                payload,
                id
            });
            
            // Timeout para evitar requests colgados
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Timeout en request: ${type}`));
                }
            }, 5000); // 5 segundos timeout
        });
    }

    /**
     * Maneja mensajes del worker
     */
    handleWorkerMessage(data) {
        const { id, success, error, ...response } = data;
        
        const request = this.pendingRequests.get(id);
        if (request) {
            this.pendingRequests.delete(id);
            
            if (success) {
                request.resolve(response);
            } else {
                request.reject(new Error(error || 'Error en worker'));
            }
        } else {
            console.warn('WorkerManager: Respuesta sin request pendiente:', id);
        }
    }

    /**
     * Maneja errores del worker
     */
    handleWorkerError(error) {
        console.error('WorkerManager: Error del worker:', error);
        
        // Limpiar requests pendientes
        this.pendingRequests.forEach((request) => {
            request.reject(new Error('Worker error'));
        });
        this.pendingRequests.clear();
        
        // Fallback a modo sin worker
        this.handleWorkerUnavailable();
    }

    /**
     * Maneja cuando el worker no está disponible
     */
    handleWorkerUnavailable() {
        console.warn('WorkerManager: Worker no disponible, usando fallback');
        
        // Aquí podríamos implementar fallback al modo main thread
        // Por ahora solo loggeamos
    }

    /**
     * Agrega breadcrumb al worker
     */
    async addBreadcrumb(type, message, data = {}) {
        try {
            const response = await this.sendMessage('ADD_BREADCRUMB', {
                type,
                message,
                data
            });
            
            return response;
        } catch (error) {
            console.error('WorkerManager: Error agregando breadcrumb:', error);
            throw error;
        }
    }

    /**
     * Obtiene breadcrumbs del worker
     */
    async getBreadcrumbs() {
        try {
            const response = await this.sendMessage('GET_BREADCRUMBS');
            return response.breadcrumbs || [];
        } catch (error) {
            console.error('WorkerManager: Error obteniendo breadcrumbs:', error);
            return [];
        }
    }

    /**
     * Limpia breadcrumbs del worker
     */
    async clearBreadcrumbs() {
        try {
            const response = await this.sendMessage('CLEAR_BREADCRUMBS');
            return response;
        } catch (error) {
            console.error('WorkerManager: Error limpiando breadcrumbs:', error);
            throw error;
        }
    }

    /**
     * Envía error al worker
     */
    async sendError(error, context = {}) {
        try {
            const response = await this.sendMessage('SEND_ERROR', {
                error,
                context
            });
            
            return response;
        } catch (error) {
            console.error('WorkerManager: Error enviando error:', error);
            throw error;
        }
    }

    /**
     * Actualiza contexto del worker
     */
    async updateContext(context) {
        try {
            const response = await this.sendMessage('UPDATE_CONTEXT', context);
            return response;
        } catch (error) {
            console.error('WorkerManager: Error actualizando contexto:', error);
            throw error;
        }
    }

    /**
     * Ping al worker para verificar conectividad
     */
    async ping() {
        try {
            const response = await this.sendMessage('PING');
            return response;
        } catch (error) {
            console.error('WorkerManager: Error en ping:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del worker
     */
    async getWorkerStats() {
        try {
            const response = await this.sendMessage('GET_STATS');
            return response;
        } catch (error) {
            console.error('WorkerManager: Error obteniendo stats:', error);
            return null;
        }
    }

    /**
     * Destruye el worker
     */
    destroy() {
        if (this.worker) {
            // Limpiar requests pendientes
            this.pendingRequests.forEach((request) => {
                request.reject(new Error('Worker destroyed'));
            });
            this.pendingRequests.clear();
            
            // Terminar worker
            this.worker.terminate();
            this.worker = null;
            
            console.log('🔄 WorkerManager: Worker destruido');
        }
    }

    /**
     * Genera ID único para requests
     */
    generateRequestId() {
        return `req_${++this.requestId}_${Date.now()}`;
    }

    /**
     * Verifica si el worker está disponible
     */
    isWorkerAvailable() {
        return this.worker !== null && this.isInitialized;
    }

    /**
     * Obtiene estado del worker
     */
    getStatus() {
        return {
            isAvailable: this.isWorkerAvailable(),
            isInitialized: this.isInitialized,
            pendingRequests: this.pendingRequests.size,
            config: this.config
        };
    }
}

export default WorkerManager; 