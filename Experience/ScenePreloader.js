/**
 * A custom, animated preloader that is mounted on scroll or on an explicit
 * trigger, and that only finishes once the 3D model has been fully loaded and
 * mounted into the scene.
 *
 * Two behaviours, both wired to the same visual:
 *  1. Entrance gate — the overlay ships visible in the HTML and covers the page
 *     while the GLB loads. It clears ONLY on `finish()`, which Experience calls
 *     from its WORLD_READY handler — i.e. only when the model is fully
 *     downloaded, parsed and mounted in the scene.
 *  2. Mountable overlay — `mount({ mode })` replays the animation on an
 *     explicit trigger, and a ScrollTrigger replays it when the footer enters
 *     the viewport. A replay self-clears once the model is already loaded.
 *
 * On a failed boot (no WebGL, timeout, dead asset) the overlay hides itself at
 * once (see `forceHide`) — it can never trap the reader behind an opaque layer.
 * Under `prefers-reduced-motion: reduce` the spinner keeps turning (Tier 3 in
 * CONTEXT.md) but the entrance tweens are dropped.
 */

import GSAP from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { dom } from "./Utils/dom.js";
import { EVENTS } from "./Utils/EVENTS.js";
import { BOOT_STATES } from "./Boot.js";

GSAP.registerPlugin(ScrollTrigger);

