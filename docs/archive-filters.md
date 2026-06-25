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
- `src/components/archive/filters.ts` — client runtime: MixItUp setup, `onMixEnd`, active-filter chips, button availability, open/close, the PhotoSwipe lightbox, and the grid zoom (`initArchiveZoom`, `flipColumnChange` — see **Zoom** below). Exposed as `initArchiveFilters()`.
- `src/components/archive/utils.ts` — build-time data/tag helpers (`isArchiveImage`, `convertTagForCss`, `ensureArray`).
- `src/components/archive/ArchiveGalleryElement.astro` — one grid cell.
- `src/components/brackets/Bracket*V.astro` / `Bracket*H.astro` — the `⊓`/`⊔` and `[ ]` bracket SVGs.
- `src/layouts/GridLayout.astro` — owns `.archive-grid`, the responsive grid the
  items lay out in (see **Zoom** below).

## Zoom (column count)

A `#zoom-wrapper` (`+` / `−`) lets the viewer grow/shrink the grid by one column.
It's absolutely positioned at the right edge of the fixed bar — opposite the nav,
in the same row as Filter (the bottom bar on mobile). Absolute positioning keeps
it out of the bar's grid so the fragile Sort/Filter track animations are
untouched. It's shown on every breakpoint **including while a Sort/Filter panel is open on
mobile**: the mobile panels expand only up to the zoom (see the mobile section
below), so it no longer needs to be hidden.

- **Column count** is driven by the `--archive-columns` custom property on
  `.archive-grid` in `GridLayout.astro`: `repeat(var(--archive-columns, N), 1fr)`
  at every breakpoint (including mobile), with per-breakpoint fallbacks (desktop 4,
  tablet 3, wide 6, mobile 2) used when nothing is set.
- `initArchiveZoom()` in `filters.ts` (called from the `astro:page-load` handler)
  steps the count by ±1, clamps to a **breakpoint-aware range** (`getMaxColumns()`:
  1–10 desktop, **1–4 mobile**), writes it as an inline `--archive-columns` on the
  grid, persists it in `localStorage` (`archiveColumns`), and disables `+`/`−` at
  the bounds. On load the stored value is re-applied **clamped to the current
  breakpoint** (storage is left untouched, so a desktop preference survives a
  mobile visit). Current count is read from the live inline value, else the
  computed track count — reading the applied value keeps stepping correct when a
  stored desktop count is clamped down on mobile.
- The cells stay square at any count via `ArchiveGalleryElement.astro` — see
  [image-optimization](image-optimization.md).
- **Gutter scales with the count.** The gap is a roughly constant fraction of the
  cell width — `gap ∝ 1 / columns` — so zooming out tightens the grid (a
  logarithmic curve was rejected: it shrinks slower than the cells, making gaps
  look proportionally *bigger* when zoomed out). Implemented in `.archive-grid`
  (GridLayout.astro): the `gap` shorthand (equal row + column gutters) and
  `--archive-pad` are each
  `clamp(8px, calc(K / var(--archive-columns, N)), max)`, with `K`/`N`/`max`
  normalised per breakpoint so the value equals the old fixed gap at that
  breakpoint's default column count, tapering to an 8px floor. The upper bound is
  set *above* the default-count value (e.g. 40px desktop vs the 28px default), so
  close zoom levels (1–3 columns) get extra whitespace while 4+ columns are
  unchanged. `--archive-pad` is inherited by the cell padding in
  `ArchiveGalleryElement.astro`.
- **Animation:** the reflow is animated with a **FLIP** pass (`flipColumnChange`
  in `filters.ts`) — measure each visible cell, change `--archive-columns`,
  measure again, then animate old→new box with a `transform` (translate + scale)
  via the Web Animations API. Transforms are GPU-compositable and never touch the
  grid tracks, so it's smooth and WebKit-safe (don't replace it with a
  `grid-template-columns` transition). In-flight zoom animations (tagged
  `archiveZoom`) are cancelled before re-measuring so rapid clicks stay correct,
  and the whole pass is skipped under `prefers-reduced-motion: reduce`.
