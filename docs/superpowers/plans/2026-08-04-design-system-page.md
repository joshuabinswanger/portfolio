# Design System Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an unlisted, non-indexed `/styleguide` route that renders every design token and reusable UI primitive in the portfolio, plus the additive tokens the codebase is currently missing.

**Architecture:** One Astro page composing nine small single-responsibility components under `src/components/styleguide/`, with page-local CSS in `src/styles/styleguide.css`. Tokens are added additively to `:root` in `src/styles/global.css` — nothing renamed, nothing removed, no existing consumer rewritten. The page has zero Cloudinary / MixItUp / PhotoSwipe dependency, so it renders without credentials or network.

**Tech Stack:** Astro 6, TypeScript, PostCSS (`postcss-preset-env` + `postcss-nesting`), `@astrojs/sitemap`. No Tailwind, no CSS-in-JS.

## Global Constraints

- **No test framework exists in this repo.** `package.json` has no vitest / jest / playwright. Introducing one is out of scope. Every task therefore uses *verification steps* (typecheck, lint, browser inspection) in place of a TDD red/green cycle. This is a deliberate, spec-approved deviation from the usual TDD structure.
- `npm run check` (`astro check`) must remain at **0 errors, 0 warnings, 0 hints** after every task.
- `npm run lint` (ESLint) must pass after every task.
- Relative import paths only — no path aliases.
- All new CSS classes are prefixed `sg-` to guarantee no collision with existing component styles.
- Do **not** rename, remove, or change the value of any token that already exists in `src/styles/global.css`.
- Do **not** modify the `<style>` block of any existing component (`ArchiveGallery_BoxFilters.astro`, `NavigationBar.astro`, brackets, etc.).
- YAML visibility flags in this codebase are the string enums `"yes"` / `"no"`, never booleans — irrelevant to this feature but do not "fix" any you see.
- Commit after every task. Do not squash tasks into one commit.
- Breakpoint definitions are fixed and must be used exactly as they appear in `global.css`:
  `--bp-mobile-small (width <= 375px)`, `--bp-mobile (width <= 767px)`, `--bp-tablet (768px <= width <= 1119px)`, `--bp-desktop (1120px <= width <= 1699px)`, `--bp-desktop-wide (width >= 1700px)`.

---

### Task 1: Additive tokens in global.css

**Files:**
- Modify: `src/styles/global.css:76-154` (the `:root` block — append inside it, before the closing brace)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties available to every later task —
  `--font-ultralight`, `--font-light`, `--font-regular`, `--font-medium`, `--font-bold`;
  `--space-1` … `--space-7`;
  `--color-text`, `--color-surface`, `--color-surface-accent`, `--color-border`, `--color-overlay`.

- [ ] **Step 1: Append the token block inside `:root`**

Insert immediately after the `--grid-layout-columns-desktop-wide` declaration and before the closing `}` of `:root`:

```css
  /* --- Additive tokens (2026-08-04) --------------------------------------
     Added alongside the originals above. Nothing here replaces an existing
     token, and no existing rule was changed to consume them — adopt these
     names as you touch files. All of them are rendered on /styleguide. */

  /* Font families. The five PowerGrotesk faces declared at the top of this
     file, so component CSS stops hardcoding `font-family: PowerGrotesk-Light`
     (currently literal in Main.astro, NavigationBar.astro and
     ArchiveGallery_BoxFilters.astro). */
  --font-ultralight: PowerGrotesk-UltraLight;
  --font-light: PowerGrotesk-Light;
  --font-regular: PowerGrotesk-Regular;
  --font-medium: PowerGrotesk-Medium;
  --font-bold: PowerGrotesk-Bold;

  /* Spacing scale, derived from values already load-bearing in this codebase
     rather than invented: 20px is --margin-right-tablet, 56px and 88px are the
     desktop and desktop-wide grid column widths. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 20px;
  --space-5: 32px;
  --space-6: 56px;
  --space-7: 88px;

  /* Semantic aliases over the --bg-* values above. Use these in new code so
     intent is readable at the point of use. */
  --color-text: #000000;
  --color-surface: var(--bg-color);
  --color-surface-accent: var(--bg-color-accent);
  --color-border: var(--bg-dark);
  --color-overlay: var(--bg-color-trans);
```

- [ ] **Step 2: Verify nothing regressed**

