const { describe, it, expect } = require('@jest/globals');
const { Environment } = require('../src/utils/Environment.js');

describe('Environment', () => {

    describe('isBrowser', () => {
        it('should return true when window and document are defined', () => {
            expect(Environment.isBrowser()).toBe(true);
        });
    });

    describe('getGlobal', () => {
        it('should return window when defined', () => {
            expect(Environment.getGlobal()).toBe(global.window);
        });
    });

    describe('hasApi', () => {
        it('should return true for a shallow global API that exists', () => {
            expect(Environment.hasApi('navigator')).toBe(true);
        });

        it('should return true for a nested API that exists', () => {
            expect(Environment.hasApi('navigator.userAgent')).toBe(true);
        });

        it('should return false when the first-level key does not exist', () => {
            expect(Environment.hasApi('nonExistentApi_xyz')).toBe(false);
        });

        it('should return false when an intermediate segment is undefined', () => {
            // navigator.connection is undefined in jsdom → effectiveType is unreachable
            expect(Environment.hasApi('navigator.connection.effectiveType')).toBe(false);
        });
    });

    describe('runIf', () => {
        it('should execute task and return its result when string condition is met', () => {
            expect(Environment.runIf('navigator', () => 'ok')).toBe('ok');
        });

        it('should return null (default fallback) when string condition is NOT met', () => {
            expect(Environment.runIf('nonExistentApi_xyz', () => 'ok')).toBeNull();
        });

        it('should return custom fallback when string condition is NOT met', () => {
            expect(Environment.runIf('nonExistentApi_xyz', () => 'ok', 'fallback')).toBe('fallback');
        });

        it('should execute task when function condition returns true', () => {
            expect(Environment.runIf(() => true, () => 'met')).toBe('met');
        });

        it('should return fallback when function condition returns false', () => {
            expect(Environment.runIf(() => false, () => 'met', 'notMet')).toBe('notMet');
        });
    });
});
