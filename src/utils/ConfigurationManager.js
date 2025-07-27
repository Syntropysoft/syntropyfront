/**
 * ConfigurationManager - Maneja configuración e inicialización de interceptores
 * Responsabilidad única: Configurar SyntropyFront e inicializar interceptores del usuario
 */
export class ConfigurationManager {
    constructor(syntropyFront) {
        this.syntropyFront = syntropyFront;
        this.isConfigured = false;
        this.interceptors = new Map();
    }

    /**
     * Configura SyntropyFront e inicializa interceptores
     * @param {Object} config - Configuración
     * @param {string} config.endpoint - Endpoint para enviar datos
     * @param {number} config.maxBreadcrumbs - Cantidad máxima de breadcrumbs
     * @param {Object} config.interceptor - Interceptor que proporciona el usuario
     * @param {Object} config.traceLevel - Nivel de trazabilidad
     */
    configure(config = {}) {
        if (this.isConfigured) {
            console.warn('SyntropyFront: Ya está configurado');
            return;
        }

        // Configurar endpoint y cantidad de breadcrumbs
        this.configureAgent(config);
        this.configureBreadcrumbs(config);
        
        // Inicializar interceptor si el usuario lo proporciona
        if (config.interceptor) {
            this.initializeInterceptor(config.interceptor, config);
        }

        this.isConfigured = true;
        console.log('✅ SyntropyFront: Configurado correctamente');
    }

    /**
     * Configura el agent para envío de datos
     * @param {Object} config - Configuración
     */
    configureAgent(config) {
        if (config.endpoint) {
            // Aquí configuraríamos el agent si existiera
            console.log(`📡 SyntropyFront: Endpoint configurado: ${config.endpoint}`);
        }
    }

    /**
     * Configura el almacenamiento de breadcrumbs
     * @param {Object} config - Configuración
     */
    configureBreadcrumbs(config) {
        if (config.maxBreadcrumbs) {
            // Aquí configuraríamos el breadcrumbStore si existiera
            console.log(`🍞 SyntropyFront: Máximo breadcrumbs: ${config.maxBreadcrumbs}`);
        }
    }

    /**
     * Inicializa un interceptor proporcionado por el usuario
     * @param {Object} interceptor - Interceptor a inicializar
     * @param {Object} config - Configuración
     */
    initializeInterceptor(interceptor, config) {
        try {
            if (typeof interceptor.init === 'function') {
                // Crear API segura para el interceptor
                const api = this.createInterceptorApi();
                
                // Inicializar el interceptor
                interceptor.init(this.syntropyFront, {
                    ...config,
                    api: api
                });
                
                this.interceptors.set(interceptor.constructor.name, interceptor);
                console.log(`🔧 SyntropyFront: Interceptor inicializado: ${interceptor.constructor.name}`);
            } else {
                console.warn('SyntropyFront: Interceptor no tiene método init()');
            }
        } catch (error) {
            console.error('SyntropyFront: Error inicializando interceptor:', error);
        }
    }

    /**
     * Crea una API segura para los interceptores
     * @returns {Object} API segura
     */
    createInterceptorApi() {
        return {
            addBreadcrumb: (category, message, data = {}) => {
                this.syntropyFront.addBreadcrumb(category, message, data);
            },
            
            sendError: (error, context = {}) => {
                this.syntropyFront.sendError(error, context);
            },
            
            getBreadcrumbs: () => {
                return this.syntropyFront.getBreadcrumbs();
            },
            
            getTimestamp: () => new Date().toISOString()
        };
    }

    /**
     * Obtiene información de configuración
     * @returns {Object} Información de configuración
     */
    getConfigInfo() {
        return {
            isConfigured: this.isConfigured,
            interceptors: Array.from(this.interceptors.keys()),
            totalInterceptors: this.interceptors.size
        };
    }

    /**
     * Limpia la configuración
     */
    destroy() {
        // Destruir interceptores
        for (const [name, interceptor] of this.interceptors) {
            if (typeof interceptor.destroy === 'function') {
                try {
                    interceptor.destroy();
                } catch (error) {
                    console.warn(`SyntropyFront: Error destruyendo interceptor ${name}:`, error);
                }
            }
        }
        
        this.interceptors.clear();
        this.isConfigured = false;
        console.log('🧹 SyntropyFront: Configuración limpiada');
    }
} 