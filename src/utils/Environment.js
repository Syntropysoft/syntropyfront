/**
 * Environment - Centralized detection of browser environment and capabilities.
 * Browser-only: targets modern browsers per browserslist config.
 */
export const Environment = {
  /**
     * Returns true if running in a browser context.
     */
  isBrowser: () => typeof window !== 'undefined' && typeof document !== 'undefined',

  /**
     * Returns the global browser object, or empty object as safe fallback.
     */
  getGlobal: () => (typeof window !== 'undefined' ? window : {}),

  /**
     * Checks availability of a nested global API via dot-notation path.
     * @param {string} apiPath - e.g. 'navigator.connection' or 'crypto.randomUUID'
     * @returns {boolean}
     */
  hasApi: (apiPath) => {
    return apiPath.split('.').reduce((current, part) => {
      if (current === null || current === undefined) return null;
      return current[part] !== undefined ? current[part] : null;
    }, Environment.getGlobal()) !== null;
  },

  /**
     * Executes a task only if a condition is met; returns fallback otherwise.
     * @param {string|Function} condition - API path string or boolean-returning function.
     * @param {Function} task - Operation to execute when condition is met.
     * @param {any} fallback - Default value when condition is not met.
     * @returns {any}
     */
  runIf: (condition, task, fallback = null) => {
    const isMet = typeof condition === 'function' ? condition() : Environment.hasApi(condition);
    return isMet ? task() : fallback;
  }
};