/** How long a trigger/scroll replay stays up once the model is already loaded. */
const REPLAY_DURATION = 1600;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export default class ScenePreloader {
    /** @param {{ boot?: import("./Boot.js").default }} [options] */
    constructor({ boot = null } = {}) {
        this.root = dom.scenePreloader ?? document.getElementById("scene-preloader");
        this.boot = boot;

        this.stage = this.root?.querySelector(".scene-preloader__stage") ?? null;
        this.spinner = this.root?.querySelector(".scene-preloader__spinner") ?? null;
        this.label = this.root?.querySelector(".scene-preloader__title") ?? null;
        this.barFill = this.root?.querySelector(".scene-preloader__bar-fill") ?? null;

        /** True once the model has fully loaded AND mounted (WORLD_READY seen). */
        this._done = false;
        /** True after a boot failure — the overlay stays hidden from then on. */
        this._failed = false;
        /** GLB byte progress mapped to 0–90. finish() owns 90→100. */
        this._progress = 0;

        this._entrance = null;
        this._spins = [];
        this._replayTimer = null;
        this._scrollTrigger = null;
        this._disposers = [];

        if (!this.root) {
            console.warn("[scene-preloader] mount point missing — gate disabled");
            return;
        }

        // From first paint the overlay IS the gate; now the script owns it, so
        // make it visible to assistive tech as well.
        this.root.setAttribute("aria-hidden", "false");
        this._applyProgress(0);
        this._animateEntrance();

        // A failed boot must never leave the reader behind an opaque overlay.
        if (this.boot) {
            this._disposers.push(
                this.boot.on(EVENTS.BOOT_STATE, (state) => {
                    if (state === BOOT_STATES.FAILED) {
                        this.forceHide();
                    }
                })
            );
        }

        // Trigger mounts: every element carrying the attribute replays it.
        this._onTriggerClick = (event) => {
            event.preventDefault();
            this.mount({ mode: "trigger" });
        };
        this._triggerButtons = [
            ...document.querySelectorAll("[data-scene-preloader-trigger]"),
        ];
        for (const button of this._triggerButtons) {
            button.addEventListener("click", this._onTriggerClick);
        }

        // Scroll mount: entering the footer replays the preloader.
        const scrollMount = document.querySelector("[data-scene-preloader-scroll]");
        if (scrollMount) {
            this._scrollTrigger = ScrollTrigger.create({
                trigger: scrollMount,
                start: "top 85%",
                onEnter: () => this.mount({ mode: "scroll" }),
            });
        }
    }

    /* ------------------------------------------------------------- progress */

    /**
     * Live progress from Resources. Only the GLB ("room") carries bytes — the
     * optional screen video may finish whenever it likes.
     *
     * @param {string} name
     * @param {{ loaded?: number, total?: number }} [stats]
     */
    onResourceProgress(name, stats = {}) {
        if (this._done || this._failed || name !== "room") {
            return;
        }
        const { loaded = 0, total = 0 } = stats;
        if (total > 0) {
            this._applyProgress(Math.min(loaded / total, 1) * 90);
        }
    }

    _applyProgress(percent) {
        this._progress = Math.min(Math.max(percent, 0), 100);
        if (this.barFill) {
            this.barFill.style.transform = `scaleX(${this._progress / 100})`;
        }
    }

    /* -------------------------------------------------------- mount / finish */

    /**
     * The ONLY signal that may clear the gate: the 3D model is fully loaded
     * and mounted. Experience calls this from WORLD_READY — nowhere else.
     */
    finish() {
        if (!this.root || this._done) {
            return;
        }
        this._done = true;

        // Snap the bar, relabel, hold a beat, then lift the curtain — the
        // first-commit intro (Preloader.js) takes the stage underneath.
        this._applyProgress(100);
        if (this.label) {
            this.label.textContent = "Ready";
        }
        this._replayTimer = window.setTimeout(
            () => this._unmount(),
            reducedMotion.matches ? 0 : 450
        );
    }

    /**
     * Mountable on trigger and on scroll. With the model already loaded this is
     * a self-clearing replay; while it is still loading this becomes the gate
     * again and only `finish()` may clear it.
     *
     * @param {{ mode?: "trigger" | "scroll" }} [options]
     */
    mount({ mode = "trigger" } = {}) {
        if (!this.root || this._failed) {
            return;
        }

        window.clearTimeout(this._replayTimer);
        this._replayTimer = null;

        this.root.classList.remove("is-hidden", "scene-preloader--scroll");
        this.root.setAttribute("aria-hidden", "false");
        if (mode === "scroll") {
            this.root.classList.add("scene-preloader--scroll");
        }

        if (this._done) {
            this._animateEntrance();
            this._replayTimer = window.setTimeout(
                () => this._unmount(),
                reducedMotion.matches ? 400 : REPLAY_DURATION
            );
            return;
        }

        // Still loading: restore real progress and wait for finish().
        this._animateEntrance();
        this._applyProgress(this._progress);
    }

    /* -------------------------------------------------------------- teardown */

    /** Boot failed — hide at once so the readable degraded page shows. */
    forceHide() {
        this._failed = true;
        if (!this.root) {
            return;
        }
        window.clearTimeout(this._replayTimer);
        this._replayTimer = null;
        this._killEntrance();
        this._killSpins();
        GSAP.killTweensOf([this.stage, this.spinner].filter(Boolean));
        this.root.style.display = "none";
        this.root.classList.add("is-hidden");
        this.root.setAttribute("aria-hidden", "true");
    }

    _unmount() {
        if (!this.root) {
            return;
        }
        this._killEntrance();
        this._killSpins();
        GSAP.killTweensOf([this.stage, this.spinner].filter(Boolean));
        this.root.classList.add("is-hidden");
        this.root.setAttribute("aria-hidden", "true");
    }

    /* ------------------------------------------------------------- animation */

    /** Entrance. Under reduced motion: place the final state, no tweens. */
    _animateEntrance() {
        this._killEntrance();
        if (!this.stage || !this.spinner) {
            return;
        }
        if (reducedMotion.matches) {
            GSAP.set(this.stage, { opacity: 1, scale: 1 });
            GSAP.set(this.spinner, { opacity: 1, scale: 1 });
            return;
        }

        GSAP.set(this.stage, { opacity: 0, scale: 0.96 });
        GSAP.set(this.spinner, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });

        this._entrance = GSAP.timeline({ onComplete: () => this._pulse() })
            .to(this.stage, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" })
            .to(
                this.spinner,
                { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" },
                0
            );
    }

    /** Idle counter-rotating rings while the overlay is on screen. */
    _pulse() {
        if (!this.spinner) {
            return;
        }
        const ringA = this.spinner.querySelector(".scene-preloader__ring--a");
        const ringB = this.spinner.querySelector(".scene-preloader__ring--b");
        if (!ringA || !ringB) {
            return;
        }
        this._killSpins();
        const spinA = GSAP.to(ringA, {
            rotation: 360,
            duration: 1.4,
            repeat: -1,
            ease: "none",
            transformOrigin: "50% 50%",
        });
        const spinB = GSAP.to(ringB, {
            rotation: -360,
            duration: 1.8,
            repeat: -1,
            ease: "none",
            transformOrigin: "50% 50%",
        });
        this._spins = [spinA, spinB];
    }

    _killEntrance() {
        this._entrance?.kill();
        this._entrance = null;
    }

    _killSpins() {
        for (const spin of this._spins) {
            spin.kill();
        }
        this._spins = [];
    }

    destroy() {
        window.clearTimeout(this._replayTimer);
        this._replayTimer = null;
        this._scrollTrigger?.kill();
        this._scrollTrigger = null;

        for (const button of this._triggerButtons ?? []) {
            button.removeEventListener("click", this._onTriggerClick);
        }
        for (const dispose of this._disposers) {
            dispose();
        }
        this._disposers = [];

        this._killEntrance();
        this._killSpins();
        GSAP.killTweensOf([this.stage, this.spinner].filter(Boolean));
    }
}
