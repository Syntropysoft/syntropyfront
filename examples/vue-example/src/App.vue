<template>
  <div class="app">
    <header class="app-header">
      <h1>🚀 SyntropyFront Vue Demo</h1>
      <p>Observability library with automatic capture</p>
      <div class="status">
        <span>✅ SyntropyFront loaded and working</span>
        <div v-if="stats" class="stats">
          <span>📊 Breadcrumbs: {{ stats.breadcrumbs }}</span>
          <span>🚨 Errors: {{ stats.errors }}</span>
          <span>📤 Mode: {{ configMode }}</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="config-selector">
        <h3>🔧 Error Handling Configuration:</h3>
        <div class="config-buttons">
          <button 
            @click="setConfigMode('console')" 
            :class="{ active: configMode === 'console' }"
          >
            Console Only
          </button>
          <button 
            @click="setConfigMode('fetch')" 
            :class="{ active: configMode === 'fetch' }"
          >
            Automatic Fetch
          </button>
          <button 
            @click="setConfigMode('callback')" 
            :class="{ active: configMode === 'callback' }"
          >
            Custom Handler
          </button>
        </div>
      </div>

      <div class="actions">
        <button @click="handleClick">Click me! ({{ clickCount }})</button>
        <button @click="handleFetch">Test HTTP Request</button>
        <button @click="handleManualBreadcrumb">Add Manual Breadcrumb</button>
        <button @click="handleManualError">Send Manual Error</button>
        <button @click="handleError" class="error-btn">Simulate Error</button>
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

        <h3>How to configure error handling?</h3>
        <pre><code>import syntropyFront from '@syntropysoft/syntropyfront';

// Option 1: Console only (default)
syntropyFront.configure({
  maxEvents: 20
});

// Option 2: Automatic fetch
syntropyFront.configure({
  maxEvents: 20,
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
  maxEvents: 20,
  onError: (errorPayload) => {
    console.log('Error:', errorPayload);
    // Do whatever you want with the error!
  }
});

// Ready! Auto-initializes</code></pre>

        <p><strong>You only need 1 line of basic code!</strong></p>
        <pre><code>import syntropyFront from '@syntropysoft/syntropyfront';
// Ready! Auto-initializes</code></pre>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import syntropyFront from '@syntropysoft/syntropyfront'

export default {
  name: 'App',
  setup() {
    const clickCount = ref(0)
    const stats = ref(null)
    const configMode = ref('console')

    const setConfigMode = (mode) => {
      configMode.value = mode
    }

    const handleClick = () => {
      clickCount.value++
      console.log('Click registered!')
    }

    const handleError = () => {
      throw new Error('Simulated error to test SyntropyFront')
    }

    const handleFetch = async () => {
      try {
        await fetch('https://jsonplaceholder.typicode.com/posts/1')
        console.log('Fetch successful!')
      } catch (error) {
        console.error('Fetch failed:', error)
      }
    }

    const handleManualBreadcrumb = () => {
      syntropyFront.addBreadcrumb('user', 'Manual breadcrumb added')
      console.log('Manual breadcrumb added!')
    }

    const handleManualError = () => {
      syntropyFront.sendError(new Error('Manual error sent'))
      console.log('Manual error sent!')
    }

    // Configure SyntropyFront when configMode changes
    watch(configMode, (newMode) => {
      let config = { maxEvents: 20 }

      if (newMode === 'fetch') {
        config.fetch = {
          url: 'https://jsonplaceholder.typicode.com/posts',
          options: {
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
          },
        }
      } else if (newMode === 'callback') {
        config.onError = (errorPayload) => {
          console.log('🎯 Custom error handler called:', errorPayload)
          
          fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: JSON.stringify(errorPayload),
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.log('Fetch failed:', err))
          
          localStorage.setItem('lastError', JSON.stringify(errorPayload))
          console.log('✅ Error handled by custom callback')
        }
      }

      syntropyFront.configure(config)
    }, { immediate: true })

    // Update stats every second
    onMounted(() => {
      const interval = setInterval(() => {
        stats.value = syntropyFront.getStats()
      }, 1000)

      return () => clearInterval(interval)
    })

    return {
      clickCount,
      stats,
      configMode,
      setConfigMode,
      handleClick,
      handleError,
      handleFetch,
      handleManualBreadcrumb,
      handleManualError
    }
  }
}
</script>

<style scoped>
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
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
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
  border-color: #42b883;
  background: #42b883;
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
  background: #42b883;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.actions button:hover {
  background: #42d392;
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
  color: #35495e;
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
  background: #35495e;
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