import React from 'react';

const LogsSection = ({ logsSent }) => {
  return (
    <div className="demo-section">
      <h2>📤 Logs Sent to Endpoint ({logsSent.length})</h2>
      <div className="logs-sent-list">
        {logsSent.slice(-5).map((log, index) => (
          <div key={index} className="log-sent">
            <span className="category">{log.category}</span>
            <span className="message">{log.message}</span>
            <span className="sent-at">Sent: {log.sentAt}</span>
            <span className="endpoint">{log.endpoint}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsSection; 