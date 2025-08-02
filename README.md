<p align="center">
  <img src="./assets/syntropysoft-logo.png" alt="SyntropySoft Logo" width="170"/>
</p>

<h1 align="center">SyntropyFront</h1>

<p align="center">
  <strong>From Chaos to Clarity</strong>
  <br />
  The Observability Library for High-Performance Teams
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@syntropysoft/syntropyfront"><img src="https://img.shields.io/npm/v/@syntropysoft/syntropyfront.svg" alt="NPM Version"></a>
  <a href="https://github.com/Syntropysoft/SyntropyLog/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@syntropysoft/syntropyfront.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-ready%20for%20production-brightgreen.svg" alt="Ready for Production"></a>
  <a href="#"><img src="https://github.com/Syntropysoft/syntropyfront/workflows/CodeQL/badge.svg" alt="CodeQL"></a>
  <a href="#"><img src="https://img.shields.io/badge/dependabot-enabled-brightgreen.svg" alt="Dependabot"></a>
  <a href="#"><img src="https://img.shields.io/badge/mutation%20score-77.60%25-brightgreen.svg" alt="Mutation Score"></a>
  <a href="#"><img src="https://img.shields.io/badge/test%20coverage-80%2B%25-brightgreen.svg" alt="Test Coverage"></a>
</p>

---

🚀 **Observability library with automatic capture - Just 1 line of code!**

SyntropyFront automatically captures user interactions, errors, HTTP calls, and console logs, providing comprehensive observability for your web applications with minimal setup.

## ✨ Features

- 🎯 **Automatic click capture** - Tracks all user interactions
- 🚨 **Error detection** - Catches uncaught exceptions and promise rejections
- 🌐 **HTTP monitoring** - Intercepts fetch calls automatically
- 📝 **Console logging** - Records console.log, console.error, console.warn
- 💾 **Smart storage** - Keeps the last N events (configurable)
- 📤 **Flexible posting** - Posts errors to your endpoint or logs to console
- ⚡ **Zero configuration** - Works out of the box with just an import

## 🚀 Quick Start

### Basic Usage (1 line of code!)

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';
// That's it! Auto-initializes and captures everything automatically
```

### With Custom Configuration

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

// Option 1: Console only (default)
syntropyFront.configure({
  maxEvents: 50
});

// Option 2: With endpoint (automatic fetch)
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://your-api.com/errors',
    options: {
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    }
  }
});

// Option 3: With custom error handler (maximum flexibility)
syntropyFront.configure({
  maxEvents: 50,
  onError: (errorPayload) => {
    // You can do anything with the error:
    // - Send to your API
    // - Save to localStorage
    // - Send to a repository
    // - Upload to cloud
    // - Whatever you want!
    console.log('Error captured:', errorPayload);
    
    // Example: send to multiple places
    fetch('https://api1.com/errors', {
      method: 'POST',
      body: JSON.stringify(errorPayload)
    });
    
    // Also save locally
    localStorage.setItem('lastError', JSON.stringify(errorPayload));
  }
});
```

## 📦 Installation

```bash
npm install @syntropysoft/syntropyfront
```

## 🎯 How It Works

SyntropyFront automatically:

1. **Captures clicks** - Records element info, coordinates, and timestamps
2. **Detects errors** - Intercepts `window.onerror` and `window.onunhandledrejection`
3. **Monitors HTTP** - Wraps `window.fetch` to track requests and responses
4. **Logs console** - Intercepts console methods to capture debug info
5. **Maintains context** - Keeps the last N events as breadcrumbs
6. **Posts errors** - Sends error data with full context to your endpoint

## 📊 What Gets Captured

### Error Payload Structure

