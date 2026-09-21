import * as THREE from "three";
import Experience from "../Experience.js";

export default class Environment {
    experience: Experience;
    scene: THREE.Scene;
    resources: any;
    sunLight!: THREE.DirectionalLight;
    ambientLight!: THREE.AmbientLight;

    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;

        this.setSunlight();
    }

    setSunlight() {
        this.sunLight = new THREE.DirectionalLight("#ffffff", 3);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.far = 20;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.sunLight.shadow.normalBias = 0.05;
        this.sunLight.position.set(-1.5, 7, 3);
        this.scene.add(this.sunLight);

        this.ambientLight = new THREE.AmbientLight("#ffffff", 1);
        this.scene.add(this.ambientLight);
    }

    switchTheme(theme: string) {
        if (theme === "dark") {
            this.sunLight.color.setHex(0x242341);
            this.ambientLight.color.setHex(0x242341);
            this.sunLight.intensity = 0.78;
            this.ambientLight.intensity = 0.78;
        } else {
            this.sunLight.color.setHex(0xffffff);
            this.ambientLight.color.setHex(0xffffff);
            this.sunLight.intensity = 3;
            this.ambientLight.intensity = 1;
        }
    }

    resize() {}

    update() {}
}
