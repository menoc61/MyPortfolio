import GSAP from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { EVENTS } from "../Utils/EVENTS.js";
import { SCROLL, LAYOUT, CIRCLES } from "../Config/scene.config.js";
import { SCROLL_STORY } from "./scrollStory.js";

GSAP.registerPlugin(ScrollTrigger);

/**
 * Turns the scroll story (data) into GSAP timelines (behaviour).
 *
 * Contains no portfolio-specific numbers — everything comes from
 * `Config/scene.config.js` and `World/scrollStory.js`.
 *
 * Reduced motion is handled in tiers (see README):
 *   Tier 1  camera travel / room travel / circle growth / smooth scroll -> not created
 *   Tier 2  section reveals                                             -> short fade
 *   Tier 3  progress bars, theme crossfade, focus rings                  -> kept
 */
export default class ScrollSequencer {
    constructor({ sizes, camera, room, floor }) {
        this.sizes = sizes;
        this.camera = camera;
        this.room = room;
        this.floor = floor;

        this.mm = GSAP.matchMedia();
        this.disposers = [];

        this.build();
        this.bindRefresh();
    }

    // --------------------------------------------------------------- targets

    /**
     * Resolve a symbolic story target (`"room.position"`, `"circle.second"`, ...)
     * against the live scene graph. This is the seam between story and scene.
     */
    resolveTarget(symbol) {
        const [scope, key] = symbol.split(".");

        switch (scope) {
            case "room":
                return key === "position"
                    ? this.room.actualRoom.position
                    : this.room.actualRoom.scale;
            case "camera":
                return this.camera.orthographicCamera.position;
            case "rectLight":
                return this.room.parts.rectLight;
            case "circle": {
                const circle =
                    this.floor[`circle${key[0].toUpperCase()}${key.slice(1)}`];
                if (!circle) {
                    throw new Error(`ScrollSequencer: unknown circle "${key}"`);
                }
                return circle;
            }
            default:
                throw new Error(`ScrollSequencer: unknown target "${symbol}"`);
        }
    }

    /** `{ viewport: "width", factor }` -> a function GSAP re-evaluates on refresh. */
    resolveValue(value) {
        if (value && typeof value === "object" && "viewport" in value) {
            const { viewport, factor } = value;
            return () =>
                (viewport === "width" ? this.sizes.width : this.sizes.height) *
                factor;
        }
        return value;
    }

    /**
     * `{ scale: 3 }` on an Object3D must become `{ x, y, z }` — assigning a number
     * to `.scale` would replace the Vector3 with a scalar and break the transform.
     */
    expandVectorProps(target, props) {
        const out = { ...props };
        if ("scale" in out && target?.scale?.isVector3) {
            const value = out.scale;
            delete out.scale;
            out.x = value;
            out.y = value;
            out.z = value;
        }
        return out;
    }

    // ----------------------------------------------------------------- build

    build() {
        this.mm.add(
            {
                isDesktop: `(min-width: ${LAYOUT.mobileBreakpoint + 1}px)`,
                isMobile: `(max-width: ${LAYOUT.mobileBreakpoint}px)`,
            },
            (ctx) => {
                const story = ctx.conditions.isDesktop
                    ? SCROLL_STORY.desktop
                    : SCROLL_STORY.mobile;

                this.applyStory(story);
                this.buildSectionChrome();
                this.bindPointerParallax();
            }
        );

        // Tier 1 off, Tier 2 softened, Tier 3 kept.
        this.mm.add("(prefers-reduced-motion: reduce)", () => {
            this.applyReducedPose();
            this.buildSectionChrome();
        });
    }

    /** The choreography: one ScrollTrigger-driven timeline per story step. */
    applyStory(story) {
        for (const step of story.steps) {
            if (step.miniPlatform) {
                this.track(this.buildMiniPlatform(step));
                continue;
            }
            if (!step.tweens?.length) {
                continue;
            }

            const timeline = GSAP.timeline({
                scrollTrigger: {
                    trigger: step.trigger,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: SCROLL.scrub,
                    invalidateOnRefresh: true,
                },
            });

            for (const { target, props } of step.tweens) {
                const object = this.resolveTarget(target);
                const resolved = {};
                for (const [key, value] of Object.entries(props)) {
                    resolved[key] = this.resolveValue(value);
                }
                timeline.to(object, this.expandVectorProps(object, resolved), "same");
            }

            this.track(timeline);
        }
    }