Run: `npm run check`
Expected: `0 errors, 0 warnings, 0 hints`

Run: `npm run lint`
Expected: exit 0, no output.

- [ ] **Step 3: Confirm the additions are purely additive**

Run: `git diff --stat src/styles/global.css`
Expected: only insertions (`+NN`), zero deletions. If the diff shows any deleted line, revert and redo — an existing token was touched.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(tokens): add font-family, spacing and semantic colour tokens"
```

---

### Task 2: Route plumbing — noindex prop, sitemap exclusion, empty page

**Files:**
- Modify: `src/layouts/Main.astro:14-17` (props destructure) and `:91-97` (head meta)
- Modify: `astro.config.mjs:9`
- Create: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `Main.astro` accepts a `noindex?: boolean` prop, default `false`. The route `/styleguide` exists and renders. Later tasks add sections to `src/pages/styleguide.astro`.

- [ ] **Step 1: Add the `noindex` prop to Main.astro**

Replace the destructure at `src/layouts/Main.astro:14-17`:

```astro
const {
  title = "Rhizome Visuals — Scientific Illustration & 3D Design",
  description = "Scientific illustration and 3D design by Joshua Binswanger (Rhizome Visuals).",
} = Astro.props;
```

with:

```astro
const {
  title = "Rhizome Visuals — Scientific Illustration & 3D Design",
  description = "Scientific illustration and 3D design by Joshua Binswanger (Rhizome Visuals).",
  // Internal pages (e.g. /styleguide) opt out of indexing. Canonical is still
  // emitted — the page is real, just not something we want in results.
  noindex = false,
} = Astro.props;
```

- [ ] **Step 2: Emit the robots meta**

In the `<head>` of `src/layouts/Main.astro`, immediately after the `<meta name="generator" ... />` line, add:

```astro
    {noindex && <meta name="robots" content="noindex, nofollow" />}
```

- [ ] **Step 3: Exclude /styleguide from the sitemap**

In `astro.config.mjs`, replace `integrations: [sitemap(), robotsTxt()],` with:

```js
  integrations: [
    sitemap({
      // /styleguide is an internal design-token reference, not site content.
      filter: (page) => !page.includes("/styleguide"),
    }),
    robotsTxt(),
  ],
```

- [ ] **Step 4: Create the page with a heading only**

Create `src/pages/styleguide.astro`:

```astro
---
// Internal design-system reference. Unlisted: not linked from any nav
// component, noindex, and filtered out of the sitemap in astro.config.mjs.
// See docs/design-system.md.
import Main from "../layouts/Main.astro";
import "../styles/styleguide.css";
---

<Main
  title="Design System — Rhizome Visuals (internal)"
  description="Internal reference rendering the design tokens and UI primitives of rhizome.ch."
  noindex={true}
>
  <div class="sg-page">
    <header class="sg-header">
      <h1 class="sg-title">Design System</h1>
      <p class="sg-lede">
        Internal reference for rhizome.ch. Every token below is read live from
        <code>src/styles/global.css</code> — resize the window to see the
        per-breakpoint values change.
      </p>
    </header>

    <main class="sg-body" id="main">
      <!-- Sections are added in Tasks 4-10. -->
    </main>
  </div>
</Main>
```

- [ ] **Step 5: Create a minimal stylesheet so the import resolves**

Create `src/styles/styleguide.css` with only the page shell for now (expanded in Task 3):

```css
/* Styles for the internal /styleguide page only. Loaded exclusively by
   src/pages/styleguide.astro, so nothing here reaches the public site.
   All classes are `sg-` prefixed to guarantee no collision. */

