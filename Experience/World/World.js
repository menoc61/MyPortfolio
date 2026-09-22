import EventBus from "../Utils/EventBus.js";
import { EVENTS } from "../Utils/EVENTS.js";

import Room from "./Room.js";
import Floor from "./Floor.js";
import Environment from "./Environment.js";

/**
 * The 3D scene graph.
 *
 * Changed from the original: it no longer listens for a stringly-typed resource
 * event and no longer fetches its own dependencies through the `Experience`
 * singleton. Everything arrives as an argument.
 */
export default class World extends EventBus {
    constructor({ scene, sizes, camera, resources, theme }) {
        super();

        this.scene = scene;
        this.environment = new Environment({ scene, sizes, theme });
        this.floor = new Floor({ scene });
        this.room = new Room({ scene, sizes, resources });

        // Emitted on the microtask queue so listeners attached immediately after
        // `new World()` still receive it — a constructor cannot know its
        // subscribers, and the original relied on a later, unrelated event firing.
        queueMicrotask(() => this.emit(EVENTS.WORLD_READY, this));
    }

    resize() {
        // Nothing in the scene is layout-dependent; the camera owns that.
    }

    update({ delta }) {
        this.room?.update({ delta });
    }

    destroy() {
        this.environment?.destroy();
        this.floor?.destroy();
        this.room?.destroy();
        this.clear();
    }
}
