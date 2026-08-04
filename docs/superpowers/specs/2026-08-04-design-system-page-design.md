# Design System Page — Design

**Date:** 2026-08-04
**Status:** Approved

## Purpose

An internal, unlisted `/styleguide` route that renders every design token and
reusable UI primitive in the portfolio, so token drift, per-breakpoint type
sizing, and control states can be inspected in one place instead of being
rediscovered across `global.css` and eight component `<style>` blocks.

Not a public portfolio piece. Not indexed.

## Decisions

| Question | Decision |
| --- | --- |
| Audience | Internal reference only. `noindex`, excluded from sitemap, not linked from nav. |
| Token scope | Document existing tokens **and** add missing ones — additively. No existing token renamed or removed, no existing consumer rewritten. |
| Coverage | Tokens + primitives + reusable UI chrome. No live gallery/archive/PhotoSwipe embeds. |
| Chrome fidelity | Snapshot markup + snapshot styles in a dedicated stylesheet, with source-file pointers and a change-checklist entry. Not a live component import. |

### Why snapshot chrome rather than importing the live components

Both candidate components are unsuitable for direct import:

- `ArchiveGallery_BoxFilters.astro` calls `getCollection("images")` (build-time
  Cloudinary data), initialises MixItUp on mount, and styles its controls
  entirely through open/closed state selectors
  (`#filter.active + #filter-box .filter-button`). Its resting state is
  `height: 0` — an imported instance would render nothing visible.
- `NavigationBar.astro` is `position: sticky`, `display: none` under
  `--bp-mobile`, and carries `transition:persist`. A second persisted instance
  on another route risks interfering with `ClientRouter` state.

The accepted cost is drift: snapshot styles can fall out of sync with the
source. Mitigated by source-file comments and a change-checklist entry in
`docs/design-system.md`, not eliminated. The rejected alternative — extracting
shared control styles into a common stylesheet consumed by both the real
components and the styleguide — would require refactoring a live, animation-
heavy component and was judged too risky for the benefit.

## Additive tokens

Added to `:root` in `src/styles/global.css`. Nothing else in the codebase is
changed to consume them; adoption is incremental as files are touched.

**Font families** — the five PowerGrotesk faces are currently referenced by
literal `font-family: PowerGrotesk-Light` in at least `Main.astro`,
`NavigationBar.astro`, and `ArchiveGallery_BoxFilters.astro`:

```
--font-ultralight, --font-light, --font-regular, --font-medium, --font-bold
```

**Spacing scale** — derived from values already meaningful in the codebase
(`56px`/`88px` are the desktop and wide grid column widths, `20px` is
`--margin-right-tablet`), not invented:

```
--space-1: 4px   --space-2: 8px   --space-3: 12px   --space-4: 20px
--space-5: 32px  --space-6: 56px  --space-7: 88px
```

**Semantic color aliases** — pointing at the existing `--bg-*` values:

```
--color-text, --color-surface, --color-surface-accent,
--color-border, --color-overlay
```

## Route plumbing

1. `Main.astro` gains an optional `noindex` prop (default `false`) that emits
   `<meta name="robots" content="noindex, nofollow">`. Canonical stays.
2. `sitemap()` in `astro.config.mjs` gains a filter excluding `/styleguide`.
3. `src/pages/styleguide.astro` uses `Main.astro` directly. Not added to any of
   the four nav components.

The page has no Cloudinary, MixItUp, or PhotoSwipe dependency, so it builds and
renders without credentials or network — unlike the rest of the site.

## Page sections

Each an anchored `<section>`, with a sticky in-page table of contents.

1. **Breakpoints** — live readout: viewport width, active `@custom-media` name,
   computed `--scrollbar-width`, current grid column count and resolved column
   width. The highest-value panel here, because every token in this codebase is
   per-breakpoint.
2. **Color** — each token as a swatch with variable name and hex, shown against
   both `--bg-color` and `--bg-dark` so contrast is visible.
3. **Type** — specimens of all five faces plus the light italic; then a table of
   the six size tokens (body + h1) across five breakpoints, each rendered at its
   resolved value, with the global `letter-spacing: 0.7px` in effect.
4. **Spacing & border** — the new scale as bars; `--border-size: 0.5px` rendered
   beside `1px`, since sub-pixel borders render inconsistently across browsers
   and device pixel ratios.
5. **Grid** — the real `GridLayout` (takes only `customClass`) with numbered
   tinted columns, the padding tokens drawn as bands, and a button that overlays
   the column grid on the whole page.
6. **Brackets** — all six bracket components (`BracketOpenV`, `BracketMiddleV`,
   `BracketCloseV`, `BracketOpenH`, `BracketMiddleH`, `BracketCloseH`) in sized
   containers, labelled by filename, with their prop defaults listed.
7. **Icons** — auto-enumerated with `import.meta.glob` over `src/assets/svg/`,
   so the section cannot go stale. Currently one icon (`Info.svg`).
8. **Chrome** — snapshot markup for archive controls (`.main-button`,
   `.sort-button`, `.filter-button`, `.active-filter`, `.filter-disabled`,
   `.zoom-button:disabled`) and nav links (`.button`, `.button.active`), each in
   default, hover, selected, and `:focus-visible` states.

## File structure

| File | Responsibility |
| --- | --- |
| `src/styles/global.css` | *modify* — additive `:root` tokens |
| `src/layouts/Main.astro` | *modify* — `noindex` prop |
| `astro.config.mjs` | *modify* — sitemap filter |
| `src/pages/styleguide.astro` | *new* — composition + ToC only |
| `src/styles/styleguide.css` | *new* — page layout + chrome snapshot styles |
| `src/components/styleguide/Section.astro` | *new* — anchored section wrapper |
| `src/components/styleguide/BreakpointReadout.astro` | *new* — live viewport readout |
| `src/components/styleguide/ColorSwatches.astro` | *new* |
| `src/components/styleguide/TypeSpecimens.astro` | *new* |
| `src/components/styleguide/SpacingScale.astro` | *new* |
| `src/components/styleguide/GridOverlay.astro` | *new* |
| `src/components/styleguide/BracketGallery.astro` | *new* |
| `src/components/styleguide/IconGallery.astro` | *new* |
| `src/components/styleguide/ChromeStates.astro` | *new* |
| `docs/design-system.md` | *new* — doc following the existing template |
| `docs/README.md` | *modify* — index entry |
| `CLAUDE.md` | *modify* — "Read the docs first" entry |

## Verification

This repo has **no test framework** — no vitest, jest, or playwright in
`package.json`. Introducing one is out of scope. Verification is therefore:

- `npm run check` — must stay at 0 errors / 0 warnings / 0 hints.
- `npm run lint` — clean.
- `npm run build` — exit 0, and `/styleguide` absent from
  `dist/sitemap-index.xml` and `dist/sitemap-0.xml`. Requires Cloudinary
  credentials in `.env` plus network; if unavailable, fall back to dev-server
  verification and note it.
- Browser pass at all five breakpoints (375 / 767 / 1024 / 1280 / 1700 px) via
  the preview tools, checking the console for errors.

## Out of scope

Dark mode. Copy-to-clipboard on tokens. JSON token export. Live
gallery/archive/PhotoSwipe embeds. Visual regression snapshots. Any rename or
removal of an existing token. Any change to a live component's styles.
