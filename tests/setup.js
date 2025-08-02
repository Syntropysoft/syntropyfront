// Mock browser APIs for testing
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US',
    onLine: true
  },
  screen: {
    width: 1920,
    height: 1080
  },
  innerWidth: 1920,
  innerHeight: 1080,
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  fetch: jest.fn(),
  onerror: null,
  onunhandledrejection: null
};

global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    style: {}
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  title: 'Test Page'
};

global.navigator = global.window.navigator;
global.location = global.window.location;
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.fetch = global.window.fetch;

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

// Mock Worker
global.Worker = jest.fn();

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn()
};

// Mock console methods
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}; 