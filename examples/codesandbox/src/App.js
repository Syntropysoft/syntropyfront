import React, { useState, useEffect } from 'react';
import SyntropyFront from 'syntropyfront';
import './App.css';

function App() {
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    preferences: { theme: 'dark', notifications: true }
  });
  
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize SyntropyFront
    const initSyntropyFront = async () => {
      try {
        await SyntropyFront.init({
          preset: 'debug',
          agent: {
            endpoint: 'https://httpbin.org/post', // Test endpoint
            batchTimeout: 5000
          }
        });
        
        setIsInitialized(true);
        console.log('✅ SyntropyFront initialized successfully');
        
        // Add initial breadcrumb
        SyntropyFront.addBreadcrumb('app', 'React app loaded', { 
          component: 'App',
          timestamp: new Date().toISOString()
        });
        
        // Track user profile changes
        const trackedProfile = SyntropyFront.addProxyObject('userProfile', userProfile);
        
        // Update breadcrumbs when they change
        const updateBreadcrumbs = () => {
          setBreadcrumbs(SyntropyFront.getBreadcrumbs());
        };
        
        // Listen for breadcrumb changes
        SyntropyFront.addBreadcrumb('system', 'Breadcrumb listener attached');
        
      } catch (error) {
        console.error('❌ Failed to initialize SyntropyFront:', error);
      }
    };

    initSyntropyFront();
  }, []);

  const handleUserAction = (action, data) => {
    SyntropyFront.addBreadcrumb('user', action, data);
    setBreadcrumbs(SyntropyFront.getBreadcrumbs());
  };

  const updateUserProfile = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    handleUserAction('Profile updated', { field, value });
  };

  const simulateError = () => {
    try {
      throw new Error('Simulated error for testing');
    } catch (error) {
      SyntropyFront.sendError(error, { 
        context: 'React Demo',
        userProfile,
        breadcrumbs: SyntropyFront.getBreadcrumbs()
      });
      setErrors(prev => [...prev, error.message]);
    }
  };

  const simulateNetworkError = async () => {
    try {
      await fetch('https://invalid-url-that-will-fail.com');
    } catch (error) {
      SyntropyFront.sendError(error, { 
        context: 'Network Error Demo',
        url: 'https://invalid-url-that-will-fail.com'
      });
      setErrors(prev => [...prev, 'Network error simulated']);
    }
  };

  const clearData = () => {
    SyntropyFront.clearBreadcrumbs();
    setBreadcrumbs([]);
    setErrors([]);
    handleUserAction('Data cleared', { action: 'clear_all' });
  };

  const getStats = () => {
    const stats = SyntropyFront.getProxyTrackerStats();
    const config = SyntropyFront.getConfiguration();
    
    alert(`SyntropyFront Stats:
- Breadcrumbs: ${breadcrumbs.length}
- Errors: ${errors.length}
- Current Preset: ${config.currentPreset}
- Is Initialized: ${config.isInitialized}
- Proxy Objects: ${stats.trackedObjectsCount}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧪 SyntropyFront React Demo</h1>
        <p>Advanced frontend tracing and error monitoring</p>
        
        <div className="status">
          Status: {isInitialized ? '✅ Initialized' : '⏳ Initializing...'}
        </div>
      </header>

      <main className="App-main">
        <div className="demo-section">
          <h2>👤 User Profile (Proxy Tracked)</h2>
          <div className="profile-form">
            <div>
              <label>Name:</label>
              <input 
                type="text" 
                value={userProfile.name}
                onChange={(e) => updateUserProfile('name', e.target.value)}
              />
            </div>
            <div>
              <label>Email:</label>
              <input 
                type="email" 
                value={userProfile.email}
                onChange={(e) => updateUserProfile('email', e.target.value)}
              />
            </div>
            <div>
              <label>Theme:</label>
              <select 
                value={userProfile.preferences.theme}
                onChange={(e) => updateUserProfile('preferences', {
                  ...userProfile.preferences,
                  theme: e.target.value
                })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🎯 Actions</h2>
          <div className="action-buttons">
            <button onClick={() => handleUserAction('Button clicked', { button: 'action' })}>
              Add Breadcrumb
            </button>
            <button onClick={simulateError}>
              Simulate Error
            </button>
            <button onClick={simulateNetworkError}>
              Simulate Network Error
            </button>
            <button onClick={getStats}>
              Get Stats
            </button>
            <button onClick={clearData}>
              Clear Data
            </button>
          </div>
        </div>

        <div className="demo-section">
          <h2>🍞 Breadcrumbs ({breadcrumbs.length})</h2>
          <div className="breadcrumbs-list">
            {breadcrumbs.slice(-5).map((crumb, index) => (
              <div key={index} className="breadcrumb">
                <span className="category">{crumb.category}</span>
                <span className="message">{crumb.message}</span>
                <span className="timestamp">{new Date(crumb.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-section">
          <h2>❌ Errors ({errors.length})</h2>
          <div className="errors-list">
            {errors.map((error, index) => (
              <div key={index} className="error">
                {error}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 