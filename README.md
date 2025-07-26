<p align="center">
  <img src="./assets/syntropysoft-logo.png" alt="SyntropyLog Logo" width="170"/>
</p>

<h1 align="center">SyntropyFront</h1>

<p align="center">
  <strong>From Chaos to Clarity</strong>
  <br />
  The Observability Framework for High-Performance Teams
</p>
<p align="center">
  Advanced frontend tracing and error monitoring with reactive object tracking, worker architecture, and circular reference handling
  <br />
</p>

## 🚀 Features

- **🔄 Reactive Object Tracking** - Real-time object state tracking using JavaScript Proxies
- **⚡ Worker Architecture** - Non-blocking data collection and processing
- **🛡️ Circular Reference Handling** - Robust serialization for complex objects
- **🎯 Configuration Presets** - Pre-configured setups for different use cases
- **📦 Lazy Loading** - Dynamic module loading for optimal bundle size
- **🔗 Framework Agnostic** - Works with any JavaScript framework
- **📊 Breadcrumb System** - Comprehensive user action tracking
- **🔄 Automatic Retry** - Exponential backoff with persistent buffer
- **🔒 Privacy First** - Granular context collection with opt-in sensitive data

## 📦 Installation

```bash
npm install syntropyfront
```

## 🎯 Quick Start

```javascript
import { SyntropyFront } from 'syntropyfront';

// Initialize with balanced preset
await SyntropyFront.init({
  preset: 'balanced',
  agent: {
    endpoint: 'https://your-api.com/errors'
  }
});

// Add reactive object tracking
const userProfile = SyntropyFront.addProxyObject('userProfile', {
  name: 'John Doe',
  preferences: { theme: 'dark' }
});

// Track user actions automatically
// Error handling is automatic
```

## ⚙️ Configuration Presets

### Safe Preset
```javascript
await SyntropyFront.init({
  preset: 'safe',
  agent: { endpoint: 'https://api.com/errors' }
});
```
- **Use case**: Production environments with privacy concerns
- **Features**: Errors only, minimal context, no tracking
- **Bundle size**: ~25KB

### Balanced Preset (Default)
```javascript
await SyntropyFront.init({
  preset: 'balanced',
  agent: { endpoint: 'https://api.com/errors' }
});
```
- **Use case**: General production use
- **Features**: Periodic sending, curated context, moderate tracking
- **Bundle size**: ~60KB

### Debug Preset
```javascript
await SyntropyFront.init({
  preset: 'debug',
  agent: { endpoint: 'https://api.com/errors' }
});
```
- **Use case**: Development and debugging
- **Features**: Frequent sending, full context, complete tracking
- **Bundle size**: ~60KB

### Performance Preset
```javascript
await SyntropyFront.init({
  preset: 'performance',
  agent: { endpoint: 'https://api.com/errors' }
});
```
- **Use case**: High-performance applications
- **Features**: Critical errors only, minimal overhead
- **Bundle size**: ~25KB

## 🔄 Reactive Object Tracking

Track object changes in real-time using JavaScript Proxies:

```javascript
// Add object for tracking
const userProfile = SyntropyFront.addProxyObject('userProfile', {
  name: 'John Doe',
  preferences: { theme: 'dark' }
});

// Changes are automatically tracked
userProfile.name = 'Jane Doe';
userProfile.preferences.theme = 'light';

// Get tracking history
const history = SyntropyFront.getProxyObjectHistory('userProfile');
const currentState = SyntropyFront.getProxyObjectState('userProfile');
```

## ⚡ Worker Architecture

Offload data processing to Web Workers for non-blocking operation:

```javascript
// Worker is automatically used when enabled
await SyntropyFront.init({
  useWorker: true,
  // ... other config
});

// Check worker status
const isAvailable = SyntropyFront.isWorkerAvailable();
const status = SyntropyFront.getWorkerStatus();
```

## 🛡️ Circular Reference Handling

Safely serialize complex objects with circular references:

```javascript
// Create circular reference
const obj = { name: 'test' };
obj.self = obj;

// SyntropyFront handles this automatically
SyntropyFront.sendError(new Error('Test'), { context: obj });
```

## 📊 Breadcrumb System

Track user actions and application events:

```javascript
// Add custom breadcrumbs
SyntropyFront.addBreadcrumb('user', 'User clicked button', {
  buttonId: 'submit',
  timestamp: Date.now()
});

// Get breadcrumbs
const breadcrumbs = SyntropyFront.getBreadcrumbs();
```

## 🔗 Framework Integration

### React
```javascript
// In your main App component
useEffect(() => {
  SyntropyFront.init({
    preset: 'balanced',
    agent: { endpoint: 'https://api.com/errors' }
  });
}, []);
```

### Vue
```javascript
// In your main.js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

// Initialize SyntropyFront
SyntropyFront.init({
  preset: 'balanced',
  agent: { endpoint: 'https://api.com/errors' }
});

app.mount('#app');
```

### Angular
```typescript
// In your main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Initialize SyntropyFront
SyntropyFront.init({
  preset: 'balanced',
  agent: { endpoint: 'https://api.com/errors' }
});

platformBrowserDynamic().bootstrapModule(AppModule);
```

## 📚 API Reference

### Core Methods

#### `SyntropyFront.init(config)`
Initialize SyntropyFront with configuration.

#### `SyntropyFront.addProxyObject(name, object, options)`
Add an object for reactive tracking.

#### `SyntropyFront.getProxyObjectHistory(name)`
Get the change history of a tracked object.

#### `SyntropyFront.addBreadcrumb(type, message, data)`
Add a breadcrumb entry.

#### `SyntropyFront.sendError(error, context)`
Send an error with context to the backend.

### Configuration Options

```javascript
{
  preset: 'balanced', // 'safe' | 'balanced' | 'debug' | 'performance'
  agent: {
    endpoint: 'https://api.com/errors',
    batchTimeout: 10000,
    batchSize: 20,
    maxRetries: 3,
    usePersistentBuffer: true
  },
  proxyTracking: {
    enabled: true,
    maxStates: 10,
    trackNested: true,
    trackArrays: true
  },
  useWorker: true,
  maxBreadcrumbs: 50,
  context: {
    device: true,
    window: true,
    session: true,
    ui: true,
    network: true
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Build in watch mode
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📦 Build Outputs

The build process generates multiple formats:

- **ESM** (`dist/index.js`) - Modern ES modules
- **CommonJS** (`dist/index.cjs`) - Node.js compatibility
- **IIFE** (`dist/index.min.js`) - Browser-ready minified bundle

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

Apache 2.0 - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/Syntropysoft/syntropyfront)
- 🐛 [Issues](https://github.com/Syntropysoft/syntropyfront/issues)
- 💬 [Discussions](https://github.com/Syntropysoft/syntropyfront/discussions)

---

Made with ❤️ by the SyntropyLog Team 