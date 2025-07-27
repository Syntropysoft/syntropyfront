# SyntropyFront

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
import syntropyFront from 'syntropyfront';
// That's it! Auto-initializes and captures everything automatically
```

### With Custom Configuration

```javascript
import syntropyFront from 'syntropyfront';

// Optional: Configure endpoint and event limit
syntropyFront.configure({
  maxEvents: 50, // Keep last 50 events
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
```

## 📦 Installation

```bash
npm install syntropyfront
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

### Basic Configuration

```javascript
syntropyFront.configure({
  maxEvents: 50 // Number of events to keep in memory
});
```

### With Endpoint

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
import syntropyFront from 'syntropyfront';

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
import syntropyFront from 'syntropyfront';

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
import syntropyFront from 'syntropyfront';

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
import syntropyFront from 'syntropyfront';

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
import syntropyFront from 'syntropyfront';

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