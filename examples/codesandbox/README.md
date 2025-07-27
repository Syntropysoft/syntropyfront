# SyntropyFront React Demo - CodeSandbox

This is a complete React application demonstrating SyntropyFront's capabilities in a CodeSandbox environment.

## 🚀 Features Demonstrated

- ✅ **SyntropyFront Initialization** with debug preset
- ✅ **Reactive Object Tracking** with Proxy objects
- ✅ **Breadcrumb System** for user action tracking
- ✅ **Error Handling** and reporting
- ✅ **Real-time UI Updates** showing breadcrumbs and errors
- ✅ **Network Error Simulation** for testing
- ✅ **Statistics Dashboard** with proxy tracking stats
- ✅ **Live Log Collection** with real-time monitoring
- ✅ **Data Dump Visualization** showing actual payloads sent to endpoints

## 🎯 Interactive Elements

### User Profile Form
- **Proxy-tracked object** that automatically logs changes
- **Real-time updates** when form fields change
- **Theme selection** with preference tracking

### Action Buttons
- **Add Breadcrumb** - Manually add breadcrumbs
- **Simulate Error** - Generate test errors
- **Simulate Network Error** - Test network error handling
- **Get Stats** - View SyntropyFront statistics
- **View Console Dumps** - See actual data being sent to endpoints
- **Clear Data** - Reset breadcrumbs and errors

### Real-time Displays
- **Breadcrumbs List** - Shows last 5 breadcrumbs with live updates
- **Logs Sent to Endpoint** - Displays logs being sent to the server
- **Data Dumps** - Shows actual payloads with metadata and batch information
- **Errors List** - Displays captured errors with context
- **Status Indicator** - Shows initialization status and last activity

## 🔧 Configuration

The demo uses the **debug preset** for maximum visibility:

```javascript
await SyntropyFront.init({
  preset: 'debug',
  agent: {
    endpoint: 'https://httpbin.org/post', // Test endpoint
    batchTimeout: 5000
  }
});
```

## 📦 Import Strategy

This demo uses a **local copy** of SyntropyFront for CodeSandbox compatibility:

```javascript
// Local import for CodeSandbox demo
import SyntropyFront from './syntropyfront.cjs';
```

**Why local import?**
- CodeSandbox has specific module resolution requirements
- Ensures consistent behavior across different environments
- Avoids npm package compatibility issues
- Provides immediate access to the latest version

## 📊 How Log Collection Works

### 1. **Real-time Breadcrumb Monitoring**
- Breadcrumbs are updated every 500ms via `setInterval`
- UI automatically reflects new breadcrumbs as they're added
- Last activity timestamp shows when the most recent action occurred

### 2. **Log Transmission Simulation**
- Logs are "sent" to the endpoint every 3 seconds
- The demo simulates the batching process that SyntropyFront uses
- You can see which logs have been transmitted and when

### 3. **Data Dump Console Output** 🆕
- **Actual payloads are logged to browser console** every 3 seconds
- Each dump includes complete data structure that would be sent to a real endpoint
- **Open browser console (F12)** to see the raw data being transmitted
- Payload includes: breadcrumbs, user profile, session info, and metadata

### 4. **Error Capture & Reporting**
- Errors are captured immediately when thrown
- Each error includes context, timestamp, and message
- Errors are sent to the endpoint along with breadcrumbs

### 5. **Proxy Object Tracking**
- User profile changes are automatically tracked
- Object modifications trigger breadcrumbs automatically
- No manual intervention required for object monitoring

## 📊 What You'll See

1. **Initialization** - Status changes from "Initializing..." to "Initialized"
2. **Breadcrumbs** - Appear instantly when you interact with the form
3. **Log Transmission** - Watch logs being "sent" to the endpoint every 3 seconds
4. **Data Dumps** - See actual payloads with batch IDs and metadata
5. **Console Output** - **Open F12 to see raw data being sent to endpoints**
6. **Error Tracking** - Errors are captured and displayed in real-time
7. **Proxy Tracking** - Object changes are automatically logged
8. **Statistics** - Click "Get Stats" to see detailed metrics
9. **Last Activity** - Real-time timestamp of the most recent action

## 🔍 Console Data Dumps

**The most important feature:** Open your browser's developer console (F12) to see the actual data being sent to endpoints:

```javascript
// Example console output:
📤 DATA DUMP SENT TO ENDPOINT: {
  timestamp: "2024-01-15T10:30:45.123Z",
  endpoint: "https://httpbin.org/post",
  batchId: "batch_1705315845123",
  payload: {
    breadcrumbs: [...],
    userProfile: {...},
    sessionInfo: {
      userAgent: "...",
      url: "...",
      timestamp: "..."
    }
  }
}
📊 PAYLOAD SIZE: 2048 bytes
```

This shows exactly what a real endpoint would receive from SyntropyFront.

## 🎨 Styling

The demo features:
- **Modern gradient design** with purple/blue theme
- **Responsive layout** that works on mobile
- **Smooth animations** and hover effects
- **Clean typography** with system fonts
- **Color-coded sections** for different types of data

## 🐛 Troubleshooting

If the demo doesn't work:
1. Check the browser console for errors
2. Ensure JavaScript is enabled
3. Try refreshing the page
4. Check that all dependencies are loaded

## 🔗 Next Steps

After exploring this demo:
1. **Try different presets** (safe, balanced, performance)
2. **Add your own tracking** to the user profile
3. **Experiment with error simulation**
4. **Check console dumps** to see actual data transmission
5. **Integrate into your own React app**

## 📈 Understanding the Data Flow

```
User Action → SyntropyFront.addBreadcrumb() → UI Update (500ms) → Log Transmission (3s)
     ↓
Proxy Object Change → Automatic Tracking → Breadcrumb Generation → Real-time Display
     ↓
Error Occurs → SyntropyFront.sendError() → Error Display → Context Preservation
     ↓
Data Dump → Console Log → Endpoint Simulation → Payload Visualization
```

This demonstrates the complete observability pipeline from user interaction to data transmission.

## 🎯 Key Learning Points

- **Real-time monitoring** - See data flow as it happens
- **Console integration** - Understand what endpoints actually receive
- **Batching behavior** - Learn how SyntropyFront optimizes network requests
- **Context preservation** - See how user state is maintained across requests
- **Error handling** - Observe how errors are captured and transmitted

---

**Happy coding! 🎉** 