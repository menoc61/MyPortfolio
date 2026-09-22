## What changed?

<!-- One or two sentences. -->

## Why?

<!-- The problem this solves. Link an issue if there is one. -->

## Checklist

- [ ] `npm run build` passes
- [ ] Content is still visible **with JavaScript disabled / WebGL unavailable** (see README > Graceful degradation)
- [ ] `prefers-reduced-motion: reduce` still shows the page correctly (see README > Reducing motion)
- [ ] No new magic numbers — animation/camera values live in `Experience/Config/scene.config.js`
- [ ] If copy changed: `index.html` **and** the JSON-LD `Person` block are in sync
- [ ] If a dependency was added: it is actually imported and used (no unused deps)
