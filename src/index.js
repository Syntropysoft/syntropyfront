/**
 * SyntropyFront - Librería de observabilidad con captura automática
 * Responsabilidad única: Capturar eventos automáticamente y enviar errores con contexto
 */
import { BreadcrumbManager } from './core/BreadcrumbManager.js';
import { ErrorManager } from './core/ErrorManager.js';
import { Logger } from './core/Logger.js';

class SyntropyFront {
    constructor() {
        // Managers básicos
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        // Configuración por defecto
        this.maxEvents = 50;
        this.fetchConfig = null; // Configuración completa de fetch
        this.isActive = false;
        
        // Captura automática
        this.originalHandlers = {};
        
        // Auto-inicializar
        this.init();
    }

    init() {
        this.isActive = true;
        
        // Configurar captura automática inmediatamente
        this.setupAutomaticCapture();
        
        console.log('🚀 SyntropyFront: Inicializado con captura automática');
    }

    /**
     * Configura SyntropyFront
     * @param {Object} config - Configuración
     * @param {number} config.maxEvents - Máximo número de eventos a guardar
     * @param {Object} config.fetch - Configuración completa de fetch
     * @param {string} config.fetch.url - URL del endpoint
     * @param {Object} config.fetch.options - Opciones de fetch (headers, method, etc.)
     */
    configure(config = {}) {
        this.maxEvents = config.maxEvents || this.maxEvents;
        this.fetchConfig = config.fetch;
        
        if (this.fetchConfig) {
            console.log(`✅ SyntropyFront: Configurado - maxEvents: ${this.maxEvents}, endpoint: ${this.fetchConfig.url}`);
        } else {
            console.log(`✅ SyntropyFront: Configurado - maxEvents: ${this.maxEvents}, solo console`);
        }
    }

    /**
     * Configura captura automática de eventos
     */
    setupAutomaticCapture() {
        if (typeof window === 'undefined') return;

        // Capturar clicks
        this.setupClickCapture();
        
        // Capturar errores
        this.setupErrorCapture();
        
        // Capturar llamadas HTTP
        this.setupHttpCapture();
        
        // Capturar console logs
        this.setupConsoleCapture();
    }

    /**
     * Captura clicks del usuario
     */
    setupClickCapture() {
        const clickHandler = (event) => {
            const element = event.target;
            this.addBreadcrumb('user', 'click', {
                element: element.tagName,
                id: element.id,
                className: element.className,
                x: event.clientX,
                y: event.clientY
            });
        };

        document.addEventListener('click', clickHandler);
    }

    /**
     * Captura errores automáticamente
     */
    setupErrorCapture() {
        // Guardar handlers originales
        this.originalHandlers.onerror = window.onerror;
        this.originalHandlers.onunhandledrejection = window.onunhandledrejection;

        // Interceptar errores
        window.onerror = (message, source, lineno, colno, error) => {
            const errorPayload = {
                type: 'uncaught_exception',
                error: { message, source, lineno, colno, stack: error?.stack },
                breadcrumbs: this.getBreadcrumbs(),
                timestamp: new Date().toISOString()
            };

            this.handleError(errorPayload);
            
            // Llamar handler original
            if (this.originalHandlers.onerror) {
                return this.originalHandlers.onerror(message, source, lineno, colno, error);
            }
            
            return false;
        };

        // Interceptar rejected promises
        window.onunhandledrejection = (event) => {
            const errorPayload = {
                type: 'unhandled_rejection',
                error: {
                    message: event.reason?.message || 'Promise rejection without message',
                    stack: event.reason?.stack,
                },
                breadcrumbs: this.getBreadcrumbs(),
                timestamp: new Date().toISOString()
            };

            this.handleError(errorPayload);
            
            // Llamar handler original
            if (this.originalHandlers.onunhandledrejection) {
                this.originalHandlers.onunhandledrejection(event);
            }
        };
    }

    /**
     * Captura llamadas HTTP
     */
    setupHttpCapture() {
        // Interceptar fetch
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const [url, options] = args;
            
            this.addBreadcrumb('http', 'fetch', {
                url: url,
                method: options?.method || 'GET'
            });

            return originalFetch(...args).then(response => {
                this.addBreadcrumb('http', 'fetch_response', {
                    url: url,
                    status: response.status
                });
                return response;
            }).catch(error => {
                this.addBreadcrumb('http', 'fetch_error', {
                    url: url,
                    error: error.message
                });
                throw error;
            });
        };
    }

    /**
     * Captura console logs
     */
    setupConsoleCapture() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.addBreadcrumb('console', 'log', { message: args.join(' ') });
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.addBreadcrumb('console', 'error', { message: args.join(' ') });
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.addBreadcrumb('console', 'warn', { message: args.join(' ') });
            originalWarn.apply(console, args);
        };
    }

    /**
     * Maneja errores - logea y postea si hay configuración de fetch
     */
    handleError(errorPayload) {
        // Log por defecto
        this.logger.error('❌ Error:', errorPayload);
        
        // Postear si hay configuración de fetch
        if (this.fetchConfig) {
            this.postToEndpoint(errorPayload);
        }
    }

    /**
     * Postea el objeto de error usando la configuración de fetch
     */
    postToEndpoint(errorPayload) {
        const { url, options = {} } = this.fetchConfig;
        
        // Configuración por defecto
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(errorPayload),
            ...options
        };

        fetch(url, defaultOptions).catch(error => {
            console.warn('SyntropyFront: Error posteando al endpoint:', error);
        });
    }

    // API pública simple
    addBreadcrumb(category, message, data = {}) {
        if (!this.isActive) return;
        
        const breadcrumb = this.breadcrumbManager.add(category, message, data);
        
        // Mantener solo los últimos maxEvents
        const breadcrumbs = this.breadcrumbManager.getAll();
        if (breadcrumbs.length > this.maxEvents) {
            this.breadcrumbManager.clear();
            breadcrumbs.slice(-this.maxEvents).forEach(b => this.breadcrumbManager.add(b.category, b.message, b.data));
        }
        
        return breadcrumb;
    }

    getBreadcrumbs() {
        return this.breadcrumbManager.getAll();
    }

    clearBreadcrumbs() {
        this.breadcrumbManager.clear();
    }

    sendError(error, context = {}) {
        if (!this.isActive) return;
        
        const errorData = this.errorManager.send(error, context);
        const errorPayload = {
            ...errorData,
            breadcrumbs: this.getBreadcrumbs(),
            timestamp: new Date().toISOString()
        };
        
        this.handleError(errorPayload);
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
            isActive: this.isActive,
            maxEvents: this.maxEvents,
            hasFetchConfig: !!this.fetchConfig,
            endpoint: this.fetchConfig?.url || 'console'
        };
    }
}

// Instancia única - se auto-inicializa
const syntropyFront = new SyntropyFront();

// Exportar la instancia
export default syntropyFront; 