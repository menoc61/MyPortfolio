/**
 * Micro-interactions engine — tooltips, hover scrims, info popups, focus
 * glow, reveal-on-scroll, magnetic hover buttons, etc.
 *
 * Every feature is opt-in via data attributes on elements.
 *
 * Usage (data attributes)
 *  - data-tip="text"            → tooltip (positioned near element)
 *  - data-tip-placement="top"   → top | bottom | left | right
 *  - data-scrim                 → hover scrim + subtle lift
 *  - data-info                  → click/tap info bubble (data-info-content)
 *  - data-magnetic              → magnetic hover follow (buttons/CTAs)
 *  - data-reveal                → GSAP ScrollTrigger reveal on scroll
 *  - data-reveal-delay="0.15"   → stagger delay for siblings
 *
 * All features respect `prefers-reduced-motion`.
 */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const registry = {
  tooltips: new Map(),
  magentics: new Map(),
  scrims: new Map(),
  reveals: new Map(),
};

// ── tooltip system ──────────────────────────────────────────────────────────

const TIP_TRIGGER_CLASS = "tippy-trigger";

function positionTip(tip, trigger) {
  const tr = trigger.getBoundingClientRect();
  const ti = tip.getBoundingClientRect();
  const pad = 8;
  let x = 0, y = 0;
  const p = getComputedStyle(trigger).getPropertyValue("--tippy-placement").trim() || "top";
  if (p === "top") {
    x = tr.left + tr.width / 2 - ti.width / 2;
    y = tr.top - ti.height - pad;
  } else if (p === "bottom") {
    x = tr.left + tr.width / 2 - ti.width / 2;
    y = tr.bottom + pad;
  } else if (p === "left") {
    x = tr.left - ti.width - pad;
    y = tr.top + tr.height / 2 - ti.height / 2;
  } else if (p === "right") {
    x = tr.right + pad;
    y = tr.top + tr.height / 2 - ti.height / 2;
  }
  x = Math.max(pad, Math.min(x, window.innerWidth - ti.width - pad));
  y = Math.max(pad, Math.min(y, window.innerHeight - ti.height - pad));
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

function attachTooltip(trigger, text, placement) {
  if (REDUCED) return;
  const tip = tipElement(text, placement);
  trigger.classList.add(TIP_TRIGGER_CLASS);
  trigger.style.setProperty("--tippy-placement", placement);
  trigger.addEventListener("mouseenter", () => {
    tip.style.opacity = "1";
    tip.style.visibility = "visible";
    positionTip(tip, trigger);
  });
  trigger.addEventListener("mouseleave", () => {
    tip.style.opacity = "0";
    tip.style.visibility = "hidden";
  });
  trigger.addEventListener("focus", () => {
    tip.style.opacity = "1";
    tip.style.visibility = "visible";
    positionTip(tip, trigger);
  });
  trigger.addEventListener("blur", () => {
    tip.style.opacity = "0";
    tip.style.visibility = "hidden";
  });
  const onScroll = () => positionTip(tip, trigger);
  window.addEventListener("scroll", onScroll, { passive: true });
  registry.tooltips.set(trigger, { tip, onScroll });
}

export function wireTooltips(root) {
  root.querySelectorAll("[data-tip]").forEach((el) => {
    const text = el.getAttribute("data-tip");
    const placement = el.getAttribute("data-tip-placement") || "top";
    if (!registry.tooltips.has(el)) attachTooltip(el, text, placement);
  });
}

// ── scrim / hover effect ────────────────────────────────────────────────────

function attachScrim(el) {
  if (REDUCED) return;
  el.addEventListener("mouseenter", () => el.classList.add("scrim--active"));
  el.addEventListener("mouseleave", () => el.classList.remove("scrim--active"));
}

export function wireScrims(root) {
  root.querySelectorAll("[data-scrim]").forEach((el) => {
    if (!registry.scrims.has(el)) {
      attachScrim(el);
      registry.scrims.set(el, true);
    }
  });
}

// ── info popups ─────────────────────────────────────────────────────────────

function attachInfo(el) {
  const content = el.getAttribute("data-info-content");
  if (!content) return;
  const bubble = document.createElement("div");
  bubble.className = "info-bubble";
  bubble.innerHTML = content;
  bubble.setAttribute("role", "dialog");
  bubble.setAttribute("aria-label", "Info");
  bubble.style.visibility = "hidden";
  bubble.style.opacity = "0";
  document.body.appendChild(bubble);
  let open = false;
  const openBubble = () => {
    open = true;
    bubble.style.visibility = "visible";
    bubble.style.opacity = "1";
    positionInfoBubble(bubble, el);
  };
  const closeBubble = () => {
    open = false;
    bubble.style.opacity = "0";
    bubble.style.visibility = "hidden";
  };
  el.addEventListener("mouseenter", openBubble);
  el.addEventListener("mouseleave", closeBubble);
  el.addEventListener("focus", openBubble);
  el.addEventListener("blur", closeBubble);
  el.addEventListener("click", () => { open ? closeBubble() : openBubble(); });
  const onScroll = () => { if (open) positionInfoBubble(bubble, el); };
  window.addEventListener("scroll", onScroll, { passive: true });
  registry.scrims.set(el, { bubble, onScroll });
}

function positionInfoBubble(bubble, anchor) {
  const ar = anchor.getBoundingClientRect();
  const br = bubble.getBoundingClientRect();
  const pad = 8;
  let x = ar.left + ar.width / 2 - br.width / 2;
  let y = ar.bottom + pad + 8;
  x = Math.max(pad, Math.min(x, window.innerWidth - br.width - pad));
  y = Math.max(pad, Math.min(y, window.innerHeight - br.height - pad));
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
}

export function wireInfo(root) {
  root.querySelectorAll("[data-info]").forEach((el) => {
    if (!registry.scrims.has(el)) {
      attachInfo(el);
      registry.scrims.set(el, true);
    }
  });
}

// ── magnetic hover ─────────────────────────────────────────────────────────

function attachMagnetic(el, strength) {
  if (REDUCED) return;
  let rect = null;
  const onMove = (e) => {
    rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const max = Math.min(rect.width, rect.height) / 2;
    const clamp = (v) => Math.max(-max, Math.min(max, v));
    const x = clamp(dx * strength);
    const y = clamp(dy * strength);
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => {
    el.style.transform = "";
    rect = null;
  };
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  registry.magentics.set(el, { onMove, onLeave });
}

export function wireMagnetics(root) {
  root.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.getAttribute("data-magnetic") || "0.12");
    if (!registry.magentics.has(el)) attachMagnetic(el, strength);
  });
}

