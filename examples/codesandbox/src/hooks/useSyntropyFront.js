import { useEffect, useState } from 'react';

/**
 * Hook para integrar con SyntropyFront
 * Responsabilidad única: Integración con la librería
 */
export const useSyntropyFront = () => {
  const [syntropyFront, setSyntropyFront] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSyntropyFront = async () => {
      try {
        // Cargar la librería principal
        const sfModule = await import('syntropyfront');
        const sf = sfModule.default;
        
        // Verificar que los métodos estén disponibles
        if (typeof sf.addBreadcrumb === 'function' && 
            typeof sf.sendError === 'function' && 
            typeof sf.clearBreadcrumbs === 'function') {
          setSyntropyFront(sf);
          setIsLoaded(true);
          console.log('✅ SyntropyFront cargado correctamente con todos los métodos');
        } else {
          console.error('❌ SyntropyFront no tiene los métodos esperados');
        }
      } catch (error) {
        console.error('❌ Error cargando SyntropyFront:', error);
      }
    };

    loadSyntropyFront();
  }, []);

  return {
    syntropyFront,
    isLoaded
  };
}; 