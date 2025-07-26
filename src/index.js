import { breadcrumbStore } from './core/BreadcrumbStore.js';
import { interceptors } from './interceptors/Interceptors.js';
import { agent } from './core/Agent.js';
import { contextCollector } from './core/ContextCollector.js';
import { getPreset, getAvailablePresets, getPresetInfo } from './config/presets.js';

/**
 * SyntropyFront - Sistema de trazabilidad para frontend
 * API principal para inicializar y configurar el sistema
 */
export class SyntropyFront {
    constructor() {
        this.isInitialized = false;
        this.currentPreset = null;
        
        // Lazy-loaded modules
        this.proxyObjectTracker = null;
        this.interceptorRegistry = null;
        this.workerManager = null;
        
        // Configuración por defecto (balanced preset)
        this.config = {
            preset: 'balanced', // Preset por defecto
            maxBreadcrumbs: 50,
            captureClicks: true,
            captureFetch: true,
            captureErrors: true,
            captureUnhandledRejections: true,
            onError: null,
            onBreadcrumbAdded: null,
            // Configuración del agent
            agent: {
                endpoint: null,
                headers: {},
                batchSize: 20,
                batchTimeout: 10000, // 10 segundos por defecto
                encrypt: null // Callback de encriptación opcional
            },
            // Configuración de contexto (nueva arquitectura granular)
            context: {
                device: true,    // Set curado por defecto
                window: true,    // Set curado por defecto
                session: true,   // Set curado por defecto
                ui: true,        // Set curado por defecto
                network: true    // Set curado por defecto
            },
            // Configuración de proxy tracking
            proxyTracking: {
                enabled: true,
                maxStates: 10,
                trackNested: true,
                trackArrays: false
            },
            // Worker habilitado por defecto
            useWorker: true
        };
    }

    /**
     * Inicializa el sistema de trazabilidad
     * @param {Object} options - Opciones de configuración
     */
    async init(options = {}) {
        if (this.isInitialized) {
            console.warn('SyntropyFront ya está inicializado');
            return;
        }

        // Manejar preset si se especifica
        if (options.preset) {
            try {
                const preset = getPreset(options.preset);
                this.currentPreset = options.preset;
                
                // Aplicar configuración del preset
                this.config = { ...this.config, ...preset };
                
                console.log(`🎯 SyntropyFront: Aplicando preset '${options.preset}' - ${preset.description}`);
            } catch (error) {
                console.error(`❌ SyntropyFront: Error aplicando preset '${options.preset}':`, error.message);
                throw error;
            }
        }

        // Aplicar configuración personalizada (sobrescribe preset)
        this.config = { ...this.config, ...options };

        // Configurar agent primero
        if (this.config.agent.endpoint) {
            agent.configure(this.config.agent);
        }

        // Configurar worker manager
        if (this.config.useWorker !== false) {
            await this.workerManager.init({
                maxBreadcrumbs: this.config.maxBreadcrumbs,
                agent: this.config.agent
            });
        }

        // Configurar breadcrumb store
        breadcrumbStore.setMaxBreadcrumbs(this.config.maxBreadcrumbs);
        breadcrumbStore.onBreadcrumbAdded = this.config.onBreadcrumbAdded;
        breadcrumbStore.setAgent(agent);

        // Configurar contexto (nueva arquitectura granular)
        this.contextConfig = this.config.context || {
            device: true,
            window: true,
            session: true,
            ui: true,
            network: true
        };



        // Lazy load modules based on configuration
        await this.loadModules();

        // Configurar proxy object tracker (si está habilitado)
        if (this.config.proxyTracking?.enabled && this.proxyObjectTracker) {
            this.proxyObjectTracker.configure(this.config.proxyTracking);
        }

        // Configurar interceptores
        interceptors.configure({
            captureClicks: this.config.captureClicks,
            captureFetch: this.config.captureFetch,
            captureErrors: this.config.captureErrors,
            captureUnhandledRejections: this.config.captureUnhandledRejections
        });

        interceptors.onError = this.config.onError;

        // Inicializar interceptores
        interceptors.init();

        // Inicializar interceptores personalizados (si están habilitados)
        if (this.interceptorRegistry) {
            this.interceptorRegistry.init({
                breadcrumbStore,
                agent,
                contextCollector
            });
        }

        this.isInitialized = true;
        console.log('SyntropyFront inicializado correctamente');
    }

