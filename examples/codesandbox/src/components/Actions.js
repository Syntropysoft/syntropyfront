import React from 'react';

/**
 * Actions - Handles user actions
 * Single responsibility: Render and handle action buttons
 */
export const Actions = ({ onUserAction, onSimulateError, onClearData, clickCount }) => {
  return (
    <section className="demo-section">
      <h2>Actions</h2>
      <div className="click-counter">
        <span>Clicks: {clickCount}</span>
      </div>
      <div className="action-buttons">
        <button onClick={onUserAction}>Click me</button>
        <button onClick={onSimulateError}>Simulate Error</button>
        <button onClick={onClearData}>Clear Data</button>
      </div>
    </section>
  );
}; 