/**
 * Copyright 2024 Syntropysoft
 */

import { breadcrumbStore } from '../core/breadcrumbs/BreadcrumbStore.js';
import { wrap } from '../utils/FunctionWrapper.js';

/**
 * FetchInterceptor - Intercepts network calls using the wrapper (chaining) pattern.
 * Captures URL and method details to feed into the breadcrumb flow.
 */
export class FetchInterceptor {
    constructor() {
        this.wrapper = null;
    }

    /**
     * Initializes interception of the global fetch API.
     */
    init() {
        // Guard: browser and fetch available
        if (typeof window === 'undefined' || !window.fetch) return;

        this.wrapper = wrap(window, 'fetch', (original) => {
            return (...args) => {
                // Functional extraction of URL and method
                const url = (args[0] instanceof Request) ? args[0].url : (args[0] || 'unknown');
                const method = (args[0] instanceof Request) ? args[0].method : (args[1]?.method || 'GET');

                breadcrumbStore.add({
                    category: 'network',
                    message: `Request: ${method} ${url}`,
                    data: {
                        url,
                        method,
                        timestamp: Date.now()
                    }
                });

                // Continue with original execution
                return original.apply(window, args);
            };
        });
    }

    /**
     * Restores original fetch behaviour.
     */
    destroy() {
        // Guard: no wrapper
        if (!this.wrapper) return;

        this.wrapper.destroy();
        this.wrapper = null;
    }
}
