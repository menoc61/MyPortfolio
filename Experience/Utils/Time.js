import EventBus from "./EventBus.js";
import { EVENTS } from "./EVENTS.js";

/**
 * The animation loop.
 *
 * Changed from the original: it chained `requestAnimationFrame` forever, even in
 * a hidden tab, burning battery to render a scene nobody could see. It now
 * suspends while the document is hidden and stops emitting ticks — the renderer
 * follows the tick, so rendering stops too.
 *
 * `delta` stays in milliseconds; the animation mixer scales it down.
 */
export default class Time extends EventBus {
    constructor() {
        super();
        this.start = performance.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 16;
        this.paused = document.hidden;

        document.addEventListener("visibilitychange", () => {
            this.paused = document.hidden;
            // Reset the clock on resume: a multi-minute delta would teleport the
            // mixer and every interpolated value.
            this.current = performance.now();
        });

        this.tick = this.tick.bind(this);
        this.raf = requestAnimationFrame(this.tick);
    }

    tick() {
        this.raf = requestAnimationFrame(this.tick);

        const now = performance.now();
        this.delta = now - this.current;
        this.current = now;
        this.elapsed = now - this.start;

        if (this.paused) {
            return;
        }

        this.emit(EVENTS.TIME_TICK);
    }
}