    /**
     * Carga módulos dinámicamente basado en la configuración
     */
    async loadModules() {
        const loadPromises = [];

        // Cargar ProxyObjectTracker si está habilitado
        if (this.config.proxyTracking?.enabled) {
            loadPromises.push(
                import('./core/ProxyObjectTracker.js')
                    .then(module => {
                        this.proxyObjectTracker = module.proxyObjectTracker;
                        console.log('🔄 ProxyObjectTracker cargado dinámicamente');
                    })
                    .catch(error => {
                        console.warn('⚠️ Error cargando ProxyObjectTracker:', error);
                    })
            );
        }

        // Cargar InterceptorRegistry si hay interceptores personalizados
        if (this.config.useInterceptors !== false) {
            loadPromises.push(
                import('./core/InterceptorRegistry.js')
                    .then(module => {
                        this.interceptorRegistry = module.interceptorRegistry;
                        console.log('🔄 InterceptorRegistry cargado dinámicamente');
                    })
                    .catch(error => {
                        console.warn('⚠️ Error cargando InterceptorRegistry:', error);
                    })
            );
        }

        // Cargar WorkerManager si está habilitado
        if (this.config.useWorker !== false) {
            loadPromises.push(
                import('./core/WorkerManager.js')
                    .then(module => {
                        this.workerManager = new module.default();
                        console.log('🔄 WorkerManager cargado dinámicamente');
                    })
                    .catch(error => {
                        console.warn('⚠️ Error cargando WorkerManager:', error);
                    })
            );
        }

        // Esperar a que todos los módulos se carguen
        await Promise.all(loadPromises);
    }

    /**
     * Añade un breadcrumb manualmente
     * @param {string} category - Categoría del evento
     * @param {string} message - Mensaje descriptivo
     * @param {Object} data - Datos adicionales
     */
    addBreadcrumb(category, message, data = {}) {
        breadcrumbStore.add({ category, message, data });
    }

    /**
     * Obtiene todos los breadcrumbs
     * @returns {Array} Lista de breadcrumbs
     */
    getBreadcrumbs() {
        return breadcrumbStore.getAll();
    }

    /**
     * Obtiene breadcrumbs por categoría
     * @param {string} category - Categoría a filtrar
     * @returns {Array} Breadcrumbs de la categoría
     */
    getBreadcrumbsByCategory(category) {
        return breadcrumbStore.getByCategory(category);
    }

    /**
     * Limpia todos los breadcrumbs
     */
    clearBreadcrumbs() {
        breadcrumbStore.clear();
    }

    /**
     * Desactiva el sistema de trazabilidad
     */
    destroy() {
        if (!this.isInitialized) return;

        interceptors.destroy();
        
        if (this.interceptorRegistry) {
            this.interceptorRegistry.destroy();
        }
        
        breadcrumbStore.clear();
        agent.disable();
        
        if (this.workerManager) {
            this.workerManager.destroy();
        }
        
        this.isInitialized = false;
        console.log('SyntropyFront desactivado');
    }

    /**
     * Configura el tamaño máximo de breadcrumbs
     * @param {number} maxBreadcrumbs - Nuevo tamaño máximo
     */
    setMaxBreadcrumbs(maxBreadcrumbs) {
        breadcrumbStore.setMaxBreadcrumbs(maxBreadcrumbs);
    }

    /**
     * Obtiene el tamaño máximo actual de breadcrumbs
     * @returns {number} Tamaño máximo
     */
    getMaxBreadcrumbs() {
        return breadcrumbStore.getMaxBreadcrumbs();
    }

    /**
     * Fuerza el envío de datos pendientes al backend
     */
    async flush() {
        await agent.forceFlush();
    }

