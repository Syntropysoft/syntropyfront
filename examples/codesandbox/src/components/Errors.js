import React from 'react';

/**
 * Errors - Muestra la lista de errores
 * Responsabilidad única: Renderizar errores
 */
export const Errors = ({ errors }) => {
  return (
    <section className="demo-section">
      <h2>Errors ({errors.length})</h2>
      <div className="errors-list">
        {errors.map((error, i) => (
          <div key={i} className="error">
            <div className="error-message">{error.message}</div>
            <div className="error-timestamp">
              {new Date(error.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}; 