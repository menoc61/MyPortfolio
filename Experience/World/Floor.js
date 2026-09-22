import * as THREE from "three";
import { CIRCLES, PLANE } from "../Config/scene.config.js";

/**
 * The ground plane and the three section circles.
 *
 * The three near-identical `circleFirst/Second/Third` blocks the original repeated
 * by hand are now a loop over `CIRCLES`, so "how many sections are there" is
 * answered in one place.
 *
 * The circles echo the page sections: each one grows as the reader enters its
 * section (see World/scrollStory.js).
 */
export default class Floor {
    constructor({ scene }) {
        this.scene = scene;

        this.setFloor();
        this.setCircles();
    }

    setFloor() {
        this.geometry = new THREE.PlaneGeometry(PLANE.size, PLANE.size);
        this.material = new THREE.MeshStandardMaterial({
            color: PLANE.color,
            side: THREE.BackSide,
        });

        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.plane.rotation.x = Math.PI / 2;
        this.plane.position.y = PLANE.positionY;
        this.plane.receiveShadow = true;

        this.scene.add(this.plane);
    }

    setCircles() {
        const geometry = new THREE.CircleGeometry(CIRCLES.radius, CIRCLES.segments);

        this.circles = {};

        for (const [key, color] of Object.entries(CIRCLES.colors)) {
            const material = new THREE.MeshStandardMaterial({ color });
            const circle = new THREE.Mesh(geometry, material);

            circle.position.y = CIRCLES.y[key];
            circle.rotation.x = -Math.PI / 2;
            circle.receiveShadow = true;
            // Hidden by default; the scroll story grows them in.
            circle.scale.setScalar(0);

            circle.name = `circle${key[0].toUpperCase()}${key.slice(1)}`;

            this.scene.add(circle);
            this.circles[key] = circle;
        }

        // Preserve the original public field names (ScrollSequencer resolves
        // "circle.first" -> this.circleFirst).
        this.circleFirst = this.circles.first;
        this.circleSecond = this.circles.second;
        this.circleThird = this.circles.third;

        this.circleSecond.position.x = CIRCLES.secondOffsetX;
    }

    destroy() {
        this.geometry?.dispose();
        this.material?.dispose();
        for (const circle of Object.values(this.circles ?? {})) {
            circle.geometry.dispose();
            circle.material.dispose();
            this.scene.remove(circle);
        }
        this.scene.remove(this.plane);
    }
}
