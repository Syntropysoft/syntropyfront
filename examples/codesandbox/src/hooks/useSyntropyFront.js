import { useEffect, useState } from 'react';
import { useAppReady } from './useAppReady';
import syntropyFront from '../syntropyfront.js';

/**
 * Hook para integrar con SyntropyFront
 * Responsabilidad única: Integración con la librería
 */
export const useSyntropyFront = () => {
  const isReady = useAppReady();
  const [syntropyFrontInstance, setSyntropyFrontInstance] = useState(null);

  useEffect(() => {
    if (isReady && syntropyFront && typeof syntropyFront.addBreadcrumb === 'function') {
      setSyntropyFrontInstance(syntropyFront);
      syntropyFront.addBreadcrumb('app', 'React app loaded - WITH LIBRARY!');
    }
  }, [isReady]);

  return {
    isReady,
    syntropyFront: syntropyFrontInstance
  };
}; 