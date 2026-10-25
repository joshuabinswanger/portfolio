# Archive Filters & Sort

The archive page (`/personal`) is a filterable, sortable image grid. The markup
and all styles live in `src/components/archive/ArchiveGallery_BoxFilters.astro`;
the client runtime (MixItUp + PhotoSwipe wiring, the mobile sheet, the zoom)
lives in `src/components/archive/filters.ts`, which the component calls via
`initArchiveFilters()`.

This doc covers the filter/sort UI. For what the archive grid renders (image-only,
Mux videos excluded) see [galleries](galleries.md); for the square-crop thumbnails
and the per-image `focus` field see [image-optimization](image-optimization.md).

> History: until 2026-10 the toolbar was a bracket-animated expanding bar with a
> large WebKit-workaround CSS layer. It was replaced by the chip rail / bottom
> sheet described here. The old per-bracket animations and their iOS caveats
> are gone with it; nothing below animates grid tracks.

## Main files

- `src/components/archive/ArchiveGallery_BoxFilters.astro` — markup and all styles.
- `src/components/archive/filters.ts` — client runtime: MixItUp setup, `onMixEnd`,
  active state (`updateActiveFiltersList`), button availability, the mobile
  sheet (`initFilterSheet`), the PhotoSwipe lightbox, and the grid zoom
  (`initArchiveZoom`, `flipColumnChange`). Exposed as `initArchiveFilters()`.
- `src/components/archive/utils.ts` — build-time data/tag helpers
  (`isArchiveImage`, `convertTagForCss`, `ensureArray`, `getArchiveImageTitle`).
- `src/components/archive/ArchiveGalleryElement.astro` — one grid cell.
- `src/layouts/GridLayout.astro` — owns `.archive-grid`, the responsive grid.
- `src/styles/global.css` — the shared `--surface-*` (glass/blur/line/shadow)
  and `--mobile-nav-*` tokens the toolbar and the floating mobile nav share.

## Anatomy

One `<form id="filter-sort-wrapper">` holds everything:

| Element | Role |
| --- | --- |
| `#filter` | **Mobile only.** "Filter & Sort" trigger pill; `#filter-count` inside it shows `[N]` active filters. Hidden on desktop. |
| `#filter-backdrop` | Mobile only. Dims the page behind the open sheet; tap closes. |
| `#filter-box` | The options. Desktop: an inline rail. Mobile: a bottom sheet. |
| `#group-wrapper` | The three `fieldset.filter-group`s (Role / Tool / Topic, `data-filter-group`) each with a `.chip-row` of `button.filter-button.chip[data-toggle]`, plus the `#sort-buttons` fieldset with a `.segmented` control of `button.sort-button[data-sort]`. |
| `.sheet-actions` | `#filter-reset-all` (`type="reset"`) and `#filter-done` (mobile only). |
| `#zoom-wrapper` | `#zoom-out` / `#zoom-in` in a `.segmented` pill. |

Group labels (`legend.filter-title`) carry the site's bracket motif
typographically (`[ ROLE ]` via `::before`/`::after`), which is the only
bracket left in this UI.

### Shared control styles

- `.chip` — outlined pill, fills black when `mixitup-control-active`, dims to
  0.28 opacity when disabled (`updateFilterButtonAvailability` sets the real
  `disabled` attribute, so unavailable chips also leave the tab order).
- `.segmented` — outlined pill container; the active `.sort-button` fills black.
  The zoom reuses the same container.
- Reset is invisible (`opacity: 0; pointer-events: none`) until any chip is
  active — `#filter-sort-wrapper:has(.filter-button.mixitup-control-active)`.

## Desktop / tablet: sticky rail

`#filter-sort-wrapper` is `position: sticky; top: 0` inside `#archive-wrapper`
(grid rows `auto 1fr`), frosted with `--surface-glass` + `--surface-blur`, and
has an 18px gradient fade below it (`::after`) so thumbnails slide out under it.

