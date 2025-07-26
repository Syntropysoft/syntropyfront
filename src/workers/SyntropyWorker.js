/**
 * SyntropyWorker - Worker dedicado para SyntropyFront
 * Maneja recolección de datos sin bloquear el hilo principal
 * 
 * @author SyntropyFront Team
 * @version 1.0.0
 */

class SyntropyWorker {
    constructor() {
        this.dataQueue = [];
        this.breadcrumbs = [];
        this.context = {};
        this.config = {};
        this.isInitialized = false;
        
        // Setup message handling
        this.setupMessageHandlers();
        
        console.log('🔄 SyntropyWorker inicializado');
    }

    /**
     * Configura los handlers de mensajes del main thread
     */
    setupMessageHandlers() {
        self.addEventListener('message', (event) => {
            const { type, payload, id } = event.data;
            
            try {
                switch (type) {
                    case 'INIT':
                        this.handleInit(payload, id);
                        break;
                    case 'ADD_BREADCRUMB':
                        this.handleAddBreadcrumb(payload, id);
                        break;
                    case 'GET_BREADCRUMBS':
                        this.handleGetBreadcrumbs(id);
                        break;
                    case 'CLEAR_BREADCRUMBS':
                        this.handleClearBreadcrumbs(id);
                        break;
                    case 'SEND_ERROR':
                        this.handleSendError(payload, id);
                        break;
                    case 'UPDATE_CONTEXT':
                        this.handleUpdateContext(payload, id);
                        break;
                    case 'PING':
                        this.handlePing(id);
                        break;
                    default:
                        this.sendResponse(id, { error: `Unknown message type: ${type}` });
                }
            } catch (error) {
                console.error('SyntropyWorker error:', error);
                this.sendResponse(id, { error: error.message });
            }
        });
    }

    /**
     * Inicializa el worker con configuración
     */
    handleInit(payload, id) {
        try {
            this.config = payload;
            this.isInitialized = true;
            
            console.log('✅ SyntropyWorker configurado:', this.config);
            
            this.sendResponse(id, { 
                success: true, 
                message: 'Worker inicializado correctamente' 
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Agrega un breadcrumb al worker
     */
    handleAddBreadcrumb(payload, id) {
        try {
            const { type, message, data } = payload;
            
            const breadcrumb = {
                type,
                message,
                data,
                timestamp: Date.now(),
                id: this.generateId()
            };
            
            this.breadcrumbs.push(breadcrumb);
            
            // Mantener límite de breadcrumbs
            if (this.breadcrumbs.length > (this.config.maxBreadcrumbs || 50)) {
                this.breadcrumbs.shift();
            }
            
            console.log('🍞 Breadcrumb agregado:', breadcrumb);
            
            this.sendResponse(id, { 
                success: true, 
                breadcrumbId: breadcrumb.id,
                totalBreadcrumbs: this.breadcrumbs.length
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Obtiene todos los breadcrumbs
     */
    handleGetBreadcrumbs(id) {
        try {
            this.sendResponse(id, { 
                success: true, 
                breadcrumbs: this.breadcrumbs,
                count: this.breadcrumbs.length
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Limpia todos los breadcrumbs
     */
    handleClearBreadcrumbs(id) {
        try {
            const count = this.breadcrumbs.length;
            this.breadcrumbs = [];
            
            console.log('🧹 Breadcrumbs limpiados:', count);
            
            this.sendResponse(id, { 
                success: true, 
                message: `${count} breadcrumbs limpiados`
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Maneja el envío de errores
     */
    handleSendError(payload, id) {
        try {
            const { error, context } = payload;
            
            // Construir reporte de error con breadcrumbs
            const errorReport = {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                context: {
                    ...context,
                    breadcrumbs: this.breadcrumbs,
                    workerContext: this.context
                },
                timestamp: Date.now(),
                id: this.generateId()
            };
            
            console.log('🚨 Error report preparado:', errorReport);
            
            // Aquí iría la lógica de envío al backend
            // Por ahora solo simulamos
            this.simulateSendToBackend(errorReport);
            
            this.sendResponse(id, { 
                success: true, 
                errorReportId: errorReport.id,
                breadcrumbsIncluded: this.breadcrumbs.length
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Actualiza el contexto del worker
     */
    handleUpdateContext(payload, id) {
        try {
            this.context = { ...this.context, ...payload };
            
            console.log('🔄 Contexto actualizado:', this.context);
            
            this.sendResponse(id, { 
                success: true, 
                contextSize: Object.keys(this.context).length
            });
        } catch (error) {
            this.sendResponse(id, { error: error.message });
        }
    }

    /**
     * Handler para ping/pong
     */
    handlePing(id) {
        this.sendResponse(id, { 
            success: true, 
            message: 'pong',
            timestamp: Date.now(),
            breadcrumbsCount: this.breadcrumbs.length
        });
    }

    /**
     * Simula envío al backend (placeholder)
     */
    simulateSendToBackend(errorReport) {
        // Aquí iría la lógica real de envío
        console.log('📤 Enviando error report al backend:', errorReport.id);
        
        // Simular delay de red
        setTimeout(() => {
            console.log('✅ Error report enviado exitosamente');
        }, 100);
    }

    /**
     * Envía respuesta al main thread
     */
    sendResponse(id, data) {
        self.postMessage({
            id,
            ...data,
            timestamp: Date.now()
        });
    }

    /**
     * Genera ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Obtiene estadísticas del worker
     */
    getStats() {
        return {
            breadcrumbsCount: this.breadcrumbs.length,
            contextSize: Object.keys(this.context).length,
            isInitialized: this.isInitialized,
            uptime: Date.now() - this.startTime
        };
    }
}

// Inicializar el worker
const worker = new SyntropyWorker();
worker.startTime = Date.now();

console.log('🚀 SyntropyWorker listo para recibir mensajes'); 