.sg-page {
  font-family: var(--font-light);
  color: var(--color-text);
  padding: var(--space-5) var(--space-4) calc(var(--space-7) * 2);
  max-width: 1100px;
  margin: 0 auto;
}
```

- [ ] **Step 6: Verify the route renders and is not indexed**

Run: `npm run check`
Expected: `0 errors, 0 warnings, 0 hints`

Start the dev server via the preview tooling (never `npm run dev` in a shell — it blocks), navigate to `/styleguide`, and confirm:
- The `<h1>` "Design System" renders.
- `<meta name="robots" content="noindex, nofollow">` is present in the document head.
- The console has no errors.
- Navigate to `/` and confirm `<meta name="robots">` is **absent** there (the default must not have changed).

- [ ] **Step 7: Commit**

```bash
git add src/layouts/Main.astro astro.config.mjs src/pages/styleguide.astro src/styles/styleguide.css
git commit -m "feat(styleguide): add unlisted /styleguide route with noindex support"
```

---

### Task 3: Page shell — section wrapper, sticky ToC, page CSS

**Files:**
- Create: `src/components/styleguide/Section.astro`
- Modify: `src/styles/styleguide.css` (replace with the full shell stylesheet)
- Modify: `src/pages/styleguide.astro` (add the ToC and wire the layout)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces:
  - `Section.astro` with `Props { id: string; title: string; note?: string }`, rendering `<section class="sg-section" id={id}><h2 class="sg-section-title">…</h2>{note && <p class="sg-note">…</p>}<slot /></section>`. Every later task wraps its content in this.
  - CSS utility classes every later task uses: `.sg-grid-auto` (auto-fill card grid), `.sg-card`, `.sg-label` (monospace token name), `.sg-value` (monospace resolved value), `.sg-table` (2–3 column definition table), `.sg-note`, `.sg-swatch`, `.sg-bar`, `.sg-demo` (bordered demo frame).
  - A `SECTIONS` array of `{ id, title }` exported from `src/pages/styleguide.astro`'s frontmatter, used to render the ToC. Section ids, fixed for all later tasks: `breakpoints`, `color`, `type`, `spacing`, `grid`, `brackets`, `icons`, `chrome`.

- [ ] **Step 1: Create `Section.astro`**

```astro
---
interface Props {
  id: string;
  title: string;
  /** Optional caveat or pointer shown under the heading. */
  note?: string;
}
const { id, title, note } = Astro.props;
---

<section class="sg-section" id={id}>
  <h2 class="sg-section-title">{title}</h2>
  {note && <p class="sg-note" set:html={note} />}
  <slot />
</section>
```

- [ ] **Step 2: Write the full `src/styles/styleguide.css`**

Replace the file with the complete shell: two-column layout (`sg-layout` = sticky ToC + body) collapsing to one column under `--bp-mobile`; `.sg-section` separated by a `var(--border-size) solid var(--color-border)` top border; `.sg-label` / `.sg-value` in `ui-monospace, monospace` at 11px so token names are visually distinct from specimen text; `.sg-card` on `var(--color-surface-accent)`; `.sg-demo` with a `1px dashed var(--color-border)` frame; `.sg-table` with `border-collapse: collapse` and left-aligned `th`. Use only `--space-*`, `--color-*`, `--font-*` tokens for every value — the stylesheet doubles as proof the new tokens work.

- [ ] **Step 3: Add the ToC to the page**

In `src/pages/styleguide.astro` frontmatter add:

```astro
const SECTIONS = [
  { id: "breakpoints", title: "Breakpoints" },
  { id: "color", title: "Colour" },
  { id: "type", title: "Type" },
  { id: "spacing", title: "Spacing & Border" },
  { id: "grid", title: "Grid" },
  { id: "brackets", title: "Brackets" },
  { id: "icons", title: "Icons" },
  { id: "chrome", title: "Chrome" },
];
```

and render it as a `<nav class="sg-toc" aria-label="Design system sections">` of anchor links inside `.sg-layout`, before `.sg-body`.

- [ ] **Step 4: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`
Run: `npm run lint` → exit 0

In the browser at `/styleguide`: the ToC renders eight links; clicking one jumps (targets do not exist yet, so expect no scroll — that is correct at this stage); at 375px width the ToC stacks above the body rather than sitting beside it.

- [ ] **Step 5: Commit**

```bash
git add src/components/styleguide/Section.astro src/styles/styleguide.css src/pages/styleguide.astro
git commit -m "feat(styleguide): page shell with sticky section nav"
```

---

### Task 4: Breakpoint readout (live)

**Files:**
- Create: `src/components/styleguide/BreakpointReadout.astro`
- Modify: `src/pages/styleguide.astro` (import + render inside a `Section` with `id="breakpoints"`)

**Interfaces:**
- Consumes: `Section.astro` from Task 3; grid column tokens from `global.css`.
- Produces: nothing later tasks depend on.

