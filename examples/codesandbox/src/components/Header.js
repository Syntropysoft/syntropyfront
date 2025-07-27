import React from 'react';

/**
 * Header - Shows the application header
 * Single responsibility: Render the header
 */
export const Header = ({ isReady, syntropyFront, errorInterceptor, isErrorInterceptorInitialized }) => {
  const libraryStatus = syntropyFront ? 'WITH LIBRARY' : 'WITHOUT LIBRARY';
  const libraryIcon = syntropyFront ? '✅' : '⚠️';
  const errorInterceptorStatus = errorInterceptor && isErrorInterceptorInitialized ? '✅' : '⚠️';

  return (
    <header className="App-header">
      <h1>🚀 React App - {libraryStatus}</h1>
      <p>Working with automatic error interceptors!</p>
      <div className="status">
        <span>{libraryIcon} {isReady ? 'App Ready' : 'Loading...'}</span>
        {syntropyFront && <span> | 🎯 Error interceptors active</span>}
        {errorInterceptor && <span> | {errorInterceptorStatus} ErrorInterceptor: {isErrorInterceptorInitialized ? 'Active' : 'Loading...'}</span>}
      </div>
    </header>
  );
}; 