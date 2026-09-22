/**
 * Named DOM refs — the DOM contract, in one place.
 *
 * Why: `.toggle-button`, `.page`, `.animatedis`, `.hero-main-title` … used to be
 * queried ad hoc from Theme.js, Controls.js and Preloader.js. Renaming a class in
 * the HTML produced a silent no-op. Here, a missing ref throws loudly in dev.
 */

export const dom = {
    // Shell
    html: document.documentElement,
    body: document.body,
    canvas: query(".experience-canvas"),
    experience: query(".experience"),
    page: query(".page"),
    preloader: query(".preloader"),
    scenePreloader: query("#scene-preloader"),

    // Header
    header: query(".site-header"),
    themeToggle: query(".toggle-button"),
    themeToggleCircle: query(".toggle-circle"),
    toggleBar: query(".toggle-bar"),

    // Hero / intro (these are split into spans for the intro animation)
    introText: query(".intro-text"),
    arrow: query(".arrow-svg-wrapper"),
    heroTitle: query(".hero-main-title"),
    heroDescription: query(".hero-main-description"),
    heroFirstSub: query(".first-sub"),
    heroSecondSub: query(".second-sub"),

    // Scroll story
    storySteps: queryAll(".story-step"),
    progressBars: queryAll(".progress-bar"),
    sections: queryAll(".section"),
};

/** Single-element query with a dev-time assertion. */
export function query(selector, root = document) {
    const el = root.querySelector(selector);
    if (!el && import.meta.env?.DEV) {
        console.warn(`[dom] missing required element: ${selector}`);
    }
    return el;
}

/** Multi-element query. Returns a real array (not a NodeList). */
export function queryAll(selector, root = document) {
    return [...root.querySelectorAll(selector)];
}

/**
 * True when the browser can actually give us a WebGL context.
 * Checked once, before anything WebGL is constructed.
 */
export function supportsWebGL() {
    try {
        const canvas = document.createElement("canvas");
        const gl =
            canvas.getContext("webgl2") ||
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
        if (!gl) {
            return false;
        }
        // Release the probe context immediately.
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) {
            lose.loseContext();
        }
        return true;
    } catch {
        return false;
    }
}
