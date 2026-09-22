import EventBus from "./EventBus.js";
import { EVENTS } from "./EVENTS.js";
import { LAYOUT, PROFILES, RENDER } from "../Config/scene.config.js";

/**
 * Viewport facts + the active device profile.
 *
 * Changed from the original:
 *  - `frustrum` (misspelled) is now `frustum`, and lives in Config, not here.
 *  - DPR is clamped per profile. `min(devicePixelRatio, 2)` still rendered 4x the
 *    pixels on a 2x screen and 9x on a 3x screen, for a diorama that reads the same.
 *  - `profile` exposes the whole named PROFILES entry, so nothing downstream
 *    re-hard-codes "0.11 vs 0.07".
 */
export default class Sizes extends EventBus {
    constructor({ breakpoint = LAYOUT.mobileBreakpoint } = {}) {
        super();
        this.breakpoint = breakpoint;
        this.measure(true);

        window.addEventListener("resize", () => this.measure(), { passive: true });
        window.addEventListener("orientationchange", () => this.measure());
    }

    measure(initial = false) {
        const previous = this.name;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspect = this.width / this.height;
        this.name = this.width < this.breakpoint ? "mobile" : "desktop";
        this.profile = PROFILES[this.name];
        this.pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            RENDER.maxPixelRatio[this.name]
        );

        if (initial) {
            return;
        }

        this.emit(EVENTS.SIZES_RESIZE);
        if (this.name !== previous) {
            this.emit(EVENTS.SIZES_PROFILE_CHANGE, this.profile);
        }
    }
}
