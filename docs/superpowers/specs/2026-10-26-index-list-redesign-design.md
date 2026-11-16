# Index list redesign — design

Date: 2026-10-26 · Status: approved direction (variant A, hover H2)

Mockups:

- [2026-10-26-index-list-mockup.png](2026-10-26-index-list-mockup.png):
  layout and states (desktop at rest, hover, open; mobile at rest, open).
  The open frames are drawn scrolled to the open project. Rows follow
  `sortProjectsByYear`. **Its grey row text is superseded**: all text is
  black, see below.
- [2026-10-26-index-list-hover-options.png](2026-10-26-index-list-hover-options.png):
  the hover treatment. **H2 (middle frame) is the chosen one.**

The editable Affinity sources were saved locally (`index-list-A.af`,
`index-list-hover-options.af`); they are not in the repo.

## Intent

The Index page (`/project-index`, `src/components/list/ProjectList.astro`)
is a list of every project. Today the project title is large (21px Medium)
and the other columns are small, every row has a rule under it, and a big
`↓` opens the row into a slider with large side arrows. It reads loud and
busy for what is basically a table of contents.

The redesign takes its cue from Adam Ridgeway's "Index of Work" list view
(adamridgeway.com/work/list): every column the same small size, no rules,
the row you point at is singled out. The work carries the page, not the
typography.

It stays a Rhizome page. We borrow Ridgeway's structure and restraint, not
his look: cream background, Power Grotesk, black text, the existing nav and
its bracket motif all stay. The hover band reuses the nav's active-cell look
(black cell, cream text), so the list and the nav speak the same language.

## Goals

- One type size across Year, Client, Project and Category, all black at
  rest; no size or weight hierarchy.
- Hover, keyboard focus and the open row are shown by inverting the row:
  black band, cream text (user decision, hover option H2).
- No column header row (no `YEAR / CLIENT / PROJECT / CATEGORY` labels):
  the list starts directly with the first project (user decision, overrides
  the mockup).
- No rules between rows. The only hairline is the one closing an open
  project.
- Hover shows a small preview image that follows the cursor, so the plainer
  list keeps a visual hook.
- Clicking a row expands it in place (as today) into: gallery, a facts
  column, and the description.
- Works on mobile and by keyboard.

## Non-goals

- No Overview / thumbnail-grid view (considered and dropped: "I meant the
  list").
- No category filtering and no sorting by other columns in this round.
- No change to the nav, the homepage gallery, the archive, story pages or
  PhotoSwipe behaviour.
- No change to which projects or media appear, or their order.

## Anti-goals (would make this a failure even if it works)

- It stops feeling like rhizome.ch (grey Helvetica-on-white Ridgeway clone).
- Grey, low-contrast row text (tried in the first mockup, rejected).
- The open state gets heavier than today's.
- Hover preview that lags, flickers, or appears on touch devices.

## Visual spec

Colours (add as tokens in `src/styles/global.css` next to the existing
`--bg-*` tokens):

| Token | Value | Use |
|---|---|---|
| `--bg-color` (exists) | `#fbf9f4` | page |
| ink | existing body text colour (black) | all row text at rest, `+`, open block text; the hover/open band fill |
| `--bg-color` on ink | `#fbf9f4` | row text and `+`/`–` inside the band |
| `--text-muted` (new) | `#8f897f` | footer, facts labels, slider counter only |
| `--rule` (new) | `#e4dfd5` | open-block closing rule |

Typography (all Power Grotesk):

- Row cells: Regular, 14px, at every breakpoint.
- Footer: Regular, 11px, uppercase, `letter-spacing: 0.06em`, `--text-muted`.
- Open block: facts labels 11px uppercase muted; facts values 13px ink;
  description 14px ink, line-height ≈ 1.45, max ≈ 60ch; link Medium 14px.

Layout (desktop, mockup measured at 1440px wide, list starts where it does
today in the `TopWrapper` grid):

- Columns: Year · Client · Project · Category · toggle. Mockup proportions:
  80px · 340px · 440px · rest · 24px (toggle right-aligned). Use a CSS grid
  with these as a starting point; the builder tunes them.
- No header row and no top hairline: the first project row sits where the
  list starts today.
- Rows: 30px tall, no separators.
- Toggle: `+` when closed, `–` when open (text glyphs, 15px, no rotation
  animation).
- Footer under the list: `17 PROJECTS · 2019 – 2025`, computed from the
  data (count, min year, max year).

Breakpoints (existing custom media in `global.css`):

- Desktop / wide: all five columns.
- Tablet (768–1119px): drop Client; Year · Project · Category · toggle.
- Mobile (≤767px): Year · Project · toggle. Rows at least 44px tall for tap
  targets. No hover preview.

## Behaviour

### At rest

All rows ink on the cream background.

### Hover / focus

- The row inverts: a black band fills the row (full row height, starting
  ~10px left of the Year column and ending ~10px right of the toggle), and
  every cell plus the `+` turns cream. No rounded corners. Transition
  ~120ms or none; never a slide/grow animation.
- Keyboard focus (`:focus-visible`) shows the same band, so focus is always
  visible without an extra outline.
- Preview image (pointer devices only, i.e. `(hover: hover) and (pointer: fine)`):
  - ~220px wide, the image's own aspect ratio, no border or shadow.
  - Top-left sits ~20px right and ~14px below the cursor, and follows the
    cursor while it is over the row. Keep it inside the viewport (flip to
    the left of the cursor near the right edge).
  - Appears when the pointer enters a row, swaps instantly when moving to
    another row, disappears when leaving the list.
  - Not shown for the row that is currently open (its images are already
    on screen).
  - `pointer-events: none`; it never blocks clicks.
  - With `prefers-reduced-motion`, it still appears but follows without any
    easing/lag.
- Preview source: the first entry of `getProjectMedia(projectName)` that is
  an image. If a project only has videos, use that video's Mux thumbnail
  (`src/components/media/mux.ts`). If a project has no media, no preview.
  Render a small optimized size (~440px wide for 2x screens), lazy, so the
  page weight barely grows.

### Open

- Click (or Enter/Space) on a row toggles it, as today. Multiple rows may
  be open at once, as today.
- The open row keeps the black band with cream text (user decision) for as
  long as it is open, hovered or not; its toggle shows `–`. Only the row
  bar is inverted: the gallery, facts and description below sit on cream.
- Below it, in order:
  1. **Gallery** — keep the existing Keen Slider and PhotoSwipe wiring
     (`ImageSlide.astro`, video play/pause logic, PhotoSwipe indices). Left
     edge aligns with the Year column, right edge with the list's right edge.
     ~4 slides per view on desktop, 3 on tablet, ~1.2 on mobile; 12px gap.
     The big side arrows go. Replace them with a small muted
     `←  1 / 6  →` control under the gallery's right end (same pattern as
     the homepage gallery bar), hidden when all slides fit in view.
  2. **Facts** (under the Year/Client columns) — label/value rows:
     `CLIENT` (client), `ROLE` (role), `TOOLS` (tools), `WITH`
     (collaborators). Omit any row whose field is missing.
  3. **Description** (under the Project column) — `projectDescription`
     markdown, as rendered today. Links stay exactly where the content puts
     them (inline, trailing, several, or none) and are only restyled:
     PowerGrotesk-Medium, ink, followed by a CSS-added ` ↗`. No content
     edits (user decision). The mockup's separate "Visit Xylopedia ↗" line
     is just Xylopedia's own trailing link with this style.
  4. A 1px `--rule` hairline closing the block, then the list continues.
