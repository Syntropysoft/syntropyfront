import React from 'react';

const DataDumpsSection = ({ dataDumps }) => {
  return (
    <div className="demo-section">
      <h2>📋 Data Dumps ({dataDumps.length}) - Console Output</h2>
      <div className="data-dumps-info">
        <p>💡 <strong>Data dumps are logged to the browser console every 3 seconds.</strong></p>
        <p>📊 Each dump includes: breadcrumbs, user profile, session info, and metadata.</p>
        <p>🔍 <strong>Open browser console (F12) to see the actual data being sent!</strong></p>
      </div>
      <div className="data-dumps-list">
        {dataDumps.slice(-3).map((dump, index) => (
          <div key={index} className="data-dump">
            <div className="dump-header">
              <span className="batch-id">Batch: {dump.batchId}</span>
              <span className="dump-timestamp">{new Date(dump.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="dump-stats">
              <span>Breadcrumbs: {dump.payload.breadcrumbs.length}</span>
              <span>Payload Size: {JSON.stringify(dump.payload).length} bytes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataDumpsSection; 