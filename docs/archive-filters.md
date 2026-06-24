# Archive Filters & Sort

The archive page (`/personal`) is a filterable, sortable image grid. The markup
and all styles live in `src/components/archive/ArchiveGallery_BoxFilters.astro`;
the client runtime (MixItUp + PhotoSwipe wiring) lives in
`src/components/archive/filters.ts`, which the component calls via
`initArchiveFilters()`.

This doc covers the filter/sort UI. For what the archive grid renders (image-only,
Mux videos excluded) see [galleries](galleries.md); for the square-crop thumbnails
and the per-image `focus` field see [image-optimization](image-optimization.md).

## Main files

- `src/components/archive/ArchiveGallery_BoxFilters.astro` — markup and all styles.
- `src/components/archive/filters.ts` — client runtime: MixItUp setup, `onMixEnd`, active-filter chips, button availability, open/close, and the PhotoSwipe lightbox. Exposed as `initArchiveFilters()`.
- `src/components/archive/utils.ts` — build-time data/tag helpers (`isArchiveImage`, `convertTagForCss`, `ensureArray`).
- `src/components/archive/ArchiveGalleryElement.astro` — one grid cell.
- `src/components/brackets/Bracket*V.astro` / `Bracket*H.astro` — the `⊓`/`⊔` and `[ ]` bracket SVGs.
- `src/layouts/GridLayout.astro` — owns `.archive-grid`, the responsive grid the
  items lay out in (see **Zoom** below).

## Zoom (column count)

A `#zoom-wrapper` (`−` / `+`) lets the viewer grow/shrink the grid by one column.
It's absolutely positioned at the right edge of the fixed bar — opposite the nav,
in the same row as Filter — and is **desktop-only** (`display: none` on mobile).
Absolute positioning keeps it out of the bar's grid so the fragile Sort/Filter
track animations are untouched.

- **Column count** is driven by the `--archive-columns` custom property on
  `.archive-grid` in `GridLayout.astro`: `repeat(var(--archive-columns, N), 1fr)`,
  with per-breakpoint fallbacks (desktop 4, tablet 3, wide 6) used when nothing is
  set. Mobile pins a literal `1fr 1fr` and ignores the var.
- `initArchiveZoom()` in `filters.ts` (called from the `astro:page-load` handler)
  steps the count by ±1, clamps to **1–10**, writes it as an inline
  `--archive-columns` on the grid, persists it in `localStorage` (`archiveColumns`),
  and disables `−`/`+` at the bounds. The stored value is re-applied on each load /
  View Transition swap. Current count is read from the persisted value, else from
  the computed track count (so the first click respects the breakpoint default).
- The cells stay square at any count via `ArchiveGalleryElement.astro` — see
  [image-optimization](image-optimization.md).
- **Gutter scales with the count.** The gap is a roughly constant fraction of the
  cell width — `gap ∝ 1 / columns` — so zooming out tightens the grid (a
  logarithmic curve was rejected: it shrinks slower than the cells, making gaps
  look proportionally *bigger* when zoomed out). Implemented in `.archive-grid`
  (GridLayout.astro): `column-gap` and `--archive-pad` are each
  `clamp(8px, calc(K / var(--archive-columns, N)), max)`, with `K`/`N`/`max`
  normalised per breakpoint so the value equals the old fixed gap at that
  breakpoint's default column count, tapering to a 8px floor and capped at the
  default so 1–2 columns don't balloon. `--archive-pad` is inherited by the cell
  padding in `ArchiveGalleryElement.astro`.
- **Animation:** the reflow is animated with a **FLIP** pass (`flipColumnChange`
  in `filters.ts`) — measure each visible cell, change `--archive-columns`,
  measure again, then animate old→new box with a `transform` (translate + scale)
  via the Web Animations API. Transforms are GPU-compositable and never touch the
  grid tracks, so it's smooth and WebKit-safe (don't replace it with a
  `grid-template-columns` transition). In-flight zoom animations (tagged
  `archiveZoom`) are cancelled before re-measuring so rapid clicks stay correct,
  and the whole pass is skipped under `prefers-reduced-motion: reduce`.
- **Edge case:** with many active filters the closed-state chip row can overflow
  under the buttons; an opaque page-coloured gutter on `#zoom-wrapper` masks it so
  chips stop cleanly before the control.

## Data & tags

Items come from the `images` collection where `metadata.showInIndex === "yes"`,
then `isArchiveImage` drops non-image entries. Tags are extracted into three
groups, each filtered against an allow-list defined in the frontmatter:

- **Role** — `metadata.role` (`2D`, `3D`, `Dev`→shown as "Tech").
- **Tool** — `metadata.program` (`Houdini`, `Blender`, `ZBrush`).
- **Topic** — `metadata.topic` + `data.tags` (`Science`, `Motion`, …).

Display names are remapped via the `*ConversionName` maps; CSS class names via
`convertTagForCss`. To surface a new tag, add it to the relevant `*AllowedList`.

## Filtering & sorting (MixItUp)

Filtering/sorting is driven by **MixItUp** + the **multifilter** extension
(`mixitup`, `mixitup-multifilter`). The mixer is created on `#archive-wrapper`.

- Each filter button carries `data-toggle=".<cssTag>"`; fieldsets carry
  `data-filter-group` so multifilter ANDs across groups and ORs within a group.
- Sort buttons carry `data-sort` (`random`, `project:asc`, `date:asc`).
- MixItUp adds `mixitup-control-active` to active controls — all "is this active"
  state keys off that class.

