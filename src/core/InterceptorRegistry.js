/**
 * InterceptorRegistry - Registro de interceptores personalizados
 * Permite al usuario inyectar sus propios interceptores sin modificar el código base
 * Usa una Facade para exponer solo métodos seguros a los interceptores
 */
export class InterceptorRegistry {
    constructor() {
        this.customInterceptors = new Map();
        this.isInitialized = false;
    }

    /**
     * Crea una API segura para los interceptores
     * Solo expone métodos públicos y seguros
     * @param {Object} config - Configuración con instancias internas
     * @returns {Object} API segura para interceptores
     */
    createInterceptorApi(config) {
        const { breadcrumbStore, agent, contextCollector } = config;
        
        return {
            // Métodos para breadcrumbs
            addBreadcrumb: (category, message, data = {}) => {
                breadcrumbStore.add({ category, message, data, timestamp: new Date().toISOString() });
            },
            
            // Métodos para enviar datos
            sendError: (errorPayload, context = null) => {
                agent.sendError(errorPayload, context);
            },
            
            sendBreadcrumbs: (breadcrumbs) => {
                agent.sendBreadcrumbs(breadcrumbs);
            },
            
            // Métodos para contexto
            getContext: (contextConfig = {}) => {
                return contextCollector.collect(contextConfig);
            },
            
            // Métodos de utilidad
            getTimestamp: () => new Date().toISOString(),
            
            // Información de la API (solo lectura)
            apiVersion: '1.0.0',
            availableMethods: [
                'addBreadcrumb',
                'sendError', 
                'sendBreadcrumbs',
                'getContext',
                'getTimestamp'
            ]
        };
    }

    /**
     * Registra un interceptor personalizado
     * @param {string} name - Nombre del interceptor
     * @param {Object} interceptor - Objeto interceptor con métodos init/destroy
     */
    register(name, interceptor) {
        if (!interceptor || typeof interceptor.init !== 'function') {
            throw new Error(`Interceptor ${name} debe tener un método init()`);
        }

        this.customInterceptors.set(name, {
            name,
            interceptor,
            enabled: true
        });

        console.log(`SyntropyFront: Interceptor personalizado registrado: ${name}`);
    }

    /**
     * Remueve un interceptor personalizado
     * @param {string} name - Nombre del interceptor
     */
    unregister(name) {
        const registered = this.customInterceptors.get(name);
        if (registered) {
            // Destruir el interceptor si está inicializado
            if (this.isInitialized && registered.interceptor.destroy) {
                try {
                    registered.interceptor.destroy();
                } catch (error) {
                    console.warn(`SyntropyFront: Error destruyendo interceptor ${name}:`, error);
                }
            }
            
            this.customInterceptors.delete(name);
            console.log(`SyntropyFront: Interceptor personalizado removido: ${name}`);
        }
    }

    /**
     * Inicializa todos los interceptores personalizados
     * @param {Object} config - Configuración con instancias internas
     */
    init(config = {}) {
        if (this.isInitialized) {
            console.warn('SyntropyFront: InterceptorRegistry ya está inicializado');
            return;
        }

        // Crear API segura para interceptores
        const interceptorApi = this.createInterceptorApi(config);

        for (const [name, registered] of this.customInterceptors) {
            if (registered.enabled) {
                try {
                    // ✅ SEGURO: Pasar solo la API, no el config crudo
                    registered.interceptor.init(interceptorApi);
                    console.log(`SyntropyFront: Interceptor ${name} inicializado`);
                } catch (error) {
                    console.error(`SyntropyFront: Error inicializando interceptor ${name}:`, error);
                }
            }
        }

        this.isInitialized = true;
    }

    /**
     * Destruye todos los interceptores personalizados
     */
    destroy() {
        if (!this.isInitialized) return;

        for (const [name, registered] of this.customInterceptors) {
            if (registered.interceptor.destroy) {
                try {
                    registered.interceptor.destroy();
                    console.log(`SyntropyFront: Interceptor ${name} destruido`);
                } catch (error) {
                    console.warn(`SyntropyFront: Error destruyendo interceptor ${name}:`, error);
                }
            }
        }

        this.isInitialized = false;
    }

    /**
     * Habilita/deshabilita un interceptor personalizado
     * @param {string} name - Nombre del interceptor
     * @param {boolean} enabled - Si está habilitado
     */
    setEnabled(name, enabled) {
        const registered = this.customInterceptors.get(name);
        if (registered) {
            registered.enabled = enabled;
            
            if (this.isInitialized) {
                if (enabled && registered.interceptor.init) {
                    try {
                        // Crear API segura para el interceptor
                        const interceptorApi = this.createInterceptorApi({
                            breadcrumbStore: this.breadcrumbStore,
                            agent: this.agent,
                            contextCollector: this.contextCollector
                        });
                        registered.interceptor.init(interceptorApi);
                        console.log(`SyntropyFront: Interceptor ${name} habilitado`);
                    } catch (error) {
                        console.error(`SyntropyFront: Error habilitando interceptor ${name}:`, error);
                    }
                } else if (!enabled && registered.interceptor.destroy) {
                    try {
                        registered.interceptor.destroy();
                        console.log(`SyntropyFront: Interceptor ${name} deshabilitado`);
                    } catch (error) {
                        console.warn(`SyntropyFront: Error deshabilitando interceptor ${name}:`, error);
                    }
                }
            }
        }
    }

    /**
     * Obtiene la lista de interceptores registrados
     * @returns {Array} Lista de nombres de interceptores
     */
    getRegisteredInterceptors() {
        return Array.from(this.customInterceptors.keys());
    }

    /**
     * Obtiene información de un interceptor específico
     * @param {string} name - Nombre del interceptor
     * @returns {Object|null} Información del interceptor
     */
    getInterceptorInfo(name) {
        const registered = this.customInterceptors.get(name);
        if (registered) {
            return {
                name: registered.name,
                enabled: registered.enabled,
                hasInit: typeof registered.interceptor.init === 'function',
                hasDestroy: typeof registered.interceptor.destroy === 'function'
            };
        }
        return null;
    }

    /**
     * Obtiene la documentación de la API para interceptores
     * @returns {Object} Documentación de la API
     */
    getApiDocumentation() {
        return {
            version: '1.0.0',
            methods: {
                addBreadcrumb: {
                    description: 'Agrega un breadcrumb al historial',
                    signature: 'addBreadcrumb(category, message, data?)',
                    example: 'api.addBreadcrumb("ui", "Usuario hizo click", { element: "button" })'
                },
                sendError: {
                    description: 'Envía un error al backend',
                    signature: 'sendError(errorPayload, context?)',
                    example: 'api.sendError({ message: "Error crítico" }, { device: true })'
                },
                sendBreadcrumbs: {
                    description: 'Envía breadcrumbs al backend',
                    signature: 'sendBreadcrumbs(breadcrumbs)',
                    example: 'api.sendBreadcrumbs([{ category: "ui", message: "Click" }])'
                },
                getContext: {
                    description: 'Obtiene contexto del navegador',
                    signature: 'getContext(contextConfig?)',
                    example: 'api.getContext({ device: true, window: ["url"] })'
                },
                getTimestamp: {
                    description: 'Obtiene timestamp actual en formato ISO',
                    signature: 'getTimestamp()',
                    example: 'const now = api.getTimestamp()'
                }
            }
        };
    }

    /**
     * Limpia todos los interceptores registrados
     */
    clear() {
        this.destroy();
        this.customInterceptors.clear();
    }
}

// Instancia singleton
export const interceptorRegistry = new InterceptorRegistry(); 