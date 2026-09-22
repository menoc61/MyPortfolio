import { CIRCLES, SCROLL } from "../Config/scene.config.js";
import { MINI_PLATFORM_OFFSET, MINI_PLATFORM_REVEAL, INTRO_CHAIR_SPIN } from "../Config/roomParts.js";

/**
 * THE SCROLL STORY — pure data.
 *
 * No GSAP in this file. Each step says *what* should be true of the scene while
 * the reader is inside a given DOM range; `ScrollSequencer` decides *how* to make
 * it so. That seam is the whole point: the choreography becomes reviewable by
 * someone who does not read GSAP, and the mechanism is reusable.
 *
 * Tween targets are symbolic (`"room.position"`, `"camera.position"`,
 * `"circle.first"`) and resolved by the sequencer against the live scene graph.
 *
 * A property value may be a number, or `{ viewport: "width" | "height", factor }`
 * for the two values that intentionally scale with the window.
 */

const circle = (name) => ({
    target: `circle.${name}`,
    props: { scale: CIRCLES.growTo },
});

const DESKTOP_STEPS = [
    {
        id: "about",
        trigger: ".story-step--1",
        tweens: [
            {
                target: "room.position",
                props: { x: { viewport: "width", factor: 0.0014 } },
            },
            circle("first"),
        ],
    },
    {
        id: "work",
        trigger: ".story-step--2",
        tweens: [
            {
                target: "room.position",
                props: {
                    x: 1,
                    y: 0.7,
                    z: { viewport: "height", factor: 0.0032 },
                },
            },
            { target: "room.scale", props: { x: 0.4, y: 0.4, z: 0.4 } },
            { target: "rectLight", props: { width: 2, height: 2.8 } },
            circle("second"),
        ],
    },
    {
        id: "contact",
        trigger: ".story-step--3",
        tweens: [
            { target: "camera.position", props: { x: -4.1, y: 1.5 } },
            circle("third"),
        ],
    },
];

const MOBILE_STEPS = [
    {
        id: "about",
        trigger: ".story-step--1",
        tweens: [
            { target: "room.scale", props: { x: 0.1, y: 0.1, z: 0.1 } },
            circle("first"),
        ],
    },
    {
        id: "work",
        trigger: ".story-step--2",
        tweens: [
            { target: "room.scale", props: { x: 0.25, y: 0.25, z: 0.25 } },
            { target: "rectLight", props: { width: 1.02, height: 1.36 } },
            { target: "room.position", props: { x: 1.5 } },
            circle("second"),
        ],
    },
    {
        id: "contact",
        trigger: ".story-step--3",
        tweens: [
            { target: "room.position", props: { z: -4.5 } },
            circle("third"),
        ],
    },
];

/** The last step also reveals the mini platform — once, not scrubbed. */
const MINI_PLATFORM_STEP = {
    trigger: ".story-step--3",
    start: "center center",
    miniPlatform: {
        offset: MINI_PLATFORM_OFFSET,
        reveal: MINI_PLATFORM_REVEAL,
        chairSpin: INTRO_CHAIR_SPIN,
    },
};

export const SCROLL_STORY = Object.freeze({
    desktop: Object.freeze({
        profile: "desktop",
        query: "(min-width: 969px)",
        steps: [...DESKTOP_STEPS, MINI_PLATFORM_STEP],
    }),
    mobile: Object.freeze({
        profile: "mobile",
        query: "(max-width: 968px)",
        steps: [...MOBILE_STEPS, MINI_PLATFORM_STEP],
    }),
    scrub: SCROLL.scrub,
});
