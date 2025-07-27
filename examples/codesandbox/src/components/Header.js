import React from 'react';

/**
 * Header - Shows the application header
 * Single responsibility: Render the header
 */
export const Header = ({ isReady, syntropyFrontLoaded, interceptorsLoaded }) => {
  return (
    <header className="App-header">
      <h1>🚀 React App - SyntropyFront Integration</h1>
      <p>Testing integration with compiled libraries!</p>
      <div className="status">
        <span>✅ {isReady ? 'App Ready' : 'Loading...'}</span>
        {syntropyFrontLoaded && <span> | 🔧 SyntropyFront Loaded</span>}
        {!syntropyFrontLoaded && <span> | ⏳ Loading SyntropyFront...</span>}
        {interceptorsLoaded && <span> | 🎯 Interceptors Loaded</span>}
        {!interceptorsLoaded && <span> | ⏳ Loading Interceptors...</span>}
      </div>
    </header>
  );
}; 