Layout is a 2-column grid: `#filter-box` (chips, wrapping) and `#zoom-wrapper`
at the right. Inside the box the fieldsets wrap in a flex row; `.sort-group`
has `margin-left: auto` so Sort sits at the right end of whichever row it lands
on (at 952px that's the Topic row — two rows total).

## Mobile (`--bp-mobile`): floating pills + bottom sheet

- The form becomes a fixed row just above the floating nav pill:
  `bottom: calc(var(--mobile-nav-stack) + 10px)` with `--mobile-nav-inset`
  side margins. `pointer-events: none` on the row, `auto` on its children, so
  the gap between the pills scrolls through to the grid.
- `#filter` is a solid black pill on the left; `#zoom-wrapper` a glass pill on
  the right.
- `#filter-box` is a fixed bottom sheet: `translateY(100%)` + `visibility:
  hidden` when closed, `translateY(0)` when `#filter-sort-wrapper.is-open`.
  Rounded top, drag-handle decoration (`.sheet-handle`), `max-height:
  min(82dvh, 680px)`, safe-area bottom padding. `#group-wrapper` scrolls
  inside it (`overscroll-behavior: contain`). Chips grow to 40px, Sort becomes
  a full-width segmented control, and the actions row (Reset + Done) is pinned
  at the bottom.
- `#filter-backdrop` fades in behind the sheet (z 1100 / sheet 1101, above the
  nav's 1001) so the nav is dimmed too.

### Open/close (`initFilterSheet` in filters.ts)

- `#filter` toggles; backdrop, Done and `Escape` close. Escape returns focus to
  the trigger.
- State lives on the form: `.is-open`, plus `aria-expanded` on the trigger.
- `inert` is set on `#filter-box` only while the sheet is closed **on mobile**
  (A-4). On desktop the box is never inert.
- While open, `<html>` gets `.archive-sheet-open` (`overflow: hidden`) to lock
  page scroll.
- Crossing the 767px breakpoint while open closes the sheet so the desktop rail
  is interactive. Everything is torn down on `astro:before-swap`.

## Zoom (column count)

`#zoom-wrapper` (`−` / `+`) grows/shrinks the grid by one column.

- **Column count** is driven by the `--archive-columns` custom property on
  `.archive-grid` in `GridLayout.astro`: `repeat(var(--archive-columns, N), 1fr)`
  at every breakpoint, with per-breakpoint fallbacks (desktop 4, tablet 3,
  wide 6, mobile 2).
- `initArchiveZoom()` in `filters.ts` steps the count by ±1, clamps to a
  **breakpoint-aware range** (`getMaxColumns()`: 1–10 desktop, **1–4 mobile**),
  writes it as an inline `--archive-columns`, persists it in `localStorage`
  (`archiveColumns`), and disables the buttons at the bounds. On load the
  stored value is re-applied **clamped to the current breakpoint** (storage is
  left untouched).
- The cells stay square at any count via `ArchiveGalleryElement.astro` — see
  [image-optimization](image-optimization.md).
- **Gutter scales with the count.** `gap ∝ 1 / columns`, implemented in
  `.archive-grid` as `clamp(8px, calc(K / var(--archive-columns, N)), max)`;
  `--archive-pad` is inherited by the cell padding.
- **Animation:** the reflow is a **FLIP** pass (`flipColumnChange`) — measure,
  change `--archive-columns`, measure again, animate old→new box with a
  `transform` via the Web Animations API. Skipped under
  `prefers-reduced-motion: reduce`.

## Image title (grid caption + lightbox)

Each image has a single resolved **title**, computed once at build time by
`getArchiveImageTitle` in `utils.ts`: `metadata.description_title`, falling
back to a humanised project name. `ArchiveGalleryElement.astro` renders it as
the cell's `<figcaption class="archive-caption">` **and** as `data-title` on
the `.photo-link`.

**Grid caption (single column only).** Shown only when the grid is zoomed to
one column (`is-single-column` on `.archive-grid`, toggled by the zoom runtime).

**Lightbox.** PhotoSwipe with generous gutters (`paddingFn`) and a centred
bottom title (`registerArchiveTitle`, styled by `.pswp__archive-title` in
`global.css`). Title-only by design.

## Data & tags

Items come from the `images` collection where `metadata.showInIndex === "yes"`,
then `isArchiveImage` drops non-image entries. Tags are grouped by `buildGroup`
in the component frontmatter, each filtered against an allow-list:

- **Role** — `metadata.role` (`2D`, `3D`, `Dev`→shown as "Tech").
- **Tool** — `metadata.program` (`Houdini`, `Blender`, `ZBrush`).
- **Topic** — `metadata.topic` + `data.tags` (`Science`, `Motion`, …).

The allow-list also fixes the chip order. To surface a new tag, add it to the
relevant list in `buildGroup(...)`; display-name remaps go in the last argument.

## Filtering & sorting (MixItUp)

Filtering/sorting is driven by **MixItUp** + the **multifilter** extension. The
mixer is created on `#archive-wrapper`.

- Each chip carries `data-toggle=".<cssTag>"`; fieldsets carry
  `data-filter-group` so multifilter ANDs across groups and ORs within a group.
- Sort buttons carry `data-sort` (`random`, `project:asc`, `date:asc`).
- MixItUp adds `mixitup-control-active` to active controls — all "is this active"
  state and styling keys off that class.
- `#filter-reset-all` is `type="reset"` (multifilter clears its state on form
  reset) and additionally calls `mixer.show()`.

`onMixEnd` rebuilds the PhotoSwipe data source, calls
`updateActiveFiltersList()` (aria-pressed on chips, `[N]` count, and
`data-active-count` on the form) and `updateFilterButtonAvailability()`
(disables chips that would match nothing), then scrolls to top.

## Change checklist

- Keep `data-toggle` / `data-sort` / `data-filter-group` on the same elements;
  MixItUp finds them globally.
- If you add a control to the sheet, make sure it is inside `#filter-box` so
  `inert` and the sheet geometry cover it.
- Re-check both breakpoints: the sticky rail on desktop, and on a phone the
  trigger → sheet → Done round trip plus Escape/backdrop close.
- Run `npm run check` (keep 0/0/0).