**Why this component owns a hidden probe:** the active grid column count and column width must be *measured*, not hardcoded, or the panel lies the moment a token changes. The component renders an offscreen `<div class="sg-probe">` carrying exactly the same `grid-template-columns` per-breakpoint rules as `.grid-container` in `src/layouts/GridLayout.astro`, then reads `getComputedStyle(probe).gridTemplateColumns` and splits it. Self-contained — no coupling to Task 8.

- [ ] **Step 1: Create the component**

Markup: a `<dl class="sg-readout">` with `<dt>`/`<dd>` pairs for — Viewport width, Active `@custom-media`, `--scrollbar-width`, Grid columns, Column width, Device pixel ratio. Each `<dd>` gets an id (`sg-rd-width`, `sg-rd-bp`, `sg-rd-sbw`, `sg-rd-cols`, `sg-rd-colw`, `sg-rd-dpr`). Plus the probe div and a `<noscript>` note that the panel needs JS.

Client script — the breakpoint bounds must match `global.css` exactly, and `--bp-mobile-small` deliberately overlaps `--bp-mobile`, so report **all** matching names:

```ts
function activeBreakpoints(w: number): string[] {
  const names: string[] = [];
  // These ranges mirror the @custom-media queries in src/styles/global.css.
  // mobile-small is a subset of mobile, so both can match at once.
  if (w <= 375) names.push("--bp-mobile-small");
  if (w <= 767) names.push("--bp-mobile");
  if (w >= 768 && w <= 1119) names.push("--bp-tablet");
  if (w >= 1120 && w <= 1699) names.push("--bp-desktop");
  if (w >= 1700) names.push("--bp-desktop-wide");
  return names;
}

function update() {
  const probe = document.getElementById("sg-probe");
  if (!probe) return;
  const cols = getComputedStyle(probe).gridTemplateColumns.split(" ").filter(Boolean);
  const set = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set("sg-rd-width", `${window.innerWidth}px`);
  set("sg-rd-bp", activeBreakpoints(window.innerWidth).join(" + ") || "none");
  set(
    "sg-rd-sbw",
    getComputedStyle(document.documentElement).getPropertyValue("--scrollbar-width").trim() ||
      "(unset)",
  );
  set("sg-rd-cols", String(cols.length));
  set("sg-rd-colw", cols[0] ?? "—");
  set("sg-rd-dpr", String(window.devicePixelRatio));
}

window.addEventListener("resize", update);
document.addEventListener("astro:page-load", update);
update();
```

Bind on `astro:page-load` as well as calling `update()` immediately — this site uses `ClientRouter`, so a plain `DOMContentLoaded` binding would not re-run on client-side navigation.

- [ ] **Step 2: Render it on the page**

```astro
<Section
  id="breakpoints"
  title="Breakpoints"
  note="Measured live, not hardcoded. Grid values are read from a hidden probe carrying the same rules as <code>.grid-container</code> in <code>src/layouts/GridLayout.astro</code>."
>
  <BreakpointReadout />
</Section>
```

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser, resize through all five breakpoints and confirm each transition:
| Width | Expected `@custom-media` | Expected columns |
| --- | --- | --- |
| 375 | `--bp-mobile-small + --bp-mobile` | 7 |
| 767 | `--bp-mobile` | 7 |
| 1024 | `--bp-tablet` | 11 |
| 1280 | `--bp-desktop` | 17 (56px) |
| 1700 | `--bp-desktop-wide` | 17 (88px) |

Console must stay clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/BreakpointReadout.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): live breakpoint and grid readout"
```

---

### Task 5: Colour swatches

**Files:**
- Create: `src/components/styleguide/ColorSwatches.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: `Section.astro`; the `--bg-*` and `--color-*` tokens.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Create the component**

Frontmatter holds two arrays so the list is data, not repeated markup:

```astro
const RAW = [
  { name: "--bg-color", hex: "#fbf9f4", note: "Page background" },
  { name: "--bg-color-trans", hex: "#fbf9f4b1", note: "Translucent overlay background" },
  { name: "--bg-light", hex: "#fbf9f4", note: "Duplicate of --bg-color" },
  { name: "--bg-dark", hex: "#aaaaaa", note: "Scrollbar thumb, skip-link background" },
  { name: "--bg-color-accent", hex: "#e7dace", note: "Accent surface" },
];

const SEMANTIC = [
  { name: "--color-text", note: "→ #000000" },
  { name: "--color-surface", note: "→ var(--bg-color)" },
  { name: "--color-surface-accent", note: "→ var(--bg-color-accent)" },
  { name: "--color-border", note: "→ var(--bg-dark)" },
  { name: "--color-overlay", note: "→ var(--bg-color-trans)" },
];
```

