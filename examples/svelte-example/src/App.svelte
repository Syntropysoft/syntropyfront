<script>
  import { onMount } from 'svelte'
  import syntropyFront from '@syntropysoft/syntropyfront'

  let clickCount = 0
  let stats = null
  let configMode = 'console'

  const setConfigMode = (mode) => {
    configMode = mode
  }

  const handleClick = () => {
    clickCount++
    console.log('Button clicked!')
  }

  const handleError = () => {
    throw new Error('Simulated error to test SyntropyFront')
  }

  const handleFetch = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const data = await response.json()
      console.log('Fetch response:', data)
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleManualBreadcrumb = () => {
    syntropyFront.addBreadcrumb('user', 'Manual breadcrumb added')
    console.log('Manual breadcrumb added')
  }

  const handleManualError = () => {
    syntropyFront.sendError(new Error('Manual error sent'))
    console.log('Manual error sent')
  }

  // Configure SyntropyFront when configMode changes
  $: {
    let config = { maxEvents: 20 }

    if (configMode === 'fetch') {
      config.fetch = {
        url: 'https://jsonplaceholder.typicode.com/posts',
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        },
      }
    } else if (configMode === 'callback') {
      config.onError = (errorPayload) => {
        console.log('🎯 Custom error handler called:', errorPayload)
        
        // Example: send to multiple places
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          body: JSON.stringify(errorPayload),
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.log('Fetch failed:', err))
        
        // Also save locally
        localStorage.setItem('lastError', JSON.stringify(errorPayload))
        
        console.log('✅ Error handled by custom callback')
      }
    }

    // Configure SyntropyFront
    syntropyFront.configure(config)
  }

  // Update stats every second
  onMount(() => {
    const interval = setInterval(() => {
      stats = syntropyFront.getStats()
    }, 1000)

    return () => clearInterval(interval)
  })
</script>

<main class="app">
  <header class="app-header">
    <h1>🚀 SyntropyFront Svelte Demo</h1>
    <p>Observability library with automatic capture</p>
    <div class="status">
      <span>✅ SyntropyFront loaded and working</span>
      {#if stats}
        <div class="stats">
          <span>📊 Breadcrumbs: {stats.breadcrumbs}</span>
          <span>🚨 Errors: {stats.errors}</span>
          <span>📤 Mode: {configMode}</span>
          {#if stats.hasErrorCallback}<span>🎯 Custom handler: ✅</span>{/if}
          {#if stats.hasFetchConfig}<span>🌐 Endpoint: {stats.endpoint}</span>{/if}
        </div>
      {/if}
    </div>
  </header>

  <div class="app-main">
    <div class="config-selector">
      <h3>🔧 Error Handling Configuration:</h3>
      <div class="config-buttons">
        <button 
          class:active={configMode === 'console'}
          on:click={() => setConfigMode('console')}
        >
          Console Only
        </button>
        <button 
          class:active={configMode === 'fetch'}
          on:click={() => setConfigMode('fetch')}
        >
          Automatic Fetch
        </button>
        <button 
          class:active={configMode === 'callback'}
          on:click={() => setConfigMode('callback')}
        >
          Custom Handler
        </button>
      </div>
    </div>

    <div class="actions">
      <button on:click={handleClick}>Click me! ({clickCount})</button>
      <button on:click={handleFetch}>Test HTTP Request</button>
      <button on:click={handleManualBreadcrumb}>Add Manual Breadcrumb</button>
      <button on:click={handleManualError}>Send Manual Error</button>
      <button class="error-btn" on:click={handleError}>Simulate Error</button>
    </div>

    <div class="info">
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
      {@html `<pre><code>import syntropyFront from '@syntropysoft/syntropyfront';

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

// Ready! Auto-initializes</code></pre>`}

      <h3>⚠️ Note about CORS:</h3>
      <p>
        To work with your API, you need to configure CORS on your server to allow requests from your domain.
        The example endpoints (JSONPlaceholder) already have CORS configured.
      </p>

      <h3>What gets captured?</h3>
      {@html `<pre><code>{
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
}</code></pre>`}

      <p><strong>You only need 1 line of basic code!</strong></p>
      <p><strong>Choose your error handling strategy: console, fetch, or custom handler</strong></p>
      {@html `<pre><code>import syntropyFront from '@syntropysoft/syntropyfront';
// Ready! Auto-initializes</code></pre>`}
    </div>
  </div>
</main>

<style>
  .app {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .app-header {
    text-align: center;
    margin-bottom: 40px;
    padding: 40px 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
    border-radius: 12px;
  }

  .app-header h1 {
    margin: 0 0 10px 0;
    font-size: 2.5rem;
  }

  .app-header p {
    margin: 0 0 20px 0;
    font-size: 1.2rem;
    opacity: 0.9;
  }

  .status {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
    justify-content: center;
  }

  .stats span {
    background: rgba(255, 255, 255, 0.2);
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 0.9rem;
  }

  .config-selector {
    margin-bottom: 30px;
    text-align: center;
  }

  .config-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 15px;
  }

  .config-buttons button {
    padding: 10px 20px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .config-buttons button.active {
    border-color: #ff6b6b;
    background: #ff6b6b;
    color: white;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 40px;
  }

  .actions button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    background: #ff6b6b;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s;
  }

  .actions button:hover {
    background: #ee5a24;
    transform: translateY(-2px);
  }

  .actions button.error-btn {
    background: #e74c3c;
  }

  .actions button.error-btn:hover {
    background: #c0392b;
  }

  .info {
    background: #f8f9fa;
    padding: 30px;
    border-radius: 12px;
    line-height: 1.6;
  }

  .info h3 {
    color: #333;
    margin-top: 30px;
    margin-bottom: 15px;
  }

  .info ul, .info ol {
    margin-bottom: 20px;
    padding-left: 20px;
  }

  .info li {
    margin-bottom: 8px;
  }

  .info pre {
    background: #2d3748;
    color: #e2e8f0;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 20px 0;
  }

  .info code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .app-header h1 {
      font-size: 2rem;
    }
    
    .actions {
      flex-direction: column;
    }
    
    .config-buttons {
      flex-direction: column;
    }
    
    .stats {
      flex-direction: column;
      align-items: center;
    }
  }
</style> 