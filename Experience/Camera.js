import * as THREE from "three";
import { ORTHO_CAMERA } from "./Config/scene.config.js";

/**
 * The camera.
 *
 * Changed from the original: this file used to also build a `PerspectiveCamera`
 * and an `OrbitControls` instance that **nothing ever rendered** — `Renderer`
 * only ever draws `orthographicCamera`. That was ~40 lines and a 5 KB example
 * module shipped for a camera that never drew a pixel. Both are gone.
 *
 * If a free-look mode is ever wanted, add it here behind an explicit flag rather
 * than paying for it on every page load.
 */
export default class Camera {
    constructor({ scene, sizes }) {
        this.scene = scene;
        this.sizes = sizes;

        this.createOrthographicCamera();
    }

    createOrthographicCamera() {
        const { frustum, near, far, position, rotationX } = ORTHO_CAMERA;

        this.orthographicCamera = new THREE.OrthographicCamera(
            (-this.sizes.aspect * frustum) / 2,
            (this.sizes.aspect * frustum) / 2,
            frustum / 2,
            -frustum / 2,
            near,
            far
        );

        this.orthographicCamera.position.set(position.x, position.y, position.z);
        this.orthographicCamera.rotation.x = rotationX;

        this.scene.add(this.orthographicCamera);
    }

    resize() {
        const { frustum } = ORTHO_CAMERA;

        this.orthographicCamera.left = (-this.sizes.aspect * frustum) / 2;
        this.orthographicCamera.right = (this.sizes.aspect * frustum) / 2;
        this.orthographicCamera.top = frustum / 2;
        this.orthographicCamera.bottom = -frustum / 2;
        this.orthographicCamera.updateProjectionMatrix();
    }
}
