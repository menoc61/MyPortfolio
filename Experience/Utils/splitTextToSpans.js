export const SPLIT_CHAR_CLASS = "animatedis";

/**
 * Split an element's text into one span per character, for the intro reveal.
 *
 * The original did `element.innerHTML = element.innerText.split("")...`, which
 * destroyed the element's accessible name — and because every `.animatedis` span
 * starts at `translateY(100%)`, the hero heading (the author's *name*) was
 * invisible until GSAP ran. No WebGL, no JS, or a thrown error meant the name
 * simply was not on the page.
 *
 * This version:
 *   1. keeps the real text in an `.sr-only` span, so the accessible name and any
 *      crawler that reads the DOM still get the words;
 *   2. marks the decorative per-character spans `aria-hidden`;
 *   3. builds nodes with the DOM API instead of `innerHTML`, so there is no
 *      escaping hazard;
 *   4. is idempotent, so an accidental double call cannot double the text.
 *
 * @returns {{element: HTMLElement, chars: HTMLElement[]}|null}
 */
export default function splitTextToSpans(
    element,
    { className = SPLIT_CHAR_CLASS } = {}
) {
    if (!element || element.dataset.split === "true") {
        return null;
    }

    const text = (element.textContent ?? "").trim();
    if (!text) {
        return null;
    }

    const accessible = document.createElement("span");
    accessible.className = "sr-only";
    accessible.textContent = text;

    const visual = document.createElement("span");
    visual.className = "split";
    visual.setAttribute("aria-hidden", "true");

    const chars = [];
    for (const char of text) {
        const span = document.createElement("span");
        if (char === " ") {
            span.textContent = "\u00A0";
        } else {
            span.className = className;
            span.textContent = char;
        }
        visual.append(span);
        chars.push(span);
    }

    element.textContent = "";
    element.append(accessible, visual);
    element.dataset.split = "true";
    element.classList.add("is-split");

    return { element, chars };
}
