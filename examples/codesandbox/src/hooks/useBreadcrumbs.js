import { useState, useEffect } from 'react';

/**
 * Hook to handle breadcrumbs
 * Single responsibility: Manage breadcrumbs
 */
export const useBreadcrumbs = (syntropyFront, isReady) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const maxBreadcrumbs = 10; // Limit to 10 breadcrumbs

  // Sync breadcrumbs with library
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
      // Update immediately for responsive UI
      const libBreadcrumbs = syntropyFront.getBreadcrumbs();
      setBreadcrumbs(libBreadcrumbs);
    } else {
      const breadcrumb = {
        category,
        message,
        timestamp: new Date().toISOString()
      };
      setBreadcrumbs(prev => {
        const newBreadcrumbs = [...prev, breadcrumb];
        // Keep only the last 10 breadcrumbs
        return newBreadcrumbs.slice(-maxBreadcrumbs);
      });
    }
  };

  const clearBreadcrumbs = () => {
    if (syntropyFront && syntropyFront.clearBreadcrumbs) {
      syntropyFront.clearBreadcrumbs();
      setBreadcrumbs([]);
    } else {
      setBreadcrumbs([]);
    }
  };

  return {
    breadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs
  };
}; 