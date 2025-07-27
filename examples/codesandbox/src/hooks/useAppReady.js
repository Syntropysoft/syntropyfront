import { useState, useEffect } from 'react';

/**
 * Super simple hook - only detects when React is mounted
 * No cycles, no complex state
 */
export const useAppReady = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Only once, when the component mounts
        setIsReady(true);
    }, []); // Empty array = only once

    return isReady;
}; 