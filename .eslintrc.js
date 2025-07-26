module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off', // We use console for debugging
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  },
  globals: {
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    location: 'readonly',
    history: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    
    // Worker globals
    Worker: 'readonly',
    SharedWorker: 'readonly',
    
    // IndexedDB globals
    indexedDB: 'readonly',
    IDBRequest: 'readonly',
    IDBOpenDBRequest: 'readonly',
    IDBTransaction: 'readonly',
    IDBDatabase: 'readonly',
    IDBObjectStore: 'readonly',
    IDBIndex: 'readonly',
    IDBCursor: 'readonly',
    IDBCursorWithValue: 'readonly',
    IDBKeyRange: 'readonly',
    
    // Performance API
    performance: 'readonly',
    PerformanceObserver: 'readonly'
  }
}; 