The `onMixEnd` callback rebuilds the PhotoSwipe data source, refreshes the active
state, and scrolls to top. Key helpers:

- `updateActiveFiltersList()` — rebuilds the removable active-filter chips, sets
  `--active-filters-list-length` on `#filter-box`, and writes the **Filter count**
  (`#filter-count` → ` [N]`, blank when zero).
- `updateFilterButtonAvailability()` — disables filter buttons that would match no
  currently-visible item.

### Filter count

The Filter button reads `Filter [2]` when two filters are active. The `#filter-count`
span is updated in `updateActiveFiltersList` from the count of
`.filter-button.mixitup-control-active`. Brackets (`[ ]`) are used to match the
site's bracket motif — change the template string there to adjust the format.

## Open/close model

Sort and Filter are **mutually exclusive**. A small `astro:page-load` handler
toggles an `.active` class on `#sort` / `#filter` and clears the other. Everything
else — the reveal, the brackets, the layout — is pure CSS keyed off `.active` via
`:has()` and adjacent-sibling (`+`) selectors. There is no JS animation.

- `#filter.active + #filter-box …` drives the filter panel.
- `#sort.active ~ #sort-buttons …` drives the sort dropdown.

## Desktop vs mobile

**Desktop**: Sort and Filter expand inline within the fixed top bar. Buttons and
bracket tracks animate open via grid sizing. The closed bar can also show a row of
active-filter chips.

**Mobile** (`@media (--bp-mobile)`, bar pinned to `bottom: 52px` above the nav):
both open as a **bracketed box** anchored just above their button, in two stages:

1. **Button widens to full width.** The bar is a 2-column grid; the *other*
   column collapses. Tracks are percentage-based so the widen interpolates
   smoothly (see the WebKit notes):
   - base `56px calc(100% - 56px)`
   - filter open `0px 100%` · sort open `100% 0px`
2. **Box grows up** from the button (`height: 0 → target`, `bottom: 104px`).
   - **Filter** → full height, `calc(100dvh - 180px)` (logo → above the button).
   - **Sort** → content height only, `calc(3*48px + 2*12px + 4*6px)` = **192px**
     (3 options + 2 brackets + gaps). Deliberately *not* full height.

The box is framed by a top `⊓` and bottom `⊔` bracket:

- Filter reuses the `.bracket-start` / `.bracket-end` divs, restyled as
  border-only `⊓`/`⊔`.
- Sort has no bracket divs (its brackets are child components), so the frame is
  drawn with `#sort-buttons::before` / `::after` pseudo-elements instead.

Mobile tradeoffs, on purpose:

- The closed-state active-filter **chip row is dropped** (`#active-filters-list`
  hidden); selections still show highlighted inside the box, plus the count.
- The per-item **V brackets are hidden**; only the outer frame remains.
- The **Filter/Sort button itself is the close affordance** — it keeps a higher
  `z-index` than the box so a second tap closes it.

## WebKit / iOS gotchas (why the CSS looks the way it does)

These are real bugs hit on iOS/iPadOS Safari that the mobile CSS works around.
Do not "simplify" them away without testing on a real device.

1. **Never animate a grid track to/from an intrinsic keyword** (`min-content`,
   `max-content`, `auto`, `fit-content`). Chrome/Firefox snap an un-interpolable
   track to its final size; WebKit collapses it to **0**. All animated tracks here
   use fixed lengths / percentages, equal to what the keyword resolved to.

2. **`:has()` containers don't re-resolve their `auto` track on toggle.** Opening
   the filter doesn't change `#filter-sort-wrapper`'s own columns, so WebKit never
   re-lays-out the column the panel lives in until an unrelated relayout occurs
   (e.g. opening Sort). Fix: the click handler forces a synchronous reflow
   (`void #filter-sort-wrapper.offsetWidth`) after each toggle.

3. **`translateZ(0)` held a stale paint** on `#filter-box` — removed. The
   "hardware acceleration" hack promoted it to a compositing layer that didn't
   repaint on the sibling-selector style change.

4. **`overflow: visible` SVGs paint at intrinsic size in 0-width grid cells.** The
   Sort bracket SVGs bled through when Sort was closed (their column is 0-wide, but
   WebKit still drew them ~13px tall). Fix: gate them with opacity on `#sort.active`.

5. **Astro style scoping needs `:global()` to reach child components.** Bracket
   SVGs render as `.svg-container` from `Bracket*.astro`, so they don't carry the
   archive component's scope attribute — selectors targeting them use
   `:global(.svg-container)`.

6. **All mobile open/close uses width / height / opacity transitions only** — no
   grid-track animation — which is the reliable, WebKit-safe path.

## Change checklist

- Keep animated grid tracks fixed-length; never interpolate to `min-content`/`auto`.
- After anything that toggles `.active`, make sure the reflow nudge still runs.
- Test the **first tap** to open on a real iOS device (point 2 above regresses silently otherwise).
- Re-check both states of both boxes: open geometry, the bracket frame, and that
  closed boxes are 0-height and don't intercept taps.
- If you change option counts or sizes, recompute the Sort box `height` calc.
- Run `npm run check` (keep 0/0/0).

> Note on local verification: the preview tool throttles CSS transitions when the
> tab isn't painted, so mid-transition reads are unreliable — measure resolved
> state with transitions disabled, and confirm animation feel on a real device.