    /** The mini platform lands once, when the last step reaches the middle. */
    buildMiniPlatform(step) {
        const { offset, reveal, chairSpin } = step.miniPlatform;
        const parts = this.room.parts;

        const timeline = GSAP.timeline({
            scrollTrigger: {
                trigger: step.trigger,
                start: step.start ?? "center center",
            },
        });

        if (parts.miniFloor) {
            timeline.to(parts.miniFloor.position, {
                x: offset.x,
                z: offset.z,
                duration: 0.3,
            });
        }

        for (const entry of reveal) {
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

        if (parts.chair && chairSpin) {
            timeline.to(
                parts.chair.rotation,
                {
                    y: chairSpin.rotationY,
                    ease: chairSpin.ease,
                    duration: chairSpin.duration,
                },
                chairSpin.position
            );
        }

        return timeline;
    }

    /**
     * Section chrome — progress bars only.
     *
     * The old border-radius morph was dropped deliberately: it animated a layout
     * property on every scroll frame (jank) to produce a decoration that encoded
     * nothing. The rounded corner is now a static design property.
     */
    buildSectionChrome() {
        for (const section of document.querySelectorAll("[data-section]")) {
            const progressBar = section.querySelector(".progress-bar");
            const progressWrapper = section.querySelector(".progress-wrapper");
            if (!progressBar || !progressWrapper) {
                continue;
            }

            const tween = GSAP.from(progressBar, {
                scaleY: 0,
                scrollTrigger: {
                    trigger: section,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: SCROLL.sectionPinScrub,
                    pin: progressWrapper,
                    pinSpacing: false,
                },
            });

            this.track(tween);
        }
    }

    /**
     * Pointer parallax on the room. Uses `quickTo` so we reuse one tween instead
     * of creating a new tween per mousemove event.
     */
    bindPointerParallax() {
        if (!this.room?.actualRoom) {
            return;
        }

        const rotateTo = GSAP.quickTo(this.room.actualRoom.rotation, "y", {
            duration: 0.6,
            ease: "power2.out",
        });

        const onPointerMove = (event) => {
            const normalized =
                ((event.clientX - this.sizes.width / 2) * 2) / this.sizes.width;
            rotateTo(normalized * CIRCLES.pointerInfluence);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        this.disposers.push(() =>
            window.removeEventListener("pointermove", onPointerMove)
        );
    }

    /** The static pose used when the reader prefers reduced motion. */
    applyReducedPose() {
        if (!this.room?.actualRoom) {
            return;
        }
        const profile = this.sizes.profile;

        this.room.actualRoom.scale.setScalar(profile.roomScale);
        this.room.actualRoom.position.set(0, 0, 0);

        this.camera.orthographicCamera.position.set(
            profile.cameraHome.x,
            profile.cameraHome.y,
            profile.cameraHome.z
        );

        for (const key of ["circleFirst", "circleSecond", "circleThird"]) {
            this.floor?.[key]?.scale.setScalar(0);
        }
    }

    // --------------------------------------------------------------- refresh

    bindRefresh() {
        // Webfonts change text metrics, which changes every trigger position.
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
        // The scene becoming ready toggles body classes that affect layout.
        document.addEventListener(EVENTS.WORLD_READY, () => ScrollTrigger.refresh());
    }

    // -------------------------------------------------------------- teardown

    /** Register a disposable (timeline, tween or cleanup fn). */
    track(disposable) {
        if (disposable && typeof disposable.kill === "function") {
            this.disposers.push(() => disposable.kill());
        }
        return disposable;
    }

    destroy() {
        for (const dispose of this.disposers) {
            dispose();
        }
        this.disposers = [];
        this.mm?.revert();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
}
