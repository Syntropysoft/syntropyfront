const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

/**
 * Facade tests: we verify BEHAVIOUR (user-visible outcomes and payloads), not just that code ran.
 * Functional: assert payload shape, state changes, and that the right data reaches the agent.
 * Avoid smoke-only: "was called" is not enough; we assert WHAT was passed or WHAT changed.
 */

// Mock dependencies BEFORE importing the library
jest.mock('../src/core/agent/Agent.js', () => ({
  agent: {
    configure: jest.fn(),
    sendError: jest.fn(),
    sendBreadcrumbs: jest.fn(),
    forceFlush: jest.fn(),
    getStats: jest.fn().mockReturnValue({}),
    disable: jest.fn(),
    retryFailedItems: jest.fn().mockResolvedValue(),
    isEnabled: jest.fn().mockReturnValue(true),
    shouldSendBreadcrumbs: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('../src/interceptors/Interceptors.js', () => ({
  interceptors: {
    configure: jest.fn(),
    init: jest.fn(),
    destroy: jest.fn(),
    onError: null
  }
}));

// Real store so that add() really runs and calls onBreadcrumbAdded (facade wires it)
jest.mock('../src/core/breadcrumbs/BreadcrumbStore.js', () => {
  const { BreadcrumbStore } = jest.requireActual('../src/core/breadcrumbs/BreadcrumbStore.js');
  return { breadcrumbStore: new BreadcrumbStore(50) };
});

const { agent } = require('../src/core/agent/Agent.js');
const { interceptors } = require('../src/interceptors/Interceptors.js');
const { breadcrumbStore } = require('../src/core/breadcrumbs/BreadcrumbStore.js');

describe('SyntropyFront Facade', () => {
  let syntropyFront;
  let mockConsoleLog;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });

    // Use isolateModules to ensure a fresh instance with active mocks
    jest.isolateModules(() => {
      syntropyFront = require('../src/index.js').default;
    });
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Initialization', () => {
    it('after init, app is active and agent/interceptors received config (not just "called")', () => {
      expect(syntropyFront.isActive).toBe(true);
      const configCall = agent.configure.mock.calls[0]?.[0];
      expect(configCall).toBeDefined();
      expect(configCall).toHaveProperty('endpoint');
      expect(configCall).toHaveProperty('headers');
      expect(interceptors.init).toHaveBeenCalled();
    });

    it('when configured with endpoint and batchTimeout, adding a breadcrumb sends it to the agent', () => {
      syntropyFront.configure({
        endpoint: 'https://api.test.com',
        batchTimeout: 5000
      });
      syntropyFront.addBreadcrumb('ui', 'User clicked', { selector: '#btn' });

      expect(agent.sendBreadcrumbs).toHaveBeenCalledWith([
        expect.objectContaining({
          category: 'ui',
          message: 'User clicked',
          data: { selector: '#btn' }
        })
      ]);
    });
  });

  describe('Configuration', () => {
    it('should propagate endpoint and options to agent and interceptors', () => {
      syntropyFront.configure({
        maxEvents: 100,
        endpoint: 'https://api.test.com'
      });

      expect(agent.configure).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: 'https://api.test.com'
      }));
      expect(interceptors.configure).toHaveBeenCalledWith(expect.objectContaining({
        captureClicks: true
      }));
    });

    it('should accept legacy fetch-style config (url + options) and map to endpoint/headers', () => {
      syntropyFront.configure({
        fetch: {
          url: 'https://legacy.com',
          options: { headers: { 'X-Test': 'true' } }
        }
      });

      expect(agent.configure).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: 'https://legacy.com',
        headers: { 'X-Test': 'true' }
      }));
    });
  });

  describe('Public API', () => {
    it('addBreadcrumb records category, message and data in the store', () => {
      syntropyFront.addBreadcrumb('test', 'msg', { foo: 'bar' });
      const all = syntropyFront.getBreadcrumbs();
      expect(all).toContainEqual(
        expect.objectContaining({
          category: 'test',
          message: 'msg',
          data: { foo: 'bar' }
        })
      );
    });

    it('sendError sends payload that includes type, error, breadcrumbs array and context', () => {
      syntropyFront.addBreadcrumb('ui', 'before error');
      const error = new Error('test');
      syntropyFront.sendError(error, { ctx: 1 });

      const [payload, context] = agent.sendError.mock.calls[0];
      expect(payload).toMatchObject({
        type: 'manual_error',
        error: expect.objectContaining({ message: 'test' })
      });
      expect(Array.isArray(payload.breadcrumbs)).toBe(true);
      expect(payload.breadcrumbs.some(b => b.message === 'before error')).toBe(true);
      expect(context).toEqual({ ctx: 1 });
    });

    it('flush delegates to agent.forceFlush so pending queue and retries are sent', async () => {
      await syntropyFront.flush();
      expect(agent.forceFlush).toHaveBeenCalled();
    });

    it('destroy stops interceptors and disables agent so app is inactive', () => {
      syntropyFront.destroy();
      expect(interceptors.destroy).toHaveBeenCalled();
      expect(agent.disable).toHaveBeenCalled();
      expect(syntropyFront.isActive).toBe(false);
    });
  });
});