Each swatch renders twice — once on `var(--bg-color)`, once on `var(--bg-dark)` — so translucent values and low-contrast pairs are visible rather than assumed. Set the fill with an inline `style={`background: var(${name})`}`, never a hardcoded hex, so the swatch cannot drift from the token.

Flag `--bg-light` explicitly as a duplicate of `--bg-color` in its note. That redundancy is real and the page should say so.

- [ ] **Step 2: Render inside `<Section id="color" title="Colour">`**

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser: ten swatch pairs render; `--bg-color-trans` visibly differs between the light and dark backing (proving alpha is applied); `--bg-light` and `--bg-color` are indistinguishable, matching the "duplicate" note.

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/ColorSwatches.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): colour token swatches"
```

---

### Task 6: Type specimens and the per-breakpoint size table

**Files:**
- Create: `src/components/styleguide/TypeSpecimens.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: `Section.astro`; `--font-*` tokens from Task 1; the `--font-size-*` tokens.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Create the component**

Three blocks:

1. **Faces** — one specimen row per face, each showing the token name, the underlying family, and a pangram set at 24px. Note the two real quirks in the font stack: `PowerGrotesk-Light` is the only face with an italic, and `PowerGrotesk-Medium` and `PowerGrotesk-Bold` are **both declared `font-weight: 600`** in `global.css:59` and `:72` — so they are indistinguishable to weight-based selection and must be picked by family name. State this on the page; it is exactly the kind of trap a styleguide exists to surface.

2. **Size table** — rows are the two roles (body, h1), columns are the five breakpoints, cells show the token name and its literal value:

| | mobile-small | mobile | tablet | desktop | desktop-wide |
| --- | --- | --- | --- | --- | --- |
| body | 10px | 12px | 12px | 14px | 14px |
| h1 | 14px | 14px | 16px | 18px | 18px |

Render each cell's text **at that size** so the ratios are visible, and mark the cell for the currently active breakpoint with a `.sg-active` class applied by a small script reusing the same bounds as Task 4.

3. **Paragraph specimen** — a real paragraph at the active body size, with the global `letter-spacing: 0.7px` from `global.css:125` in effect, plus a copy with `letter-spacing: normal` beside it for comparison.

- [ ] **Step 2: Render inside `<Section id="type" title="Type">`**

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser: all five faces render in distinct shapes (if any render identically the `@font-face` src path is wrong — check the Network panel for 404s on `/fonts/PowerGrotesk/...`); the active-breakpoint column highlight follows a resize; the Medium/Bold weight-collision note is present.

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/TypeSpecimens.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): type specimens and per-breakpoint size table"
```

---

### Task 7: Spacing scale and border

**Files:**
- Create: `src/components/styleguide/SpacingScale.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: `Section.astro`; `--space-*` and `--border-size` tokens.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Create the component**

Three blocks:

1. **Spacing scale** — seven rows, each a bar of `width: var(--space-N)` with the token name and value, and a note naming the codebase provenance for `--space-4` (`--margin-right-tablet`), `--space-6` (desktop column width) and `--space-7` (desktop-wide column width).
2. **Padding tokens** — the existing top/bottom padding tokens as a table, including the computed values of the two `calc()` ones: `--padding-bot-desktop: calc(9 * 56px)` = 504px, `--padding-bot-desktop-wide: calc(9 * 88px)` = 792px.
3. **Border** — three stacked rules at `var(--border-size)` (0.5px), `1px` and `1.5px` (the literal used by the archive filter brackets), each labelled, with a note that sub-pixel borders round differently by browser and device pixel ratio, and a pointer to the live DPR value in the Breakpoints panel.

