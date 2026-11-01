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
> large WebKit-workaround CSS layer. It was replaced by a chip rail / bottom
> sheet. In 2026-11 the desktop toolbar went back to the original bracket look
> (Filter drawer + Sort dropdown, below), rebuilt without the old grid-track
> animations; the phone sheet is unchanged. The mockup it follows is
> `archive-filter-bracket-mockup.af` (Affinity, kept outside the repo).

## Main files

- `src/components/archive/ArchiveGallery_BoxFilters.astro` — markup and all styles.
- `src/components/archive/filters.ts` — client runtime: MixItUp setup, `onMixEnd`,
  active state (`updateActiveFiltersList`), button availability, the mobile
  sheet (`initFilterSheet`), the PhotoSwipe lightbox, and the grid zoom
  (`initArchiveZoom`, `flipColumnChange`). Exposed as `initArchiveFilters()`.
- `src/components/archive/utils.ts` — build-time data/tag helpers
  (`isArchiveImage`, `convertTagForCss`, `ensureArray`, `getArchiveImageTitle`,
  `getArchiveProject`, `getArchiveDate`).
- `src/components/archive/ArchiveGalleryElement.astro` — one grid cell.
- `src/layouts/GridLayout.astro` — owns `.archive-grid`, the responsive grid.
- `src/styles/global.css` — the shared `--surface-*` (glass/blur/line/shadow)
  and `--mobile-nav-*` tokens the toolbar and the floating mobile nav share.

## Anatomy

One `<form id="filter-sort-wrapper">` holds everything:

| Element | Role |
| --- | --- |
| `#filter` | Trigger. Mobile: "Filter & Sort" pill with `#filter-count` (`[N]`). Desktop: the black "Filter" block that widens into the drawer's header. Labels swap via `.label-mobile` / `.label-desktop`. |
| `#filter-summary` | Desktop only. `#filter-active` (bracketed row of removable `.summary-chip`s) and `#filter-clear`. |
| `#filter-backdrop` | Mobile only. Dims the page behind the open sheet; tap closes. |
| `#filter-box` | The options. Desktop: the drawer under Filter. Mobile: a bottom sheet. Its body is wrapped in `.box-inner` (`display: contents` on mobile). |
| `#group-wrapper` | The three `fieldset.filter-group`s (Role / Tool / Topic, `data-filter-group`) each with a `.chip-row` of `button.filter-button.chip[data-toggle]`, plus the phone-only `#sort-buttons` fieldset (`.segmented` of `button.sort-button[data-sort]`). Groups with more than 4 options get `.two-col` + `--rows`, and their second-column buttons `.col-2`. |
| `.sheet-actions` | `#filter-reset-all` (`type="reset"`; "Reset" on phones, "Clear" in the drawer) and `#filter-done` (mobile only). |
| `#sort-menu` | Desktop only. `#sort-toggle` (shows `#sort-label`) and `#sort-list`, a second set of `button.sort-option[data-sort]`. |
| `#zoom-wrapper` | `#zoom-out` / `#zoom-in` in a `.segmented` pill. |

On phones the group labels (`legend.filter-title`) carry the bracket motif
typographically (`[ ROLE ]` via `::before`/`::after`); on desktop they are
plain centred titles over bracket lists.

### Shared control styles

Every control is **square** (no border-radius), matching the nav and the
bracket motif, with tight padding.

- `.chip` — hairline black outline, fills black when `mixitup-control-active`,
  dims to 0.28 opacity when disabled (`updateFilterButtonAvailability` sets the
  real `disabled` attribute, so unavailable chips also leave the tab order).
- `.segmented` — hairline black outlined box; the active `.sort-button` fills
  black. `#zoom-wrapper` reuses the class but drops the outline: its two
  buttons are solid black squares, like the original bar.
- Clear (`#filter-clear` in the bar, `#filter-reset-all` in the drawer) is
  always shown on desktop. The phone sheet's Reset is taken out of its row
  (`display: none`) until a chip is active.

