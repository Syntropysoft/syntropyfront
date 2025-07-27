/**
 * useErrorInterceptor - Hook to integrate ErrorInterceptor from @syntropyfront/interceptors
 * 
 * This hook demonstrates how to use the new ErrorInterceptor
 * with the React example application.
 * 
 * Usage:
 * import { useErrorInterceptor } from './useErrorInterceptor';
 * const { errorInterceptor, isInitialized } = useErrorInterceptor(syntropyFront);
 */

import { useEffect, useState } from 'react';

// Import the ErrorInterceptor from the installed package
import { ErrorInterceptor } from 'syntropyfront-interceptors';

/**
 * Hook to integrate ErrorInterceptor
 * @param {Object} syntropyFront - SyntropyFront instance
 * @returns {Object} ErrorInterceptor instance and status
 */
export const useErrorInterceptor = (syntropyFront) => {
    const [errorInterceptor, setErrorInterceptor] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!syntropyFront) return;

        // Create ErrorInterceptor instance
        const interceptor = new ErrorInterceptor();
        
        // Initialize with SyntropyFront
        interceptor.init(syntropyFront, {
            captureErrors: true,
            captureUnhandledRejections: true,
            logToConsole: true
        });

        setErrorInterceptor(interceptor);
        setIsInitialized(true);

        console.log('🚀 ErrorInterceptor integrated with React app');

        // Cleanup on unmount
        return () => {
            if (interceptor) {
                interceptor.destroy();
                console.log('🧹 ErrorInterceptor destroyed');
            }
        };
    }, [syntropyFront]);

    return {
        errorInterceptor,
        isInitialized
    };
}; 