- [ ] **Step 2: Render inside `<Section id="spacing" title="Spacing & Border">`**

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser: bar widths increase monotonically 4 → 88px; the 0.5px rule renders visibly thinner than the 1px rule at DPR 1 (if they look identical, that is a real finding worth the note, not a bug in this task).

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/SpacingScale.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): spacing scale and border-width reference"
```

---

### Task 8: Grid section and page overlay

**Files:**
- Create: `src/components/styleguide/GridOverlay.astro`
- Modify: `src/pages/styleguide.astro`
- Modify: `src/styles/styleguide.css` (overlay rules)

**Interfaces:**
- Consumes: `Section.astro`; `src/layouts/GridLayout.astro` (imported directly — it takes only `customClass`, no data).
- Produces: a `.sg-grid-on` class on `<html>` toggled by the overlay button. No later task depends on it.

- [ ] **Step 1: Create the component**

Two parts:

1. **Inline demo** — the real `GridLayout` with `customClass="sg-grid-demo"`, containing 17 numbered cells. Under `--bp-mobile` (7 columns) and `--bp-tablet` (11 columns) the cells wrap onto extra rows; add a note saying so, because the numbering then runs past the first row and would otherwise read as a bug.
2. **Page overlay** — a `<button type="button" id="sg-grid-toggle">` and a `<div class="sg-grid-overlay" aria-hidden="true">` of 17 column divs, `position: fixed; inset: 0; pointer-events: none;` and `display: none` unless `<html>` carries `.sg-grid-on`. The overlay grid uses the same `--grid-layout-columns-*` tokens per breakpoint as `GridLayout`, so it shows where the real columns fall relative to this page's content.

Script:

```ts
function bind() {
  const btn = document.getElementById("sg-grid-toggle");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    const on = document.documentElement.classList.toggle("sg-grid-on");
    btn.setAttribute("aria-pressed", String(on));
  });
}
document.addEventListener("astro:page-load", bind);
bind();
```

The `dataset.bound` guard matters: `astro:page-load` fires again on client-side navigation back to this route, and a second listener would make the toggle a no-op (two toggles per click). `NavigationBar.astro:146` uses the same guard pattern for the same reason.

- [ ] **Step 2: Render inside `<Section id="grid" title="Grid">`**

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser: the inline demo shows 17 columns at 1280px and 7 at 375px; the toggle button flips `aria-pressed` and the fixed overlay appears/disappears; overlay columns line up with the inline demo's columns at every breakpoint; clicking the toggle twice returns to the off state (proving no double-binding).

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/GridOverlay.astro src/pages/styleguide.astro src/styles/styleguide.css
git commit -m "feat(styleguide): grid demo and page column overlay"
```

---

### Task 9: Bracket and icon inventories

**Files:**
- Create: `src/components/styleguide/BracketGallery.astro`
- Create: `src/components/styleguide/IconGallery.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: `Section.astro`; the six bracket components in `src/components/brackets/`; `src/components/Icon.astro`.
- Produces: nothing later tasks depend on.

**Bracket geometry — these are not interchangeable.** The V variants are wide and short, used stacked as horizontal rules; the H variants are tall and narrow, used side by side as vertical rules. Sizing a V bracket like an H one renders a hairline. Verified viewBoxes:

| Component | viewBox | Demo container |
| --- | --- | --- |
| `BracketOpenV` | `0 0 200 16` | 200 × 16 |
| `BracketMiddleV` | `0 -16 200 32` | 200 × 32 |
| `BracketCloseV` | (V family) | 200 × 16 |
| `BracketOpenH` | `0 0 50 200` | 50 × 200 |
| `BracketMiddleH` | `-50 0 100 200` | 100 × 200 |
| `BracketCloseH` | (H family) | 50 × 200 |

- [ ] **Step 1: Create `BracketGallery.astro`**

Import all six. Render each in a `.sg-demo` frame sized per the table above, labelled with the filename, and list the shared prop defaults once: `strokewidth="1px"`, `strokecolor="black"`, `height="100%"`, `width="100%"`; V variants also take `overflow="visible"`, H variants take `padding="1px"` instead. Note that all six use `vector-effect="non-scaling-stroke"`, so the stroke stays 1px regardless of container size.

- [ ] **Step 2: Create `IconGallery.astro`**

Auto-enumerate so the section cannot go stale as icons are added:

```astro
// Enumerated rather than hardcoded so this section stays correct as icons are
// added to src/assets/svg/. Icon.astro resolves the same directory by name.
const files = import.meta.glob("../../assets/svg/*.svg", { query: "?raw" });
const iconNames = Object.keys(files)
  .map((p) => p.split("/").pop()!.replace(/\.svg$/, ""))
  .sort();
