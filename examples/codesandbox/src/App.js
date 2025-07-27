import React, { useState } from 'react';
import './App.css';

// Importar hooks
import { useSyntropyFront, useBreadcrumbs, useErrorSimulation, useDebugLogging } from './hooks';

// Importar componentes
import { Header, Actions, Breadcrumbs, Errors } from './components';

/**
 * App - Orquesta los componentes
 * Responsabilidad única: Coordinar los componentes
 */
function App() {
  const [errors, setErrors] = useState([]);

  // Hook para integrar con SyntropyFront
  const { isReady, syntropyFront } = useSyntropyFront();

  // Hook para manejar breadcrumbs
  const { breadcrumbs, addBreadcrumb, clearBreadcrumbs } = useBreadcrumbs(syntropyFront, isReady);

  // Hook para manejar error simulation
  const { simulateError } = useErrorSimulation(addBreadcrumb);

  // Hook para logging/debugging
  const { 
    logUserAction, 
    logBreadcrumbAdded, 
    logLibraryUnavailable,
    logClearing,
    logDataCleared,
    logSimulatingError,
    logExploding
  } = useDebugLogging();

  // Event handlers simples
  const handleUserAction = () => {
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
    if (syntropyFront && syntropyFront.clearBreadcrumbs) {
      logDataCleared();
    }
    setErrors([]);
  };

  return (
    <div className="App">
      <Header isReady={isReady} />
      
      <main className="App-main">
        <Actions 
          onUserAction={handleUserAction}
          onSimulateError={handleSimulateError}
          onClearData={handleClearData}
        />
        
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <Errors errors={errors} />
      </main>
    </div>
  );
}

export default App; 