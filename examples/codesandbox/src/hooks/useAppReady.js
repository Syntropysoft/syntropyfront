import { useState, useEffect } from 'react';

/**
 * Hook súper simple - solo detecta cuando React se montó
 * Sin ciclos, sin estado complejo
 */
export const useAppReady = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Solo una vez, cuando el componente se monta
        setIsReady(true);
    }, []); // Array vacío = solo una vez

    return isReady;
}; 