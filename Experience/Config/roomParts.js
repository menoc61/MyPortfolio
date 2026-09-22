/**
 * The GLB node manifest.
 *
 * Why: Room.js, Preloader.js and Controls.js each compared `child.name` against
 * bare string literals. `Controls.js` compared against "Mini_Floor" while the GLB
 * node is actually "Mini Floor" (a space), so that animation silently never ran.
 * One manifest means one place to be wrong — and `Room.parts` only ever exposes
 * keys that were actually found.
 */

/** Normalised key -> exact GLB node name. */
export const ROOM_PARTS = Object.freeze({
    cube: "Cube",
    computer: "Computer",
    shelves: "Shelves",
    miniFloor: "Mini Floor",
    tableStuff: "Table Stuff",
    fish: "fish",
    desks: "Desks",
    clock: "Clock",
    lamp: "Lamp",
    mailbox: "Mailbox",
    dirt: "Dirt",
    floorThird: "FloorThird",
    floorSecond: "FloorSecond",
    floorFirst: "FloorFirst",
    flower1: "Flower1",
    flower2: "Flower2",
    floorItems: "Floor Items",
    chair: "Chair",
    aquarium: "Aquarium",
    body: "Body",
});

/**
 * Parts that materialise behind the intro, in order.
 * `position: "chair"` means "start alongside the chair tween" (a GSAP label).
 */
export const INTRO_REVEAL = Object.freeze([
    { part: "aquarium", ease: "back.out(2.2)", duration: 0.5, position: ">-0.5" },
    { part: "clock", ease: "back.out(2.2)", duration: 0.5, position: ">-0.4" },
    { part: "shelves", ease: "back.out(2.2)", duration: 0.5, position: ">-0.3" },
    { part: "floorItems", ease: "back.out(2.2)", duration: 0.5, position: ">-0.2" },
    { part: "desks", ease: "back.out(2.2)", duration: 0.5, position: ">-0.1" },
    { part: "tableStuff", ease: "back.out(2.2)", duration: 0.5, position: ">-0.1" },
    { part: "computer", ease: "back.out(2.2)", duration: 0.5, position: ">-0.1" },
    { part: "miniFloor", set: true },
    { part: "chair", ease: "back.out(2.2)", duration: 0.5, position: "chair" },
    { part: "fish", ease: "back.out(2.2)", duration: 0.5, position: "chair" },
]);

/** The chair does a small spin as it lands. */
export const INTRO_CHAIR_SPIN = Object.freeze({
    rotationY: 4 * Math.PI + Math.PI / 4,
    ease: "power2.out",
    duration: 1,
    position: "chair",
});

/**
 * The mini platform parts are NOT revealed by the intro. They stay hidden until
 * the reader reaches the last story step, then pop in one after another.
 */
export const MINI_PLATFORM_REVEAL = Object.freeze([
    { part: "mailbox", ease: "back.out(2)", duration: 0.3 },
    { part: "lamp", ease: "back.out(2)", duration: 0.3 },
    { part: "floorFirst", ease: "back.out(2)", duration: 0.3 },
    { part: "floorSecond", duration: 0.3 },
    { part: "floorThird", ease: "back.out(2)", duration: 0.3 },
    { part: "dirt", ease: "back.out(2)", duration: 0.3 },
    { part: "flower1", ease: "back.out(2)", duration: 0.3 },
    { part: "flower2", ease: "back.out(2)", duration: 0.3 },
]);

/** Where the mini platform sits until the last story step moves it. */
export const MINI_PLATFORM_HOME = Object.freeze({ x: -0.289521, z: 8.83572 });

/** Where the last story step slides it to. */
export const MINI_PLATFORM_OFFSET = Object.freeze({ x: -5.44055, z: 13.6135 });

/**
 * Which parts cast a shadow.
 *
 * The original set `castShadow` on every mesh, so the shadow pass re-drew the
 * whole diorama every frame — including flat things (the floors, the dirt patch)
 * whose shadows are invisible at this scale. Only silhouettes that read.
 */
export const CASTS_SHADOW = Object.freeze([
    "body",
    "desks",
    "shelves",
    "computer",
    "miniFloor",
    "tableStuff",
    "chair",
    "aquarium",
]);

/** The aquarium body is swapped for a transmissive glass material. */
export const AQUARIUM_MATERIAL = Object.freeze({
    color: 0x549dd2,
    roughness: 0,
    ior: 3,
    transmission: 1,
    opacity: 1,
});
