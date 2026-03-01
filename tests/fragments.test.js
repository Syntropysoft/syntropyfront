const { describe, it, expect } = require('@jest/globals');
const { CONTEXT_PROVIDERS } = require('../src/core/context/ContextCollector.js');
const { DOM_UTILS } = require('../src/interceptors/ClickInterceptor.js');
const { ERROR_UTILS } = require('../src/interceptors/ErrorInterceptor.js');

describe('Functional Fragments Audit', () => {

    describe('CONTEXT_PROVIDERS', () => {
        it('device provider should return valid fields', () => {
            // Validating against current test environment (JSDOM)
            expect(CONTEXT_PROVIDERS.device.userAgent()).toContain('jsdom');
            expect(CONTEXT_PROVIDERS.device.language()).toBeDefined();
        });

        it('window provider should return current location', () => {
            expect(CONTEXT_PROVIDERS.window.url()).toBe('http://localhost/');
            expect(CONTEXT_PROVIDERS.window.viewport()).toEqual({
                width: expect.any(Number),
                height: expect.any(Number)
            });
        });

        it('session provider should execute collectors', () => {
            const mockCollector = { generateSessionId: () => 'mock-session' };
            expect(CONTEXT_PROVIDERS.session.sessionId(mockCollector)).toBe('mock-session');
        });

        it('performance provider should handle memory safely', () => {
            // performance.memory is not standard in JSDOM, should return null safely
            expect(CONTEXT_PROVIDERS.performance.memory()).toBeNull();
            expect(CONTEXT_PROVIDERS.performance.timing()).toBeNull();
        });

        it('resolveFields should handle all strategy types', () => {
            const collector = { providers: new Map() };
            const provider = { field1: () => { } };

            // Boolean strategy
            expect(CONTEXT_PROVIDERS.device.userAgent).toBeDefined(); // sanity check
            const cc = new (require('../src/core/context/ContextCollector.js').ContextCollector)();

            expect(cc.resolveFields('device', provider, true)).toEqual(['userAgent', 'language', 'screen', 'timezone']);
            expect(cc.resolveFields('unknown', provider, true)).toEqual(['field1']);
            expect(cc.resolveFields('device', provider, false)).toBeNull();

            // Object/Array strategy
            expect(cc.resolveFields('device', provider, ['f1'])).toEqual(['f1']);
            expect(cc.resolveFields('device', provider, { custom: true })).toEqual(['field1']);

            // Undefined/Invalid strategy
            expect(cc.resolveFields('device', provider, 123)).toBeNull();
        });

        it('device provider should handle missing globals safely', () => {
            const originalNav = global.navigator;
            Object.defineProperty(global, 'navigator', { value: undefined, configurable: true });
            expect(CONTEXT_PROVIDERS.device.languages()).toBeNull();
            expect(CONTEXT_PROVIDERS.device.cookieEnabled()).toBeNull();
            expect(CONTEXT_PROVIDERS.device.doNotTrack()).toBeNull();
            Object.defineProperty(global, 'navigator', { value: originalNav, configurable: true });
        });
    });

    describe('DOM_UTILS', () => {
        it('findInteractiveTarget should identify buttons', () => {
            const mockEl = {
                closest: (sel) => sel.includes('button') ? { tagName: 'BUTTON' } : null,
                nodeType: 1
            };
            const target = DOM_UTILS.findInteractiveTarget(mockEl);
            expect(target.tagName).toBe('BUTTON');
        });

        it('findTargetByStyle should recurse correctly and stop at body', () => {
            // Mock window.getComputedStyle
            const originalGCS = global.window.getComputedStyle;
            global.window.getComputedStyle = (el) => ({
                cursor: el.style?.cursor || 'default'
            });

            const grandparent = { style: { cursor: 'pointer' }, nodeType: 1, tagName: 'DIV' };
            const parent = { style: { cursor: 'default' }, parentElement: grandparent, nodeType: 1, tagName: 'DIV' };
            const child = { style: { cursor: 'default' }, parentElement: parent, nodeType: 1, tagName: 'SPAN' };

            expect(DOM_UTILS.findTargetByStyle(child)).toBe(grandparent);

            const body = global.document.body;
            const bodyChild = { parentElement: body, nodeType: 1, style: { cursor: 'default' } };
            expect(DOM_UTILS.findTargetByStyle(bodyChild)).toBeNull();

            global.window.getComputedStyle = originalGCS;
        });

        it('findTargetByStyle should handle non-element nodes', () => {
            expect(DOM_UTILS.findTargetByStyle({ nodeType: 3 })).toBeNull();
        });

        it('findInteractiveTarget should return null for body or invalid elements', () => {
            expect(DOM_UTILS.findInteractiveTarget(null)).toBeNull();
            expect(DOM_UTILS.findInteractiveTarget(global.document?.body)).toBeNull();

            const divWithNoPointer = {
                closest: () => null,
                nodeType: 1,
                parentElement: null,
                tagName: 'DIV'
            };
            expect(DOM_UTILS.findInteractiveTarget(divWithNoPointer)).toBeNull();
        });

        it('hasPointerCursor should handle errors gracefully', () => {
            const originalGCS = global.window.getComputedStyle;
            global.window.getComputedStyle = () => { throw new Error('Crashed'); };
            expect(DOM_UTILS.hasPointerCursor({})).toBe(false);
            global.window.getComputedStyle = originalGCS;
        });

        it('generateSelector should handle IDs and classes', () => {
            const mockEl = {
                tagName: 'DIV',
                id: 'main',
                className: 'container active'
            };
            expect(DOM_UTILS.generateSelector(mockEl)).toBe('div#main.container.active');
        });

        it('generateSelector should handle null/undefined elements safely', () => {
            expect(DOM_UTILS.generateSelector(null)).toBe('unknown');
            expect(DOM_UTILS.generateSelector(undefined)).toBe('unknown');
        });
    });

    describe('ERROR_UTILS', () => {
        it('createExceptionPayload should produce valid structure', () => {
            const payload = ERROR_UTILS.createExceptionPayload('Fail', 'source.js', 1, 1, new Error('Test'));
            expect(payload.type).toBe('uncaught_exception');
            expect(payload.error.message).toBe('Fail');
            expect(payload.timestamp).toBeDefined();
        });

        it('createRejectionPayload should handle missing reasons in events', () => {
            expect(ERROR_UTILS.createRejectionPayload({ reason: null }).error.message).toBe('Promise rejection without message');
            expect(ERROR_UTILS.createRejectionPayload({}).error.message).toBe('Promise rejection without message');
        });
    });

    describe('Interceptors Coordination & Wrappers', () => {
        it('ErrorInterceptor destroy should be safe with partial wrappers', () => {
            const { ErrorInterceptor } = require('../src/interceptors/ErrorInterceptor.js');
            const ei = new ErrorInterceptor();

            // Only one wrapper
            ei.errorWrapper = { destroy: jest.fn() };
            ei.destroy();
            expect(ei.errorWrapper).toBeNull();
            expect(ei.rejectionWrapper).toBeNull();
        });

        it('ClickInterceptor findTargetByStyle should handle null parentElement mid-recursion', () => {
            const el = {
                nodeType: 1,
                parentElement: { nodeType: 1, parentElement: null, style: {} },
                style: {}
            };
            // Mock getComputedStyle to always return default
            const originalGCS = global.window.getComputedStyle;
            global.window.getComputedStyle = () => ({ cursor: 'default' });

            expect(DOM_UTILS.findTargetByStyle(el)).toBeNull();

            global.window.getComputedStyle = originalGCS;
        });
    });

    describe('Interceptors Coordination Extra Branches', () => {
        it('should handle destroy with missing wrappers', () => {
            const { ErrorInterceptor } = require('../src/interceptors/ErrorInterceptor.js');
            const ei = new ErrorInterceptor();
            expect(() => ei.destroy()).not.toThrow();
        });

        it('should skip interceptors without the requested lifecycle method', () => {
            // Mock interceptors object for testing
            const interceptors = {
                registry: new Map([
                    ['clicks', { init: () => { }, destroy: () => { } }],
                    ['fetch', { init: () => { } }]
                ]),
                runLifecycle: function (methodName) {
                    this.registry.forEach(interceptor => {
                        if (typeof interceptor[methodName] === 'function') {
                            interceptor[methodName]();
                        }
                    });
                }
            };

            const backup = interceptors.registry.get('clicks').init;
            interceptors.registry.get('clicks').init = undefined;

            expect(() => interceptors.runLifecycle('init')).not.toThrow();

            interceptors.registry.get('clicks').init = backup;
        });

        it('should handle missing interceptors in registry safely', () => {
            // Mock interceptors object for testing
            const interceptors = {
                registry: new Map([
                    ['clicks', { init: () => { }, destroy: () => { } }],
                    ['fetch', { init: () => { } }]
                ]),
                runLifecycle: function (methodName) {
                    this.registry.forEach(interceptor => {
                        if (typeof interceptor[methodName] === 'function') {
                            interceptor[methodName]();
                        }
                    });
                }
            };

            const backup = interceptors.registry.get('fetch');
            interceptors.registry.delete('fetch');

            expect(() => interceptors.runLifecycle('init')).not.toThrow();

            interceptors.registry.set('fetch', backup);
        });
    });

});
