# SyntropyFront Examples

This directory contains examples demonstrating how to use SyntropyFront with different frameworks.

## Examples

### React Example (`react-example/`)
- **Port:** 3000
- **Framework:** React 18
- **Build Tool:** Create React App
- **Features:** Complete demo with all SyntropyFront features

### Vue Example (`vue-example/`)
- **Port:** 3001
- **Framework:** Vue 3
- **Build Tool:** Vite
- **Features:** Complete demo with all SyntropyFront features

### Svelte Example (`svelte-example/`)
- **Port:** 3002
- **Framework:** Svelte 4
- **Build Tool:** Vite
- **Features:** Complete demo with all SyntropyFront features

## Running the Examples

### React Example
```bash
cd react-example
npm install
npm start
# Open http://localhost:3000
```

### Vue Example
```bash
cd vue-example
npm install
npm run dev
# Open http://localhost:3001
```

### Svelte Example
```bash
cd svelte-example
npm install
npm run dev
# Open http://localhost:3002
```

## What Each Example Demonstrates

All examples showcase:

1. **Auto-initialization** - SyntropyFront starts automatically on import
2. **Configuration options** - Console, Fetch, and Custom Handler modes
3. **Automatic capture** - Clicks, HTTP requests, console logs, errors
4. **Manual API** - Adding breadcrumbs and sending errors manually
5. **Real-time stats** - Live statistics display
6. **Error handling** - All three error handling strategies

## Framework-Agnostic

SyntropyFront works identically across all frameworks because it uses vanilla JavaScript and browser APIs. The only difference is the import syntax:

```javascript
// Same import in all frameworks
import syntropyFront from '@syntropysoft/syntropyfront';
```

## Key Features Demonstrated

- ✅ **1-line setup** - Just import and it works
- ✅ **Automatic capture** - No configuration needed for basic functionality
- ✅ **Flexible configuration** - Choose your error handling strategy
- ✅ **Real-time monitoring** - Live statistics and event tracking
- ✅ **Framework independence** - Same API across React, Vue, Svelte, and vanilla JS 