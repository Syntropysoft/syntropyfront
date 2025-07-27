import { useEffect, useState } from 'react';
import { useAppReady } from './useAppReady';
import syntropyFront from '../syntropyfront.js';

/**
 * Hook to integrate with SyntropyFront
 * Single responsibility: Library integration
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