/**
 * BreadcrumbManager - Gestiona breadcrumbs
 * Responsabilidad única: Almacenar y gestionar breadcrumbs
 */
class BreadcrumbManager {
    constructor() {
        this.breadcrumbs = [];
    }

    add(category, message, data = {}) {
        const breadcrumb = {
            category,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.breadcrumbs.push(breadcrumb);
        return breadcrumb;
    }

    getAll() {
        return this.breadcrumbs;
    }

    clear() {
        this.breadcrumbs = [];
    }

    getCount() {
        return this.breadcrumbs.length;
    }
}

/**
 * ErrorManager - Gestiona errores
 * Responsabilidad única: Formatear y gestionar errores
 */
class ErrorManager {
    constructor() {
        this.errors = [];
    }

    send(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(errorData);
        return errorData;
    }

    getAll() {
        return this.errors;
    }

    clear() {
        this.errors = [];
    }

    getCount() {
        return this.errors.length;
    }
}

/**
 * Logger - Hace logging solo en errores
 * Responsabilidad única: Mostrar mensajes solo cuando hay errores
 */
class Logger {
    constructor() {
        this.isSilent = true; // Por defecto silente
    }

    log(message, data = null) {
        // No loggear nada en modo silente
        if (this.isSilent) return;
        
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }

    error(message, data = null) {
        // SIEMPRE loggear errores
        if (data) {
            console.error(message, data);
        } else {
            console.error(message);
        }
    }

    warn(message, data = null) {
        // Solo warnings importantes
        if (data) {
            console.warn(message, data);
        } else {
            console.warn(message);
        }
    }

    // Método para activar logging (solo para debug)
    enableLogging() {
        this.isSilent = false;
    }

    // Método para desactivar logging
    disableLogging() {
        this.isSilent = true;
    }
}

/**
 * SyntropyFront - Orquesta los managers
 * Responsabilidad única: Coordinar los diferentes managers
 */
class SyntropyFront {
    constructor() {
        // Cada manager tiene una responsabilidad única
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        this.isActive = false;
        this.originalHandlers = {};
        
        this.init();
        this.setupErrorInterceptors(); // 🎯 INYECTAR INTERCEPTORES AUTOMÁTICOS
    }

    init() {
        this.isActive = true;
        // No loggear nada en inicialización
    }

    // 🎯 INTERCEPTORES AUTOMÁTICOS DE ERRORES
    setupErrorInterceptors() {
        if (typeof window === 'undefined') return;

        // Interceptar errores no capturados
        this.originalHandlers.onerror = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            const errorPayload = {
                type: 'uncaught_exception',
                error: { 
                    message, 
                    source, 
                    lineno, 
                    colno, 
                    stack: error?.stack 
                },
                breadcrumbs: this.breadcrumbManager.getAll(),
                timestamp: new Date().toISOString()
            };

            // 🎯 ENDPOINT SIMULADO - LOG A CONSOLA
            console.log('🚨 SyntropyFront - Error detectado automáticamente:', errorPayload);
            
            // Enviar a la librería
            this.sendError(errorPayload);
            
            // Llamar al handler original si existe
            if (this.originalHandlers.onerror) {
                return this.originalHandlers.onerror(message, source, lineno, colno, error);
            }
            
            return false;
        };

        // Interceptar promesas rechazadas
        this.originalHandlers.onunhandledrejection = window.onunhandledrejection;
        window.onunhandledrejection = (event) => {
            const errorPayload = {
                type: 'unhandled_rejection',
                error: {
                    message: event.reason?.message || 'Rechazo de promesa sin mensaje',
                    stack: event.reason?.stack,
                },
                breadcrumbs: this.breadcrumbManager.getAll(),
                timestamp: new Date().toISOString()
            };

            // 🎯 ENDPOINT SIMULADO - LOG A CONSOLA
            console.log('🚨 SyntropyFront - Promesa rechazada detectada automáticamente:', errorPayload);
            
            // Enviar a la librería
            this.sendError(errorPayload);
            
            // Llamar al handler original si existe
            if (this.originalHandlers.onunhandledrejection) {
                this.originalHandlers.onunhandledrejection(event);
            }
        };
    }

    // Delegar a BreadcrumbManager
    addBreadcrumb(category, message, data = {}) {
        if (!this.isActive) return;
        
        const breadcrumb = this.breadcrumbManager.add(category, message, data);
        // No loggear breadcrumbs - solo almacenar
        return breadcrumb;
    }

    getBreadcrumbs() {
        return this.breadcrumbManager.getAll();
    }

    clearBreadcrumbs() {
        this.breadcrumbManager.clear();
    }

    // Delegar a ErrorManager
    sendError(error, context = {}) {
        if (!this.isActive) return;
        
        const errorData = this.errorManager.send(error, context);
        this.logger.error('❌ Error:', errorData); // SOLO errores se loggean
        return errorData;
    }

    getErrors() {
        return this.errorManager.getAll();
    }

    clearErrors() {
        this.errorManager.clear();
    }

    // Métodos de utilidad
    getStats() {
        return {
            breadcrumbs: this.breadcrumbManager.getCount(),
            errors: this.errorManager.getCount(),
            isActive: this.isActive
        };
    }
}

// Instancia única - se auto-inicializa
const syntropyFront = new SyntropyFront();

export default syntropyFront; 