```json
{
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
      "data": {
        "element": "BUTTON",
        "id": "submit-btn",
        "className": "btn-primary",
        "x": 100,
        "y": 200
      },
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Breadcrumb Categories

- **`user`** - Click events, form submissions, etc.
- **`http`** - Fetch requests, responses, and errors
- **`console`** - Console.log, console.error, console.warn
- **`error`** - Manual error reports

## ⚙️ Configuration Options

SyntropyFront uses a priority system for error handling:

1. **Custom Error Handler** (`onError`) - Maximum flexibility
2. **Endpoint** (`fetch`) - Automatic posting
3. **Console** - Default fallback

### Basic Configuration (Console Only)

```javascript
syntropyFront.configure({
  maxEvents: 50 // Number of events to keep in memory
});
```

### With Endpoint (Automatic Fetch)

```javascript
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://your-api.com/errors',
    options: {
      headers: {
        'Authorization': 'Bearer your-token',
        'X-API-Key': 'your-api-key',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'include'
    }
  }
});
```

### With Custom Error Handler (Maximum Flexibility)

```javascript
syntropyFront.configure({
  maxEvents: 50,
  onError: (errorPayload) => {
    // You have complete control over what to do with the error
    
    // Send to your API
    fetch('https://your-api.com/errors', {
      method: 'POST',
      body: JSON.stringify(errorPayload)
    });
    
    // Save to localStorage
    localStorage.setItem('lastError', JSON.stringify(errorPayload));
    
    // Send to multiple services
    Promise.all([
      fetch('https://service1.com/errors', { method: 'POST', body: JSON.stringify(errorPayload) }),
      fetch('https://service2.com/errors', { method: 'POST', body: JSON.stringify(errorPayload) })
    ]);
    
    // Upload to cloud storage
    // Send to repository
    // Log to file
    // Whatever you want!
  }
});
```

## 🔧 API Reference

### Core Methods

```javascript
// Add custom breadcrumb
syntropyFront.addBreadcrumb('user', 'Custom action', { data: 'value' });

// Send manual error
syntropyFront.sendError(new Error('Custom error'));

// Get current breadcrumbs
const breadcrumbs = syntropyFront.getBreadcrumbs();

// Clear breadcrumbs
syntropyFront.clearBreadcrumbs();

// Get statistics
const stats = syntropyFront.getStats();
// Returns: { breadcrumbs: 5, errors: 2, isActive: true, maxEvents: 50, endpoint: 'console' }
```

## 🎯 Extending SyntropyFront

SyntropyFront captures the essentials by default, but you can extend it to capture any DOM events you want:

### Adding Custom Event Capture

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

// Add scroll tracking
window.addEventListener('scroll', () => {
  syntropyFront.addBreadcrumb('user', 'scroll', {
    scrollY: window.scrollY,
    scrollX: window.scrollX
  });
});

// Add form submissions
document.addEventListener('submit', (event) => {
  syntropyFront.addBreadcrumb('user', 'form_submit', {
    formId: event.target.id,
    formAction: event.target.action
  });
});

// Add window resize
window.addEventListener('resize', () => {
  syntropyFront.addBreadcrumb('system', 'window_resize', {
    width: window.innerWidth,
    height: window.innerHeight
  });
});

// Add custom business events
function trackPurchase(productId, amount) {
  syntropyFront.addBreadcrumb('business', 'purchase', {
    productId,
    amount,
    timestamp: new Date().toISOString()
  });
}
```

### Common Events You Can Track

- **User interactions**: `click`, `scroll`, `keydown`, `focus`, `blur`
- **Form events**: `submit`, `input`, `change`, `reset`
- **System events**: `resize`, `online`, `offline`, `visibilitychange`
- **Custom events**: Any business logic or user actions
- **Performance**: `load`, `DOMContentLoaded`, timing events

## 🌐 CORS Configuration

To use with your API, ensure your server allows CORS:

```javascript
// Express.js example
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Or in headers
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
res.setHeader('Access-Control-Allow-Methods', 'POST');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

## 📱 Framework Support

SyntropyFront works with any JavaScript framework:

- ✅ **React** - Works out of the box
- ✅ **Vue** - Works out of the box  
- ✅ **Angular** - Works out of the box
- ✅ **Svelte** - Works out of the box
- ✅ **Vanilla JS** - Works out of the box

## 🎯 Examples

### React Example

```jsx
import React from 'react';
import syntropyFront from '@syntropysoft/syntropyfront';

