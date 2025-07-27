import React from 'react';

const ActionsSection = ({ 
  onUserAction, 
  onSimulateError, 
  onSimulateNetworkError, 
  onGetStats, 
  onViewConsoleDumps, 
  onClearData 
}) => {
  return (
    <div className="demo-section">
      <h2>🎯 Actions</h2>
      <div className="action-buttons">
        <button onClick={() => onUserAction('Button clicked', { button: 'action' })}>
          Add Breadcrumb
        </button>
        <button onClick={onSimulateError}>
          Simulate Error
        </button>
        <button onClick={onSimulateNetworkError}>
          Simulate Network Error
        </button>
        <button onClick={onGetStats}>
          Get Stats
        </button>
        <button onClick={onViewConsoleDumps}>
          View Console Dumps
        </button>
        <button onClick={onClearData}>
          Clear Data
        </button>
      </div>
    </div>
  );
};

export default ActionsSection; 