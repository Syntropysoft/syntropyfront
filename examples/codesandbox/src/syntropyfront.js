/**
 * BreadcrumbManager - Manages breadcrumbs
 * Single responsibility: Store and manage breadcrumbs
 */
class BreadcrumbManager {
    constructor() {
        this.breadcrumbs = [];
        this.maxBreadcrumbs = 10; // Limit to 10 breadcrumbs
    }

    add(category, message, data = {}) {
        const breadcrumb = {
            category,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.breadcrumbs.push(breadcrumb);
        
        // Keep only the last 10 breadcrumbs
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
        }
        
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
 * ErrorManager - Manages errors
 * Single responsibility: Format and manage errors
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
 * Logger - Logs only on errors
 * Single responsibility: Show messages only when there are errors
 */
class Logger {
    constructor() {
        this.isSilent = true; // Silent by default
    }

    log(message, data = null) {
        // Don't log anything in silent mode
        if (this.isSilent) return;
        
        if (data) {
            console.log(message, data);
        } else {
            console.log(message);
        }
    }

    error(message, data = null) {
        // ALWAYS log errors
        if (data) {
            console.error(message, data);
        } else {
            console.error(message);
        }
    }

    warn(message, data = null) {
        // Only important warnings
        if (data) {
            console.warn(message, data);
        } else {
            console.warn(message);
        }
    }

    // Method to enable logging (only for debug)
    enableLogging() {
        this.isSilent = false;
    }

    // Method to disable logging
    disableLogging() {
        this.isSilent = true;
    }
}

/**
 * SyntropyFront - Orchestrates the managers
 * Single responsibility: Coordinate different managers
 */
class SyntropyFront {
    constructor() {
        // Each manager has a single responsibility
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        this.isActive = false;
        this.originalHandlers = {};
        
        this.init();
        // Removed setupErrorInterceptors() to avoid duplicate interceptors
        // ErrorInterceptor from @syntropyfront/interceptors will handle this
    }

    init() {
        this.isActive = true;
        // Don't log anything during initialization
    }

    // Automatic error interceptors
    setupErrorInterceptors() {
        if (typeof window === 'undefined') return;

        // Intercept uncaught errors
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

            // Simulated endpoint - log to console
            console.log('🚨 SyntropyFront - Error detected automatically:', errorPayload);
            
            // Send to library
            this.sendError(errorPayload);
            
            // Call original handler if exists
            if (this.originalHandlers.onerror) {
                return this.originalHandlers.onerror(message, source, lineno, colno, error);
            }
            
            return false;
        };

        // Intercept rejected promises
        this.originalHandlers.onunhandledrejection = window.onunhandledrejection;
        window.onunhandledrejection = (event) => {
            const errorPayload = {
                type: 'unhandled_rejection',
                error: {
                    message: event.reason?.message || 'Promise rejection without message',
                    stack: event.reason?.stack,
                },
                breadcrumbs: this.breadcrumbManager.getAll(),
                timestamp: new Date().toISOString()
            };

            // Simulated endpoint - log to console
            console.log('🚨 SyntropyFront - Promise rejection detected automatically:', errorPayload);
            
            // Send to library
            this.sendError(errorPayload);
            
            // Call original handler if exists
            if (this.originalHandlers.onunhandledrejection) {
                this.originalHandlers.onunhandledrejection(event);
            }
        };
    }

    // Delegate to BreadcrumbManager
    addBreadcrumb(category, message, data = {}) {
        if (!this.isActive) return;
        
        const breadcrumb = this.breadcrumbManager.add(category, message, data);
        // Don't log breadcrumbs - just store
        return breadcrumb;
    }

    getBreadcrumbs() {
        return this.breadcrumbManager.getAll();
    }

    clearBreadcrumbs() {
        this.breadcrumbManager.clear();
    }

    // Delegate to ErrorManager
    sendError(error, context = {}) {
        if (!this.isActive) return;
        
        const errorData = this.errorManager.send(error, context);
        this.logger.error('❌ Error:', errorData); // Only errors are logged
        return errorData;
    }

    getErrors() {
        return this.errorManager.getAll();
    }

    clearErrors() {
        this.errorManager.clear();
    }

    // Utility methods
    getStats() {
        return {
            breadcrumbs: this.breadcrumbManager.getCount(),
            errors: this.errorManager.getCount(),
            isActive: this.isActive
        };
    }
}

// Single instance - auto-initializes
const syntropyFront = new SyntropyFront();

export default syntropyFront; 