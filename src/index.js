/**
 * SyntropyFront - Orquesta los managers
 * Responsabilidad única: Coordinar los diferentes managers
 */
import { BreadcrumbManager } from './core/BreadcrumbManager.js';
import { ErrorManager } from './core/ErrorManager.js';
import { Logger } from './core/Logger.js';

class SyntropyFront {
    constructor() {
        // Cada manager tiene una responsabilidad única
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        this.isActive = false;
        this.init();
    }

    init() {
        this.isActive = true;
        this.logger.log('✅ SyntropyFront: Listo para usar');
    }

    // Delegar a BreadcrumbManager
    addBreadcrumb(category, message, data = {}) {
        if (!this.isActive) return;
        
        const breadcrumb = this.breadcrumbManager.add(category, message, data);
        this.logger.log('📝 Breadcrumb:', breadcrumb);
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
        this.logger.error('❌ Error:', errorData);
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

// Exportar la instancia
export default syntropyFront; 