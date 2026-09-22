import * as THREE from "three";

import {
    ROOM_PARTS,
    CASTS_SHADOW,
    AQUARIUM_MATERIAL,
    MINI_PLATFORM_HOME,
} from "../Config/roomParts.js";
import { LIGHTING } from "../Config/scene.config.js";
import { EVENTS } from "../Utils/EVENTS.js";

/**
 * The GLB diorama.
 *
 * Changed from the original:
 *  - meshes are found from the `ROOM_PARTS` manifest and exposed as `parts`,
 *    instead of three files each comparing `child.name` against their own string
 *    literals. `Controls.js` compared against "Mini_Floor" while the GLB node is
 *    "Mini Floor" — that animation silently never ran. A missing part now logs.
 *  - shadow casting is limited to the parts that actually read at this scale.
 *  - pointer parallax moved to `ScrollSequencer` (it uses one `quickTo` tween
 *    instead of creating a tween target on every mousemove).
 */
export default class Room {
    constructor({ scene, sizes, resources }) {
        this.scene = scene;
        this.sizes = sizes;
        this.resources = resources;

        this.model = resources.items.room;
        this.actualRoom = this.model?.scene;
        this.parts = {};

        if (!this.actualRoom) {
            throw new Error("Room: the room model was not loaded");
        }

        this.setModel();
        this.setAnimation();
    }

    setModel() {
        this.actualRoom.traverse((object) => {
            if (object.name) {
                this.actualRoom.userData.byName ??= new Map();
                this.actualRoom.userData.byName.set(object.name, object);
            }
        });
        const byName = this.actualRoom.userData.byName ?? new Map();

        const castsShadow = new Set(CASTS_SHADOW);

        for (const [key, nodeName] of Object.entries(ROOM_PARTS)) {
            const node = byName.get(nodeName);
            if (!node) {
                console.warn(`[room] manifest lists "${nodeName}" but the GLB has no such node`);
                continue;
            }

            node.castShadow = castsShadow.has(key);
            node.receiveShadow = true;

            this.parts[key] = node;
        }

        this.applyMaterialTweaks();
        this.placeParts();

        // Everything starts collapsed; the intro and the scroll story grow it back.
        for (const part of Object.values(this.parts)) {
            part.scale.setScalar(0);
        }

        this.addDeskLight();

        this.actualRoom.scale.setScalar(this.sizes.profile.roomScale);
        this.scene.add(this.actualRoom);

        // The screen video is an OPTIONAL asset, so it may arrive after the world
        // is built. When it does, swap it in — otherwise the monitor would keep
        // its modelled material forever.
        this.resources.on(EVENTS.RESOURCES_PROGRESS, (name) => {
            if (name === "screen") {
                this.mountScreen();
            }
        });
    }

    applyMaterialTweaks() {
        const aquariumGlass = this.parts.aquarium?.children?.[0];
        if (aquariumGlass) {
            const material = new THREE.MeshPhysicalMaterial({
                roughness: AQUARIUM_MATERIAL.roughness,
                ior: AQUARIUM_MATERIAL.ior,
                transmission: AQUARIUM_MATERIAL.transmission,
                opacity: AQUARIUM_MATERIAL.opacity,
                transparent: true,
            });
            material.color.set(AQUARIUM_MATERIAL.color);
            aquariumGlass.material = material;
        }

        this.mountScreen();
    }

    /**
     * Put the screen video on the monitor. Called once at build time and again if
     * the optional video asset turns up later.
     */
    mountScreen() {
        const screen = this.parts.computer?.children?.[1];
        const screenTexture = this.resources.items.screen;
        if (!screen || !screenTexture) {
            return;
        }

        screen.material?.dispose?.();
        screen.material = new THREE.MeshBasicMaterial({ map: screenTexture });
    }

    placeParts() {
        if (this.parts.cube) {
            this.parts.cube.position.set(0, -1, 0);
            this.parts.cube.rotation.y = Math.PI / 4;
        }

        if (this.parts.miniFloor) {
            this.parts.miniFloor.position.x = MINI_PLATFORM_HOME.x;
            this.parts.miniFloor.position.z = MINI_PLATFORM_HOME.z;
        }
    }

    /**
     * The desk lamp is a `RectAreaLight` added at run time. `RectAreaLightUniformsLib`
     * must have been initialised first — Renderer does that.
     */
    addDeskLight() {
        const { desk } = LIGHTING;
        const width = this.sizes.profile.rectLight.width;
        const height = this.sizes.profile.rectLight.height;

        const rectLight = new THREE.RectAreaLight(
            desk.color,
            desk.intensity,
            width,
            height
        );
        rectLight.position.set(desk.position.x, desk.position.y, desk.position.z);
        rectLight.rotation.x = desk.rotationX;
        rectLight.rotation.z = desk.rotationZ;

        this.actualRoom.add(rectLight);
        this.parts.rectLight = rectLight;
    }

    setAnimation() {
        if (!this.model.animations?.length) {
            return;
        }
        this.mixer = new THREE.AnimationMixer(this.actualRoom);
        this.swim = this.mixer.clipAction(this.model.animations[0]);
        this.swim.play();
    }

    update({ delta }) {
        if (!this.mixer) {
            return;
        }
        // The original divided first and then multiplied; keep the same rate.
        this.mixer.update(delta * 0.0009);
    }

    destroy() {
        this.mixer?.stopAllAction();
        for (const part of Object.values(this.parts)) {
            part.traverse?.((object) => {
                object.geometry?.dispose?.();
                if (Array.isArray(object.material)) {
                    object.material.forEach((m) => m.dispose?.());
                } else {
                    object.material?.dispose?.();
                }
            });
        }
        this.scene.remove(this.actualRoom);
    }
}
