/**
 * Hook para logging/debugging
 * Responsabilidad única: Mostrar logs de debug
 */
export const useDebugLogging = () => {
  const logUserAction = (message) => {
    console.log(`🖱️ ${message} - agregando breadcrumb...`);
  };

  const logBreadcrumbAdded = () => {
    console.log('✅ Breadcrumb agregado a la librería');
  };

  const logLibraryUnavailable = () => {
    console.log('⚠️ Librería no disponible, usando estado local');
  };

  const logClearing = () => {
    console.log('🧹 Limpiando datos...');
  };

  const logDataCleared = () => {
    console.log('✅ Datos limpiados en la librería');
  };

  const logSimulatingError = () => {
    console.log('💥 Simulando error - agregando breadcrumb...');
  };

  const logExploding = () => {
    console.log('💥 ¡REVENTANDO AHORA!');
  };

  return {
    logUserAction,
    logBreadcrumbAdded,
    logLibraryUnavailable,
    logClearing,
    logDataCleared,
    logSimulatingError,
    logExploding
  };
}; 