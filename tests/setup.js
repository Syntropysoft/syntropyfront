// Mock browser APIs for testing
global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
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
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  fetch: vi.fn(),
  onerror: null,
  onunhandledrejection: null
};

global.document = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {}
  })),
  getElementById: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  title: 'Test Page'
};

global.navigator = global.window.navigator;
global.location = global.window.location;
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.fetch = global.window.fetch;

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

// Mock Worker
global.Worker = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
};

// Mock console methods
global.console = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}; 