/**
 * Copyright 2024 Syntropysoft
 */

/**
 * FunctionWrapper - Utility for standardizing global handler interception.
 * Provides functional abstractions for safe execution and wrapping.
 */

/**
 * Safely executes a function with a given context and arguments.
 * @param {Function} fn - Function to execute.
 * @param {Object} context - Execution context (this).
 * @param {Array} args - Arguments to pass.
 * @param {string} [label='original handler'] - Diagnostic label for errors.
 * @returns {any} Result of the function execution or undefined if failed.
 */
export const safeApply = (fn, context, args, label = 'original handler') => {
  if (typeof fn !== 'function') return;
  try {
    return fn.apply(context, args);
  } catch (error) {
    // Log for instrumentation but don't crash the host application
    console.error(`SyntropyFront: Error in ${label}:`, error);
    return;
  }
};

/**
 * Wraps a property on a target object using a factory.
 * @param {Object} target - Target object (e.g., window).
 * @param {string} property - Property name (e.g., 'fetch').
 * @param {Function} wrapperFactory - Factory receiving (original) and returning (wrapped).
 * @returns {Object|null} Disposable object with destroy() method.
 */
export const wrap = (target, property, wrapperFactory) => {
  // `in` operator accepts null values (e.g. window.onerror === null by default)
  if (!target || !(property in target)) return null;

  const original = target[property]; // null is a valid initial value
  const wrapped = wrapperFactory(original);

  // Apply the wrap
  target[property] = wrapped;

  return {
    target,
    property,
    original,
    wrapped,
    destroy: () => {
      // Only restore if it hasn't been re-wrapped by someone else (best effort)
      if (target[property] === wrapped) {
        target[property] = original;
      }
    }
  };
};

// Legacy class export for backwards compatibility during transition
export const FunctionWrapper = {
  wrap,
  safeApply
};
