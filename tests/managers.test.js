import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BreadcrumbManager } from '../src/core/BreadcrumbManager.js';
import { ErrorManager } from '../src/core/ErrorManager.js';
import { Logger } from '../src/core/Logger.js';

describe('BreadcrumbManager', () => {
  let breadcrumbManager;

  beforeEach(() => {
    breadcrumbManager = new BreadcrumbManager();
  });

  describe('add', () => {
    it('should add breadcrumb with timestamp', () => {
      const breadcrumb = breadcrumbManager.add('user', 'test action', { data: 'value' });
      
      expect(breadcrumb).toHaveProperty('category', 'user');
      expect(breadcrumb).toHaveProperty('message', 'test action');
      expect(breadcrumb).toHaveProperty('data', { data: 'value' });
      expect(breadcrumb).toHaveProperty('timestamp');
      expect(new Date(breadcrumb.timestamp)).toBeInstanceOf(Date);
    });

    it('should add breadcrumb without data', () => {
      const breadcrumb = breadcrumbManager.add('system', 'event');
      
      expect(breadcrumb.category).toBe('system');
      expect(breadcrumb.message).toBe('event');
      expect(breadcrumb.data).toEqual({});
    });
  });

  describe('getAll', () => {
    it('should return all breadcrumbs in order', () => {
      breadcrumbManager.add('user', 'first');
      breadcrumbManager.add('system', 'second');
      breadcrumbManager.add('http', 'third');
      
      const breadcrumbs = breadcrumbManager.getAll();
      
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].message).toBe('first');
      expect(breadcrumbs[1].message).toBe('second');
      expect(breadcrumbs[2].message).toBe('third');
    });

    it('should return empty array when no breadcrumbs', () => {
      expect(breadcrumbManager.getAll()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all breadcrumbs', () => {
      breadcrumbManager.add('user', 'test');
      expect(breadcrumbManager.getAll()).toHaveLength(1);
      
      breadcrumbManager.clear();
      expect(breadcrumbManager.getAll()).toHaveLength(0);
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(breadcrumbManager.getCount()).toBe(0);
      
      breadcrumbManager.add('user', 'test1');
      expect(breadcrumbManager.getCount()).toBe(1);
      
      breadcrumbManager.add('system', 'test2');
      expect(breadcrumbManager.getCount()).toBe(2);
      
      breadcrumbManager.clear();
      expect(breadcrumbManager.getCount()).toBe(0);
    });
  });
});

describe('ErrorManager', () => {
  let errorManager;

  beforeEach(() => {
    errorManager = new ErrorManager();
  });

  describe('send', () => {
    it('should create error data with context', () => {
      const error = new Error('Test error');
      const context = { userId: 123, action: 'test' };
      
      const errorData = errorManager.send(error, context);
      
      expect(errorData).toHaveProperty('message', 'Test error');
      expect(errorData).toHaveProperty('stack');
      expect(errorData).toHaveProperty('context', context);
      expect(errorData).toHaveProperty('timestamp');
    });

    it('should handle error without context', () => {
      const error = new Error('Simple error');
      
      const errorData = errorManager.send(error);
      
      expect(errorData.message).toBe('Simple error');
      expect(errorData.context).toEqual({});
    });

    it('should handle non-Error objects', () => {
      const errorData = errorManager.send('String error', { test: true });
      
      expect(errorData).toHaveProperty('message');
      expect(errorData.context).toEqual({ test: true });
    });
  });

  describe('getAll', () => {
    it('should return all errors in order', () => {
      errorManager.send(new Error('First error'));
      errorManager.send(new Error('Second error'));
      
      const errors = errorManager.getAll();
      
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('First error');
      expect(errors[1].message).toBe('Second error');
    });

    it('should return empty array when no errors', () => {
      expect(errorManager.getAll()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all errors', () => {
      errorManager.send(new Error('test'));
      expect(errorManager.getAll()).toHaveLength(1);
      
      errorManager.clear();
      expect(errorManager.getAll()).toHaveLength(0);
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(errorManager.getCount()).toBe(0);
      
      errorManager.send(new Error('test1'));
      expect(errorManager.getCount()).toBe(1);
      
      errorManager.send(new Error('test2'));
      expect(errorManager.getCount()).toBe(2);
      
      errorManager.clear();
      expect(errorManager.getCount()).toBe(0);
    });
  });
});

describe('Logger', () => {
  let logger;
  let mockConsoleLog;
  let mockConsoleError;
  let mockConsoleWarn;

  beforeEach(() => {
    logger = new Logger();
    
    mockConsoleLog = vi.fn();
    mockConsoleError = vi.fn();
    mockConsoleWarn = vi.fn();
    
    global.console.log = mockConsoleLog;
    global.console.error = mockConsoleError;
    global.console.warn = mockConsoleWarn;
  });

  describe('constructor', () => {
    it('should initialize with silent mode by default', () => {
      expect(logger.isSilent).toBe(true);
    });
  });

  describe('log', () => {
    it('should log when not silent', () => {
      logger.enableLogging();
      logger.log('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Test message');
    });

    it('should not log when silent', () => {
      logger.disableLogging();
      logger.log('Test message');
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle data parameter', () => {
      logger.enableLogging();
      logger.log('Message', { data: 'value' });
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Message', { data: 'value' });
    });
  });

  describe('error', () => {
    it('should always log errors regardless of silent mode', () => {
      logger.disableLogging();
      logger.error('Error message');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error message');
    });

    it('should handle data parameter', () => {
      logger.error('Error', { details: 'test' });
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error', { details: 'test' });
    });
  });

  describe('warn', () => {
    it('should always warn regardless of silent mode', () => {
      logger.disableLogging();
      logger.warn('Warning message');
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Warning message');
    });

    it('should handle data parameter', () => {
      logger.warn('Warning', { details: 'test' });
      
      expect(mockConsoleWarn).toHaveBeenCalledWith('Warning', { details: 'test' });
    });
  });

  describe('enableLogging/disableLogging', () => {
    it('should change silent mode', () => {
      logger.enableLogging();
      expect(logger.isSilent).toBe(false);
      
      logger.disableLogging();
      expect(logger.isSilent).toBe(true);
    });

    it('should affect logging behavior', () => {
      logger.enableLogging();
      logger.log('Should log');
      expect(mockConsoleLog).toHaveBeenCalledWith('Should log');
      
      vi.clearAllMocks();
      
      logger.disableLogging();
      logger.log('Should not log');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });
}); 