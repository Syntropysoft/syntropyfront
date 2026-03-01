const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock dependencies BEFORE importing the library
jest.mock('../src/core/agent/Agent.js', () => ({
  agent: {
    configure: jest.fn(),
    sendError: jest.fn(),
    forceFlush: jest.fn(),
    getStats: jest.fn().mockReturnValue({}),
    disable: jest.fn(),
    retryFailedItems: jest.fn().mockResolvedValue()
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

jest.mock('../src/core/breadcrumbs/BreadcrumbStore.js', () => ({
  breadcrumbStore: {
    add: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    clear: jest.fn(),
    count: jest.fn().mockReturnValue(0)
  }
}));

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
    it('should have initialized defaults', () => {
      expect(syntropyFront.isActive).toBe(true);
      expect(agent.configure).toHaveBeenCalled();
      expect(interceptors.init).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should update configuration and notify components', () => {
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

    it('should handle legacy fetch config', () => {
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
    it('should delegate addBreadcrumb to breadcrumbStore', () => {
      syntropyFront.addBreadcrumb('test', 'msg', { foo: 'bar' });
      expect(breadcrumbStore.add).toHaveBeenCalledWith({
        category: 'test',
        message: 'msg',
        data: { foo: 'bar' }
      });
    });

    it('should delegate sendError to agent', () => {
      const error = new Error('test');
      syntropyFront.sendError(error, { ctx: 1 });

      expect(agent.sendError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'manual_error',
          error: expect.objectContaining({ message: 'test' })
        }),
        { ctx: 1 }
      );
    });

    it('should delegate flush to agent', async () => {
      await syntropyFront.flush();
      expect(agent.forceFlush).toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      syntropyFront.destroy();
      expect(interceptors.destroy).toHaveBeenCalled();
      expect(agent.disable).toHaveBeenCalled();
      expect(syntropyFront.isActive).toBe(false);
    });
  });
});