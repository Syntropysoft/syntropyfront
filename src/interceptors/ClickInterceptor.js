import { breadcrumbStore } from '../core/breadcrumbs/BreadcrumbStore.js';
import { Environment } from '../utils/Environment.js';

/**
 * Functional fragments: DOM detection and labeling utilities.
 */
export const DOM_UTILS = {
    /**
     * Selector exhaustivo de elementos interactivos.
     */
    INTERACTIVE_SELECTOR: [
        'a', 'button', 'input', 'select', 'textarea', 'label', 'summary',
        '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
        '[role="menuitem"]', '[role="option"]', '[role="switch"]', '[role="tab"]',
        '.interactive', '.btn', '.clickable', // Convention selectors
        '[onclick]', '[ng-click]', '[v-on:click]', '[@click]' // Selectores de framework
    ].join(', '),

    /**
     * Checks if an element has cursor:pointer (pure CSS fallback).
     */
    hasPointerCursor: (el) => {
        try {
            return window.getComputedStyle(el).cursor === 'pointer';
        } catch (e) {
            return false;
        }
    },

    /**
     * Walks up the DOM tree looking for cursor:pointer (declarative, no while).
     */
    findTargetByStyle: (el) => {
        // Guard: element nodes only
        if (!el || el.nodeType !== 1) return null;
        if (DOM_UTILS.hasPointerCursor(el)) return el;
        if (!el.parentElement || el.parentElement === document.body) return null;
        return DOM_UTILS.findTargetByStyle(el.parentElement);
    },

    /**
     * Finds the interactive target using closest() with CSS fallback (declarative).
     */
    findInteractiveTarget: (el) => {
        // Guard: valid element
        if (!el || el === document.body || el.nodeType !== 1) return null;

        // Declarative search via closest()
        return el.closest(DOM_UTILS.INTERACTIVE_SELECTOR) || DOM_UTILS.findTargetByStyle(el);
    },

    /**
     * Generates a readable selector for the element.
     */
    generateSelector: (el) => {
        // Guard: no element
        if (!el) return 'unknown';

        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = (typeof el.className === 'string' && el.className)
            ? `.${el.className.split(' ').filter(Boolean).join('.')}`
            : '';

        return `${tag}${id}${classes}`;
    }
};

/**
 * ClickInterceptor - Interceptor coordinated by functional fragments.
 * Refactored for maximum purity and removal of imperative logic.
 */
export class ClickInterceptor {
    constructor() {
        this.handler = null;
        this.lastClickTime = 0;
        this.THROTTLE_MS = 500;
    }

    init() {
        // Guard: browser environment
        if (!Environment.isBrowser()) return;

        this.handler = (event) => this.processClick(event);
        document.addEventListener('click', this.handler, true);
    }

    /**
     * Pipeline de procesamiento de clic (Pureza funcional).
     */
    processClick(event) {
        const el = event?.target;

        // Guard: throttling and element existence
        if (!el || this.isThrottled()) return;

        const target = DOM_UTILS.findInteractiveTarget(el);
        if (!target) return;

        this.recordBreadcrumb(target);
    }

    /**
     * Flow control to avoid duplicates.
     */
    isThrottled() {
        const now = Date.now();
        const throttled = now - this.lastClickTime < this.THROTTLE_MS;
        if (!throttled) this.lastClickTime = now;
        return throttled;
    }

    /**
     * Records trace in the store.
     */
    recordBreadcrumb(target) {
        const selector = DOM_UTILS.generateSelector(target);

        breadcrumbStore.add({
            category: 'ui',
            message: `User clicked on '${selector}'`,
            data: {
                selector,
                tagName: target.tagName,
                id: target.id || null,
                className: target.className || null,
                text: (target.innerText || target.value || '').substring(0, 30).trim()
            }
        });
    }

    /**
     * Limpieza de recursos.
     */
    destroy() {
        // Guard: browser and handler
        if (!Environment.isBrowser() || !this.handler) return;

        document.removeEventListener('click', this.handler, true);
        this.handler = null;
    }
}
