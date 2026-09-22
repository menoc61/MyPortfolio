/**
 * Entry point.
 *
 * Fonts are imported here rather than via `@import` inside the stylesheet: a CSS
 * `@import` to a third party is render-blocking and costs a DNS + TLS round trip
 * before the first paint. These are self-hosted, so they resolve with the bundle.
 */
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";

import "./style.css";

import Experience from "./Experience/Experience.js";
import { dom } from "./Experience/Utils/dom.js";

try {
    new Experience(dom.canvas);
} catch (error) {
    // Last line of defence: if anything in the scene graph throws, the content
    // must still be readable. `is-degraded` hides the canvas and releases the
    // scroll lock (see styles/shell.css).
    console.error("[main] the 3D experience failed to start", error);
    const { documentElement } = document;
    documentElement.classList.remove("is-loading", "is-intro");
    documentElement.classList.add("is-degraded");
}
