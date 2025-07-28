<p align="center">
  <img src="./assets/syntropysoft-logo.png" alt="SyntropySoft Logo" width="170"/>
</p>

<h1 align="center">SyntropyFront</h1>

<p align="center">
  <strong>From Chaos to Clarity</strong>
  <br />
  The Observability Framework for High-Performance Teams
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@syntropysoft/syntropyfront"><img src="https://img.shields.io/npm/v/@syntropysoft/syntropyfront.svg" alt="NPM Version"></a>
  <a href="https://github.com/Syntropysoft/SyntropyLog/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@syntropysoft/syntropyfront.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-ready%20for%20production-brightgreen.svg" alt="Ready for Production"></a>
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

## 🌐 Framework Support

SyntropyFront works with any JavaScript framework:

- ✅ **React** - Works out of the box
- ✅ **Vue** - Works out of the box  
- ✅ **Angular** - Works out of the box
- ✅ **Svelte** - Works out of the box
- ✅ **Vanilla JS** - Works out of the box

## 📄 License

Apache 2.0

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for better web observability** 