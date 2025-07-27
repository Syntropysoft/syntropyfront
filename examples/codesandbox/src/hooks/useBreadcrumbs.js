import { useState } from 'react';

/**
 * Hook to handle breadcrumbs
 * Single responsibility: Manage breadcrumbs locally
 */
export const useBreadcrumbs = () => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const maxBreadcrumbs = 10; // Limit to 10 breadcrumbs

  const addBreadcrumb = (category, message) => {
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
  };

  const clearBreadcrumbs = () => {
    setBreadcrumbs([]);
  };

  return {
    breadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs
  };
}; 