## Desktop / tablet: bracket bar, Filter drawer, Sort dropdown

All desktop rules sit in one `@media (width >= 768px)` block so none of them
leak into the phone sheet. The look is the pre-2026-10 toolbar's: solid black
32px blocks, and option lists closed off by thin brackets.

`#filter-sort-wrapper` is `position: sticky; top: 0`, a flex row with **no
surface at all** (no background, frost or fade, by request 2026-11): images
slide behind the black blocks. Because the invisible bar still spans the
column, it has `pointer-events: none` and only `#filter`, `#filter-summary`,
`#sort-menu`, `#zoom-wrapper` and `#filter-box` opt back in, so a click on an
empty part of the bar reaches the image behind it. Its top padding is
`--bar-top`, the page's top padding per breakpoint (`--padding-top-desktop` /
`-tablet` / `-desktop-wide`, the same offset the nav sticks at), pulled back
by an equal negative margin, and
the controls sit level with the logo at rest **and** while scrolling (they
used to ride up 10px from the window top). The drawer hangs at
`--bar-top + --bar-h`. Row: `#filter` | `#filter-summary` | `#sort-menu`
(`margin-left: auto`) | `#zoom-wrapper`. Both menus are absolutely positioned
and **lay over the grid**; the page keeps scrolling (no scroll lock).

