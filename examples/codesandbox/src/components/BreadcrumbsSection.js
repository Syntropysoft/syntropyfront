import React from 'react';

const BreadcrumbsSection = ({ breadcrumbs }) => {
  return (
    <div className="demo-section">
      <h2>🍞 Breadcrumbs ({breadcrumbs.length}) - Real-time</h2>
      <div className="breadcrumbs-list">
        {breadcrumbs.slice(-5).map((crumb, index) => (
          <div key={index} className="breadcrumb">
            <span className="category">{crumb.category}</span>
            <span className="message">{crumb.message}</span>
            <span className="timestamp">{new Date(crumb.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BreadcrumbsSection; 