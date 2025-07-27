import React from 'react';

/**
 * Breadcrumbs - Muestra la lista de breadcrumbs
 * Responsabilidad única: Renderizar breadcrumbs
 */
export const Breadcrumbs = ({ breadcrumbs }) => {
  return (
    <section className="demo-section">
      <h2>Breadcrumbs ({breadcrumbs.length})</h2>
      <div className="breadcrumbs-list">
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="breadcrumb">
            <span className="category">{crumb.category}</span>
            <span className="message">{crumb.message}</span>
            <span className="timestamp">
              {new Date(crumb.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}; 