- **Edge case:** with many active filters the closed-state chip row can overflow
  behind the buttons. The buttons are opaque black at a higher `z-index`, so an
  overflowing chip simply tucks behind them (black-on-black) — no mask gutter
  needed. (On mobile the closed-state chip row is dropped entirely.)

## Image title (grid caption + lightbox)

Each image has a single resolved **title**, computed once at build time by
`getArchiveImageTitle` in `utils.ts`: the image's `metadata.description_title`,
falling back to a **humanised project name** (`prettifyProjectName`:
`BardsOfDawn` → "Bards Of Dawn"). Placeholder projects (`none`, `aaa_noproject`,
empty) resolve to `""` (no title). `ArchiveGalleryElement.astro` renders it both
as the cell's `<figcaption class="archive-caption">` **and** as `data-title` on
the `.photo-link` — one source of truth for both surfaces below.

**Grid caption (single column only).** The `.archive-caption` under each cell is
`display: none` by default and only revealed when the grid is zoomed to one
column. The zoom runtime (`initArchiveZoom`) toggles `is-single-column` on
`.archive-grid` whenever the count hits 1 (`syncSingleColumn`, folded into the
FLIP "apply" so the reflow animates), and
`:global(.archive-grid.is-single-column) .archive-caption` shows it. Multi-column
layouts stay image-only.

**Lightbox (single-image view).** Clicking a thumbnail opens the **PhotoSwipe**
lightbox. Two archive-specific touches:

- **Padding / gap** — `paddingFn` sets generous gutters so the image breathes and
  there's room for the title below it: desktop `{top:56, bottom:110, left:160,
  right:160}`, phone-portrait `{top:0, bottom:56, left:16, right:16}` (the bottom
  inset leaves space for the caption).
- **Bottom title** — `registerArchiveTitle(lightbox)` adds a centred title in the
  bottom gutter, reading the `title` field on each data-source item (sourced from
  the link's `data-title`). Styling lives in `.pswp__archive-title` in
  `global.css`. Title-only by design — the shared `photoswipeCaption.ts` (homepage
  gallery + project list) renders title **plus** the full description paragraph;
  the archive deliberately does not.

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

1. **Button widens toward the zoom +, stopping short with a gap.** The buttons
   expand to fill the gap but leave a visible gap before the zoom `+/−`, which
   stays visible. The reserved space (zoom width + gap) is the `--zoom-reserve`
   custom property (defined on `#filter-sort-wrapper` in the mobile block). The
   two sides animate by **different** drivers, each chosen so nothing pops:
   - **filter open** — the Filter column is held **constant** at its open width
     (`56px calc(100% - 56px - var(--zoom-reserve))`) in every state; the widen
     is a transition on the **Filter button width** (`110px → 100%` of that fixed
     column). Animating the track instead would pop the button to the old full
     width (`calc(100% - 56px)`) then shrink it. Sort stays put.
   - **sort open** — driven by the **grid track**: col 1 grows
     (`calc(100% - var(--zoom-reserve) - 110px)`) and pushes the (still-visible)
     110px Filter button right. The Sort button is `width: 100%` and simply
     tracks that animating column — its own `width` transition is dropped
     (`transition: none`) so the two don't fight. The 110px filter col makes the
     pushed button's right edge land at the same spot as the filter-open state,
     so the gap to the + is identical in both. Tracks are percentage/px (never
     intrinsic keywords) so they interpolate cleanly on WebKit.
2. **Box grows up** from the button (`height: 0 → target`, `bottom: 104px`). Each
   box is sized and positioned to **exactly overlay its trigger button** (same
   left edge, same width) and sit directly above it — Filter box over the Filter
   button (`left: 60px; right: calc(var(--zoom-reserve) - 4px)`), Sort box over
   the Sort button (`left: 2px; right: calc(var(--zoom-reserve) + 108px)`). The
   `4px`/`108px` offsets fold in the 2px bar inset and the 2px button margins; if
   the bar inset, Sort column (56px), or button margins change, recompute them.
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
