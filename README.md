# Gilles Momeni — Portfolio (v1, WebGL room)

An interactive 3D portfolio. A hand-built WebGL diorama (a small room, modelled in Blender)
sits behind a scroll-driven editorial layout. The DOM scroll position drives the camera, the
room's position/scale, and an environmental light rig, all through **GSAP ScrollTrigger**.

- **Live:** https://gilles-momeni.vercel.app
- **Stack:** vanilla ES modules + [Three.js](https://threejs.org) + [GSAP](https://gsap.com) + [Vite](https://vitejs.dev)
- **No framework. No TypeScript.** Everything is plain JavaScript.

> **v2 note.** A separate React rewrite lives at https://gillemomeni-v2.vercel.app (its own repo).
> This repo is the original Three.js version and is deliberately kept framework-free.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve the production build locally
```

Requires **Node 24** (see `.nvmrc`).

---

## Changelog

### Unreleased
- Added a project changelog to the README to track notable updates and release history.
- Kept the README focused on setup, architecture, accessibility, and performance notes.

### v1.0.0
- Initial public launch of the portfolio, including the WebGL room experience, scroll-driven editorial layout, and Vite build setup.
- Added a graceful degradation path for WebGL failures, reduced-motion support, and SEO-focused static content.
- Organized the project around a modular Three.js experience with GSAP-driven storytelling.

---

## Project structure

```
index.html                    # All content lives here, in the DOM (SEO: crawlers must see it)
main.js                       # Entry point: imports CSS, boots the Experience
style.css                     # Generated from styles/*.css via @import
vite.config.js                # Build config + vendor chunk splitting

Experience/
  Experience.js               # Composition root. The only module that knows construction order.
  Boot.js                     # Boot-state machine: loading -> ready | failed (see "Graceful degradation")
  Camera.js                   # Orthographic camera (the one that renders) + resize
  Renderer.js                 # WebGLRenderer setup + per-frame render
  Theme.js                    # Light/dark theme controller
  Preloader.js                # Introductory animation sequence
  Config/
    scene.config.js           # EVERY magic number + the per-device profiles. Single source of truth.
    profile.js                # Static profile/social data mirrored for JSON-LD
  Utils/
    EVENTS.js                 # Frozen event-name constants
    EventBus.js               # Tiny local emitter (replaces the Node `events` polyfill)
    dom.js                    # Named DOM refs, resolved once, with dev-time assertions
    assets.js                 # Asset manifest
    Resources.js              # GLTF/video loading, with error handling
    Sizes.js                  # Viewport size, DPR clamp, device profile
    Time.js                   # RAF loop (pauses when the tab is hidden)
    splitTextToSpans.js       # Character split for intro animations (a11y-safe)
  World/
    World.js                  # Owns Room / Floor / Environment
    Room.js                   # The GLB model, per-mesh material tweaks, `parts` accessor
    Floor.js                  # Ground plane + the three section circles
    Environment.js            # Light rig (directional + ambient) + theme switching
    scrollStory.js            # The scroll story as DATA (sections, targets, transforms)
    ScrollSequencer.js        # The MECHANISM that turns scrollStory into GSAP timelines
    Controls.js               # Thin facade over ScrollSequencer

style/                        # Source CSS, imported by style.css
public/
  models/                     # room GLB (Draco-compressed)
  textures/                   # screen video texture
  draco/                      # Draco decoder (required at runtime: the GLB uses Draco)
  robots.txt  sitemap.xml     # SEO
```

---

## Graceful degradation (important)

The layout **must** be readable even if WebGL is unavailable or the model fails to load.
`Boot.js` is a small state machine (`loading` / `ready` / `failed`) that:

1. resolves on `Resources.ready`, **or** on an asset error, **or** on a hard timeout;
2. adds a `webgl-failed` / `load-failed` class to `<body>`;
3. in those states the canvas is hidden and the `.page` content is plain, scrollable HTML.

Never reintroduce a code path where the preloader can only be dismissed by WebGL.
There is a Playwright smoke test for exactly this (`tests/`).

---

## Reducing motion

`prefers-reduced-motion: reduce` is honoured in **tiers**, not as a kill switch:

| Tier | Examples | Reduced behaviour |
|---|---|---|
| 1 | Camera travel, room repositioning, circle growth, smooth scroll | Removed |
| 2 | Section reveals | Short opacity fade (<=200ms) |
| 3 | Theme transitions, focus rings, loading indicator | Kept |

CSS handles the DOM layer; `gsap.matchMedia()` handles the timeline layer; `Boot.js` skips the
intro choreography for the WebGL layer.

---

## Performance budget

- Device pixel ratio clamped (see `Sizes.js`) — never render 3x pixels on a phone.
- Shadow map 1024px, on the few meshes that read at diorama scale.
- Render loop pauses when `document.hidden` or when the canvas is out of view.
- `three` and `gsap` are split into their own chunks (`vite.config.js`).

---

## SEO checklist

Everything content-related is static in `index.html` so it is visible without JavaScript:
title/description/canonical, Open Graph + Twitter cards, JSON-LD `Person`, `robots.txt`,
`sitemap.xml`. When you change copy, change it in `index.html` **and** keep the JSON-LD in sync.

---

## Credits & licence

- **WebGL model:** "Head of David but with hay" — **personal use only, not for commercial use.**
  Attribution is displayed in the site's credits block and must stay.
- **Code:** GNU GPL v3 (see `LICENSE`).
- **Typefaces:** open-source, self-hosted via `@fontsource` (see `style/`).

The original model/room artwork is not relicensed by this repository's GPL licence.