```

Render one `.sg-demo` per name with `<Icon icon={name} width="32px" />` and the name as the label. If `iconNames` is empty, render a note saying so rather than an empty grid. At time of writing the directory holds exactly one icon, `Info.svg`.

- [ ] **Step 3: Render both sections**

`<Section id="brackets" title="Brackets">` and `<Section id="icons" title="Icons">`.

- [ ] **Step 4: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser: all six brackets render as recognisable bracket shapes — none collapsed to a line, none clipped; the Info icon renders at 32px; console clean (a failed `import.meta.glob` or a bad icon name surfaces as a build error, not a console warning, so a successful build is part of the evidence here).

- [ ] **Step 5: Commit**

```bash
git add src/components/styleguide/BracketGallery.astro src/components/styleguide/IconGallery.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): bracket and icon inventories"
```

---

### Task 10: Chrome states (snapshot)

**Files:**
- Create: `src/components/styleguide/ChromeStates.astro`
- Modify: `src/pages/styleguide.astro`

**Interfaces:**
- Consumes: `Section.astro`.
- Produces: nothing later tasks depend on.

**This is the one deliberate duplication in the feature, and it must be labelled as such on the page itself.** Neither source component can be imported:

- `ArchiveGallery_BoxFilters.astro` calls `getCollection("images")` (build-time Cloudinary data), initialises MixItUp on mount, and styles its controls purely through open/closed state selectors (`#filter.active + #filter-box .filter-button`). Its resting state is `height: 0` — an imported instance renders nothing.
- `NavigationBar.astro` is `position: sticky`, `display: none` under `--bp-mobile`, and carries `transition:persist`. A second persisted instance on another route risks interfering with `ClientRouter`.

So this component re-declares the **resting** appearance of each control, scoped under `.sg-chrome` inside its own `<style>` block, with a header comment naming each source file and the line range it was copied from.

- [ ] **Step 1: Create the component**

Two groups, each control shown in default / hover / selected / `:focus-visible` state (hover and focus demonstrated by a `.sg-force-hover` / `.sg-force-focus` class that duplicates the real pseudo-class declarations, since a static page cannot show a live hover):

*Archive controls* — copied from `ArchiveGallery_BoxFilters.astro`:
- `.main-button` (`:465-480`) — 40px tall, black background, `--bg-color` text, 14px, `letter-spacing: 0.6px`
- `.sort-button` (`:618-681`) at its **open** size (168 × 40) — the resting 0 × 0 is an animation artefact, not a design state; say so
- `.filter-button` (`:764-822`) at its open size (168 × 32), plus the `.mixitup-control-active` variant (black fill via `::before` at `width: 100%`, inverted text)
- `.active-filter` (`:1095-1117`) — the collapsed chip, 168 × 32, 11px
- `.filter-disabled` (`:824-827`) — `opacity: 0.25`
- `.zoom-button:disabled` (`:524-527`) — `opacity: 0.35`

*Nav links* — copied from `NavigationBar.astro:287-340`:
- `.button` default — black text on page background
- `.button.active` — `--bg-color` text over the `::before` bar at `width: 100%`

Note on the page that these controls carry **no `:focus-visible` style in the source** — the only focus affordance is the browser default. That is a genuine accessibility gap this page exists to surface; do not invent a focus style here and imply the site has one. Render the browser default and label it.

- [ ] **Step 2: Render inside a `Section` whose `note` states the snapshot caveat**

```astro
<Section
  id="chrome"
  title="Chrome"
  note="<strong>Snapshot, not live.</strong> These styles are copied from <code>ArchiveGallery_BoxFilters.astro</code> and <code>NavigationBar.astro</code> — see the change checklist in <code>docs/design-system.md</code> when you edit either."
>
```

- [ ] **Step 3: Verify**

Run: `npm run check` → `0 errors, 0 warnings, 0 hints`

In the browser, compare side by side against the real thing: open `/personal/` (or whichever route renders the archive), open the Filter panel, and confirm the styleguide's `.filter-button` and `.filter-button.mixitup-control-active` match the live controls in size, fill and text colour. Then compare `.button.active` against the current nav item on `/`. Any mismatch means the snapshot is already stale — fix the snapshot, not the source.

- [ ] **Step 4: Commit**

```bash
git add src/components/styleguide/ChromeStates.astro src/pages/styleguide.astro
git commit -m "feat(styleguide): archive and nav control state snapshots"
```