    /**
     * Obtiene el contexto actual según la configuración
     * @returns {Object} Contexto recolectado
     */
    getContext() {
        const context = contextCollector.collect(this.contextConfig);
        
        // Agregar objetos personalizados
        const customObjects = customObjectCollector.collectCustomObjects();
        if (Object.keys(customObjects).length > 0) {
            context.customObjects = customObjects;
        }
        
        return context;
    }

    /**
     * Obtiene todos los tipos de contexto disponibles
     * @returns {Array} Tipos disponibles
     */
    getAvailableContextTypes() {
        return contextCollector.getAvailableTypes();
    }

    /**
     * Obtiene los campos disponibles para un tipo de contexto
     * @param {string} contextType - Tipo de contexto
     * @returns {Array} Campos disponibles
     */
    getAvailableContextFields(contextType) {
        return contextCollector.getAvailableFields(contextType);
    }

    /**
     * Obtiene información sobre los sets por defecto
     * @returns {Object} Información de sets por defecto
     */
    getDefaultContextsInfo() {
        return contextCollector.getDefaultContextsInfo();
    }

    /**
     * Configura el contexto a recolectar
     * @param {Object} contextConfig - Configuración de contexto
     */
    setContext(contextConfig) {
        if (typeof contextConfig !== 'object') {
            console.warn('SyntropyFront: contextConfig debe ser un objeto');
            return;
        }

        this.contextConfig = contextConfig;
        console.log('SyntropyFront: Configuración de contexto actualizada:', contextConfig);
    }

    /**
     * Configura los tipos de contexto a recolectar (método legacy)
     * @param {Array} contextTypes - Tipos de contexto
     */
    setContextTypes(contextTypes) {
        if (!Array.isArray(contextTypes)) {
            console.warn('SyntropyFront: contextTypes debe ser un array');
            return;
        }

        // Convertir array a configuración por defecto
        const contextConfig = {};
        contextTypes.forEach(type => {
            contextConfig[type] = true; // Usar set por defecto
        });

        this.setContext(contextConfig);
    }

    // ===== DEPRECATED: CUSTOM OBJECT METHODS =====
    // Estos métodos están deprecados. Usa ProxyObjectTracker en su lugar.
    
    /**
     * @deprecated Usa addProxyObject() en su lugar
     */
    addCustomObject(name, source, maxStates = 10) {
        console.warn('SyntropyFront: addCustomObject() está deprecado. Usa addProxyObject() en su lugar.');
        throw new Error('addCustomObject() está deprecado. Usa addProxyObject() en su lugar.');
    }

    /**
     * @deprecated Usa removeProxyObject() en su lugar
     */
    removeCustomObject(name) {
        console.warn('SyntropyFront: removeCustomObject() está deprecado. Usa removeProxyObject() en su lugar.');
        throw new Error('removeCustomObject() está deprecado. Usa removeProxyObject() en su lugar.');
    }

    /**
     * @deprecated Usa getProxyObjectState() en su lugar
     */
    getCustomObjectValue(name) {
        console.warn('SyntropyFront: getCustomObjectValue() está deprecado. Usa getProxyObjectState() en su lugar.');
        throw new Error('getCustomObjectValue() está deprecado. Usa getProxyObjectState() en su lugar.');
    }

    /**
     * @deprecated Usa getProxyObjectHistory() en su lugar
     */
    getCustomObjectHistory(name) {
        console.warn('SyntropyFront: getCustomObjectHistory() está deprecado. Usa getProxyObjectHistory() en su lugar.');
        throw new Error('getCustomObjectHistory() está deprecado. Usa getProxyObjectHistory() en su lugar.');
    }

    /**
     * @deprecated Usa getProxyTrackedObjects() en su lugar
     */
    getCustomObjectNames() {
        console.warn('SyntropyFront: getCustomObjectNames() está deprecado. Usa getProxyTrackedObjects() en su lugar.');
        throw new Error('getCustomObjectNames() está deprecado. Usa getProxyTrackedObjects() en su lugar.');
    }

