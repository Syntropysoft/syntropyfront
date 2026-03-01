const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { BreadcrumbStore } = require('../src/core/breadcrumbs/BreadcrumbStore.js');

/**
 * Store tests: we verify BEHAVIOUR (state after actions, callback contract), not just "no throw".
 * Assert getAll() / count() / getByCategory() outcomes.
 * For callbacks: assert they receive the right data and that add() still updates state when callback throws.
 */

describe('BreadcrumbStore', () => {
  let store;

  beforeEach(() => {
    store = new BreadcrumbStore(5); // Small limit for testing
  });

  afterEach(() => {
    store.clear();
  });

  describe('Constructor', () => {
    it('should initialize with default maxBreadcrumbs', () => {
      const defaultStore = new BreadcrumbStore();
      expect(defaultStore.maxBreadcrumbs).toBe(25);
      expect(defaultStore.breadcrumbs).toEqual([]);
      expect(defaultStore.onBreadcrumbAdded).toBeNull();
    });

    it('should initialize with custom maxBreadcrumbs', () => {
      expect(store.maxBreadcrumbs).toBe(5);
      expect(store.breadcrumbs).toEqual([]);
    });

    it('should validate maxBreadcrumbs parameter', () => {
      const storeWithZero = new BreadcrumbStore(0);
      expect(storeWithZero.maxBreadcrumbs).toBe(0);

      const storeWithNegative = new BreadcrumbStore(-1);
      expect(storeWithNegative.maxBreadcrumbs).toBe(-1);
    });
  });

  describe('onBreadcrumbAdded callback', () => {
    it('when set, is called with the new breadcrumb on add', () => {
      const onAdd = jest.fn();
      store.onBreadcrumbAdded = onAdd;

      store.add({ category: 'test', message: 'test message' });

      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test',
          message: 'test message'
        })
      );
    });

    it('when not set, add still stores the breadcrumb', () => {
      store.onBreadcrumbAdded = null;
      store.add({ category: 'x', message: 'y' });
      expect(store.getAll()).toHaveLength(1);
      expect(store.getAll()[0]).toMatchObject({ category: 'x', message: 'y' });
    });

    it('when callback throws, add does not throw and logs', () => {
      store.onBreadcrumbAdded = () => { throw new Error('callback error'); };
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => store.add({ category: 'test', message: 'msg' })).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('SyntropyFront: Error in onBreadcrumbAdded:', expect.any(Error));
      expect(store.getAll()).toHaveLength(1);

      spyWarn.mockRestore();
    });
  });

  describe('setMaxBreadcrumbs', () => {
    it('should update maxBreadcrumbs', () => {
      store.setMaxBreadcrumbs(10);
      expect(store.maxBreadcrumbs).toBe(10);
    });

    it('should truncate breadcrumbs when new max is smaller', () => {
      // Agregar 5 breadcrumbs
      for (let i = 0; i < 5; i++) {
        store.add({ category: 'test', message: `test ${i}` });
      }
      expect(store.breadcrumbs).toHaveLength(5);

      // Reduce max to 3
      store.setMaxBreadcrumbs(3);
      expect(store.maxBreadcrumbs).toBe(3);
      expect(store.breadcrumbs).toHaveLength(3);
      expect(store.breadcrumbs[0].message).toBe('test 2'); // Last 3 kept
      expect(store.breadcrumbs[2].message).toBe('test 4');
    });

    it('should handle zero maxBreadcrumbs', () => {
      store.add({ category: 'test', message: 'test' });
      store.setMaxBreadcrumbs(0);
      // setMaxBreadcrumbs only trims when current length > new max
      // With 1 breadcrumb and new max 0, current behaviour leaves 1 (known limitation)
      expect(store.breadcrumbs).toHaveLength(1);
    });

    it('should handle negative maxBreadcrumbs', () => {
      store.add({ category: 'test', message: 'test' });
      store.setMaxBreadcrumbs(-1);
      expect(store.breadcrumbs).toHaveLength(0);
    });
  });

  describe('getMaxBreadcrumbs', () => {
    it('should return current maxBreadcrumbs value', () => {
      expect(store.getMaxBreadcrumbs()).toBe(5);

      store.setMaxBreadcrumbs(15);
      expect(store.getMaxBreadcrumbs()).toBe(15);
    });
  });

  describe('add', () => {
    it('should add breadcrumb with timestamp', () => {
      const crumb = { category: 'test', message: 'test message' };
      store.add(crumb);

      expect(store.breadcrumbs).toHaveLength(1);
      expect(store.breadcrumbs[0].category).toBe('test');
      expect(store.breadcrumbs[0].message).toBe('test message');
      expect(store.breadcrumbs[0].timestamp).toBeDefined();
      expect(new Date(store.breadcrumbs[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should add breadcrumb with additional data', () => {
      const crumb = {
        category: 'test',
        message: 'test message',
        data: { userId: 123, action: 'click' }
      };
      store.add(crumb);

      expect(store.breadcrumbs[0].data).toEqual({ userId: 123, action: 'click' });
    });

    it('should respect maxBreadcrumbs limit', () => {
      // Add 6 breadcrumbs when limit is 5
      for (let i = 0; i < 6; i++) {
        store.add({ category: 'test', message: `test ${i}` });
      }

      expect(store.breadcrumbs).toHaveLength(5);
      expect(store.breadcrumbs[0].message).toBe('test 1'); // First one dropped
      expect(store.breadcrumbs[4].message).toBe('test 5'); // Last kept
    });

    it('should handle exact maxBreadcrumbs limit', () => {
      // Agregar exactamente 5 breadcrumbs
      for (let i = 0; i < 5; i++) {
        store.add({ category: 'test', message: `test ${i}` });
      }

      expect(store.breadcrumbs).toHaveLength(5);
      expect(store.breadcrumbs[0].message).toBe('test 0');
      expect(store.breadcrumbs[4].message).toBe('test 4');
    });

    it('calls onBreadcrumbAdded with the new breadcrumb (with timestamp) and stores it', () => {
      const callback = jest.fn();
      store.onBreadcrumbAdded = callback;

      store.add({ category: 'test', message: 'test message' });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        category: 'test',
        message: 'test message',
        timestamp: expect.any(String)
      }));
      expect(store.getAll()).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('should return copy of breadcrumbs array', () => {
      store.add({ category: 'test', message: 'test 1' });
      store.add({ category: 'test', message: 'test 2' });

      const result = store.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('test 1');
      expect(result[1].message).toBe('test 2');

      // Verify it's a copy of the array, not the original reference
      // Pero los objetos dentro siguen siendo referencias (copia superficial)
      result[0].message = 'modified';
      expect(store.breadcrumbs[0].message).toBe('modified'); // Cambia porque es referencia al mismo objeto

      // Verify the array is different
      expect(result).not.toBe(store.breadcrumbs);
    });

    it('should return empty array when no breadcrumbs', () => {
      const result = store.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all breadcrumbs', () => {
      store.add({ category: 'test', message: 'test 1' });
      store.add({ category: 'test', message: 'test 2' });

      expect(store.breadcrumbs).toHaveLength(2);

      store.clear();
      expect(store.breadcrumbs).toHaveLength(0);
      expect(store.breadcrumbs).toEqual([]);
    });

    it('should work when already empty', () => {
      expect(store.breadcrumbs).toHaveLength(0);
      store.clear();
      expect(store.breadcrumbs).toHaveLength(0);
    });
  });

  describe('getByCategory', () => {
    it('should return breadcrumbs for specific category', () => {
      store.add({ category: 'ui', message: 'click' });
      store.add({ category: 'network', message: 'fetch' });
      store.add({ category: 'ui', message: 'scroll' });
      store.add({ category: 'error', message: 'exception' });

      const uiBreadcrumbs = store.getByCategory('ui');
      expect(uiBreadcrumbs).toHaveLength(2);
      expect(uiBreadcrumbs[0].message).toBe('click');
      expect(uiBreadcrumbs[1].message).toBe('scroll');

      const networkBreadcrumbs = store.getByCategory('network');
      expect(networkBreadcrumbs).toHaveLength(1);
      expect(networkBreadcrumbs[0].message).toBe('fetch');
    });

    it('should return empty array for non-existent category', () => {
      store.add({ category: 'ui', message: 'click' });

      const result = store.getByCategory('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return empty array when no breadcrumbs', () => {
      const result = store.getByCategory('ui');
      expect(result).toEqual([]);
    });

    it('should handle case-sensitive category matching', () => {
      store.add({ category: 'UI', message: 'click' });

      const result = store.getByCategory('ui');
      expect(result).toEqual([]); // Case-sensitive, no match
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty breadcrumb object', () => {
      store.add({});
      expect(store.breadcrumbs).toHaveLength(1);
      expect(store.breadcrumbs[0]).toHaveProperty('timestamp');
    });

    it('should handle breadcrumb with null values', () => {
      store.add({ category: null, message: null, data: null });
      expect(store.breadcrumbs).toHaveLength(1);
      expect(store.breadcrumbs[0].category).toBeNull();
      expect(store.breadcrumbs[0].message).toBeNull();
      expect(store.breadcrumbs[0].data).toBeNull();
    });

    it('should handle breadcrumb with undefined values', () => {
      store.add({ category: undefined, message: undefined, data: undefined });
      expect(store.breadcrumbs).toHaveLength(1);
      expect(store.breadcrumbs[0].category).toBeUndefined();
      expect(store.breadcrumbs[0].message).toBeUndefined();
      expect(store.breadcrumbs[0].data).toBeUndefined();
    });

    it('should handle maxBreadcrumbs of 1', () => {
      const singleStore = new BreadcrumbStore(1);
      singleStore.add({ category: 'test', message: 'first' });
      singleStore.add({ category: 'test', message: 'second' });

      expect(singleStore.breadcrumbs).toHaveLength(1);
      expect(singleStore.breadcrumbs[0].message).toBe('second');
    });
  });
}); 