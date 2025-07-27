import { useEffect, useState } from 'react';

/**
 * Hook para cargar interceptores de React
 * Responsabilidad única: Cargar interceptores de forma segura
 */
export const useReactInterceptors = () => {
  const [interceptors, setInterceptors] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadInterceptors = async () => {
      try {
        // Cargar interceptores de React
        const interceptorsModule = await import('syntropyfront-interceptors/react');
        
        setInterceptors(interceptorsModule);
        setIsLoaded(true);
        
        console.log('✅ Interceptores de React cargados:', Object.keys(interceptorsModule));
      } catch (error) {
        console.warn('⚠️ Error cargando interceptores de React:', error);
      }
    };

    loadInterceptors();
  }, []);

  return {
    interceptors,
    isLoaded
  };
}; 