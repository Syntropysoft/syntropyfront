/**
 * SyntropyFront - Observability library with automatic capture
 * Single responsibility: Automatically capture events and send errors with context
 */
import { BreadcrumbManager } from './core/breadcrumbs/BreadcrumbManager.js';
import { ErrorManager } from './core/utils/ErrorManager.js';
import { Logger } from './core/utils/Logger.js';

class SyntropyFront {
    constructor() {
        // Basic managers
        this.breadcrumbManager = new BreadcrumbManager();
        this.errorManager = new ErrorManager();
        this.logger = new Logger();
        
        // Default configuration
        this.maxEvents = 50;
        this.fetchConfig = null; // Complete fetch configuration
        this.onErrorCallback = null; // User-defined error handler
        this.isActive = false;
        
        // Automatic capture
        this.originalHandlers = {};
        
        // Auto-initialize
        this.init();
    }

    init() {
        this.isActive = true;
        
        // Configure automatic capture immediately
        this.setupAutomaticCapture();
        
        console.log('🚀 SyntropyFront: Initialized with automatic capture');
    }

    /**
     * Configure SyntropyFront
     * @param {Object} config - Configuration
     * @param {number} config.maxEvents - Maximum number of events to store
     * @param {Object} config.fetch - Complete fetch configuration
     * @param {string} config.fetch.url - Endpoint URL
     * @param {Object} config.fetch.options - Fetch options (headers, method, etc.)
     * @param {Function} config.onError - User-defined error handler callback
     */
    configure(config = {}) {
        this.maxEvents = config.maxEvents || this.maxEvents;
        this.fetchConfig = config.fetch;
        this.onErrorCallback = config.onError;
        
        if (this.onErrorCallback) {
            console.log(`✅ SyntropyFront: Configured - maxEvents: ${this.maxEvents}, custom error handler`);
        } else if (this.fetchConfig) {
            console.log(`✅ SyntropyFront: Configured - maxEvents: ${this.maxEvents}, endpoint: ${this.fetchConfig.url}`);
        } else {
            console.log(`✅ SyntropyFront: Configured - maxEvents: ${this.maxEvents}, console only`);
        }
    }

    /**
     * Configure automatic event capture
     */
    setupAutomaticCapture() {
        if (typeof window === 'undefined') return;

        // Capture clicks
        this.setupClickCapture();
        
        // Capture errors
        this.setupErrorCapture();
        
        // Capture HTTP calls
        this.setupHttpCapture();
        
        // Capture console logs
        this.setupConsoleCapture();
    }

    /**
     * Capture user clicks
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
     * Automatically capture errors
     */
    setupErrorCapture() {
        // Save original handlers
        this.originalHandlers.onerror = window.onerror;
        this.originalHandlers.onunhandledrejection = window.onunhandledrejection;

        // Intercept errors
        window.onerror = (message, source, lineno, colno, error) => {
            const errorPayload = {
                type: 'uncaught_exception',
                error: { message, source, lineno, colno, stack: error?.stack },
                breadcrumbs: this.getBreadcrumbs(),
                timestamp: new Date().toISOString()
            };

            this.handleError(errorPayload);
            
            // Call original handler
            if (this.originalHandlers.onerror) {
                return this.originalHandlers.onerror(message, source, lineno, colno, error);
            }
            
            return false;
        };

        // Intercept rejected promises
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
            
            // Call original handler
            if (this.originalHandlers.onunhandledrejection) {
                this.originalHandlers.onunhandledrejection(event);
            }
        };
    }

    /**
     * Capture HTTP calls
     */
    setupHttpCapture() {
        // Intercept fetch
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const [url, options] = args;
            
            this.addBreadcrumb('http', 'fetch', {
                url,
                method: options?.method || 'GET'
            });

            return originalFetch(...args).then(response => {
                this.addBreadcrumb('http', 'fetch_response', {
                    url,
                    status: response.status
                });
                return response;
            }).catch(error => {
                this.addBreadcrumb('http', 'fetch_error', {
                    url,
                    error: error.message
                });
                throw error;
            });
        };
    }

    /**
     * Capture console logs
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
     * Handle errors - priority: onError callback > fetch > console
     */
    handleError(errorPayload) {
        // Default log
        this.logger.error('❌ Error:', errorPayload);
        
        // Priority 1: User-defined callback (maximum flexibility)
        if (this.onErrorCallback) {
            try {
                this.onErrorCallback(errorPayload);
            } catch (callbackError) {
                console.warn('SyntropyFront: Error in user callback:', callbackError);
            }
            return;
        }
        
        // Priority 2: Fetch to endpoint
        if (this.fetchConfig) {
            this.postToEndpoint(errorPayload);
            return;
        }
        
        // Priority 3: Console only (default)
        // Already logged above
    }

    /**
     * Post error object using fetch configuration
     */
    postToEndpoint(errorPayload) {
        const { url, options = {} } = this.fetchConfig;
        
        // Default configuration
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
            console.warn('SyntropyFront: Error posting to endpoint:', error);
        });
    }

    // Public API
    addBreadcrumb(category, message, data = {}) {
        if (!this.isActive) return;
        
        const breadcrumb = this.breadcrumbManager.add(category, message, data);
        
        // Keep only the last maxEvents
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

    // Utility methods
    getStats() {
        return {
            breadcrumbs: this.breadcrumbManager.getCount(),
            errors: this.errorManager.getCount(),
            isActive: this.isActive,
            maxEvents: this.maxEvents,
            hasFetchConfig: !!this.fetchConfig,
            hasErrorCallback: !!this.onErrorCallback,
            endpoint: this.fetchConfig?.url || 'console'
        };
    }
}

// Single instance - auto-initializes
const syntropyFront = new SyntropyFront();

// Export the instance
export default syntropyFront; 