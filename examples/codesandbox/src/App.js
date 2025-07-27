import React from 'react';
import './css/App.css';

// Import hooks
import { useAppReady, useBreadcrumbs, useErrorSimulation, useDebugLogging, useClickCounter, useSyntropyFront, useReactInterceptors } from './hooks';

// Import components
import { Header, Actions, Breadcrumbs, Errors } from './components';

/**
 * App - Orchestrates the components
 * Single responsibility: Coordinate components
 */
function App() {
  // Hook to detect when app is ready
  const { isReady } = useAppReady();

  // Hook to integrate with SyntropyFront
  const { syntropyFront, isLoaded } = useSyntropyFront();

  // Hook to load React interceptors
  const { interceptors, isLoaded: interceptorsLoaded } = useReactInterceptors();

  // Hook to handle breadcrumbs
  const { breadcrumbs, addBreadcrumb, clearBreadcrumbs } = useBreadcrumbs();

  // Hook to count clicks
  const { clickCount, incrementClick, resetClickCount } = useClickCounter();

  // Hook to handle error simulation
  const { simulateError } = useErrorSimulation(addBreadcrumb);

  // Hook for logging/debugging
  const { 
    logUserAction, 
    logBreadcrumbAdded, 
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
    
    // También agregar breadcrumb a SyntropyFront si está cargado
    if (syntropyFront && isLoaded) {
      syntropyFront.addBreadcrumb('user', 'Button clicked');
    }
    
    logBreadcrumbAdded();
  };

  const handleSimulateError = () => {
    logSimulatingError();
    simulateError();
    
    // También enviar error a SyntropyFront si está cargado
    if (syntropyFront && isLoaded) {
      syntropyFront.sendError(new Error('Simulated error from React app'));
    }
    
    logExploding();
  };

  const handleClearData = () => {
    logClearing();
    clearBreadcrumbs();
    resetClickCount();
    
    // También limpiar breadcrumbs en SyntropyFront si está cargado
    if (syntropyFront && isLoaded) {
      syntropyFront.clearBreadcrumbs();
    }
    
    logDataCleared();
  };

  return (
    <div className="App">
      <Header 
        isReady={isReady} 
        syntropyFrontLoaded={isLoaded} 
        interceptorsLoaded={interceptorsLoaded}
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