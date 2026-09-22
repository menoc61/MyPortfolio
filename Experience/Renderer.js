import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import { RENDER } from "./Config/scene.config.js";

/**
 * The WebGL renderer.
 *
 * Migrated to current three.js APIs. The r141 originals are all removed in
 * modern three and would silently no-op or throw:
 *   `renderer.outputEncoding = THREE.sRGBEncoding`  -> `renderer.outputColorSpace = THREE.SRGBColorSpace`
 *   `texture.encoding = ...`                        -> `texture.colorSpace = ...`   (see Utils/Resources.js)
 *   `renderer.physicallyCorrectLights = true`       -> removed; that is the default now,
 *                                                      so the light intensities are unchanged.
 *
 * `RectAreaLightUniformsLib.init()` is new and REQUIRED: three no longer ships the
 * LTC lookup tables in the core bundle, and without this the desk light in the
 * diorama renders black.
 */
export default class Renderer {
    constructor({ canvas, scene, sizes, camera }) {
        this.canvas = canvas;
        this.scene = scene;
        this.sizes = sizes;
        this.camera = camera;

        RectAreaLightUniformsLib.init();
        this.setRenderer();
        this.bindContextLoss();
    }

    setRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance",
        });

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.CineonToneMapping;
        this.renderer.toneMappingExposure = RENDER.toneMappingExposure;
        this.renderer.shadowMap.enabled = true;
        // PCFShadowMap instead of PCFSoftShadowMap: soft shadows cost a lot for a
        // diorama seen at 0.11 scale, where the difference is not visible.
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.resize();
    }

    /**
     * A lost WebGL context (driver reset, GPU sleep, too many contexts) used to
     * leave a frozen canvas with no way back. We surface it to the page instead.
     */
    bindContextLoss() {
        this.canvas.addEventListener(
            "webglcontextlost",
            (event) => {
                event.preventDefault();
                document.documentElement.classList.add("webgl-context-lost");
            },
            false
        );
    }

    resize() {
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(this.sizes.pixelRatio);
    }

    update() {
        this.renderer.render(this.scene, this.camera.orthographicCamera);
    }

    destroy() {
        this.renderer?.dispose();
    }
}