    /**
     * Inyecta un interceptor personalizado
     * @param {string} name - Nombre del interceptor
     * @param {Object} interceptor - Objeto interceptor con métodos init/destroy
     * @returns {SyntropyFront} Instancia para chaining
     */
    inject(name, interceptor) {
        if (!this.interceptorRegistry) {
            console.warn('SyntropyFront: InterceptorRegistry no está cargado. Asegúrate de que useInterceptors no esté en false.');
            return this;
        }
        this.interceptorRegistry.register(name, interceptor);
        return this; // Para chaining
    }

    /**
     * Remueve un interceptor personalizado
     * @param {string} name - Nombre del interceptor
     */
    removeInterceptor(name) {
        if (!this.interceptorRegistry) {
            console.warn('SyntropyFront: InterceptorRegistry no está cargado.');
            return;
        }
        this.interceptorRegistry.unregister(name);
    }

    /**
     * Obtiene la lista de interceptores registrados
     * @returns {Array} Lista de nombres de interceptores
     */
    getRegisteredInterceptors() {
        if (!this.interceptorRegistry) {
            return [];
        }
        return this.interceptorRegistry.getRegisteredInterceptors();
    }

    /**
     * Obtiene información de un interceptor específico
     * @param {string} name - Nombre del interceptor
     * @returns {Object|null} Información del interceptor
     */
    getInterceptorInfo(name) {
        if (!this.interceptorRegistry) {
            return null;
        }
        return this.interceptorRegistry.getInterceptorInfo(name);
    }

    /**
     * Verifica si está inicializado
     * @returns {boolean} Estado de inicialización
     */
    isActive() {
        return this.isInitialized;
    }

    // ===== PROXY OBJECT TRACKER METHODS =====

    /**
     * Agrega un objeto para tracking reactivo con Proxy
     * @param {string} objectPath - Ruta/nombre del objeto
     * @param {Object} targetObject - Objeto a trackear
     * @param {Object} options - Opciones de tracking
     * @returns {Object} Proxy del objeto original
     */
    addProxyObject(objectPath, targetObject, options = {}) {
        if (!this.proxyObjectTracker) {
            console.warn('SyntropyFront: ProxyObjectTracker no está cargado. Asegúrate de que proxyTracking.enabled esté en true.');
            return targetObject;
        }
        return this.proxyObjectTracker.addObject(objectPath, targetObject, options);
    }

    /**
     * Obtiene el historial de estados de un objeto trackeado
     * @param {string} objectPath - Ruta del objeto
     * @returns {Array} Historial de estados
     */
    getProxyObjectHistory(objectPath) {
        if (!this.proxyObjectTracker) {
            return [];
        }
        return this.proxyObjectTracker.getObjectHistory(objectPath);
    }

    /**
     * Obtiene el estado actual de un objeto trackeado
     * @param {string} objectPath - Ruta del objeto
     * @returns {Object|null} Estado actual
     */
    getProxyObjectState(objectPath) {
        if (!this.proxyObjectTracker) {
            return null;
        }
        return this.proxyObjectTracker.getCurrentState(objectPath);
    }

    /**
     * Obtiene todos los objetos trackeados con Proxy
     * @returns {Array} Lista de objetos trackeados
     */
    getProxyTrackedObjects() {
        if (!this.proxyObjectTracker) {
            return [];
        }
        return this.proxyObjectTracker.getTrackedObjects();
    }

    /**
     * Remueve un objeto del tracking con Proxy
     * @param {string} objectPath - Ruta del objeto
     * @returns {Object|null} Objeto original (sin proxy)
     */
    removeProxyObject(objectPath) {
        if (!this.proxyObjectTracker) {
            return null;
        }
        return this.proxyObjectTracker.removeObject(objectPath);
    }

    /**
     * Limpia todos los objetos trackeados con Proxy
     */
    clearProxyObjects() {
        if (!this.proxyObjectTracker) {
            return;
        }
        this.proxyObjectTracker.clear();
    }

