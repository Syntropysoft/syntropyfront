const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { Interceptors } = require('../src/interceptors/Interceptors.js');
const { breadcrumbStore } = require('../src/core/breadcrumbs/BreadcrumbStore.js');

// Mock dependencies
jest.mock('../src/core/breadcrumbs/BreadcrumbStore.js', () => ({
  breadcrumbStore: {
    add: jest.fn(),
    getAll: jest.fn().mockReturnValue([{ category: 'test', message: 'prev' }]),
    clear: jest.fn()
  }
}));

jest.mock('../src/core/agent/Agent.js', () => ({
  agent: {
    sendError: jest.fn(),
    isEnabled: true
  }
}));

jest.mock('../src/core/context/ContextCollector.js', () => ({
  contextCollector: {
    collect: jest.fn().mockReturnValue({ device: 'mock' })
  }
}));

describe('Interceptors Coordination', () => {
  let interceptors;

  beforeEach(() => {
    // Mock Request global for FetchInterceptor
    if (typeof global.Request === 'undefined') {
      global.Request = class Request {
        constructor(input, init) {
          this.url = typeof input === 'string' ? input : input?.url;
          this.method = init?.method || input?.method || 'GET';
        }
      };
    }

    interceptors = new Interceptors();
    jest.clearAllMocks();

    // Global mocks for DOM
    if (typeof document === 'undefined') {
      global.document = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        body: { nodeType: 1 }
      };
    }
  });

  it('should initialize all enabled interceptors', () => {
    interceptors.init();
    expect(interceptors.isInitialized).toBe(true);
  });

  it('should not re-initialize if already initialized', () => {
    const spy = jest.spyOn(console, 'log');
    interceptors.init();
    interceptors.init();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('should destroy all interceptors', () => {
    interceptors.init();
    interceptors.destroy();
    expect(interceptors.isInitialized).toBe(false);
  });

  it('should handle lifecycle methods on registry subsets', () => {
    // Disable clicks and fetch, only errors enabled
    interceptors.configure({
      captureClicks: false,
      captureFetch: false,
      captureErrors: true
    });

    // Manually trigger runLifecycle to see if it processes correctly
    const spy = jest.spyOn(interceptors.registry.get('errors'), 'init');
    const clickSpy = jest.spyOn(interceptors.registry.get('clicks'), 'init');

    interceptors.runLifecycle('init');

    expect(spy).toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should skip interceptors without the requested lifecycle method', () => {
    const backup = interceptors.registry.get('clicks').init;
    interceptors.registry.get('clicks').init = undefined;

    expect(() => interceptors.runLifecycle('init')).not.toThrow();

    interceptors.registry.get('clicks').init = backup;
  });
});

describe('ClickInterceptor', () => {
  let interceptors;

  beforeEach(() => {
    interceptors = new Interceptors();

    // Mock getComputedStyle
    global.window = global.window || {};
    global.window.getComputedStyle = jest.fn().mockReturnValue({ cursor: 'pointer' });
  });

  it('should capture clicks on interactive elements', () => {
    interceptors.init();
    const handler = interceptors.clickInterceptor.handler;

    const mockEl = {
      tagName: 'BUTTON',
      id: 'test-btn',
      className: 'btn',
      innerText: 'Click me',
      nodeType: 1,
      closest: jest.fn().mockImplementation(() => mockEl)
    };

    handler({ target: mockEl });

    expect(breadcrumbStore.add).toHaveBeenCalledWith(expect.objectContaining({
      category: 'ui',
      message: expect.stringContaining('User clicked')
    }));
  });

  it('should fallback to CSS cursor:pointer check', () => {
    interceptors.init();
    const handler = interceptors.clickInterceptor.handler;

    const mockEl = {
      tagName: 'DIV',
      nodeType: 1,
      closest: jest.fn().mockReturnValue(null),
      parentElement: null
    };

    handler({ target: mockEl });
    expect(breadcrumbStore.add).toHaveBeenCalled();
  });
});

describe('FetchInterceptor', () => {
  let interceptors;
  let originalFetch;

  beforeEach(() => {
    interceptors = new Interceptors();
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockReturnValue(Promise.resolve({}));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should intercept fetch calls', async () => {
    interceptors.init();
    await global.fetch('http://api.com/data');

    expect(breadcrumbStore.add).toHaveBeenCalledWith(expect.objectContaining({
      category: 'network',
      message: expect.stringContaining('Request: GET')
    }));
  });
});

describe('ErrorInterceptor', () => {
  let interceptors;

  beforeEach(() => {
    interceptors = new Interceptors();
    global.onerror = jest.fn();
    global.onunhandledrejection = jest.fn();
  });

  it('should capture global errors', () => {
    interceptors.init();
    const handler = global.onerror;

    handler('Test error', 'script.js', 10, 20, new Error('Test'));

    const { agent } = require('../src/core/agent/Agent.js');
    expect(agent.sendError).toHaveBeenCalled();
  });

  it('should handle unhandled promise rejections', () => {
    interceptors.init();
    const handler = global.onunhandledrejection;

    handler({
      reason: new Error('Async failure')
    });

    const { agent } = require('../src/core/agent/Agent.js');
    expect(agent.sendError).toHaveBeenCalled();
  });
});