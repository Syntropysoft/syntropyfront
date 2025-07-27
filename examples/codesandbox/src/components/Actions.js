import React from 'react';

/**
 * Actions - Maneja las acciones del usuario
 * Responsabilidad única: Renderizar y manejar botones de acción
 */
export const Actions = ({ onUserAction, onSimulateError, onClearData }) => {
  return (
    <section className="demo-section">
      <h2>Actions</h2>
      <div className="action-buttons">
        <button onClick={onUserAction}>Click me</button>
        <button onClick={onSimulateError}>Simulate Error</button>
        <button onClick={onClearData}>Clear Data</button>
      </div>
    </section>
  );
}; 