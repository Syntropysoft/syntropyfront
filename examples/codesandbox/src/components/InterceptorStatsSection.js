import React from 'react';

const InterceptorStatsSection = ({ interceptorStats }) => {
  if (!interceptorStats) return null;

  return (
    <div className="demo-section">
      <h2>🔧 Endpoint Interceptor Stats</h2>
      <div className="interceptor-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Requests:</span>
            <span className="stat-value">{interceptorStats.totalRequests}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Responses:</span>
            <span className="stat-value">{interceptorStats.totalResponses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Payload Size:</span>
            <span className="stat-value">{interceptorStats.averagePayloadSize.toFixed(0)} bytes</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Processing Time:</span>
            <span className="stat-value">{interceptorStats.averageProcessingTime.toFixed(0)}ms</span>
          </div>
        </div>
        
        {interceptorStats.lastRequest && (
          <div className="last-request-info">
            <h4>📤 Last Request</h4>
            <div className="request-details">
              <span>ID: {interceptorStats.lastRequest.id}</span>
              <span>Size: {interceptorStats.lastRequest.payloadSize} bytes</span>
              <span>Time: {new Date(interceptorStats.lastRequest.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
        
        {interceptorStats.lastResponse && (
          <div className="last-response-info">
            <h4>✅ Last Response</h4>
            <div className="response-details">
              <span>Status: {interceptorStats.lastResponse.status}</span>
              <span>Time: {interceptorStats.lastResponse.processingTime.toFixed(0)}ms</span>
              <span>Processed: {interceptorStats.lastResponse.data.breadcrumbsProcessed} breadcrumbs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterceptorStatsSection; 