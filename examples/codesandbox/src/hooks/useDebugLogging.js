/**
 * Hook for logging/debugging
 * Single responsibility: Show debug logs
 */
export const useDebugLogging = () => {
  const logUserAction = (message) => {
    console.log(`🖱️ ${message} - adding breadcrumb...`);
  };

  const logBreadcrumbAdded = () => {
    console.log('✅ Breadcrumb added');
  };

  const logClearing = () => {
    console.log('🧹 Clearing data...');
  };

  const logDataCleared = () => {
    console.log('✅ Data cleared');
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
    logClearing,
    logDataCleared,
    logSimulatingError,
    logExploding
  };
}; 