import React from 'react';
import './App.css';

// Import hooks
import { useSyntropyFront, useBreadcrumbs, useErrorSimulation, useDebugLogging, useClickCounter } from './hooks';
import { useErrorInterceptor } from './useErrorInterceptor';

// Import components
import { Header, Actions, Breadcrumbs, Errors } from './components';

/**
 * App - Orchestrates the components
 * Single responsibility: Coordinate components
 */
function App() {
  // Hook to integrate with SyntropyFront
  const { isReady, syntropyFront } = useSyntropyFront();

  // Hook to integrate ErrorInterceptor
  const { errorInterceptor, isErrorInterceptorInitialized } = useErrorInterceptor(syntropyFront);

  // Hook to handle breadcrumbs
  const { breadcrumbs, addBreadcrumb, clearBreadcrumbs } = useBreadcrumbs(syntropyFront, isReady);

  // Hook to count clicks
  const { clickCount, incrementClick, resetClickCount } = useClickCounter();

  // Hook to handle error simulation
  const { simulateError } = useErrorSimulation(addBreadcrumb);

  // Hook for logging/debugging
  const { 
    logUserAction, 
    logBreadcrumbAdded, 
    logLibraryUnavailable,
    logClearing,
    logDataCleared,
    logSimulatingError,
    logExploding
  } = useDebugLogging();

  // Simple event handlers
  const handleUserAction = () => {
    incrementClick();
    logUserAction('Button clicked');
    addBreadcrumb('user', 'Button clicked');
    if (syntropyFront && syntropyFront.addBreadcrumb) {
      logBreadcrumbAdded();
    } else {
      logLibraryUnavailable();
    }
  };

  const handleSimulateError = () => {
    logSimulatingError();
    simulateError();
    logExploding();
  };

  const handleClearData = () => {
    logClearing();
    clearBreadcrumbs();
    resetClickCount();
    if (syntropyFront && syntropyFront.clearBreadcrumbs) {
      logDataCleared();
    }
  };

  return (
    <div className="App">
      <Header 
        isReady={isReady} 
        syntropyFront={syntropyFront} 
        errorInterceptor={errorInterceptor}
        isErrorInterceptorInitialized={isErrorInterceptorInitialized}
      />
      
      <main className="App-main">
        <Actions 
          onUserAction={handleUserAction}
          onSimulateError={handleSimulateError}
          onClearData={handleClearData}
          clickCount={clickCount}
        />
        
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <Errors errors={[]} />
      </main>
    </div>
  );
}

export default App; 