---

### Task 11: Documentation and full verification

**Files:**
- Create: `docs/design-system.md`
- Modify: `docs/README.md:5-14` (Topics list)
- Modify: `CLAUDE.md` (the "Read the docs first" paragraph)

**Interfaces:**
- Consumes: everything above.
- Produces: the doc every future change to this feature is checked against.

- [ ] **Step 1: Write `docs/design-system.md`**

Follow the template `docs/README.md:18-25` prescribes — Purpose, Main files, Data contract, Change checklist, Verification. The change checklist must contain, at minimum:

- Adding a token → add it to `:root` in `global.css` **and** to the matching styleguide component, or the page silently under-reports.
- Editing archive control styles or nav button styles → update `ChromeStates.astro` to match. This is the known drift risk.
- Adding an icon to `src/assets/svg/` → nothing to do, `IconGallery.astro` enumerates the directory.
- Adding a bracket component → add it to `BracketGallery.astro` with the correct container geometry (V = wide/short, H = tall/narrow).
- Changing a breakpoint in `global.css` → update the bounds in `BreakpointReadout.astro` and `TypeSpecimens.astro`, which mirror them in JS.

Also record the two findings the page surfaced: `--bg-light` duplicates `--bg-color`, and `PowerGrotesk-Medium` / `PowerGrotesk-Bold` are both declared `font-weight: 600`.

- [ ] **Step 2: Add the index entry to `docs/README.md`**

Insert into the Topics list, before the Troubleshooting line:

```markdown
- [Design System](./design-system.md): The `/styleguide` reference page, design tokens, and the token/chrome change checklist.
```

- [ ] **Step 3: Add it to the CLAUDE.md docs list**

Add `[design-system](docs/design-system.md)` to the linked list in the "Read the docs first" section, and add "the design tokens" to the list of systems that require reading a doc first.

- [ ] **Step 4: Full verification**

Run: `npm run check`
Expected: `0 errors, 0 warnings, 0 hints`

Run: `npm run lint`
Expected: exit 0

Run: `npm run build`
Expected: exit 0. Requires Cloudinary credentials in `.env` plus network. If the build fails for credential or network reasons — not for a code reason — say so explicitly rather than claiming a green build.

Then confirm the sitemap exclusion actually worked:

```bash
grep -r styleguide dist/sitemap-index.xml dist/sitemap-0.xml
```

Expected: no matches. A match means the `filter` in `astro.config.mjs` is wrong.

And confirm the page is in the build output with its robots tag:

```bash
grep -c "noindex" dist/styleguide/index.html
```

Expected: `1` or more.

- [ ] **Step 5: Browser pass at all five breakpoints**

Load `/styleguide` at 375, 767, 1024, 1280 and 1700px. At each: no console errors, no horizontal page scroll, the breakpoint readout reports the expected values from Task 4's table, and every section renders content.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system.md docs/README.md CLAUDE.md
git commit -m "docs: add design-system doc and index it"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: additive tokens → Task 1; route plumbing (noindex, sitemap, unlisted) → Task 2; page sections 1–8 → Tasks 4, 5, 6, 7, 8, 9 (brackets + icons), 10; file structure → Tasks 2, 3 and each component task; verification → Task 11; docs → Task 11. The spec's snapshot-chrome rationale is carried into Task 10 verbatim rather than left implicit.

**Placeholders.** None. Every task names exact files, exact class and id names, and the verification command with its expected output. Where a task specifies markup in prose rather than a full code block (Tasks 5–7, 9, 10), the class names, data arrays and literal values are all given, and those class names are the ones defined in Task 3's Interfaces block.

**Type consistency.** Section ids are fixed once in Task 3 (`breakpoints`, `color`, `type`, `spacing`, `grid`, `brackets`, `icons`, `chrome`) and used unchanged in Tasks 4–10. `Section.astro`'s prop names (`id`, `title`, `note`) are identical at every call site. The readout element ids (`sg-rd-*`) are defined and consumed only inside Task 4. The `activeBreakpoints` bounds appear in Tasks 4 and 6 and are identical in both — Task 11's change checklist names both files for that reason.

**Known risk carried forward.** Task 10's snapshot will drift from its sources. Mitigated by source-file comments, an on-page label, and a change-checklist entry — not eliminated. Accepted in the spec.
