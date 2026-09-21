import * as THREE from "three";
import { EventEmitter } from "eventemitter3";
import Experience from "../Experience.js";
import Resources from "../Utils/Resources.js";
import Environment from "./Environment.js";
import Floor from "./Floor.js";
import Room from "./Room.js";
import Controls from "./Controls.js";

export default class World extends EventEmitter {
    experience: Experience;
    sizes: any;
    scene: THREE.Scene;
    canvas: HTMLCanvasElement;
    camera: any;
    resources: Resources;
    theme: any;
    environment!: Environment;
    floor!: Floor;
    room!: Room;
    controls!: Controls;

    constructor() {
        super();
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.camera = this.experience.camera;
        this.resources = this.experience.resources;
        this.theme = this.experience.theme;

        this.resources.on("ready", () => {
            this.environment = new Environment();
            this.floor = new Floor();
            this.room = new Room();
            this.emit("worldready");

            this.theme.on("switch", (theme: string) => {
                this.switchTheme(theme);
            });
        });
    }

    switchTheme(theme: string) {
        if (this.environment) {
            this.environment.switchTheme(theme);
        }
    }

    resize() {}

    update() {
        if (this.room) {
            this.room.update();
        }
        if (this.controls) {
            this.controls.update();
        }
    }
}
