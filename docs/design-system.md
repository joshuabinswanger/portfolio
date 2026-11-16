# Design System

## Purpose

`/styleguide` is an internal reference that renders every design token and
reusable UI primitive in one place, so token drift, per-breakpoint type sizing,
and control states can be inspected instead of rediscovered across `global.css`
and a dozen component `<style>` blocks.

It is **dev-only**: `astro.config.mjs` injects the route only under
`astro dev`, so it is never built or deployed (rhizome.ch/styleguide does not
exist). Run `npm run dev` and open `/styleguide`. It also carries
`noindex, nofollow` and is not linked from any nav component.

The page has no Cloudinary, MixItUp, or PhotoSwipe dependency, so unlike the
rest of the site it renders without credentials or network.

## Main files

| File | Role |
| --- | --- |
| `src/dev/Styleguide.astro` | Composition and section nav only. Owns the `SECTIONS` list. |
| `src/styles/styleguide.css` | Page layout plus shared primitives (`.sg-card`, `.sg-table`, `.sg-demo`, `.sg-label`, `.sg-value`, `.sg-bar`, `.sg-active`). |
| `src/components/styleguide/Section.astro` | Anchored section wrapper. Props: `id`, `title`, `note` (note renders as HTML). |
| `src/components/styleguide/BreakpointReadout.astro` | Live viewport / grid readout. Owns a hidden probe. |
| `src/components/styleguide/ColorSwatches.astro` | Base and semantic colour tokens. |
| `src/components/styleguide/TypeSpecimens.astro` | Faces, per-breakpoint size table, letter-spacing. |
| `src/components/styleguide/SpacingScale.astro` | Spacing scale, padding tokens, border widths. |
| `src/components/styleguide/GridOverlay.astro` | Real `GridLayout` demo plus the fixed page overlay. |
| `src/components/styleguide/BracketGallery.astro` | The six bracket components. |
| `src/components/styleguide/IconGallery.astro` | Auto-enumerated from `src/assets/svg/`. |
| `src/components/styleguide/ChromeStates.astro` | **Snapshot** of archive and nav control styles. |
| `src/layouts/Main.astro` | Provides the `noindex` prop. |
| `astro.config.mjs` | Injects `/styleguide` under `astro dev` only. |

## Data contract

The page consumes no content collections and takes no props. Its only inputs are
CSS custom properties from `src/styles/global.css` and the file listing of
`src/assets/svg/`.

`Main.astro` accepts `noindex?: boolean` (default `false`). When true it emits
`<meta name="robots" content="noindex, nofollow">`. The canonical link is still
emitted — the page is real, just not indexable.

### Tokens added 2026-08-04

Purely additive; no pre-existing token was renamed, removed, or re-valued, and
no existing rule was changed to consume these. Adopt them as you touch files.

- **Font families** — `--font-ultralight`, `--font-light`, `--font-regular`,
  `--font-medium`, `--font-bold`. Component CSS currently hardcodes
  `font-family: PowerGrotesk-Light` in `Main.astro`, `NavigationBar.astro`, and
  `ArchiveGallery_BoxFilters.astro`; these tokens stop that spreading further.
- **Spacing** — `--space-1` … `--space-7` (4 / 8 / 12 / 20 / 32 / 56 / 88px).
  Derived from values already load-bearing here: 20px is
  `--margin-right-tablet`; 56px and 88px were the fixed desktop and
  desktop-wide column widths before the grid went fluid (`--grid-cell-desktop`
  now runs from 56px at 1120px up to 96px).
- **Semantic colours** — `--color-text`, `--color-surface`,
  `--color-surface-accent`, `--color-border`, `--color-overlay`.

## Change checklist

- **Adding a token** → declare it in `:root` in `global.css` **and** add it to
  the matching styleguide component. The page does not enumerate CSS variables
  at runtime, so a token added in only one place is silently under-reported.
- **Editing archive control styles or nav button styles** → update
  `ChromeStates.astro` to match. This is the known drift risk in the feature:
  those styles are copied, not imported, and the source line ranges are listed
  in that component's frontmatter comment.
- **Changing a breakpoint** in `global.css` → update the JS bounds in **both**
  `BreakpointReadout.astro` (`activeBreakpoints`) and `TypeSpecimens.astro`
  (`currentBp`). Both mirror the `@custom-media` ranges in JavaScript.
- **Changing a `--grid-layout-columns-*` token** → nothing to do. The readout
  measures a probe and the overlay uses the tokens directly.
- **Adding an icon** to `src/assets/svg/` → nothing to do. `IconGallery.astro`
  enumerates the directory with `import.meta.glob`.
- **Adding a bracket component** → add it to `BracketGallery.astro` in the
  correct family list. V variants are wide and short (used as horizontal rules),
  H variants tall and narrow (vertical rules); sizing one like the other
  collapses it to a hairline.
- **Adding a section** → add an entry to `SECTIONS` in `src/dev/Styleguide.astro` and a
  matching `<Section id="…">`. The ids are the contract between the two.

## Findings this page surfaced

Recorded here because they are easy to trip over and are not obvious from
reading `global.css`:

1. **`--bg-light` duplicates `--bg-color`** — both are `#fbf9f4`. Redundant.
2. **`PowerGrotesk-Medium` and `PowerGrotesk-Bold` both declare
   `font-weight: 600`** (`global.css:59` and `:72`). They are genuinely
   different outlines (measured advance widths 282px vs 300px for the same
   string at 24px), but weight-based selection cannot distinguish them — they
   must be selected by family name.
3. **`--border-size: 0.5px` buys nothing over `1px` for layout.** Measured in
   Chromium, 0.5px, 1px and 1.5px all report a used `border-top-width` of `1px`
   at both DPR 1 and DPR 2.
4. **No control declares a `:focus-visible` style.** The archive filter/sort
   buttons and nav links rely on the browser default outline, which on the
   filled black variants sits on a black background. A real accessibility gap.

## Verification

This repo has no test framework, so verification is typecheck, lint, build, and
browser inspection:

```bash
npm run check
```

Must report 0 errors / 0 warnings / 0 hints.

```bash
npm run lint
```

```bash
npm run build
```

Then confirm the page is not in the build (this must find nothing):

```bash
ls dist | grep styleguide
```

Finally, under `npm run dev`, load `/styleguide` at 375, 767, 1024, 1280 and 1700px. At each width:
no console errors, no horizontal page scroll, and the breakpoint readout should
report 7 / 7 / 11 / 17 / 17 columns; the desktop cell is fluid (56px at
1120px, capped at 96px).
