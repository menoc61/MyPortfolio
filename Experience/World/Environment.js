import * as THREE from "three";
import GSAP from "gsap";

import { LIGHTING, RENDER } from "../Config/scene.config.js";
import { EVENTS } from "../Utils/EVENTS.js";

/**
 * The light rig.
 *
 * Changed from the original:
 *  - `lil-gui` is gone. The original imported it at module scope while every
 *    call site was commented out, so an entire GUI library was parsed and
 *    shipped to production for zero behaviour.
 *  - shadow map size follows the device profile (1024 desktop / 512 mobile)
 *    instead of a flat 2048x2048 — the diorama is seen at 0.11 scale.
 *  - theme changes are subscribed to directly, instead of World relaying them.
 */
export default class Environment {
    constructor({ scene, sizes, theme }) {
        this.scene = scene;
        this.sizes = sizes;

        this.setSunlight();

        this.offTheme = theme?.on(EVENTS.THEME_CHANGE, (next) =>
            this.switchTheme(next)
        );
    }

    setSunlight() {
        const { sun, ambient } = LIGHTING;

        this.sunLight = new THREE.DirectionalLight(sun.color, sun.intensity);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.far = sun.shadowFar;
        this.sunLight.shadow.mapSize.set(
            RENDER.shadowMapSize[this.sizes.name],
            RENDER.shadowMapSize[this.sizes.name]
        );
        this.sunLight.shadow.normalBias = sun.shadowNormalBias;
        this.sunLight.position.set(sun.position.x, sun.position.y, sun.position.z);

        this.ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);

        this.scene.add(this.sunLight);
        this.scene.add(this.ambientLight);
    }

    /** @param {"light"|"dark"} theme */
    switchTheme(theme) {
        const target = theme === "dark" ? LIGHTING.dark : LIGHTING.light;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduced ? 0 : 0.5;

        GSAP.to(this.sunLight.color, { ...target.color, duration, overwrite: "auto" });
        GSAP.to(this.ambientLight.color, {
            ...target.color,
            duration,
            overwrite: "auto",
        });
        GSAP.to(this.sunLight, {
            intensity: target.sunIntensity,
            duration,
            overwrite: "auto",
        });
        GSAP.to(this.ambientLight, {
            intensity: target.ambientIntensity,
            duration,
            overwrite: "auto",
        });
    }

    destroy() {
        this.offTheme?.();
        this.scene.remove(this.sunLight, this.ambientLight);
        this.sunLight?.dispose();
        this.ambientLight?.dispose();
    }
}
