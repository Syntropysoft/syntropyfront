<p align="center">
  <img src="./assets/syntropysoft-logo.png" alt="SyntropySoft Logo" width="170"/>
</p>

<h1 align="center">SyntropyFront</h1>

<p align="center">
  <strong>From Uncertainty to Clarity</strong>
  <br />
  The Observability Library for High-Performance Teams
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@syntropysoft/syntropyfront"><img src="https://img.shields.io/npm/v/@syntropysoft/syntropyfront.svg" alt="NPM Version"></a>
  <a href="https://github.com/Syntropysoft/syntropyfront/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@syntropysoft/syntropyfront.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-ready%20for%20production-brightgreen.svg" alt="Ready for Production"></a>
  <a href="#"><img src="https://img.shields.io/badge/test%20coverage-87%25-brightgreen.svg" alt="Test Coverage"></a>
  <a href="#"><img src="https://img.shields.io/badge/bundle%20size-34%20KB-brightgreen.svg" alt="Bundle Size"></a>
  <a href="https://socket.dev/npm/package/@syntropysoft/syntropyfront"><img src="https://socket.dev/api/badge/npm/package/@syntropysoft/syntropyfront" alt="Socket Badge"></a>
</p>

---

🚀 **Automatic observability capture - Just 1 line of code! Zero external dependencies.**

SyntropyFront automatically captures user interactions, errors, HTTP calls, and console logs, providing a 360° view of the user experience with minimal performance impact.

## 🧠 Our Philosophy: Observability with Purpose

SyntropyFront is not just a log collector; it is a piece of engineering designed under three fundamental pillars:

1.  **SOLID Principles**: Each component has a single responsibility. From `QueueManager` to `RetryManager`, the system is extensible and predictable.
2.  **Functional Programming**: We use declarative patterns to transform data, ensuring that error processing and PII obfuscation are pure and without unexpected side effects.
3.  **Privacy by Design (Privacy-by-Default)**: Security is not optional. The system includes a sensitive data masking engine (PII) that acts before any information leaves the client.

**Network access:** This library uses the network only to send errors and breadcrumbs to the endpoint you configure (`configure({ endpoint })` or `onError`). It does not phone home or send data to third parties by default.

## ✨ Key Features

- 🎯 **Smart Click Capture**: Tracks interactions on interactive elements with built-in throttling logic.
- 🚨 **Global Error Management**: Captures uncaught exceptions (`window.onerror`) and promise rejections.
- 🌐 **Network Monitoring**: Intercepts `fetch` calls for full API visibility.
- 🛡️ **PII Masking & ANSI Cleaning**: Automatically protects sensitive data (emails, cards, tokens).
- 🎲 **Probabilistic Sampling**: Controls the volume of data sent to optimize costs and traffic.
- 💾 **Offline Resilience**: Retry queue with *Exponential Backoff* and persistent storage via IndexedDB.
- 📦 **Native Tree Shaking**: Modular architecture that allows you to include only the interceptors you truly need.

## 🚀 Quick Start

### Installation

```bash
pnpm add @syntropysoft/syntropyfront
```

### Basic Usage (Zero Config)

Simply import the library in your application's entry point:

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';
// Done! SyntropyFront auto-initializes and starts capturing events.
```

## ⚙️ Advanced Configuration

SyntropyFront is highly configurable to suit your production needs.

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

syntropyFront.configure({
  // Your observability backend URL (optional, defaults to console logging)
  endpoint: 'https://your-api.com/v1/telemetry',
  
  // Custom headers for transmission
  headers: {
    'Authorization': 'Bearer your-app-token',
    'X-Environment': 'production'
  },

  // 🎲 SAMPLING: Only sends 10% of errors to save resources
  samplingRate: 0.1,

  // 📦 BATCHING: Batch size and timeout before sending
  batchSize: 10,
  batchTimeout: 5000,

  // 🛡️ SECURITY: Basic payload encryption (base64/rot13)
  encrypt: true,

  // 💾 PERSISTENCE: Enable disk storage if the user is offline
  usePersistentBuffer: true,

  // Custom callback to handle the error before it is sent
  onError: (payload) => {
    console.warn('Error captured:', payload.type);
    return payload; // You can modify the payload here if necessary
  }
});
```

## 🕹️ Event Capture & Custom Events

SyntropyFront provides both automatic tracking and manual tools to enrich your observability data.

### 🤖 Automatic Capture
By default, the following interceptors are initialized:
- **UI Clicks**: Captures clicks on interactive elements (buttons, links, etc.) with smart selection logic.
- **Network**: Intercepts `fetch` calls, logging requests and responses (without sensitive headers).
- **Errors**: Catch-all for uncaught exceptions and unhandled promise rejections.

