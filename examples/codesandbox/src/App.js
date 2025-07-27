import React, { useState, useEffect } from 'react';
import './css/App.css';

// Import SyntropyFront - ¡Se auto-inicializa!
import syntropyFront from 'syntropyfront';

/**
 * App - Demo minimalista de SyntropyFront
 * Single responsibility: Demostrar que funciona con 2 líneas de código
 */
function App() {
  const [clickCount, setClickCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [configMode, setConfigMode] = useState('console'); // 'console', 'jsonplaceholder', 'custom'

  // Configurar SyntropyFront cuando la app se monta
  useEffect(() => {
    let fetchConfig = null;

    if (configMode === 'jsonplaceholder') {
      // Usar JSONPlaceholder que permite CORS
      fetchConfig = {
        url: 'https://jsonplaceholder.typicode.com/posts',
        options: {
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        },
      };
    } else if (configMode === 'custom') {
      // Configuración personalizada (ejemplo)
      fetchConfig = {
        url: 'https://httpbin.org/post', // Permite CORS
        options: {
          headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'SyntropyFront',
          },
          mode: 'cors',
        },
      };
    }
    // Si es 'console', fetchConfig queda null

    // Configurar SyntropyFront
    syntropyFront.configure({
      maxEvents: 20, // Mantener solo los últimos 20 eventos
      fetch: fetchConfig,
    });

    // Actualizar stats cada segundo
    const interval = setInterval(() => {
      setStats(syntropyFront.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [configMode]);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    console.log('Click registrado!');
  };

  const handleError = () => {
    throw new Error('Error simulado para probar SyntropyFront');
  };

  const handleFetch = async () => {
    try {
      await fetch('https://jsonplaceholder.typicode.com/posts/1');
      console.log('Fetch exitoso!');
    } catch (error) {
      console.error('Fetch falló:', error);
    }
  };

  const handleManualBreadcrumb = () => {
    syntropyFront.addBreadcrumb('user', 'Breadcrumb manual agregado');
    console.log('Breadcrumb manual agregado!');
  };

  const handleManualError = () => {
    syntropyFront.sendError(new Error('Error manual enviado'));
    console.log('Error manual enviado!');
  };

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>🚀 SyntropyFront Demo</h1>
        <p>Librería de observabilidad con captura automática</p>
        <div className='status'>
          <span>✅ SyntropyFront cargado y funcionando</span>
          {stats && (
            <div className='stats'>
              <span>📊 Breadcrumbs: {stats.breadcrumbs}</span>
              <span>🚨 Errores: {stats.errors}</span>
              <span>📤 Endpoint: {stats.endpoint}</span>
            </div>
          )}
        </div>
      </header>

      <main className='App-main'>
        <div className='config-selector'>
          <h3>🔧 Configuración de Endpoint:</h3>
          <div className='config-buttons'>
            <button
              onClick={() => setConfigMode('console')}
              className={configMode === 'console' ? 'active' : ''}
            >
              Solo Console
            </button>
            <button
              onClick={() => setConfigMode('jsonplaceholder')}
              className={configMode === 'jsonplaceholder' ? 'active' : ''}
            >
              JSONPlaceholder (CORS OK)
            </button>
            <button
              onClick={() => setConfigMode('custom')}
              className={configMode === 'custom' ? 'active' : ''}
            >
              HttpBin (CORS OK)
            </button>
          </div>
        </div>

        <div className='actions'>
          <button onClick={handleClick}>Click me! ({clickCount})</button>

          <button onClick={handleFetch}>Test HTTP Request</button>

          <button onClick={handleManualBreadcrumb}>Agregar Breadcrumb Manual</button>

          <button onClick={handleManualError}>Enviar Error Manual</button>

          <button onClick={handleError} style={{ backgroundColor: '#ff4444' }}>
            Simular Error
          </button>
        </div>

        <div className='info'>
          <h3>¿Qué hace SyntropyFront automáticamente?</h3>
          <ul>
            <li>🎯 Captura todos los clicks</li>
            <li>🚨 Detecta errores automáticamente</li>
            <li>🌐 Intercepta llamadas HTTP</li>
            <li>📝 Registra console logs</li>
            <li>💾 Mantiene los últimos N eventos (configurable)</li>
            <li>📤 Postea errores con configuración completa de fetch</li>
          </ul>

          <h3>¿Cómo configurar fetch?</h3>
          <pre>
            {`import syntropyFront from 'syntropyfront';

// Opción 1: Solo console (sin configuración)
syntropyFront.configure({
  maxEvents: 50
});

// Opción 2: Con endpoint que permite CORS
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://jsonplaceholder.typicode.com/posts',
    options: {
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    }
  }
});

// Opción 3: Con tu API (necesita CORS configurado)
syntropyFront.configure({
  maxEvents: 50,
  fetch: {
    url: 'https://tu-api.com/errors',
    options: {
      headers: {
        'Authorization': 'Bearer tu-token',
        'X-API-Key': 'tu-api-key',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
    }
  }
});

// ¡Ya está! Se auto-inicializa`}
          </pre>

          <h3>⚠️ Nota sobre CORS:</h3>
          <p>
            Para que funcione con tu API, necesitas configurar CORS en tu servidor para permitir requests desde tu dominio.
            Los endpoints de ejemplo (JSONPlaceholder, HttpBin) ya tienen CORS configurado.
          </p>

          <h3>¿Qué se postea?</h3>
          <pre>
            {`{
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
      "data": { "element": "BUTTON", "x": 100, "y": 200 },
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
    // ... últimos N eventos
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}`}
          </pre>

          <p>
            <strong>¡Solo necesitas 1 línea de código básico!</strong>
          </p>
          <p>
            <strong>Si le das un endpoint, se postea ahí, si no, se postea en la consola</strong>
          </p>
          <pre>
            {`import syntropyFront from 'syntropyfront';
// ¡Ya está! Se auto-inicializa`}
          </pre>
        </div>
      </main>
    </div>
  );
}

export default App;
