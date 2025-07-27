import { useState, useEffect } from 'react';

/**
 * Hook para manejar breadcrumbs
 * Responsabilidad única: Gestionar breadcrumbs
 */
export const useBreadcrumbs = (syntropyFront, isReady) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Sincronizar breadcrumbs con la librería
  useEffect(() => {
    if (syntropyFront && isReady) {
      const interval = setInterval(() => {
        const libBreadcrumbs = syntropyFront.getBreadcrumbs();
        setBreadcrumbs(libBreadcrumbs);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [syntropyFront, isReady]);

  const addBreadcrumb = (category, message) => {
    if (syntropyFront && syntropyFront.addBreadcrumb) {
      syntropyFront.addBreadcrumb(category, message);
    } else {
      const breadcrumb = {
        category,
        message,
        timestamp: new Date().toISOString()
      };
      setBreadcrumbs(prev => [...prev, breadcrumb]);
    }
  };

  const clearBreadcrumbs = () => {
    if (syntropyFront && syntropyFront.clearBreadcrumbs) {
      syntropyFront.clearBreadcrumbs();
    }
    setBreadcrumbs([]);
  };

  return {
    breadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs
  };
}; 