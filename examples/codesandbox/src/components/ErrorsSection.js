import React from 'react';

const ErrorsSection = ({ errors }) => {
  return (
    <div className="demo-section">
      <h2>❌ Errors ({errors.length})</h2>
      <div className="errors-list">
        {errors.map((error, index) => (
          <div key={index} className="error">
            <div className="error-message">{error.message}</div>
            <div className="error-context">{error.context}</div>
            <div className="error-timestamp">{error.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorsSection; 