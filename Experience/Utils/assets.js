/**
 * Asset manifest.
 *
 * `critical: true` means "without this there is no scene, fail the boot".
 * The screen video is decorative — if it 404s or autoplay is blocked, the room
 * still works and the reader still sees the whole portfolio. Counting it in the
 * same queue (as the original did) meant one blocked 2.4 MB video could take
 * down the entire page.
 */
export default [
    {
        name: "room",
        type: "glbModel",
        path: "/models/Finale Version 16.glb",
        critical: true,
    },
    {
        name: "screen",
        type: "videoTexture",
        path: "/textures/kda.mp4",
        critical: false,
    },
];
