import React, { useState, useEffect } from 'react';
import './css/App.css';

// Import SyntropyFront - Auto-initializes!
import syntropyFront from '@syntropysoft/syntropyfront';

/**
 * App - Minimalist SyntropyFront Demo
 * Single responsibility: Demonstrate it works with 1 line of code
 */
function App() {
  const [clickCount, setClickCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [configMode, setConfigMode] = useState('console'); // 'console', 'fetch', 'callback'

  // Configure SyntropyFront when app mounts
  useEffect(() => {
    let config = { maxEvents: 20 };

    if (configMode === 'fetch') {
      // Use fetch configuration
      config.fetch = {
        url: 'https://jsonplaceholder.typicode.com/posts',
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        },
      };
    } else if (configMode === 'callback') {
      // Use custom error handler
      config.onError = (errorPayload) => {
        console.log('🎯 Custom error handler called:', errorPayload);
        
        // Example: send to multiple places
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: JSON.stringify(errorPayload),
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.log('Fetch failed:', err));
        
        // Also save locally
        localStorage.setItem('lastError', JSON.stringify(errorPayload));
        
        // You can do anything here!
        console.log('✅ Error handled by custom callback');
      };
    }
    // If 'console', no additional config needed

    // Configure SyntropyFront
    syntropyFront.configure(config);

    // Update stats every second
    const interval = setInterval(() => {
      setStats(syntropyFront.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [configMode]);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    console.log('Click registered!');
  };

  const handleError = () => {
    throw new Error('Simulated error to test SyntropyFront');
  };

  const handleFetch = async () => {
    try {
      await fetch('https://jsonplaceholder.typicode.com/posts/1');
      console.log('Fetch successful!');
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  };

  const handleManualBreadcrumb = () => {
    syntropyFront.addBreadcrumb('user', 'Manual breadcrumb added');
    console.log('Manual breadcrumb added!');
  };

  const handleManualError = () => {
    syntropyFront.sendError(new Error('Manual error sent'));
    console.log('Manual error sent!');
  };

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>🚀 SyntropyFront Demo</h1>
        <p>Observability library with automatic capture</p>
        <div className='status'>
          <span>✅ SyntropyFront loaded and working</span>
          {stats && (
            <div className='stats'>
              <span>📊 Breadcrumbs: {stats.breadcrumbs}</span>
              <span>📤 Queue: {stats.agent?.queueLength ?? 0}</span>
              <span>📤 Mode: {configMode}</span>
              {stats.config?.onError && <span>🎯 Custom handler: ✅</span>}
              {stats.config?.endpoint && <span>🌐 Endpoint: {stats.config.endpoint}</span>}
            </div>
          )}
        </div>
      </header>

      <main className='App-main'>
        <div className='config-selector'>
          <h3>🔧 Error Handling Configuration:</h3>
          <div className='config-buttons'>
            <button
              onClick={() => setConfigMode('console')}
              className={configMode === 'console' ? 'active' : ''}
            >
              Console Only
            </button>
            <button
              onClick={() => setConfigMode('fetch')}
              className={configMode === 'fetch' ? 'active' : ''}
            >
              Automatic Fetch
            </button>
            <button
              onClick={() => setConfigMode('callback')}
              className={configMode === 'callback' ? 'active' : ''}
            >
              Custom Handler
            </button>
          </div>
        </div>

        <div className='actions'>
          <button onClick={handleClick}>Click me! ({clickCount})</button>

          <button onClick={handleFetch}>Test HTTP Request</button>

          <button onClick={handleManualBreadcrumb}>Add Manual Breadcrumb</button>

          <button onClick={handleManualError}>Send Manual Error</button>

          <button onClick={handleError} style={{ backgroundColor: '#ff4444' }}>
            Simulate Error
          </button>
        </div>

        <div className='info'>
          <h3>What does SyntropyFront do automatically?</h3>
          <ul>
            <li>🎯 Captures all clicks</li>
            <li>🚨 Detects errors automatically</li>
            <li>🌐 Intercepts HTTP calls</li>
            <li>📝 Records console logs</li>
            <li>💾 Keeps the last N events (configurable)</li>
            <li>📤 Handles errors with priority system</li>
          </ul>

          <h3>Error Handling Priority:</h3>
          <ol>
            <li><strong>Custom Handler</strong> - You decide what to do with errors</li>
            <li><strong>Automatic Fetch</strong> - Posts to your endpoint</li>
            <li><strong>Console Only</strong> - Default fallback</li>
          </ol>

          <h3>How to configure error handling?</h3>
          <pre>
            {`import syntropyFront from '@syntropysoft/syntropyfront';

// Option 1: Console only (default)
syntropyFront.configure({
  maxEvents: 50
});

// Option 2: Automatic fetch
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://your-api.com/errors',
    options: {
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors'
    }
  }
});

// Option 3: Custom handler (maximum flexibility)
syntropyFront.configure({
  maxEvents: 50,
  onError: (errorPayload) => {
    // You can do anything:
    // - Send to your API
    // - Save to localStorage
    // - Send to multiple services
    // - Upload to cloud
    // - Whatever you want!
    console.log('Error:', errorPayload);
    
    // Example: send to multiple places
    fetch('https://api1.com/errors', {
      method: 'POST',
      body: JSON.stringify(errorPayload)
    });
    
    localStorage.setItem('lastError', JSON.stringify(errorPayload));
  }
});

// Ready! Auto-initializes`}
          </pre>

          <h3>⚠️ Note about CORS:</h3>
          <p>
            To work with your API, you need to configure CORS on your server to allow requests from your domain.
            The example endpoints (JSONPlaceholder) already have CORS configured.
          </p>

          <h3>What gets captured?</h3>
          <pre>
            {`{
  "type": "uncaught_exception",
  "error": {
    "message": "Error message",
    "source": "file.js",
    "lineno": 42,
    "colno": 15,
    "stack": "Error stack trace..."
  },
  "breadcrumbs": [
    {
      "category": "user",
      "message": "click",
      "data": { "element": "BUTTON", "x": 100, "y": 200 },
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
    // ... last N events
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}`}
          </pre>

          <p>
            <strong>You only need 1 line of basic code!</strong>
          </p>
          <p>
            <strong>Choose your error handling strategy: console, fetch, or custom handler</strong>
          </p>
          <pre>
            {`import syntropyFront from '@syntropysoft/syntropyfront';
// Ready! Auto-initializes`}
          </pre>
        </div>
      </main>
    </div>
  );
}

export default App;
