/**
 * Minimal event emitter.
 *
 * Replaces the Node `events` polyfill, which was being bundled into client JS
 * (six modules imported it) purely to get `.on()` / `.emit()`.
 */
export default class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /**
     * Subscribe. Returns an unsubscribe function so callers can clean up
     * without having to remember the exact function reference.
     */
    on(event, handler) {
        if (typeof handler !== "function") {
            throw new TypeError(`EventBus.on("${event}") expects a function`);
        }
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);

        return () => this.off(event, handler);
    }

    once(event, handler) {
        const off = this.on(event, (...args) => {
            off();
            handler(...args);
        });
        return off;
    }

    off(event, handler) {
        const handlers = this.listeners.get(event);
        if (!handlers) {
            return;
        }
        handlers.delete(handler);
        if (handlers.size === 0) {
            this.listeners.delete(event);
        }
    }

    emit(event, ...args) {
        const handlers = this.listeners.get(event);
        if (!handlers) {
            return;
        }
        // Copy first: a handler may unsubscribe itself or others.
        for (const handler of [...handlers]) {
            handler(...args);
        }
    }

    /** Drop every listener. Used on teardown. */
    clear() {
        this.listeners.clear();
    }
}