function App() {
  // SyntropyFront auto-initializes on import
  return (
    <div>
      <button onClick={() => console.log('Button clicked')}>
        Click me!
      </button>
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <button @click="handleClick">Click me!</button>
</template>

<script>
import syntropyFront from '@syntropysoft/syntropyfront';

export default {
  methods: {
    handleClick() {
      console.log('Button clicked');
    }
  }
}
</script>
```

### Manual Error Reporting

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

try {
  // Your code here
} catch (error) {
  // SyntropyFront will automatically capture this
  throw error;
}

// Or manually report
syntropyFront.sendError(new Error('Something went wrong'));
```

### Extending with Custom Events

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

// Add your custom event listeners
window.addEventListener('scroll', () => {
  syntropyFront.addBreadcrumb('user', 'scroll', {
    scrollY: window.scrollY,
    scrollX: window.scrollX
  });
});

// Track business events
function userCompletedCheckout(orderId, total) {
  syntropyFront.addBreadcrumb('business', 'checkout_completed', {
    orderId,
    total,
    timestamp: new Date().toISOString()
  });
}

// Track performance
window.addEventListener('load', () => {
  syntropyFront.addBreadcrumb('performance', 'page_loaded', {
    loadTime: performance.now()
  });
});
```

## 🏗️ Architecture & Code Quality

SyntropyFront follows SOLID principles and maintains high code quality through:

### Modular Architecture

The codebase is organized into focused modules with single responsibilities:

```
src/core/
├── agent/           # Core Agent components
│   ├── Agent.js              # Main coordinator
│   ├── ConfigurationManager.js # Configuration handling
│   ├── QueueManager.js        # Batching and queuing
│   └── HttpTransport.js       # HTTP communication
├── database/        # IndexedDB management
│   ├── DatabaseManager.js     # Database coordinator
│   ├── DatabaseConfigManager.js # Configuration
│   ├── DatabaseConnectionManager.js # Connection handling
│   ├── DatabaseTransactionManager.js # Transaction management
│   ├── StorageManager.js      # CRUD operations
│   └── SerializationManager.js # Data serialization
├── retry/           # Retry system
│   ├── RetryManager.js        # Retry coordination
│   └── RetryLogicManager.js   # Retry logic
├── persistent/      # Persistent buffer
│   └── PersistentBufferManager.js # Buffer management
├── breadcrumbs/     # Event tracking
│   ├── BreadcrumbManager.js   # Breadcrumb coordination
│   └── BreadcrumbStore.js     # Breadcrumb storage
├── context/         # Context collection
│   └── ContextCollector.js    # Context gathering
└── utils/           # Utilities
    ├── Logger.js              # Logging utilities
    └── ErrorManager.js        # Error handling
```

### Design Principles

- **Single Responsibility Principle (SRP)**: Each class has one clear purpose
- **Dependency Injection**: Components receive dependencies through constructors
- **Declarative Error Handling**: Structured error responses with fallbacks
- **Comprehensive Testing**: 484 tests with 77.60% mutation score
- **Optimized Performance**: Timeouts optimized for faster execution

## 🧪 Testing & Quality

SyntropyFront maintains high code quality through comprehensive testing:

### Test Coverage & Mutation Testing

- **Mutation Score**: 77.60% - Our tests effectively detect code changes
- **Test Coverage**: 92.22% - Comprehensive unit test coverage
- **Key Components Performance**:
  - `Agent.js`: 87.23% mutation score
  - `ConfigurationManager.js`: 100% mutation score
  - `QueueManager.js`: 97.37% mutation score
  - `HttpTransport.js`: 86.96% mutation score
  - `BreadcrumbManager.js`: 100% mutation score
  - `BreadcrumbStore.js`: 95.00% mutation score
  - `SerializationManager.js`: 100% mutation score
  - `DatabaseTransactionManager.js`: 100% mutation score

### Testing Stack

- **Jest**: Unit testing framework
- **Stryker**: Mutation testing for test quality validation
- **IndexedDB Mocking**: Browser storage testing
- **Fetch Mocking**: HTTP request testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run mutation testing
npm run test:mutation
```

## 🔍 Debugging

SyntropyFront logs helpful information to the console:

```
🚀 SyntropyFront: Initialized with automatic capture
✅ SyntropyFront: Configured - maxEvents: 50, endpoint: https://your-api.com/errors
❌ Error: { type: "uncaught_exception", error: {...}, breadcrumbs: [...] }
```

## 📄 License

Apache 2.0

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for better web observability** 