    /**
     * Obtiene estadísticas del ProxyObjectTracker
     * @returns {Object} Estadísticas
     */
    getProxyTrackerStats() {
        if (!this.proxyObjectTracker) {
            return { enabled: false, trackedObjects: 0 };
        }
        return this.proxyObjectTracker.getStats();
    }

    // Worker Manager Methods
    async addBreadcrumbToWorker(type, message, data = {}) {
        if (!this.workerManager) {
            console.warn('SyntropyFront: WorkerManager no está cargado. Asegúrate de que useWorker no esté en false.');
            return this.addBreadcrumb(type, message, data);
        }
        if (this.workerManager.isWorkerAvailable()) {
            return await this.workerManager.addBreadcrumb(type, message, data);
        } else {
            // Fallback al método normal
            return this.addBreadcrumb(type, message, data);
        }
    }

    async getBreadcrumbsFromWorker() {
        if (!this.workerManager) {
            return this.getBreadcrumbs();
        }
        if (this.workerManager.isWorkerAvailable()) {
            return await this.workerManager.getBreadcrumbs();
        } else {
            return this.getBreadcrumbs();
        }
    }

    async clearBreadcrumbsFromWorker() {
        if (!this.workerManager) {
            return this.clearBreadcrumbs();
        }
        if (this.workerManager.isWorkerAvailable()) {
            return await this.workerManager.clearBreadcrumbs();
        } else {
            return this.clearBreadcrumbs();
        }
    }

    async sendErrorToWorker(error, context = {}) {
        if (!this.workerManager) {
            console.warn('SyntropyFront: WorkerManager no está cargado. Asegúrate de que useWorker no esté en false.');
            return this.sendError(error, context);
        }
        if (this.workerManager.isWorkerAvailable()) {
            return await this.workerManager.sendError(error, context);
        } else {
            // Fallback al método normal
            return this.sendError(error, context);
        }
    }

    async pingWorker() {
        if (!this.workerManager) {
            return { success: false, message: 'Worker no cargado' };
        }
        if (this.workerManager.isWorkerAvailable()) {
            return await this.workerManager.ping();
        } else {
            return { success: false, message: 'Worker no disponible' };
        }
    }

    getWorkerStatus() {
        if (!this.workerManager) {
            return { isAvailable: false, isInitialized: false, pendingRequests: 0 };
        }
        return this.workerManager.getStatus();
    }

    isWorkerAvailable() {
        if (!this.workerManager) {
            return false;
        }
        return this.workerManager.isWorkerAvailable();
    }

    // Preset Methods
    getCurrentPreset() {
        return this.currentPreset;
    }

    getPresetInfo(presetName = null) {
        const name = presetName || this.currentPreset;
        if (!name) {
            return null;
        }
        return getPresetInfo(name);
    }

    getAvailablePresets() {
        return getAvailablePresets();
    }

    async changePreset(presetName, options = {}) {
        if (this.isInitialized) {
            console.warn('SyntropyFront: No se puede cambiar preset después de la inicialización');
            return false;
        }

        try {
            const preset = getPreset(presetName);
            this.currentPreset = presetName;
            
            // Aplicar preset
            this.config = { ...this.config, ...preset };
            
            // Aplicar opciones adicionales
            this.config = { ...this.config, ...options };
            
            console.log(`🎯 SyntropyFront: Preset cambiado a '${presetName}' - ${preset.description}`);
            return true;
        } catch (error) {
            console.error(`❌ SyntropyFront: Error cambiando preset a '${presetName}':`, error.message);
            return false;
        }
    }

    getConfiguration() {
        return {
            currentPreset: this.currentPreset,
            config: this.config,
            isInitialized: this.isInitialized
        };
    }
}

// Instancia singleton principal
const syntropyFront = new SyntropyFront();

// Exportar la instancia y la clase
export default syntropyFront;
export { SyntropyFront };

// Exportar componentes individuales para uso avanzado
export { breadcrumbStore, interceptors, agent }; 