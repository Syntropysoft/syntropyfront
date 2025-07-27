import React, { useState, useEffect } from 'react';
import './App.css';

// Hook simple para detectar cuando la app está lista
import { useAppReady } from './hooks';

// Importar componentes
import { Header, Actions, Breadcrumbs, Errors } from './components';

/**
 * App - Orquesta los componentes
 * Responsabilidad única: Coordinar el estado y los componentes
 */
function App() {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [errors, setErrors] = useState([]);

  // Hook simple para detectar cuando la app está lista
  const isReady = useAppReady();

  // Simular breadcrumbs cuando la app esté lista
  useEffect(() => {
    if (isReady) {
      const initialBreadcrumb = {
        category: 'app',
        message: 'React app loaded - SIN LIBRERÍA!',
        timestamp: new Date().toISOString()
      };
      
      setBreadcrumbs([initialBreadcrumb]);
      console.log('📝 Breadcrumb:', initialBreadcrumb);
    }
  }, [isReady]);

  // Event handlers
  const handleUserAction = () => {
    const breadcrumb = {
      category: 'user',
      message: 'Button clicked',
      timestamp: new Date().toISOString()
    };
    
    setBreadcrumbs(prev => [...prev, breadcrumb]);
    console.log('📝 Breadcrumb:', breadcrumb);
  };

  const handleSimulateError = () => {
    // ¡REVENTAR DE VERDAD EN RUNTIME!
    console.log('💥 Simulando error que va a reventar...');
    
    // Agregar breadcrumb antes del error
    const errorBreadcrumb = {
      category: 'error',
      message: 'About to simulate error',
      timestamp: new Date().toISOString()
    };
    setBreadcrumbs(prev => [...prev, errorBreadcrumb]);
    
    // ¡REVENTAR REALMENTE EN RUNTIME!
    setTimeout(() => {
      // Esto va a reventar de verdad en runtime
      const obj = null;
      console.log(obj.nonExistentProperty); // TypeError: Cannot read property 'nonExistentProperty' of null
    }, 100);
  };

  const handleClearData = () => {
    setBreadcrumbs([]);
    setErrors([]);
    console.log('🧹 Data cleared');
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