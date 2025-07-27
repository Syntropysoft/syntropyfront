'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
 * Logger - Hace logging
 * Responsabilidad única: Mostrar mensajes en consola
 */
class Logger {
    log(message, data = null) {
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }

    error(message, data = null) {
        if (data) {
            console.error(message, data);
        } else {
            console.error(message);
        }
    }

    warn(message, data = null) {
        if (data) {
            console.warn(message, data);
        } else {
            console.warn(message);
        }
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

exports.default = syntropyFront;
//# sourceMappingURL=index.cjs.map
