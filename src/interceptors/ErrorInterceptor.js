import { breadcrumbStore } from '../core/breadcrumbs/BreadcrumbStore.js';
import { agent } from '../core/agent/Agent.js';
import { contextCollector } from '../core/context/ContextCollector.js';
import { wrap, safeApply } from '../utils/FunctionWrapper.js';
import { Environment } from '../utils/Environment.js';

/**
 * Functional fragments: pure error payload generators.
 */
export const ERROR_UTILS = {
    createExceptionPayload: (message, source, lineno, colno, error) => ({
        type: 'uncaught_exception',
        error: { message, source, lineno, colno, stack: error?.stack },
        breadcrumbs: breadcrumbStore.getAll(),
        timestamp: new Date().toISOString()
    }),

    createRejectionPayload: (event) => ({
        type: 'unhandled_rejection',
        error: {
            message: event.reason?.message || 'Promise rejection without message',
            stack: event.reason?.stack,
        },
        breadcrumbs: breadcrumbStore.getAll(),
        timestamp: new Date().toISOString()
    })
};

/**
 * ErrorInterceptor - Error capture coordinated by functional fragments.
 * Refactored to remove heavy imperative logic and use FunctionWrapper consistently.
 */
export class ErrorInterceptor {
    constructor() {
        this.errorWrapper = null;
        this.rejectionWrapper = null;
        this.config = { captureErrors: true, captureUnhandledRejections: true };
        this.contextTypes = [];
        this.onErrorCallback = null;
    }

    /**
     * Dynamic configuration of the interceptor.
     */
    configure(config, contextTypes, onErrorCallback) {
        this.config = { ...this.config, ...config };
        this.contextTypes = contextTypes || [];
        this.onErrorCallback = onErrorCallback;
    }

    /**
     * Selective initialization.
     */
    init() {
        // Guard: browser environment
        if (!Environment.isBrowser()) return;

        this.setupExceptionCapture();
        this.setupRejectionCapture();
    }

    /**
     * Sets up the wrapper for window.onerror (exceptions).
     */
    setupExceptionCapture() {
        // Guard: capture disabled
        if (!this.config.captureErrors) return;

        this.errorWrapper = wrap(window, 'onerror', (original) => {
            return (message, source, lineno, colno, error) => {
                const payload = ERROR_UTILS.createExceptionPayload(message, source, lineno, colno, error);
                this.handleError(payload);
                return safeApply(original, window, [message, source, lineno, colno, error], 'original window.onerror');
            };
        });
    }

    /**
     * Sets up the wrapper for promise rejections.
     */
    setupRejectionCapture() {
        // Guard: capture disabled
        if (!this.config.captureUnhandledRejections) return;

        this.rejectionWrapper = wrap(window, 'onunhandledrejection', (original) => {
            return (event) => {
                const payload = ERROR_UTILS.createRejectionPayload(event);
                this.handleError(payload);
                safeApply(original, window, [event], 'original window.onunhandledrejection');
            };
        });
    }

    /**
     * Functional delegation for error handling and send.
     */
    handleError(payload) {
        const context = this.contextTypes.length > 0 ? contextCollector.collect(this.contextTypes) : null;
        agent.sendError(payload, context);
        if (this.onErrorCallback) this.onErrorCallback(payload);
    }

    /**
     * Cleans up wrappers to avoid memory leaks.
     */
    destroy() {
        this.errorWrapper?.destroy();
        this.rejectionWrapper?.destroy();
        this.errorWrapper = null;
        this.rejectionWrapper = null;
    }
}