### 🛠️ Custom Breadcrumbs
Breadcrumbs are a timeline of events that help you understand what happened before an error occurred. You can add your own milestones:

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

// Simple breadcrumb
syntropyFront.addBreadcrumb('auth', 'User logged in successfully');

// Breadcrumb with data
syntropyFront.addBreadcrumb('commerce', 'Item added to cart', {
  productId: 'abc-123',
  price: 49.99,
  currency: 'USD'
});
```

### 🚨 Manual Error Reporting
You can manually send errors that you catch in your own `try/catch` blocks:

```javascript
try {
  performRiskyOperation();
} catch (error) {
  syntropyFront.sendError(error, {
    severity: 'critical',
    userId: 'user_99'
  });
}
```

---

## 🛡️ Sensitive Data Protection (PII Masking)

SyntropyFront automatically protects your users' privacy. The `DataMaskingManager` detects and obfuscates:
- Email addresses (`j***@example.com`)
- Authentication tokens and passwords
- Credit card numbers (keeps only the last 4 digits)
- SSN and phone numbers

### Custom Rules Configuration
```javascript
syntropyFront.configure({
  maskingRules: [
    {
      pattern: /custom_id_\d+/i,
      mask: 'HIDDEN_ID'
    }
  ]
});
```

## 🏗️ Modular Architecture and Tree Shaking

In a future version (e.g. 0.5.0), interceptors may be exposed as independent modules. To minimize your bundle size, you would then import only what you need:

```javascript
// Instead of global import, use specific interceptors directly
// (Coming soon in the granular export API)
```

### Core Structure
The system is divided into managers with unique responsibilities:
- **QueueManager**: Manages batching and output flow.
- **RetryManager**: Handles smart retries with incremental waits.
- **SerializationManager**: Ensures data is safe for transmission over the network.
- **ContextCollector**: Collects device information and user environment context.

## 📊 Quality Metrics

We take stability seriously. SyntropyFront maintains:
- **Test Coverage**: **87%** (All files).
- **Stryker Mutation Score**: **>71%** (Our tests truly verify logic, they don't just "pass through" it).
- **Zero Dependencies**: We don't add third-party vulnerabilities to your project.

## 📖 API Reference

### `syntropyFront.configure(config)`
Updates the global configuration of the agent.

### `syntropyFront.addBreadcrumb(category, message, data)`
Adds a manual milestone to the timeline.
- `category`: String (e.g., 'auth', 'ui', 'action')
- `message`: Description of the event.
- `data`: (Optional) Object with additional metadata.

### `syntropyFront.sendError(error, context)`
Manually reports an error.
- `error`: Error object or string.
- `context`: (Optional) Additional data to send with this specific error.

### `syntropyFront.flush()`
Forces the immediate sending of all pending events in the queue.

### `syntropyFront.getBreadcrumbs()`
Returns the list of current breadcrumbs in memory.

### `syntropyFront.clearBreadcrumbs()`
Clears the temporary breadcrumb history.

### `syntropyFront.getStats()`
Returns an object with library performance statistics (queue length, retry status, etc.).

### `syntropyFront.destroy()`
Deactivates all interceptors and stops the agent.

---

## 🔍 Advanced Context Collection

You can precisely control what environment data is collected when an error occurs.

```javascript
syntropyFront.configure({
  context: {
    // Collect all default fields for these types
    device: true,
    network: true,
    
    // Collect ONLY specific fields
    window: ['url', 'title', 'viewport'],
    performance: ['memory'],
    
    // Explicitly disable a type
    storage: false
  }
});
```

### Available Context Fields
- **`device`**: `userAgent`, `language`, `screen`, `timezone`, `cookieEnabled`.
- **`window`**: `url`, `pathname`, `referrer`, `title`, `viewport`.
- **`storage`**: `localStorage`, `sessionStorage` (size and keys only, no values).
- **`network`**: `online`, `connection` (type, downlink).
- **`ui`**: `focused`, `visibility`, `activeElement`.
- **`performance`**: `memory` (heap usage), `timing`.
- **`session`**: `sessionId`, `startTime`, `pageLoadTime`.

## 🛠️ Local Development

If you want to contribute or test the library locally:

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/Syntropysoft/syntropyfront.git
    cd syntropyfront
    pnpm install
    ```

2.  **Run Tests**:
    ```bash
    npm test          # Run all tests
    npm run test:watch # Watch mode
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

## 📄 License

This project is licensed under the **Apache License 2.0**. You can freely use, modify, and distribute it in commercial projects.

---

**Developed with ❤️ for a clearer and more stable web.**
