import GSAP from "gsap";

import { dom } from "./Utils/dom.js";
import splitTextToSpans from "./Utils/splitTextToSpans.js";
import { INTRO } from "./Config/scene.config.js";
import { INTRO_REVEAL, INTRO_CHAIR_SPIN } from "./Config/roomParts.js";

/**
 * How long we wait for the reader to make an intentional gesture before starting
 * anyway.
 *
 * Kept deliberately short. The hero heading is the page's LCP element and its
 * characters are still translated off-screen behind this gate, so a long wait
 * costs real Core Web Vitals. Three seconds is enough for the "scroll to begin"
 * moment to register without making a first-time visitor wait for the content.
 */
const INTENT_TIMEOUT = 3000;

/**
 * The intro sequence.
 *
 * Two things changed for reasons that matter.
 *
 * 1. It always finishes. The original armed `wheel` / `touchstart` listeners and
 *    advanced only on a downward gesture — nothing else could move it forward. A
 *    reader who did not scroll, a trackpad still in inertia, or a keyboard-only
 *    user sat on the "Welcome to my portfolio!" card with the hero name still
 *    hidden behind `translateY(100%)`. The gate now opens on wheel, touch, key or
 *    click — or after a timeout.
 *
 * 2. It degrades in tiers. Under `prefers-reduced-motion: reduce` there is no cube
 *    flight, no camera move and no per-character rise: the curtain is removed and
 *    the scene is placed in its final pose.
 *
 * It also animates explicit element arrays rather than selector strings, so a
 * missing element can never silently widen the selection to the whole page.
 */
export default class Preloader {
    constructor({ sizes, camera, room }) {
        this.sizes = sizes;
        this.camera = camera;
        this.room = room;

        this.root = dom.preloader;
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.intentTimeout = null;

        this.prepareText();
    }

    /** Split the hero type into per-character spans (accessibly — see splitTextToSpans). */
    prepareText() {
        this.splits = {
            intro: splitTextToSpans(dom.introText),
            title: splitTextToSpans(dom.heroTitle),
            description: splitTextToSpans(dom.heroDescription),
            firstSub: splitTextToSpans(dom.heroFirstSub),
            secondSub: splitTextToSpans(dom.heroSecondSub),
        };
    }

    charsOf(...keys) {
        return keys
            .map((key) => this.splits[key])
            .filter(Boolean)
            .flatMap((split) => split.chars);
    }

    get allChars() {
        return this.charsOf("intro", "title", "description", "firstSub", "secondSub");
    }

    play() {
        document.documentElement.classList.add("is-intro");

        if (this.reducedMotion.matches) {
            this.finishWithoutMotion();
            return Promise.resolve();
        }

        return this.firstIntro()
            .then(() => this.waitForIntent())
            .then(() => this.secondIntro())
            .catch((error) => {
                console.warn("[preloader] intro aborted", error);
            })
            .finally(() => this.complete());
    }

    /** Reduced motion: no cube flight, no camera move, no character rise. */
    finishWithoutMotion() {
        this.revealAllParts();
        this.hideCurtain({ immediate: true });

        GSAP.set(this.allChars, { y: 0, yPercent: 0 });
        if (dom.arrow) {
            GSAP.set(dom.arrow, { opacity: 1 });
        }
        if (dom.toggleBar) {
            GSAP.set(dom.toggleBar, { opacity: 1 });
        }
    }

    firstIntro() {
        return new Promise((resolve) => {
            const timeline = GSAP.timeline({ onComplete: resolve });
            const offset = this.sizes.profile.introRoomOffset;

            timeline.set(this.allChars, { y: 0, yPercent: 100 });
            timeline.to(this.root ?? {}, {
                opacity: 0,
                delay: INTRO.preloaderFadeDelay,
                onComplete: () => this.hideCurtain(),
            });

            // The cube grows and the room drifts, behind the curtain fade.
            if (this.room.parts.cube) {
                timeline.to(
                    this.room.parts.cube.scale,
                    {
                        x: INTRO.cubeGrow.to,
                        y: INTRO.cubeGrow.to,
                        z: INTRO.cubeGrow.to,
                        ease: INTRO.cubeGrow.ease,
                        duration: INTRO.cubeGrow.duration,
                    },
                    0
                );
            }
            timeline.to(
                this.room.actualRoom.position,
                {
                    x: offset.x,
                    y: offset.y,
                    z: offset.z,
                    ease: "power1.out",
                    duration: INTRO.cubeGrow.duration,
                },
                0
            );

            timeline.to(this.charsOf("intro"), {
                yPercent: 0,
                stagger: 0.05,
                ease: INTRO.charEase,
            });
            timeline.to(dom.arrow ?? {}, { opacity: 1 }, "same");
            timeline.to(dom.toggleBar ?? {}, { opacity: 1 }, "same");
        });
    }

