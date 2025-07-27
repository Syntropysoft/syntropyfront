/**
 * Hook for logging/debugging
 * Single responsibility: Show debug logs
 */
export const useDebugLogging = () => {
  const logUserAction = (message) => {
    console.log(`🖱️ ${message} - adding breadcrumb...`);
  };

  const logBreadcrumbAdded = () => {
    console.log('✅ Breadcrumb added to library');
  };

  const logLibraryUnavailable = () => {
    console.log('⚠️ Library not available, using local state');
  };

  const logClearing = () => {
    console.log('🧹 Clearing data...');
  };

  const logDataCleared = () => {
    console.log('✅ Data cleared in library');
  };

  const logSimulatingError = () => {
    console.log('💥 Simulating error - adding breadcrumb...');
  };

  const logExploding = () => {
    console.log('💥 EXPLODING NOW!');
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