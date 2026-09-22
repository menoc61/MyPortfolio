import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import EventBus from "./EventBus.js";
import { EVENTS } from "./EVENTS.js";

/**
 * Asset loading.
 *
 * Changed from the original:
 *  - returns a Promise instead of counting `loaded === queue`, which had no
 *    failure branch at all: one failed request left the preloader spinning
 *    forever behind an opaque full-screen overlay, hiding the whole site.
 *  - assets declare whether they are `critical` (see Utils/assets.js).
 *  - non-critical failures are reported but do not reject the boot.
 *  - the Draco decoder is self-hosted (`public/draco`) and wired via
 *    `dracoPath`. Three's own default resolves the decoder relative to
 *    `import.meta.url`: Rollup rewrites that for the production build, but
 *    Vite's dev server cannot serve it (the dep-optimized module lives under
 *    /node_modules/.vite/deps/), so dev 404s and the critical model never
 *    loads. The files in public/draco are VERBATIM copies of three's bundled
 *    decoder (version-matched to the DRACOLoader protocol and to the GLB's
 *    draco v2.2 data) — refresh them whenever three is upgraded.
 */
export default class Resources extends EventBus {
    constructor(assets, { dracoPath = null } = {}) {
        super();
        this.assets = assets;

        this.items = {};
        this.failed = [];

        this.setLoaders(dracoPath);
    }

    setLoaders(dracoPath) {
        this.dracoLoader = new DRACOLoader();
        if (dracoPath) {
            this.dracoLoader.setDecoderPath(dracoPath);
        }

        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }

    /**
     * Resolves once every CRITICAL asset is in.
     *
     * Optional assets (`critical: false`) are started but deliberately NOT
     * awaited: they must never be able to hold the page behind the curtain. The
     * original counted every asset in one queue, so a blocked video took the whole
     * site down with it — and this rewrite reintroduced that bug for one build
     * until a headless test caught it. Do not "simplify" this back to one Promise.all.
     */
    load() {
        const critical = [];
        const optional = [];

        for (const asset of this.assets) {
            (asset.critical === false ? optional : critical).push(asset);
        }

        for (const asset of optional) {
            this.loadOne(asset).catch((error) => {
                // Already recorded by recordFailure; swallow so it stays optional.
                void error;
            });
        }

        return Promise.all(critical.map((asset) => this.loadOne(asset))).then(
            () => this.items
        );
    }

    loadOne(asset) {
        if (asset.type === "glbModel") {
            return this.loadModel(asset);
        }
        if (asset.type === "videoTexture") {
            return this.loadVideo(asset);
        }
        return Promise.resolve(null);
    }

    loadModel(asset) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                asset.path,
                (file) => {
                    this.items[asset.name] = file;
                    this.emit(EVENTS.RESOURCES_PROGRESS, asset.name);
                    resolve(file);
                },
                // Byte progress. The GLB is the only critical asset, so its
                // bytes ARE the loading progress — ScenePreloader drives its
                // bar from this (mapped to 0–90%; WORLD_READY owns the rest).
                (event) => {
                    this.emit(EVENTS.RESOURCES_PROGRESS, asset.name, {
                        loaded: Number(event?.loaded ?? 0),
                        total: Number(event?.total ?? 0),
                    });
                },
                (error) => {
                    this.recordFailure(asset, error);
                    if (asset.critical === false) {
                        resolve(null);
                        return;
                    }
                    reject(error);
                }
            );
        });
    }

    /**
     * Video textures are best-effort. `play()` is explicitly caught: browsers may
     * reject autoplay even for muted inline video, and an unhandled rejection
     * there was previously invisible.
     */
    loadVideo(asset) {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.src = asset.path;
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            video.loop = true;
            video.preload = "auto";

            const settle = (ok, error) => {
                if (!ok) {
                    this.recordFailure(asset, error);
                    resolve(null);
                    return;
                }

                const texture = new THREE.VideoTexture(video);
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                texture.generateMipmaps = false;
                texture.colorSpace = THREE.SRGBColorSpace;

                this.items[asset.name] = texture;
                this.emit(EVENTS.RESOURCES_PROGRESS, asset.name);
                resolve(texture);
            };

            video.addEventListener(
                "loadeddata",
                () => {
                    video.play().then(
                        () => settle(true),
                        (error) => settle(false, error)
                    );
                },
                { once: true }
            );
            video.addEventListener("error", (error) => settle(false, error), {
                once: true,
            });

            video.load();
        });
    }

    recordFailure(asset, error) {
        this.failed.push({ name: asset.name, error });
        console.warn(`[resources] failed to load "${asset.name}"`, error);
        this.emit(EVENTS.RESOURCES_ERROR, { asset, error });
    }

    destroy() {
        this.dracoLoader?.dispose();
        this.items = {};
        this.clear();
    }
}
