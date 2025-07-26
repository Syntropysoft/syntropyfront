# SyntropyFront Examples

This directory contains interactive examples and demos for SyntropyFront.

## 🎯 Interactive Demos

### CodeSandbox - React Demo
**URL**: [Coming soon - will be added after npm publish]

A complete React application demonstrating:
- ✅ SyntropyFront initialization with presets
- ✅ Reactive object tracking with Proxy
- ✅ Breadcrumb system
- ✅ Error handling and reporting
- ✅ Real-time UI updates

**Features**:
- User profile tracking with reactive updates
- Simulated error generation
- Network error handling
- Statistics dashboard
- Real-time breadcrumb display

### StackBlitz - Vanilla JavaScript Demo
**URL**: [Coming soon - will be added after npm publish]

A pure JavaScript demo showcasing:
- ✅ Framework-agnostic usage
- ✅ Proxy object tracking
- ✅ Breadcrumb management
- ✅ Error simulation
- ✅ Statistics display

**Features**:
- No framework dependencies
- Interactive form with proxy tracking
- Real-time statistics
- Error simulation
- Clean, modern UI

### CodePen - Quick Demo
**URL**: [Coming soon - will be added after npm publish]

A minimal demo for quick testing:
- ✅ Basic initialization
- ✅ Simple breadcrumb tracking
- ✅ Error handling
- ✅ Minimal setup

## 🚀 How to Use These Examples

### 1. CodeSandbox
1. Click the CodeSandbox link (after npm publish)
2. The demo will load automatically
3. Interact with the form to see proxy tracking in action
4. Click buttons to test different features
5. Watch breadcrumbs and errors update in real-time

### 2. StackBlitz
1. Click the StackBlitz link (after npm publish)
2. The demo runs in your browser
3. Modify the user profile to see reactive tracking
4. Test error simulation
5. View statistics and breadcrumbs

### 3. CodePen
1. Click the CodePen link (after npm publish)
2. Quick demo for basic functionality
3. Perfect for understanding core concepts

## 📦 Local Development

To run these examples locally:

```bash
# Clone the repository
git clone https://github.com/Syntropysoft/syntropyfront.git
cd syntropyfront

# Install dependencies
npm install

# Build the package
npm run build

# Run examples locally
cd examples/codesandbox
npm install
npm start
```

## 🎨 Customization

Each example can be customized:

### React Demo
- Modify `src/App.js` to add new features
- Update `src/App.css` for styling changes
- Add new components to test different scenarios

### StackBlitz Demo
- Edit the HTML file directly
- Modify the JavaScript simulation
- Update CSS for different themes

### CodePen Demo
- Minimal setup for quick testing
- Easy to modify and experiment

## 🔧 Testing Different Features

### Presets
Try different presets in the initialization:
```javascript
// Safe preset - minimal impact
await SyntropyFront.init({ preset: 'safe' });

// Balanced preset - default
await SyntropyFront.init({ preset: 'balanced' });

// Debug preset - maximum information
await SyntropyFront.init({ preset: 'debug' });

// Performance preset - minimal overhead
await SyntropyFront.init({ preset: 'performance' });
```

### Proxy Tracking
Test reactive object tracking:
```javascript
const userProfile = SyntropyFront.addProxyObject('userProfile', {
  name: 'John Doe',
  preferences: { theme: 'dark' }
});

// Changes are automatically tracked
userProfile.name = 'Jane Doe';
userProfile.preferences.theme = 'light';
```

### Breadcrumbs
Add custom breadcrumbs:
```javascript
SyntropyFront.addBreadcrumb('user', 'Button clicked', {
  buttonId: 'submit',
  timestamp: Date.now()
});
```

### Error Handling
Simulate errors:
```javascript
try {
  throw new Error('Test error');
} catch (error) {
  SyntropyFront.sendError(error, { context: 'Demo' });
}
```

## 📊 What You'll See

### Real-time Updates
- Breadcrumbs appear instantly when actions occur
- Error count updates automatically
- Statistics refresh in real-time
- Proxy tracking shows object changes

### Console Logging
- Detailed logs for debugging
- Initialization messages
- Error details
- Performance metrics

### Network Activity
- Requests to test endpoints (httpbin.org)
- Error simulation with failed requests
- Batch sending of data

## 🎯 Learning Path

1. **Start with CodePen** - Basic concepts
2. **Try StackBlitz** - Framework-agnostic usage
3. **Explore CodeSandbox** - Full React integration
4. **Experiment locally** - Custom modifications

## 🐛 Troubleshooting

### Common Issues

**Example doesn't load:**
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

**SyntropyFront not found:**
- Examples use CDN links (after npm publish)
- For local development, use `npm link`

**Proxy tracking not working:**
- Check browser console for errors
- Ensure the object is properly wrapped
- Verify initialization completed

### Getting Help

- Check the [main documentation](../README.md)
- Open an issue on GitHub
- Review console logs for error details

## 🚀 Next Steps

After exploring these examples:

1. **Integrate into your project** - Use the npm package
2. **Customize for your needs** - Modify presets and configuration
3. **Add to your monitoring stack** - Combine with other tools
4. **Contribute** - Submit improvements and new examples

---

**Happy coding! 🎉** 