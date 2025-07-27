/**
 * SyntropyFront - Orquesta los managers
 * Responsabilidad única: Coordinar los diferentes managers
 */
import { BreadcrumbManager } from './core/BreadcrumbManager.js';
import { ErrorManager } from './core/ErrorManager.js';
import { Logger } from './core/Logger.js';
import { ConfigurationManager } from './utils/ConfigurationManager.js';

class SyntropyFront {
    constructor() {
        // Cada manager tiene una responsabilidad única
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        // ConfigurationManager para manejar configuración e interceptores
        this.configManager = new ConfigurationManager(this);
        
        this.isActive = false;
        this.init();
    }

    init() {
        this.isActive = true;
        // No loggear nada en inicialización
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

    // Configuración e interceptores
    configure(config = {}) {
        this.configManager.configure(config);
    }

    getConfigInfo() {
        return this.configManager.getConfigInfo();
    }

    // Métodos de utilidad
    getStats() {
        return {
            breadcrumbs: this.breadcrumbManager.getCount(),
            errors: this.errorManager.getCount(),
            isActive: this.isActive,
            config: this.getConfigInfo()
        };
    }
}

// Instancia única - se auto-inicializa
const syntropyFront = new SyntropyFront();

// Exportar la instancia
export default syntropyFront; 