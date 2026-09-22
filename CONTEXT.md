# CONTEXT — domain glossary

The vocabulary this codebase uses. Use these words in code, commits and reviews; do not invent synonyms.

## Core concepts

**Portfolio** — the whole product: one page, three sections, one WebGL scene, one scroll story.

**Experience** — the composition root (`Experience/Experience.js`). The *only* module allowed to know
the construction order of the other modules. Everything else receives its dependencies as arguments.
When you need a new subsystem, register it here and pass it down — never reach for `new Experience()`
inside a leaf module to fetch a sibling.

**Boot** — the lifecycle of the page, modelled explicitly as a state machine:
`loading -> ready` or `loading -> failed`. Replaces the old, implicit "the preloader decides when
anything may happen" arrangement. Anything that needs the scene must wait on Boot, never on a
bare event string.

**World** — the 3D scene graph: `Room`, `Floor`, `Environment`. Owns the objects, not the animation.

**Room** — the GLB diorama. Its addressable meshes are exposed through `Room.parts` (a frozen map),
keyed by the *normalised* GLB node name (`"Mini Floor"` -> `parts.miniFloor`). Colour, material and
scale tweaks that belong to the artwork live here.

**Part** — one addressable mesh inside the Room (`cube`, `body`, `aquarium`, `chair`, `fish`,
`computer`, `miniFloor`, `rectLight`, ...). Parts are referenced by name, never by index.

**Floor** — the ground plane plus the three **section circles** (`first`/`second`/`third`).
The circles are the visual echo of the three page sections.

**Section** — one screen of the scroll story: `hero`, `about`, `work`, `contact`.
Each section owns one circle, one camera pose and one room transform.

**Scroll story** — the declarative description of how the scene changes as the reader scrolls
(`World/scrollStory.js`). It is **data**: trigger selector, camera target, room transform, circle to
grow, device overrides. It contains no GSAP calls.

**Scroll sequencer** — the **mechanism** that consumes a scroll story and produces GSAP timelines and
ScrollTriggers (`World/ScrollSequencer.js`). It contains no portfolio-specific numbers.

**Device profile** — the named set of numbers used for a viewport class (`desktop`, `mobile`):
room scale, room offset, camera pose, circle scale. Lives in `Config/scene.config.js` only.
If a number differs between desktop and mobile, it belongs in a profile — never inline.

**Magic number** — any unexplained literal in animation or camera code. There are none; they all live
in `Config/scene.config.js`.

**Boot state** — see *Boot*.

**Reduced-motion tier** — how a given animation degrades under `prefers-reduced-motion: reduce`.
Tier 1 = removed (camera travel, smooth scroll), Tier 2 = softened to a short fade, Tier 3 = kept
(theme crossfade, focus rings, loading spinner).

## Things that are deliberately NOT here

- No framework (no React/Vue/Svelte). No TypeScript. No CSS framework.
- No runtime content fetching. Content is static HTML so crawlers see it.
- No analytics beyond what is explicitly configured.
