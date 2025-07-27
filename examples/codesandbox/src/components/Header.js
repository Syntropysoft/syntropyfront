import React from 'react';

/**
 * Header - Muestra el header de la aplicación
 * Responsabilidad única: Renderizar el header
 */
export const Header = ({ isReady }) => {
  return (
    <header className="App-header">
      <h1>🚀 React App - SIN LIBRERÍA</h1>
      <p>¡Funcionando sin dependencias externas!</p>
      <div className="status">
        <span>✅ {isReady ? 'App Ready' : 'Loading...'}</span>
      </div>
    </header>
  );
}; 