const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { Interceptors } = require('../src/interceptors/Interceptors.js');

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
    sendError: jest.fn()
  }
}));

jest.mock('../src/core/context/ContextCollector.js', () => ({
  contextCollector: {
    collect: jest.fn().mockReturnValue({ device: 'mock' })
  }
}));

const { breadcrumbStore } = require('../src/core/breadcrumbs/BreadcrumbStore.js');
const { agent } = require('../src/core/agent/Agent.js');
const { contextCollector } = require('../src/core/context/ContextCollector.js');

describe('Interceptors', () => {
  let interceptors;
  let originalFetch;
  let originalOnError;
  let originalOnUnhandledRejection;

  beforeEach(() => {
    interceptors = new Interceptors();

    // Backup original globals
    originalFetch = global.fetch;
    originalOnError = global.onerror;
    originalOnUnhandledRejection = global.onunhandledrejection;

    // Mock globals
    global.fetch = jest.fn();
    global.onerror = jest.fn();
    global.onunhandledrejection = jest.fn();

    // Mock global objects
    if (!global.document) {
      global.document = { body: { nodeType: 1, tagName: 'BODY' } };
    }
    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();
    if (!global.document.body) global.document.body = { nodeType: 1, tagName: 'BODY' };

    if (!global.window) {
      global.window = {};
    }
    global.window.fetch = global.fetch;
    global.window.onerror = global.onerror;
    global.window.onunhandledrejection = global.onunhandledrejection;
    global.window.getComputedStyle = jest.fn().mockReturnValue({ cursor: 'default' });

    global.Request = class Request {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
      }
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.onerror = originalOnError;
    global.onunhandledrejection = originalOnUnhandledRejection;
  });

  describe('setupClickInterceptor', () => {
    it('should create breadcrumb with full data for interactive elements', () => {
      interceptors.setupClickInterceptor();
      const clickHandler = interceptors.eventListeners.get('click');

      const mockElement = {
        tagName: 'BUTTON',
        id: 'btn-1',
        className: 'primary bold',
        nodeType: 1,
        innerText: 'Click Me',
        getAttribute: jest.fn().mockReturnValue(null),
        parentElement: null
      };

      clickHandler({ target: mockElement });

      expect(breadcrumbStore.add).toHaveBeenCalledWith(expect.objectContaining({
        message: "Usuario hizo click en 'button#btn-1'",
        data: expect.objectContaining({
          text: 'Click Me'
        })
      }));
    });

    it('should bubbling up to find interactive parent', () => {
      interceptors.setupClickInterceptor();
      const clickHandler = interceptors.eventListeners.get('click');

      const parent = {
        tagName: 'A',
        id: 'link-parent',
        nodeType: 1,
        getAttribute: jest.fn().mockReturnValue(null),
        parentElement: null
      };

      const child = {
        tagName: 'SPAN',
        nodeType: 1,
        getAttribute: jest.fn().mockReturnValue(null),
        parentElement: parent
      };

      clickHandler({ target: child });

      expect(breadcrumbStore.add).toHaveBeenCalledWith(expect.objectContaining({
        message: "Usuario hizo click en 'a#link-parent'"
      }));
    });

    it('should trigger throttle and ignore second click', () => {
      interceptors.setupClickInterceptor();
      const clickHandler = interceptors.eventListeners.get('click');
      const target = { tagName: 'BUTTON', nodeType: 1, getAttribute: jest.fn() };

      clickHandler({ target });
      clickHandler({ target });

      expect(breadcrumbStore.add).toHaveBeenCalledTimes(1);
    });

    it('should handle getComputedStyle failure gracefully', () => {
      const spy = jest.spyOn(global.window, 'getComputedStyle').mockImplementation(() => { throw new Error('fail'); });
      interceptors.setupClickInterceptor();
      const clickHandler = interceptors.eventListeners.get('click');
      const target = { tagName: 'BUTTON', nodeType: 1, getAttribute: jest.fn() };

      clickHandler({ target });
      expect(breadcrumbStore.add).toHaveBeenCalled(); // Pass filter because tagName is BUTTON
    });
  });

  describe('setupFetchInterceptor', () => {
    it('should intercept request and chain with original', async () => {
      const mockResp = { status: 200, json: () => Promise.resolve({}) };
      global.fetch = jest.fn().mockResolvedValue(mockResp);

      interceptors.setupFetchInterceptor();
      const res = await global.fetch('https://api.test', { method: 'POST' });

      expect(breadcrumbStore.add).toHaveBeenCalledWith(expect.objectContaining({
        category: 'network',
        message: 'Request: POST https://api.test'
      }));
      expect(res).toBe(mockResp);
    });
  });

  describe('setupErrorInterceptors', () => {
    it('should handle window.onerror and chain', () => {
      const originalHandler = jest.fn().mockReturnValue(true);
      global.onerror = originalHandler;

      interceptors.setupErrorInterceptors();
      const result = global.onerror('msg', 'url', 1, 1, new Error('err'));

      expect(agent.sendError).toHaveBeenCalled();
      expect(originalHandler).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle onunhandledrejection and context collection', () => {
      interceptors.contextTypes = ['device'];
      interceptors.setupErrorInterceptors();

      const event = { reason: new Error('reject') };
      global.onunhandledrejection(event);

      expect(contextCollector.collect).toHaveBeenCalledWith(['device']);
      expect(agent.sendError).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'unhandled_rejection' }),
        { device: 'mock' }
      );
    });

    it('should handle rejection without reason gracefully', () => {
      interceptors.setupErrorInterceptors();
      global.onunhandledrejection({ reason: null });
      expect(agent.sendError).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({ message: 'Rechazo de promesa sin mensaje' })
      }), null);
    });
  });

  describe('destroy', () => {
    it('should restore original globals and remove listeners', () => {
      const originalLog = jest.spyOn(console, 'log').mockImplementation();
      const clickHandler = jest.fn();

      interceptors.init();
      interceptors.destroy();

      expect(interceptors.isInitialized).toBe(false);
      expect(global.document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);

      originalLog.mockRestore();
    });
  });

  describe('handleError', () => {
    it('should priority call custom onError callback', () => {
      const custom = jest.fn();
      interceptors.onError = custom;
      interceptors.handleError({ type: 'test' });
      expect(custom).toHaveBeenCalled();
    });
  });
});