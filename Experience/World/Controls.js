import ScrollSequencer from "./ScrollSequencer.js";

/**
 * Input choreography facade.
 *
 * Kept as the single entry point for "the scene follows the reader": it owns the
 * scroll sequencer and the reduced-motion decision, so `Experience` does not have
 * to know how any of it works.
 */
export default class Controls {
    constructor({ sizes, camera, room, floor }) {
        this.sizes = sizes;
        this.camera = camera;
        this.room = room;
        this.floor = floor;

        this.sequencer = new ScrollSequencer({ sizes, camera, room, floor });
    }

    destroy() {
        this.sequencer?.destroy();
    }
}
