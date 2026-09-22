import * as THREE from "three";

import Sizes from "./Utils/Sizes.js";
import Time from "./Utils/Time.js";
import Resources from "./Utils/Resources.js";
import assets from "./Utils/assets.js";
import { dom, supportsWebGL } from "./Utils/dom.js";
import { EVENTS } from "./Utils/EVENTS.js";

import Boot from "./Boot.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Theme from "./Theme.js";
import Preloader from "./Preloader.js";
import ScenePreloader from "./ScenePreloader.js";

import World from "./World/World.js";
import Controls from "./World/Controls.js";

/**
 * The composition root.
 *
 * This is now the ONLY module that knows the construction order. Previously every
 * module did `this.experience = new Experience()` and then reached four levels
 * deep for a sibling (`experience.world.room.roomChildren.cube`), which meant no
 * module could be understood, or tested, on its own. Now dependencies arrive as
 * constructor arguments.
 *
 * It also owns the boot lifecycle: `Boot` settles exactly once, whether the scene
 * works or not, so the page can never be left behind an opaque curtain.
 */
export default class Experience {
    static instance;

    constructor(canvas = dom.canvas) {
        if (Experience.instance) {
            return Experience.instance;
        }
        Experience.instance = this;

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.time = new Time();
        this.sizes = new Sizes();
        this.boot = new Boot();

        // Theme is pure DOM. It must exist even when WebGL does not, so the
        // reader can still switch the page to dark.
        this.theme = new Theme();

        // The scene preloader is pure DOM too, so it is created BEFORE any
        // WebGL check: on the earliest boot failure it hides itself
        // (ScenePreloader.forceHide) and the reader keeps the readable page.
        // Its gate clears only on finish() — i.e. only when the 3D model is
        // fully loaded and mounted in the scene.
        this.scenePreloader = new ScenePreloader({ boot: this.boot });

        this.sizes.on(EVENTS.SIZES_RESIZE, () => this.resize());
        this.time.on(EVENTS.TIME_TICK, () => this.update());

        if (!this.canvas) {
            this.boot.fail("no-canvas");
            return;
        }
        if (!supportsWebGL()) {
            this.boot.fail("no-webgl");
            return;
        }

        try {
            this.camera = new Camera({ scene: this.scene, sizes: this.sizes });
            this.renderer = new Renderer({
                canvas: this.canvas,
                scene: this.scene,
                sizes: this.sizes,
                camera: this.camera,
            });
        } catch (error) {
            this.boot.fail("renderer-init", error);
            return;
        }

        // The GLB is Draco-compressed (data header v2.2, encoded by Blender's
        // glTF exporter), so GLTFLoader needs a decoder new enough for it. Three
        // resolves its own decoder relative to import.meta.url — Rollup rewrites
        // that for the production build, but Vite's dev server serves the
        // dep-optimized module from /node_modules/.vite/deps/ and the relative
        // decoder URL 404s, so the model (and with it the intro) never loads in
        // dev. The decoder is therefore self-hosted in public/draco — VERBATIM
        // copies of three's own bundled files, so the version always matches
        // both the DRACOLoader protocol and the GLB data. (The first commit's
        // decoder files predate draco v2.2 and fail with "Unexpected geometry
        // type" — refresh these copies whenever three is upgraded.) base is
        // "/", so the absolute path holds in dev and in production alike.
        this.resources = new Resources(assets, { dracoPath: "/draco/" });
        this.resources.on(EVENTS.RESOURCES_PROGRESS, (name, stats) => {
            this.scenePreloader?.onResourceProgress(name, stats);
        });
        this.resources
            .load()
            .then(() => this.createWorld())
            .catch((error) => this.boot.fail("assets", error));
    }

    createWorld() {
        this.world = new World({
            scene: this.scene,
            sizes: this.sizes,
            camera: this.camera,
            resources: this.resources,
            theme: this.theme,
        });

        this.world.on(EVENTS.WORLD_READY, () => {
            // The scene is built and rendering — that is what "ready" means.
            // The intro is an enhancement and must NOT be able to trip the
            // watchdog: it deliberately waits for the reader's first gesture, so
            // finishing it is not a measure of whether the app works.
            this.boot.ready();

            // The 3D model is fully loaded and mounted — ONLY NOW may the
            // scene preloader's gate clear. It runs before startIntro so the
            // curtain lifts exactly as the first-commit intro begins.
            this.scenePreloader.finish();
            this.startIntro();
        });
    }

    startIntro() {
        try {
            this.preloader = new Preloader({
                sizes: this.sizes,
                camera: this.camera,
                room: this.world.room,
            });
        } catch (error) {
            console.warn("[experience] intro unavailable", error);
            this.releaseScrollLock();
            return;
        }

        this.preloader
            .play()
            .then(() => this.enableControls())
            .catch((error) => {
                console.warn("[experience] intro aborted", error);
                this.releaseScrollLock();
            });
    }

    /** Belt-and-braces: nothing may leave the reader unable to scroll. */
    releaseScrollLock() {
        document.documentElement.classList.remove("is-intro", "is-loading");
    }

    enableControls() {
        try {
            this.controls = new Controls({
                sizes: this.sizes,
                camera: this.camera,
                room: this.world.room,
                floor: this.world.floor,
            });
        } catch (error) {
            // Scroll choreography is an enhancement; the page works without it.
            console.warn("[experience] scroll choreography unavailable", error);
        }
    }

    resize() {
        this.camera?.resize();
        this.renderer?.resize();
        this.world?.resize();
    }

    update() {
        this.world?.update({ delta: this.time.delta });
        this.renderer?.update();
    }

    destroy() {
        this.controls?.destroy();
        this.preloader?.destroy();
        this.scenePreloader?.destroy();
        this.world?.destroy();
        this.renderer?.destroy();
        this.time.clear();
        this.sizes.clear();
        this.boot.clear();
        Experience.instance = null;
    }
}