- **Bracket lists ("ladders").** `.chip-row .chip` and `.sort-option` are 32px
  rows, 128px (`--ladder-w`) wide. Each row draws its own top rule plus four
  11px side segments as background gradients; stacked, they make the original
  bracket (legs under the top bar, ticks either side of each rule, legs above
  the bottom bar, which is the list's own `border-bottom`). The first gradient
  layer is the active fill: `background-size` 0% to 100% sweeps it in from the
  left. Unavailable options fade their text only (`opacity: 1`, faint
  `color`) so the bracket stays whole. `.two-col` lists (Topic) are a
  column-flow grid of `--rows` rows; `.col-2` shifts the second list 1px left
  so both share the middle line.
- **Filter drawer.** `#filter-box` hangs under the Filter block,
  `width: max-content`, and animates `grid-template-rows: 0fr` to `1fr`;
  `.box-inner` is the clipped body. Its `::before` draws legs down from the
  Filter block's ends, its `::after` the closing bar with legs. Opening is two
  steps, like the original: `#filter` widens from 96px to `--drawer-w`, then
  the drawer drops and the groups fade in staggered by `--card-index`. Closing
  runs it backwards via the closed-state transition delays. The phone Sort
  group is hidden here; Clear (`#filter-reset-all`) sits centred at the bottom.
- **Drawer width ends mid-image.** `syncDrawerWidth` (filters.ts) measures the
  drawer's content width, then stretches it so its right edge lands on the
  first image column centre past that (`getColumnCentres` reads the grid's
  resolved tracks and gap; cells pad their image evenly, so a column's centre
  is its images' centre). It sets both the inline width and `--drawer-w`, and
  re-runs on open, resize, breakpoint change and zoom (the zoom calls it
  through the module-level `syncDrawer` hook). The groups spread over the
  extra width (`justify-content: space-between`). With no centre far enough
  out (e.g. one column) the drawer keeps its content width. Sort is not
  snapped: its right edge is fixed by the zoom buttons, so snapping its left
  edge made it 280px+ wide.
- **Active filters in the bar.** `#filter-active` holds one `.summary-chip` per
  active filter (built in `updateActiveFiltersList`; clicking one clicks the
  real `.filter-button`, so MixItUp stays the single source of truth), between
  `[ ]` drawn by its `::before`/`::after`, then `#filter-clear` (a second
  `type="reset"`). Chips are created at runtime, so their CSS must be
  `:global(...)`. The summary hides while the drawer is open. There is no
  result count, on purpose.
- **Sort dropdown.** `#sort-toggle` is a black block the same width as the
  closed Filter block (`--block-w`, 96px), and its options fill that width
  rather than `--ladder-w`. Open
  (`.is-sort-open` on the form) it turns page-coloured and becomes the top of
  the bracket (its background gradients draw the bar and legs), and
  `#sort-list` drops under it. The `.sort-option`s are a second set of MixItUp
  sort controls; MixItUp keeps the active class on both sets in step. Picking
  an order (here or in the sheet) writes its name into `#sort-label`; picking
  it in the dropdown also closes it.
- **Open/close.** Only one menu is open at a time (`setOpen` / `setSortOpen`
  close each other). `Escape` closes whichever is open and returns focus to
  its trigger; a `pointerdown` outside the form closes both. Whatever is
  collapsed is `inert`.

## Sort sections (sort by Project or Date)

Sorted by Project or Date, the grid reads as sections: each project (or year)
on a new row under its title and a bracket line (rule + down tick) as wide as
its images, at most one row.

- Build time (utils.ts), on each cell:
  - `getArchiveProject` gives `data-project-title`, the project's display
    name from `getProjectDisplayName` (the `projects` collection's `title`,
    then `ARCHIVE_GROUP_TITLES` for slug-only groups, then the humanised
    slug), and `data-project`, that name lowercased. Keying by the shown name
    means slugs with the same name share one section (`hold` and
    `characters` are both "Characters"; `StructureOfWood` and
    `structureofwood` too) and sections sort alphabetically by what they
    show. No project gives `zzz_noproject`, sorted last and titled "Other".
  - `getArchiveDate` gives `data-date`, always `YYYYMM` (month `00` when
    unknown), and `data-year`. `metadata.year` is plain `YYYY` now; older
    `YYYYMM` values still parse, and the fixed length keeps MixItUp's numeric
    compare in calendar order. Images without a date sort last (Date is
    newest first) under "Undated".
- Runtime: `syncSortSections` (filters.ts) runs in `onMixEnd` with the active
  sort string. `SECTION_GROUPS` maps the sort attribute to the cell data that
  groups a section and names it (`project` -> `project` / `projectTitle`,
  `date` -> `year` / `year`); any other sort (Random) gets no sections. It
  walks runs of equal keys among visible cells and inserts a `.sort-heading`
  before each. `onMixStart` removes them all first (`clearSortSections`), so
  MixItUp never measures or moves anything but its own targets.
- Layout: a heading is a full-row grid item (`grid-column: 1 / -1`) with
  `grid-template-columns: subgrid`; its `.sort-heading-inner` spans `--span`
  columns, padded by `--archive-pad` so the line meets the images' edges.
  `--span` is the run length clamped to the current column count, and
  `refreshSectionSpans` re-clamps it whenever the zoom changes.
- Section titles come from content: give a slug-only group a readable name in
  `ARCHIVE_GROUP_TITLES` (utils.ts), or add a `projects` entry.

## Mobile (`--bp-mobile`): floating pills + bottom sheet

- The form becomes a second floating row directly above the nav bar:
  `bottom: calc(var(--mobile-nav-stack) + var(--mobile-bar-gap))`, the same
  `--mobile-nav-inset` and `--mobile-nav-pad` as the nav, so its buttons line
  up with the nav's edges. The row has **no surface of its own** (no frosted
  strip, 2026-10-26): only `#filter` and the zoom squares float, each with the
  small `--bar-shadow`, and the page shows between them.
- Never put a `backdrop-filter` on the form: a backdrop-filter on an ancestor
  becomes the containing block for `position: fixed` descendants and would
  trap the full-screen sheet and backdrop inside the row.
- Taps: the form has `pointer-events: none`; `#filter`, `#zoom-wrapper` and
  `#filter-box` opt back in, so a tap between the buttons reaches the grid.
  **Never** use a blanket `> *` here: the backdrop is a full-screen fixed child
  and would then swallow every tap on the page while invisible (shipped once,
  2026-10-25). The backdrop takes pointer events only under `.is-open`.
- `#filter` is a solid black square block on the left; the zoom's two black
  squares sit on the right. Both are `--mobile-toolbar-height` (32px) tall.
- `#filter-box` is a fixed bottom sheet: `translateY(100%)` + `visibility:
  hidden` when closed, `translateY(0)` when `#filter-sort-wrapper.is-open`.
  Square, with a hairline top edge, `max-height: min(82dvh, 680px)` and
  safe-area bottom padding. `#group-wrapper` scrolls inside it
  (`overscroll-behavior: contain`). Chips grow to 34px, Sort becomes a
  full-width segmented control, and the actions row (Reset + Done) is pinned
  at the bottom.
- **Drag to close** (`initSheetDrag` in filters.ts). `.sheet-handle` is a
  full-width 28px strip (`touch-action: none`) with a short bar drawn by
  `::before`. A downward drag engages from the handle, or from anywhere in the
  sheet while the list is scrolled to the top; mid-list or upward drags scroll
  normally. While engaged the sheet follows the finger (`.is-dragging` kills
  the transition) and the backdrop fades with it. Release closes past 25% of
  the sheet height or on a flick faster than 0.5px/ms, otherwise it springs
  back. Touch events only, since the sheet only exists on phones.
- `#filter-backdrop` fades in behind the sheet (z 1100 / sheet 1101, above the
  nav's 1001) so the nav is dimmed too.

### Open/close (`initFilterSheet` in filters.ts)

- `#filter` toggles; backdrop, Done and `Escape` close. Escape returns focus to
  the trigger.
- State lives on the form: `.is-open` (and `.is-sort-open` for the desktop
  dropdown), plus `aria-expanded` on the triggers.
- `inert` is set on `#filter-box` (and `#sort-list`) whenever closed (A-4).
- While open on mobile, `<html>` gets `.archive-sheet-open` (`overflow:
  hidden`) to lock page scroll.
- Crossing the 767px breakpoint closes everything (sheet ↔ menus swap).
  Everything is torn down on `astro:before-swap`.

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
back to the project's display name (`getProjectDisplayName`): the matching
`projects` entry's `title` (slug matched case-insensitively), then
`ARCHIVE_GROUP_TITLES` for archive-only groups with no project entry
(`FigureDrawing`, `misc3d`, …), then a humanised slug. Add a new archive-only
slug to that map to give it a proper name. `ArchiveGalleryElement.astro` renders it as
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
- Sort buttons carry `data-sort` (`random`, `project:asc`, `date:desc`, i.e. newest first). There
  are two sets (the phone sheet's `.sort-button`s and the desktop dropdown's
  `.sort-option`s); MixItUp marks the active one in both.
- MixItUp adds `mixitup-control-active` to active controls — all "is this active"
  state and styling keys off that class.
- `#filter-reset-all` and `#filter-clear` are `type="reset"` (multifilter
  clears its state on form reset) and additionally call `mixer.show()`.

`onMixStart` removes the section headings. `onMixEnd` re-adds them when
sorted by Project or Date (`syncSortSections`), rebuilds the PhotoSwipe data
source, calls `updateActiveFiltersList()` (aria-pressed on chips, `[N]` count,
the bar's summary chips and `data-active-count` on the form) and
`updateFilterButtonAvailability()` (disables chips that would match nothing).
It deliberately does not scroll: filtering or sorting leaves the page where
the visitor had it (until 2026-11 it scrolled to the top).

A mix only ends once animation frames run. In a hidden or backgrounded
browser tab, sorting and filtering stall and `onMixEnd` never fires, so test
these in a visible window.

## Change checklist

- Keep `data-toggle` / `data-sort` / `data-filter-group` on the same elements;
  MixItUp finds them globally.
- If you add a control to the sheet, make sure it is inside `#filter-box` so
  `inert` and the sheet geometry cover it.
- Re-check both breakpoints: the sticky rail on desktop, and on a phone the
  trigger → sheet → Done round trip plus Escape/backdrop close.
- Run `npm run check` (keep 0/0/0).
