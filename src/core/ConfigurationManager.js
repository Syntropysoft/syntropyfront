/**
 * ConfigurationManager - Maneja la configuración del Agent
 * Responsabilidad única: Gestionar configuración y validación
 */
export class ConfigurationManager {
    constructor() {
        this.endpoint = null;
        this.headers = {
            'Content-Type': 'application/json'
        };
        this.batchSize = 10;
        this.batchTimeout = null;
        this.isEnabled = false;
        this.sendBreadcrumbs = false;
        this.encrypt = null;
        this.usePersistentBuffer = false;
        this.maxRetries = 5;
        this.baseDelay = 1000;
        this.maxDelay = 30000;
    }

    /**
     * Configura el manager
     * @param {Object} config - Configuración
     */
    configure(config) {
        this.endpoint = config.endpoint;
        this.headers = { ...this.headers, ...config.headers };
        this.batchSize = config.batchSize || this.batchSize;
        this.batchTimeout = config.batchTimeout;
        this.isEnabled = !!config.endpoint;
        this.encrypt = config.encrypt || null;
        this.usePersistentBuffer = config.usePersistentBuffer === true;
        this.maxRetries = config.maxRetries || this.maxRetries;
        
        // Lógica simple: si hay batchTimeout = enviar breadcrumbs, sino = solo errores
        this.sendBreadcrumbs = !!config.batchTimeout;
    }

    /**
     * Verifica si el agent está habilitado
     */
    isAgentEnabled() {
        return this.isEnabled;
    }

    /**
     * Verifica si debe enviar breadcrumbs
     */
    shouldSendBreadcrumbs() {
        return this.sendBreadcrumbs;
    }

    /**
     * Obtiene la configuración actual
     */
    getConfig() {
        return {
            endpoint: this.endpoint,
            headers: this.headers,
            batchSize: this.batchSize,
            batchTimeout: this.batchTimeout,
            isEnabled: this.isEnabled,
            sendBreadcrumbs: this.sendBreadcrumbs,
            encrypt: this.encrypt,
            usePersistentBuffer: this.usePersistentBuffer,
            maxRetries: this.maxRetries,
            baseDelay: this.baseDelay,
            maxDelay: this.maxDelay
        };
    }
} 