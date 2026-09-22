import EventBus from "./Utils/EventBus.js";
import { EVENTS } from "./Utils/EVENTS.js";

export const BOOT_STATES = Object.freeze({
    LOADING: "loading",
    READY: "ready",
    FAILED: "failed",
});

/**
 * The boot state machine — `loading -> ready | failed`.
 *
 * This is the fix for the most serious defect in the previous version: the
 * preloader was a full-screen opaque overlay with a colossal z-index, and the
 * only code path that dismissed it required BOTH the 435 KB model and a 2.4 MB
 * video to load successfully. No WebGL, a dropped request, or a slow connection
 * left the reader staring at three dots — and left crawlers and social scrapers
 * with a page that had no visible content.
 *
 * Now the boot settles *exactly once*, always. On failure the scene is hidden,
 * `is-degraded` lands on <body>, and the page is plain, readable HTML.
 */
export default class Boot extends EventBus {
    constructor({ timeout = 20000 } = {}) {
        super();
        this.state = BOOT_STATES.LOADING;
        this.reason = null;
        this.error = null;

        this.syncBodyState();
        this.watchdog = window.setTimeout(() => this.fail("timeout"), timeout);
    }

    get isLoading() {
        return this.state === BOOT_STATES.LOADING;
    }

    get isDegraded() {
        return this.state === BOOT_STATES.FAILED;
    }

    ready() {
        this.settle(BOOT_STATES.READY);
    }

    fail(reason, error = null) {
        this.reason = reason;
        this.error = error;
        console.warn(`[boot] degraded — reason: ${reason}`, error ?? "");
        this.settle(BOOT_STATES.FAILED);
    }

    settle(state) {
        // Idempotent: whichever signal arrives first wins.
        if (!this.isLoading) {
            return;
        }
        window.clearTimeout(this.watchdog);
        this.watchdog = null;
        this.state = state;
        this.syncBodyState();
        this.emit(EVENTS.BOOT_STATE, state, this.reason);
    }

    /**
     * The classes the CSS keys off — on <html>, matching the inline head script
     * that sets `js` + `is-loading` before first paint. One element, one contract.
     */
    syncBodyState() {
        const { documentElement } = document;
        documentElement.classList.toggle("is-loading", this.state === BOOT_STATES.LOADING);
        documentElement.classList.toggle("is-ready", this.state === BOOT_STATES.READY);
        documentElement.classList.toggle("is-degraded", this.state === BOOT_STATES.FAILED);
        documentElement.classList.toggle(
            "is-degraded-no-webgl",
            this.state === BOOT_STATES.FAILED && this.reason === "no-webgl"
        );
    }

    /** Resolves with the final state — never rejects, so callers cannot hang. */
    whenSettled() {
        if (!this.isLoading) {
            return Promise.resolve(this.state);
        }
        return new Promise((resolve) => {
            this.once(EVENTS.BOOT_STATE, (state) => resolve(state));
        });
    }
}
