import * as THREE from "three";
import Experience from "../Experience.js";
import Resources from "../Utils/Resources.js";
import Time from "../Utils/Time.js";
import gsap from "gsap";

export default class Room {
    experience: Experience;
    scene: THREE.Scene;
    resources: Resources;
    time: Time;
    room: any;
    actualRoom: THREE.Object3D;
    roomChildren: { [key: string]: THREE.Object3D };
    lerp: { current: number; target: number; ease: number };
    rectLight!: THREE.RectAreaLight;
    mixer!: THREE.AnimationMixer;
    swim!: THREE.AnimationAction;
    rotation: number = 0;

    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.room = this.resources.items.room;
        this.actualRoom = this.room.scene;
        this.roomChildren = {};

        this.lerp = {
            current: 0,
            target: 0,
            ease: 0.1,
        };

        this.setModel();
        this.setAnimation();
        this.onMouseMove();
    }

    setModel() {
        this.actualRoom.children.forEach((child: any) => {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child instanceof THREE.Group) {
                child.children.forEach((groupchild: any) => {
                    groupchild.castShadow = true;
                    groupchild.receiveShadow = true;
                });
            }

            if (child.name === "Aquarium") {
                child.children[0].material = new THREE.MeshPhysicalMaterial({
                    roughness: 0,
                    color: 0x549dd2,
                    ior: 3,
                    transmission: 1,
                    opacity: 1,
                    transparent: true,
                });
            }

            if (child.name === "Computer") {
                child.children[1].material = new THREE.MeshBasicMaterial({
                    map: this.resources.items.screen,
                });
            }

            if (child.name === "Mini_Floor") {
                child.position.x = -0.289521;
                child.position.z = 8.83572;
            }

            if (
                child.name === "Mailbox" ||
                child.name === "Lamp" ||
                child.name === "FloorFirst" ||
                child.name === "FloorSecond" ||
                child.name === "FloorThird" ||
                child.name === "Dirt" ||
                child.name === "Flower1" ||
                child.name === "Flower2"
            ) {
                child.scale.set(0, 0, 0);
            }

            this.roomChildren[child.name.toLowerCase()] = child;
        });

        const width = 0.5;
        const height = 0.7;
        const intensity = 1;
        this.rectLight = new THREE.RectAreaLight(
            0xffffff,
            intensity,
            width,
            height
        );
        this.rectLight.position.set(7.68244, 7, 0.5);
        this.rectLight.rotation.x = -Math.PI / 2;
        this.rectLight.rotation.z = Math.PI / 4;
        this.actualRoom.add(this.rectLight);

        this.roomChildren["rectLight"] = this.rectLight as any;

        this.scene.add(this.actualRoom);
        this.actualRoom.scale.set(0.11, 0.11, 0.11);
    }

    setAnimation() {
        this.mixer = new THREE.AnimationMixer(this.actualRoom);
        if (this.room.animations && this.room.animations[0]) {
            this.swim = this.mixer.clipAction(this.room.animations[0]);
            this.swim.play();
        }
    }

    onMouseMove() {
        window.addEventListener("mousemove", (e) => {
            this.rotation =
                ((e.clientX - window.innerWidth / 2) * 2) / window.innerWidth;
            this.lerp.target = this.rotation * 0.1;
        });
    }

    resize() {}

    update() {
        this.lerp.current = gsap.utils.interpolate(
            this.lerp.current,
            this.lerp.target,
            this.lerp.ease
        );

        this.actualRoom.rotation.y = this.lerp.current;

        if (this.mixer) {
            this.mixer.update(this.time.delta * 0.001);
        }
    }
}