- Open/close keeps today's height transition (~0.5s).

## Data and copy

- Category column = the project's `role` field (as today).
- Fix the typo "Design & Developement" → "Design & Development" in
  `src/content/projects/UBJahresbericht23.yaml` and `UBJahresbericht24.yaml`.
- Year column shows the first 4 characters of `year` (as today); order stays
  `sortProjectsByYear`.
- `credits` (HTML table) is no longer shown in the list; it stays on the
  PhotoSwipe info slide (user decision). That includes the paper citations
  and the links that exist only in `credits` (e.g. Living Bricks' paper,
  Gjermundbu's 3D viewer and UNIMUS); they are reachable only through the
  info slide, and that is accepted.
- Facts read the plain YAML fields as they are. Treat empty strings (e.g.
  `collaborators: ""`) as missing. Where a field disagrees with `credits`
  (Xylopedia `tools` vs its credits table), the field wins; reconciling the
  content is out of scope.
- The description's link markup is raw inline HTML with an inline
  `style="pointer-events: auto; color: black;"`; the restyle must work
  with that markup unchanged (it already forces black, which is the ink
  colour, so only weight and the `↗` need adding).

## Accessibility

- Each row's clickable bar becomes a real `<button>` (or gets
  `role="button"`, `tabindex="0"`, key handling) with `aria-expanded` and
  `aria-controls` pointing at its open block.
- The preview image is decorative (`alt=""`, `aria-hidden`).

## Constraints

- Astro 6 static, PostCSS (preset-env + nesting), no Tailwind; relative
  imports only; client logic stays in the component or a colocated `.ts` in
  `src/components/list/`.
- `npm run check` must stay at 0 errors/warnings/hints; `npm run build` and
  `npm run lint` must pass.
- Mobile floating nav and PhotoSwipe must keep working; the slider's
  z-index must stay under the mobile nav (z 1000).
- Update `docs/galleries.md` ("Project List Gallery") for the new structure
  and preview-image rule.

## Decided by the user

- Restyle the Index list (not the homepage, no overview grid).
- Inspiration: Adam Ridgeway's index list view.
- Variant A: keep Rhizome's cream, Power Grotesk and nav; one size,
  cursor-following preview, in-place open block.
- Hover behaviour as described is right; don't change it.
- No column header row.
- Text always black; hover = H2 (black band, cream text), and the open row
  keeps the band.
- Mobile as described (Year · Project · toggle, peeking slider, facts then
  description), confirmed with the M1/M2 mockup.
- Description links are restyled in place (Medium + `↗`), no content edits.
- `credits` content may live only on the PhotoSwipe info slide.

## Calls made by the designer (check these)

- Slider kept (not a static 4-image row as drawn), because projects have
  3–10+ media items and some are videos; its arrows move into a small
  `← 1 / 6 →` control.
- Preview image = first image in the project gallery order, no new YAML
  field.
- Tablet drops Client; mobile drops Client and Category.
- Typo fix in the two UB annual report YAML files.

## Left to the builder

- Exact column widths and spacing at each breakpoint.
- How the preview follows the cursor (rAF + transform is expected).
- Whether to split client script into `src/components/list/preview.ts`.
- Image size/format details for the preview, within the existing local
  image pipeline (`docs/image-optimization.md`).
