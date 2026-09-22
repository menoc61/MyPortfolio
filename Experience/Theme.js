import EventBus from "./Utils/EventBus.js";
import { EVENTS } from "./Utils/EVENTS.js";
import { dom } from "./Utils/dom.js";
import { THEME_CHROME_COLORS } from "./Config/scene.config.js";

export const THEMES = Object.freeze({ LIGHT: "light", DARK: "dark" });

/** localStorage key for the reader's explicit choice. */
const STORAGE_KEY = "gm-theme";

/**
 * Light/dark theme.
 *
 * Changed from the original:
 *  - it extends our local EventBus instead of the Node `events` polyfill;
 *  - it reads a stored preference and falls back to the OS setting, instead of
 *    always starting light and forgetting the choice on reload;
 *  - the toggle is a real switch for assistive tech (`aria-pressed` + label);
 *  - the browser chrome colour (`<meta name="theme-color">`) follows the theme;
 *  - the change is wrapped in a View Transition when the platform supports it,
 *    and collapses to an instant swap when the reader prefers reduced motion.
 *
 * It is constructed before any WebGL work, so the theme keeps working even when
 * the scene cannot boot at all.
 */
export default class Theme extends EventBus {
    constructor({ button = dom.themeToggle, circle = dom.themeToggleCircle } = {}) {
        super();
        this.button = button;
        this.circle = circle;
        this.meta = document.querySelector('meta[name="theme-color"]');
        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        this.theme = this.readPreference();
        this.apply(this.theme, { animate: false });

        this.button?.addEventListener("click", () => this.toggle());
    }

    readPreference() {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
                return stored;
            }
        } catch {
            // Private mode / storage disabled: fall through to the OS setting.
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? THEMES.DARK
            : THEMES.LIGHT;
    }

    toggle() {
        this.set(this.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
    }

    set(next, options = {}) {
        if (next === this.theme) {
            return;
        }
        this.theme = next;

        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Non-fatal: the theme still applies for this session.
        }

        const swap = () => this.apply(next, options);
        if (document.startViewTransition && !this.reducedMotion.matches) {
            document.startViewTransition(swap);
        } else {
            swap();
        }

        this.emit(EVENTS.THEME_CHANGE, next);
    }

    apply(theme, { animate = true } = {}) {
        const isDark = theme === THEMES.DARK;
        const { body } = document;

        if (!animate) {
            body.classList.add("theme-no-transition");
        }

        body.classList.toggle("dark-theme", isDark);
        body.classList.toggle("light-theme", !isDark);
        this.circle?.classList.toggle("slide", isDark);

        if (this.button) {
            this.button.setAttribute("aria-pressed", String(isDark));
            this.button.setAttribute(
                "aria-label",
                isDark ? "Switch to light theme" : "Switch to dark theme"
            );
        }

        this.meta?.setAttribute(
            "content",
            isDark ? THEME_CHROME_COLORS.dark : THEME_CHROME_COLORS.light
        );

        if (!animate) {
            // Force a reflow so the class is gone before the first paint.
            void body.offsetHeight;
            body.classList.remove("theme-no-transition");
        }
    }
}
