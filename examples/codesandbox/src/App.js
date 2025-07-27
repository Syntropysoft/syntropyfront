import React, { useState, useEffect } from 'react';
import './css/App.css';

// Import SyntropyFront - Auto-initializes!
import syntropyFront from 'syntropyfront';

/**
 * App - Minimalist SyntropyFront Demo
 * Single responsibility: Demonstrate it works with 1 line of code
 */
function App() {
  const [clickCount, setClickCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [configMode, setConfigMode] = useState('console'); // 'console', 'jsonplaceholder', 'custom'

  // Configure SyntropyFront when app mounts
  useEffect(() => {
    let fetchConfig = null;

    if (configMode === 'jsonplaceholder') {
      // Use JSONPlaceholder which allows CORS
      fetchConfig = {
        url: 'https://jsonplaceholder.typicode.com/posts',
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        },
      };
    } else if (configMode === 'custom') {
      // Custom configuration (example)
      fetchConfig = {
        url: 'https://httpbin.org/post', // Allows CORS
        options: {
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'SyntropyFront',
          },
          mode: 'cors',
        },
      };
    }
    // If 'console', fetchConfig remains null

    // Configure SyntropyFront
    syntropyFront.configure({
      maxEvents: 20, // Keep only the last 20 events
      fetch: fetchConfig,
    });

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
              <span>🚨 Errors: {stats.errors}</span>
              <span>📤 Endpoint: {stats.endpoint}</span>
            </div>
          )}
        </div>
      </header>

      <main className='App-main'>
        <div className='config-selector'>
          <h3>🔧 Endpoint Configuration:</h3>
          <div className='config-buttons'>
            <button
              onClick={() => setConfigMode('console')}
              className={configMode === 'console' ? 'active' : ''}
            >
              Console Only
            </button>
            <button
              onClick={() => setConfigMode('jsonplaceholder')}
              className={configMode === 'jsonplaceholder' ? 'active' : ''}
            >
              JSONPlaceholder (CORS OK)
            </button>
            <button
              onClick={() => setConfigMode('custom')}
              className={configMode === 'custom' ? 'active' : ''}
            >
              HttpBin (CORS OK)
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
            <li>📤 Posts errors with complete fetch configuration</li>
          </ul>

          <h3>How to configure fetch?</h3>
          <pre>
            {`import syntropyFront from 'syntropyfront';

// Option 1: Console only (no configuration)
syntropyFront.configure({
  maxEvents: 50
});

// Option 2: With endpoint that allows CORS
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://jsonplaceholder.typicode.com/posts',
    options: {
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    }
  }
});

// Option 3: With your API (needs CORS configured)
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://your-api.com/errors',
    options: {
      headers: {
        'Authorization': 'Bearer your-token',
        'X-API-Key': 'your-api-key',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
    }
  }
});

// Ready! Auto-initializes`}
          </pre>

          <h3>⚠️ Note about CORS:</h3>
          <p>
            To work with your API, you need to configure CORS on your server to allow requests from your domain.
            The example endpoints (JSONPlaceholder, HttpBin) already have CORS configured.
          </p>

          <h3>What gets posted?</h3>
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
            <strong>If you give it an endpoint, it posts there, if not, it posts to console</strong>
          </p>
          <pre>
            {`import syntropyFront from 'syntropyfront';
// Ready! Auto-initializes`}
          </pre>
        </div>
      </main>
    </div>
  );
}

export default App;
