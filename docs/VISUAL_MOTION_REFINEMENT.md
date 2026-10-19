# Warm editorial refinement

## Design decisions

- Keep Hugo/Doks/Bootstrap/SCSS, the light-only shell, the blue waves, the existing project illustrations and their honest “concept” captions.
- Use warm paper `#fcfaf8`, ink `#26251e`, quieter neutral surfaces and modest six-pixel panel corners. The primary actions are rounded; the entire site does not become a collection of pill-shaped cards.
- Retain the Chinese serif display character with lighter hero weight and modest tracking. Article text stays 17px on desktop and 16px on narrow screens, with readable line length and 1.95 line height. No display-style wide tracking on prose.
- Selected work uses a larger first preview and two supporting cards. Filtering returns a regular two-column grid, or one column on phones. Product UI remains dark where it depicts the product; its surrounding stage is warm and quiet.
- Hover lift is three pixels, with a soft border/shadow change. Touch devices do not depend on hover; complex perspective is disabled on narrow/coarse-pointer devices.

## Motion contract

`hero-scroll.js` derives a single progress value from document geometry. The title, support copy, product stage, wave retreat and selected-work heading use overlapping cue windows on that timeline. The title leaves first; the work heading arrives after the wave begins to retreat. No wheel listener, scroll hijack, pinning, synthetic scroll distance or animation library is added.

The selected-work heading has exactly one animation owner (`data-hero-entry`). Other home headings/cards keep their existing once-per-document reveal behavior. A finite reveal is deliberately allowed to finish when it moves below the viewport; it is not paused mid-animation. Existing original project mask reveals are retained.

Fully transparent outgoing controls become inert. Keyboard-focused layers remain visible and interactive. The incoming heading is similarly removed from interaction only while transparent. Geometry uses offsets rather than animated rectangles. Resize, font readiness, restored history, and the existing navigation synchronization event remeasure the transition.

Reduced motion clears transition styles/inert state and leaves content visible. No-JavaScript HTML/CSS is readable by default. Hidden documents cancel queued scroll work; completed offscreen transitions no longer schedule per-scroll frames until the reader returns. Existing wave suspension remains intact.

## Reference boundary

Inspiration: [MiMo Code](https://mimo.xiaomi.com/coder?lang=en) for warm paper/ink and subtle tonal separation; [DeepSeek Harness](https://www.deepseek.com/en/harness/) for layered narrative timing. The implementation is original and retains the site's own SVG/CSS artwork and blue wave assets. No proprietary reference fonts, image assets or shaders were copied. The user's reverse-engineering notes informed these decisions; no new claim about the reference sites' live behavior is made.

## Verification

- `npm run ci`: search, theme, and motion tests; Hugo production build; production artifact verification.
- Seven new deterministic motion tests cover the incoming heading, reversal, focus, reduced motion, background cancellation, offscreen scheduling and compact perspective.
- Production verification checks the new tokens and selectors after CSS pruning.
- These tests validate behavior against API/geometry doubles, not browser rendering. Actual browser review and deployment status must be recorded separately; passing a build is not visual approval.
