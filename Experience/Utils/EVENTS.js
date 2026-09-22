/**
 * Frozen event-name constants.
 *
 * Why: event names used to be bare strings ("ready", "worldready", "enablecontrols")
 * scattered across six files. A typo failed silently. Import the constant instead.
 */
export const EVENTS = Object.freeze({
    BOOT_STATE: "boot:state",

    RESOURCES_PROGRESS: "resources:progress",
    RESOURCES_READY: "resources:ready",
    RESOURCES_ERROR: "resources:error",

    WORLD_READY: "world:ready",

    THEME_CHANGE: "theme:change",

    SIZES_RESIZE: "sizes:resize",
    SIZES_PROFILE_CHANGE: "sizes:profile-change",

    TIME_TICK: "time:tick",
});
