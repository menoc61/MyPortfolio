/**
 * EVERY magic number in the scene lives here.
 *
 * Why: these values used to be sprinkled through Controls.js (467 lines),
 * Preloader.js and Room.js, with the device-dependent ones (0.11 desktop /
 * 0.07 mobile) duplicated in three files that had to agree and silently didn't.
 * If a number differs between desktop and mobile, it belongs in a PROFILE.
 */

/** Orthographic camera geometry. Never changes between scroll sections. */
export const ORTHO_CAMERA = Object.freeze({
    frustum: 5,
    near: -50,
    far: 50,
    position: Object.freeze({ x: 0, y: 5.65, z: 10 }),
    rotationX: -Math.PI / 6,
});

/** Renderer look. */
export const RENDER = Object.freeze({
    toneMappingExposure: 1.75,
    /** DPR clamp. Rendering 3x pixels on a 3x phone is 9x the fill cost for no visible gain. */
    maxPixelRatio: Object.freeze({ desktop: 1.5, mobile: 1.25 }),
    shadowMapSize: Object.freeze({ desktop: 1024, mobile: 512 }),
});

/** Light rig. `intensity` values are in the physical units three.js uses by default. */
export const LIGHTING = Object.freeze({
    sun: Object.freeze({
        color: "#ffffff",
        intensity: 3,
        position: Object.freeze({ x: -1.5, y: 7, z: 3 }),
        shadowFar: 20,
        shadowNormalBias: 0.05,
    }),
    ambient: Object.freeze({ color: "#ffffff", intensity: 1 }),
    /** Values the light rig tweens to when the dark theme is active. */
    dark: Object.freeze({
        color: Object.freeze({ r: 0.17254901960784313, g: 0.23137254901960785, b: 0.6862745098039216 }),
        sunIntensity: 0.78,
        ambientIntensity: 0.78,
    }),
    light: Object.freeze({
        color: Object.freeze({ r: 1, g: 1, b: 1 }),
        sunIntensity: 3,
        ambientIntensity: 1,
    }),
    /** The RectAreaLight mounted behind the desk in the diorama. */
    desk: Object.freeze({
        color: 0xffffff,
        intensity: 1,
        position: Object.freeze({ x: 7.68244, y: 7, z: 0.5 }),
        rotationX: -Math.PI / 2,
        rotationZ: Math.PI / 4,
    }),
});

/** The three floor circles that echo the three page sections. */
export const CIRCLES = Object.freeze({
    radius: 5,
    segments: 64,
    colors: Object.freeze({ first: 0xe5a1aa, second: 0x8395cd, third: 0x7ad0ac }),
    y: Object.freeze({ first: -0.29, second: -0.28, third: -0.27 }),
    secondOffsetX: 2,
    growTo: 3,
    /** How far the pointer swings the room, as a fraction of the viewport half-width. */
    pointerInfluence: 0.05,
});

/** Ground plane. */
export const PLANE = Object.freeze({
    size: 100,
    color: 0xffe6a2,
    positionY: -0.3,
});

/**
 * Per-viewport-class numbers. The scroll story reads these; it never hard-codes.
 */
export const PROFILES = Object.freeze({
    desktop: Object.freeze({
        name: "desktop",
        /** Room transform when the reader is at the top of the page. */
        roomScale: 0.11,
        rectLight: Object.freeze({ width: 0.5, height: 0.7 }),
        cameraHome: Object.freeze({ x: 0, y: 6.5, z: 10 }),
        /** Where the room sits during the *intro* only (it animates back to 0). */
        introRoomOffset: Object.freeze({ x: -1, y: 0, z: 0 }),
    }),
    mobile: Object.freeze({
        name: "mobile",
        roomScale: 0.07,
        rectLight: Object.freeze({ width: 0.3, height: 0.4 }),
        cameraHome: Object.freeze({ x: 0, y: 6.5, z: 10 }),
        introRoomOffset: Object.freeze({ x: 0, y: 0, z: -1 }),
    }),
});

/**
 * The intro choreography.
 *
 * `viewport: { axis, factor }` means "resolve at run time as axis * factor" —
 * the two values that intentionally scale with the window size.
 */
export const INTRO = Object.freeze({
    preloaderFadeDelay: 1,
    cubeGrow: Object.freeze({ to: 1.4, ease: "back.out(2.5)", duration: 0.7 }),
    /** Cube flies off screen and the room lands, revealing the hero type. */
    cubeFinalScale: 10,
    cubeFinalSpin: 2 * Math.PI + Math.PI / 4,
    cubeHiddenScale: 0,
    cubeFinalPosition: Object.freeze({ x: 0.638711, y: 8.5618, z: 1.3243 }),
    bodyScale: 1,
    charStagger: 0.07,
    charEase: "back.out(1.7)",
});

/** Thumbnail of every magic constant for the scroll story. */
export const SCROLL = Object.freeze({
    scrub: 0.6,
    sectionPinScrub: 0.4,
    /** Border radius the "right"-aligned section animates into. */
    sectionRadius: 10,
    sectionRadiusLarge: 700,
});

/** Sizes / breakpoint. */
export const LAYOUT = Object.freeze({
    mobileBreakpoint: 968,
});

/** Browser-chrome colours, applied to <meta name="theme-color">. Keep in sync with styles/tokens.css. */
export const THEME_CHROME_COLORS = Object.freeze({
    light: "#f7f1e3",
    dark: "#171512",
});