    /**
     * Hold until the reader shows intent. Any of the four gestures opens the gate,
     * and a timeout guarantees it opens anyway.
     */
    waitForIntent() {
        return new Promise((resolve) => {
            const events = ["wheel", "touchstart", "keydown", "pointerdown"];

            const open = () => {
                events.forEach((name) => window.removeEventListener(name, open));
                window.clearTimeout(this.intentTimeout);
                this.intentTimeout = null;
                resolve();
            };

            events.forEach((name) =>
                window.addEventListener(name, open, { once: true })
            );
            this.intentTimeout = window.setTimeout(open, INTENT_TIMEOUT);
        });
    }

    secondIntro() {
        const room = this.room.actualRoom;
        const parts = this.room.parts;
        const profile = this.sizes.profile;

        return new Promise((resolve) => {
            const timeline = GSAP.timeline({ onComplete: resolve });

            timeline
                .to(this.allChars, {
                    yPercent: 100,
                    stagger: 0.05,
                    ease: "back.in(1.7)",
                })
                .to(dom.arrow ?? {}, { opacity: 0 }, "fadeout")
                .to(
                    room.position,
                    { x: 0, y: 0, z: 0, ease: "power1.out", duration: 0.7 },
                    "same"
                )
                .to(parts.cube.rotation, { y: INTRO.cubeFinalSpin }, "same")
                .to(
                    parts.cube.scale,
                    {
                        x: INTRO.cubeFinalScale,
                        y: INTRO.cubeFinalScale,
                        z: INTRO.cubeFinalScale,
                    },
                    "same"
                )
                .to(
                    this.camera.orthographicCamera.position,
                    { y: profile.cameraHome.y },
                    "same"
                )
                .to(parts.cube.position, { ...INTRO.cubeFinalPosition }, "same")
                .set(parts.body.scale, {
                    x: INTRO.bodyScale,
                    y: INTRO.bodyScale,
                    z: INTRO.bodyScale,
                });

            // The cube is flung away and the room lands, revealing the hero type.
            timeline.to(parts.cube.scale, { x: 0, y: 0, z: 0, duration: 1 }, "introtext");
            timeline.to(
                this.charsOf("title", "description", "firstSub", "secondSub"),
                {
                    yPercent: 0,
                    stagger: INTRO.charStagger,
                    ease: INTRO.charEase,
                },
                "introtext"
            );

            this.appendPartReveal(timeline);

            timeline.to(dom.arrow ?? {}, { opacity: 1 });
        });
    }

    /** Every diorama part pops in, staggered, ending with the chair spin. */
    appendPartReveal(timeline) {
        const parts = this.room.parts;

        for (const entry of INTRO_REVEAL) {
            const part = parts[entry.part];
            if (!part) {
                continue;
            }
            const vars = {
                x: 1,
                y: 1,
                z: 1,
                ease: entry.ease,
                duration: entry.duration,
            };
            if (entry.set) {
                timeline.set(part.scale, vars);
            } else {
                timeline.to(part.scale, vars, entry.position);
            }
        }

        if (parts.chair) {
            timeline.to(
                parts.chair.rotation,
                {
                    y: INTRO_CHAIR_SPIN.rotationY,
                    ease: INTRO_CHAIR_SPIN.ease,
                    duration: INTRO_CHAIR_SPIN.duration,
                },
                INTRO_CHAIR_SPIN.position
            );
        }
    }

    revealAllParts() {
        for (const part of Object.values(this.room.parts)) {
            part.scale?.setScalar(1);
        }
    }

    hideCurtain({ immediate = false } = {}) {
        if (!this.root) {
            return;
        }
        this.root.classList.add("is-hidden");
        if (immediate) {
            this.root.style.display = "none";
        }
    }

    /** Always reached: releases the scroll lock and reveals the page. */
    complete() {
        document.documentElement.classList.remove("is-intro");
        window.clearTimeout(this.intentTimeout);
        this.hideCurtain();
        this.hideArrow();
    }

    /**
     * The arrow is a "scroll to continue" affordance. Once the intro is over that
     * is a lie, and it overlaps the first section on small screens.
     */
    hideArrow() {
        dom.arrow?.classList.add("is-hidden");
    }

    destroy() {
        window.clearTimeout(this.intentTimeout);
        document.documentElement.classList.remove("is-intro");
    }
}
