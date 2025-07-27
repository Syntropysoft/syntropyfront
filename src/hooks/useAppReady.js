import { useState, useEffect } from 'react';

// Hook súper simple - solo detecta cuando React se montó
export function useAppReady() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    return isReady;
} 