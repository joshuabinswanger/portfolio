# Index List Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the project Index list (`/project-index`) into a one-size, black-text list with an inverted-band hover/open state, a cursor-following preview image, and a quieter in-place open block.

**Architecture:** All work stays in `src/components/list/`. Pure, DOM-free logic (footer summary, facts rows, preview placement, preview source choice, slider-controls rule) goes in a new `listHelpers.ts` and is unit-tested with Node's built-in test runner. The cursor preview's DOM behaviour lives in a new `preview.ts`. `ProjectList.astro` gets new markup, styles and slider wiring; `ImageSlide.astro` only changes its `sizes`.

**Tech Stack:** Astro 6 (static, `ClientRouter`), TypeScript, PostCSS (preset-env stage 0 + nesting, custom media from `src/styles/global.css`), keen-slider 6, PhotoSwipe 5, Node 25 `node --test` (native TS type-stripping, no new dependencies).

**Spec:** [docs/superpowers/specs/2026-10-26-index-list-redesign-design.md](../specs/2026-10-26-index-list-redesign-design.md) — read it first; mockups sit next to it (`2026-10-26-index-list-mockup.png` for layout, `2026-10-26-index-list-hover-options.png` frame H2 for the hover look; the grey text in the first mockup is superseded: all text is black).

## Global Constraints

- Relative import paths only, no aliases; existing code imports `.ts` files with the extension (`./utils.ts`).
- No Tailwind; styles are scoped `<style>` blocks with PostCSS nesting and the custom media `--bp-mobile` (≤767px), `--bp-tablet` (768–1119px), `--bp-desktop`, `--bp-desktop-wide` (≥1700px).
- `npm run check` stays at 0 errors / 0 warnings / 0 hints; `npm run lint` and `npm run build` pass.
- Font: Power Grotesk; row cells `PowerGrotesk-Regular` 14px at every breakpoint; links `PowerGrotesk-Medium`.
- Colours: page `--bg-color` `#fbf9f4`; ink `#000000`; `--text-muted` `#8f897f` (footer, facts labels, slider counter only); `--rule` `#e4dfd5`.
- No column header row. No rules between rows.
- Content YAML is not edited except the typo fix `Design & Developement` → `Design & Development` in `src/content/projects/UBJahresbericht23.yaml` and `UBJahresbericht24.yaml`.
- PhotoSwipe data, slide indices (`startIndex`, `slidesCount`) and the info slide stay as they are.
- The mobile floating nav (z-index 1000) stays above everything in the list.
- Client scripts run on `astro:page-load` and clean up on `astro:before-swap` (the site uses `ClientRouter`).

## Review Focus

1. **Sticky hover on touch:** after tapping a row open and tapping it closed on a phone, the row must not stay black. Hover band styles only apply under `@media (hover: hover)`; the open/focus band applies everywhere. → Task 3, Step 6 check.
2. **Preview at viewport edges:** pointer near the right or bottom edge must keep the preview fully on screen (flip left of cursor / pull up). → Task 2 tests `placePreview flips left…` and `placePreview pulls up…`.
3. **ClientRouter navigation:** Index → Info → Index must leave exactly one preview element and one set of listeners, and hovering must still work. → Task 5, Step 6 check.
4. **Missing or empty fact fields** (`collaborators: ""`, absent `tools`): the row is omitted, never shown as an empty label. → Task 1 test `getProjectFacts omits empty and whitespace values`.
5. **Few slides:** a project with 3 media items on desktop (4 per view) shows no `← 1 / 3 →` control and no arrows that do nothing. → Task 2 test `shouldShowSliderControls` and Task 4, Step 5 check (UZH Blender Course, Historic Game Night, Cellulose Living Material have 3).

---

### Task 1: Test harness, footer summary and facts helpers

**Files:**
- Modify: `package.json` (scripts)
- Create: `src/components/list/listHelpers.ts`
- Test: `tests/list/listHelpers.test.ts`

**Interfaces:**
- Produces:
  - `formatListSummary(years: string[]): string`
  - `type ProjectFact = { label: "Client" | "Role" | "Tools" | "With"; value: string }`
  - `getProjectFacts(data: { client?: string; role?: string; tools?: string; collaborators?: string }): ProjectFact[]`

- [ ] **Step 1: Add the test script.** In `package.json` scripts add `"test": "node --test \"tests/**/*.test.ts\""`.

- [ ] **Step 2: Write the failing tests** in `tests/list/listHelpers.test.ts`, importing from `../../src/components/list/listHelpers.ts` with `node:test` and `node:assert/strict`:

```ts
test("formatListSummary counts projects and spans first 4 year digits", () => {
  assert.equal(formatListSummary(["202504", "2024", "201906"]), "3 Projects · 2019 – 2025");
});
test("formatListSummary collapses a single year and singularises", () => {
  assert.equal(formatListSummary(["202409"]), "1 Project · 2024");
  assert.equal(formatListSummary(["2024", "202412"]), "2 Projects · 2024");
});
test("formatListSummary handles an empty list", () => {
  assert.equal(formatListSummary([]), "0 Projects");
});
test("getProjectFacts keeps spec order and labels", () => {
  assert.deepEqual(
    getProjectFacts({ collaborators: "A, B", tools: "Houdini", role: "Design", client: "HNE" }),
    [
      { label: "Client", value: "HNE" },
      { label: "Role", value: "Design" },
      { label: "Tools", value: "Houdini" },
      { label: "With", value: "A, B" },
    ],
  );
});
test("getProjectFacts omits empty and whitespace values", () => {
  assert.deepEqual(getProjectFacts({ client: " SLF ", collaborators: "", tools: "   " }), [
    { label: "Client", value: "SLF" },
  ]);
});
```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL, module/exports not found.

- [ ] **Step 4: Implement both functions** in `src/components/list/listHelpers.ts` (no `astro:*` imports in this file — it must run under plain Node). Separators are exactly `" · "` (middle dot) and `" – "` (en dash); the CSS uppercases the footer, so the function returns title case.

- [ ] **Step 5: Run** `npm test` → PASS, then `npm run check` → 0 errors/warnings/hints (the test file is type-checked too).

- [ ] **Step 6: Commit**

```bash
git add package.json src/components/list/listHelpers.ts tests/list/listHelpers.test.ts
git commit -m "feat(list): summary and facts helpers with node tests"
```

---

### Task 2: Preview placement, preview source and slider-controls helpers

**Files:**
- Modify: `src/components/list/listHelpers.ts`
- Test: `tests/list/listHelpers.test.ts`

**Interfaces:**
- Consumes: Task 1's file.
- Produces:
  - `type Point = { x: number; y: number }`, `type Size = { width: number; height: number }`
  - `placePreview(pointer: Point, preview: Size, viewport: Size): Point` — constants inside: offset `{ x: 20, y: 14 }`, edge margin `8`.
  - `type PreviewCandidate = { data: { mediaType?: "image"; src: string } | { mediaType: "video"; posterSrc: string } }`
  - `pickPreviewSrc(media: PreviewCandidate[]): string | null`
  - `shouldShowSliderControls(slideCount: number, perView: number): boolean`

- [ ] **Step 1: Write the failing tests** (append):

```ts
const vp = { width: 1440, height: 900 };
const img = { width: 220, height: 275 };
test("placePreview sits 20px right and 14px below the pointer", () => {
  assert.deepEqual(placePreview({ x: 600, y: 200 }, img, vp), { x: 620, y: 214 });
});
test("placePreview flips left of the pointer near the right edge", () => {
  assert.deepEqual(placePreview({ x: 1300, y: 200 }, img, vp), { x: 1060, y: 214 });
});
test("placePreview pulls up near the bottom edge", () => {
  assert.deepEqual(placePreview({ x: 600, y: 800 }, img, vp), { x: 620, y: 617 });
});
test("placePreview never leaves the top-left margin", () => {
  assert.deepEqual(placePreview({ x: 100, y: 10 }, { width: 220, height: 2000 }, { width: 300, height: 900 }), { x: 8, y: 8 });
});
test("pickPreviewSrc prefers the first image", () => {
  assert.equal(pickPreviewSrc([
    { data: { mediaType: "video", posterSrc: "/p.webp" } },
    { data: { src: "/a.webp" } },
    { data: { mediaType: "image", src: "/b.webp" } },
  ]), "/a.webp");
});
test("pickPreviewSrc falls back to a video poster, then null", () => {
  assert.equal(pickPreviewSrc([{ data: { mediaType: "video", posterSrc: "/p.webp" } }]), "/p.webp");
  assert.equal(pickPreviewSrc([]), null);
});
test("shouldShowSliderControls only when slides overflow the view", () => {
  assert.equal(shouldShowSliderControls(3, 4), false);
  assert.equal(shouldShowSliderControls(4, 4), false);
  assert.equal(shouldShowSliderControls(5, 4), true);
  assert.equal(shouldShowSliderControls(1, 1.2), false);
  assert.equal(shouldShowSliderControls(2, 1.2), true);
});
```

- [ ] **Step 2: Run** `npm test` → the new tests FAIL.

- [ ] **Step 3: Implement.** `placePreview`: x = pointer.x + 20; if x + width > viewport.width − 8, x = pointer.x − 20 − width; then x = max(x, 8). y = pointer.y + 14; if y + height > viewport.height − 8, y = viewport.height − 8 − height; then y = max(y, 8). `pickPreviewSrc` uses the video poster where the spec says "Mux thumbnail": the poster is the local still Mux shows anyway, and keeps the page on local images.

- [ ] **Step 4: Run** `npm test` → PASS; `npm run check` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/list/listHelpers.ts tests/list/listHelpers.test.ts
git commit -m "feat(list): preview placement, preview source and slider-controls helpers"
```

---

### Task 3: List rows — markup, black text, H2 band, columns, footer

**Files:**
- Modify: `src/styles/global.css` (tokens next to `--bg-color-accent`, ~line 82)
- Modify: `src/components/list/ProjectList.astro` (frontmatter, row markup, `<style>`, click handler in the Keen Slider script)
- Modify: `src/content/projects/UBJahresbericht23.yaml:8`, `src/content/projects/UBJahresbericht24.yaml:8`

**Interfaces:**
- Consumes: `formatListSummary` (Task 1).
- Produces (later tasks select on these):
  - Wrapper `#list-wrapper` sets `--list-columns` (the grid template every row and the open block share).
  - Per project: `.ListElement` (`id={projectName}`, keeps `data-project-title`, `data-project-credits`), containing `button.row-bar` (`type="button"`, `aria-expanded`, `aria-controls={`${projectName}-panel`}`) with child spans `.cell-year`, `.cell-client`, `.cell-title`, `.cell-category`, `.cell-toggle`; then `.flip-out#${projectName}-panel`.
  - Open state: class `open` on `.ListElement` **and** `aria-expanded="true"` on its `.row-bar`.
  - Footer `p.list-summary` after the last row.

- [ ] **Step 1: Tokens.** In `global.css` add `--ink: #000000;`, `--text-muted: #8f897f;`, `--rule: #e4dfd5;`.

- [ ] **Step 2: Typo fix** in the two UB YAML files (`role: "Design & Development"`).

- [ ] **Step 3: Markup.** Replace the four `column1..4` divs and both `<hr />`s with the `button.row-bar` structure above (`.cell-toggle` is empty; CSS draws `+`/`–`). Category = `entry.data.role`; year = `entry.data.year.slice(0, 4)` (as today). After the map, render `<p class="list-summary">{formatListSummary(sortedProjects.map((p) => p.data.year))}</p>`.

- [ ] **Step 4: Styles** (replace the old `.list-element-bar`, `.column*`, `.year`, `.project-title`, `.role`, `hr` rules):
  - `#list-wrapper`: `--list-columns: 5rem minmax(0, 2.8fr) minmax(0, 3.6fr) minmax(0, 2.5fr) 1.5rem;` tablet: `5rem 0 minmax(0, 3fr) minmax(0, 2fr) 1.5rem` with `.cell-client { display: none }`; mobile: `3.5rem 0 minmax(0, 1fr) 0 1.5rem`, hide client and category; mobile `padding-bottom: calc(var(--mobile-nav-stack) + 16px)`.
  - `.row-bar`: `all: unset; box-sizing: border-box; display: grid; grid-template-columns: var(--list-columns); column-gap: 16px; width: calc(100% + 20px); margin-inline: -10px; padding: 7px 10px; min-height: 30px; cursor: pointer; font: 14px PowerGrotesk-Regular; color: var(--ink);` mobile `min-height: 44px; align-items: center`.
  - Band: `.ListElement.open > .row-bar, .row-bar:focus-visible { background: var(--ink); color: var(--bg-color); }` and the same declarations for `.row-bar:hover` **only inside `@media (hover: hover)`**. Transition `background-color, color` 120ms. No outline needed on focus (the band is the focus indicator); keep `outline: none` only together with `:focus-visible` band.
  - `.cell-toggle { justify-self: end; font-size: 15px }`, `::before { content: "+" }`, `[aria-expanded="true"] .cell-toggle::before { content: "–" }`. Drop the old rotate transition.
  - `.list-summary`: 11px, uppercase, `letter-spacing: 0.06em`, `color: var(--text-muted)`, margin-top 32px.
  - Remove `.ListElement { grid-template-rows: 52px auto }` (rows are now content-height).

- [ ] **Step 5: Click handler.** In the Keen Slider script select `.row-bar` instead of `.list-element-bar`; on toggle also set `listBar.setAttribute("aria-expanded", String(isOpen))`. A `<button>` gives Enter/Space for free; no key handler.

- [ ] **Step 6: Verify in the browser.** `npm run dev`, open `/project-index/`:
  - 1440×900: all text black, one size, no header, no rules; hover shows the black band with cream text spanning ~10px past Year and toggle; Tab moves the band row to row; footer reads `17 PROJECTS · 2019 – 2025`.
  - 1120 wide: long clients ("ETH Sustainable Agroecosystems Group", "UZH, Prof. Dr. Noah Bubenhofer") wrap inside their cell and the band covers the full taller row.
  - 768 wide: Client hidden. 375 wide (mobile emulation): Year · Title · `+`, rows ≥44px, last row and footer clear the floating nav; tap a row open then closed → the row is not left black (Review Focus 1).

- [ ] **Step 7: Run** `npm run check && npm run lint && npm test` → clean.

- [ ] **Step 8: Commit**

```bash
git add src/styles/global.css src/components/list/ProjectList.astro src/content/projects/UBJahresbericht23.yaml src/content/projects/UBJahresbericht24.yaml
git commit -m "feat(list): one-size black rows with inverted band, no header or rules"
```

---

### Task 4: Open block — slider, controls, facts, description links

**Files:**
- Modify: `src/components/list/ProjectList.astro` (`.flip-out` markup, Keen Slider init, `<style>`)
- Modify: `src/components/list/ImageSlide.astro` (`sizes` only)

**Interfaces:**
- Consumes: `getProjectFacts`, `shouldShowSliderControls` (Tasks 1–2); `--list-columns`, `.ListElement`, `.row-bar` (Task 3).
- Produces: inside `.flip-out`: `.project-images` (unchanged class, keen container), `.slider-controls` (`button.slider-prev`, `span.slider-count`, `button.slider-next`), `dl.facts`, `.project-description` (class unchanged — the PhotoSwipe script reads its `innerHTML`), `.description`.

- [ ] **Step 1: Markup.** Remove `button.arrow-left` / `button.arrow-right` and the `.project-slider` 40px side columns. Order inside `.flip-out`: `.project-images` → `.slider-controls` (with `hidden` by default; `aria-label`s "Previous image" / "Next image"; count text `1 / N`) → `dl.facts` built from `getProjectFacts(entry.data)` (`<dt>` label uppercased by CSS, `<dd>` value) → `.project-description` > `.description` (unchanged markdown render) → closing rule (`border-bottom: 1px solid var(--rule)` on `.flip-out`).

- [ ] **Step 2: Slider options.** `loop: false`, `slides: { perView: 4, spacing: 12 }`, breakpoints `"(max-width: 1119px)": { slides: { perView: 3, spacing: 12 } }`, `"(max-width: 767px)": { slides: { perView: 1.2, spacing: 12 } }`. Keep the `created/slideChanged/animationEnded` video sync. Add an `updateControls(s)` called from `created`, `slideChanged` and `optionsChanged`: `controls.hidden = !shouldShowSliderControls(s.slides.length, perView)` where `perView` is the numeric `s.options.slides.perView`; count = `${s.track.details.rel + 1} / ${s.slides.length}`; prev/next `disabled` at the ends. Prev/next click handlers keep `e.stopPropagation()`.

- [ ] **Step 3: `ImageSlide.astro` sizes** → `"(max-width: 767px) 80vw, (max-width: 1119px) 33vw, 25vw"`.

- [ ] **Step 4: Styles.**
  - `.flip-out` open grid: `grid-template-columns: var(--list-columns); column-gap: 16px;` gallery and controls span all columns (`1 / -1`); gallery top margin 18px; `.slider-controls` right-aligned, 12px muted text, buttons `all: unset; cursor: pointer`, disabled at 0.3 opacity.
  - `.facts`: columns 1–2 (Year+Client), label/value two-column grid (`5rem 1fr`), labels 11px uppercase `letter-spacing: 0.06em` `--text-muted`, values 13px ink, line-height 18px.
  - `.project-description`: columns 3–5, 14px ink, line-height 1.45, `max-width: 60ch`, no centering/padding from the old rule.
  - Description links (set:html content needs `:global`): `.description :global(a) { font-family: PowerGrotesk-Medium; }` and `.description :global(a)::after { content: " ↗"; }`. Do not touch the YAML's inline `style` attribute.
  - Tablet and mobile: facts and description stack full-width (facts first), 24px gap.
  - Keep the open/close `max-height` transition (0.5s); raise `max-height` so long descriptions plus facts are not clipped (e.g. 1600px).
  - Keep the slider's z-index below the mobile nav.

- [ ] **Step 5: Verify in the browser.**
  - Open Xylopedia at 1440: band stays while open (also after moving the mouse away), toggle shows `–`, four images in view, `← 1 / 6 →` right-aligned under the gallery, facts CLIENT/ROLE/TOOLS/WITH left, description right, "Visit Xylopedia ↗" in Medium, a hairline closes the block.
  - Open UZH Blender Course (3 media): no controls (Review Focus 5). Open Freedom: its mid-sentence link gets Medium + `↗` in place.
  - Click a gallery image → PhotoSwipe opens at the right image; its last slide still shows the credits table.
  - 375 wide: one image plus a peek of the next, swipe works, facts then description, nothing hidden under the nav.
  - Video project (Game Design 101): inline video plays only while its slide is visible and the row is open.

- [ ] **Step 6: Run** `npm run check && npm run lint && npm test` → clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/list/ProjectList.astro src/components/list/ImageSlide.astro
git commit -m "feat(list): quiet open block with slider counter, facts and inline link style"
```

---

### Task 5: Cursor-following preview

**Files:**
- Create: `src/components/list/preview.ts`
- Modify: `src/components/list/ProjectList.astro` (frontmatter, `.ListElement` attributes, preview element, a script hook)

**Interfaces:**
- Consumes: `pickPreviewSrc`, `placePreview` (Task 2); `getProjectMedia` (`./utils.ts`); `resolveLocalImage` (`../images/localImages.ts`); `.ListElement.open` (Task 3).
- Produces: `initListPreview(list: HTMLElement): () => void` — returns a cleanup function.

- [ ] **Step 1: Data.** In the frontmatter loop, `const path = pickPreviewSrc(media)`; when not null, `const img = await getImage({ src: resolveLocalImage(path), width: 440 })` (`astro:assets`). Put `data-preview-src={img.src}`, `data-preview-width`, `data-preview-height` (from the source `ImageMetadata`) on `.ListElement`. Inside `#list-wrapper` render one `<img class="list-preview" alt="" aria-hidden="true" hidden />`.

- [ ] **Step 2: Implement `initListPreview(list)`** in `preview.ts`:
  - Return a no-op cleanup unless `matchMedia("(hover: hover) and (pointer: fine)").matches`.
  - On `pointermove` over `list`: find `closest(".ListElement")`; hide if none, if it has class `open`, or if it has no `data-preview-src`; otherwise set `src` when it changed (instant swap), compute display size `220 × 220·h/w`, and on the next animation frame position with `transform: translate3d(x, y, 0)` from `placePreview({x: clientX, y: clientY}, size, {width: innerWidth, height: innerHeight})`. One pending rAF at a time.
  - On `pointerleave` of `list`, and on `click` (a row just opened), hide.
  - On the first `pointerenter` of `list`, preload every `data-preview-src` with `new Image()`.
  - No transitions or easing on position (this also satisfies `prefers-reduced-motion`).
  - Cleanup removes all listeners, cancels a pending rAF and hides the image.

- [ ] **Step 3: Styles.** `.list-preview { position: fixed; top: 0; left: 0; width: 220px; height: auto; pointer-events: none; z-index: 10; }` plus `display: none` under `@media (hover: none), (pointer: coarse)`.

- [ ] **Step 4: Wire it.** In the Keen Slider script: on `astro:page-load` call `initListPreview(document.getElementById("list-wrapper"))` when present and keep the cleanup; call it on `astro:before-swap`.

- [ ] **Step 5: Run** `npm run check && npm run lint && npm test && npm run build` → clean; the build output must contain the 440px preview variants.

- [ ] **Step 6: Verify in the browser.**
  - 1440: hover Gjermundbu → helmet image ~220px wide, top-left 20px right / 14px below the cursor, follows without lag; moving to another row swaps instantly; leaving the list hides it; open Xylopedia and hover it → no preview; pointer near the right edge → preview flips left of the cursor.
  - Navigate Index → Info → Index via the nav, then hover: exactly one `.list-preview` in the DOM (`document.querySelectorAll(".list-preview").length === 1`) and it works (Review Focus 3).
  - Mobile emulation (375, touch): no preview ever appears.

- [ ] **Step 7: Commit**

```bash
git add src/components/list/preview.ts src/components/list/ProjectList.astro
git commit -m "feat(list): cursor-following preview image on hover"
```

---

### Task 6: Docs and final checks

**Files:**
- Modify: `docs/galleries.md` ("Project List Gallery" section)

- [ ] **Step 1: Update `docs/galleries.md`.** Describe: row structure (`button.row-bar`, `aria-expanded`, `.open`), the inverted band (hover only under `(hover: hover)`, focus and open everywhere), slider options (`loop: false`, 4 / 3 / 1.2 per view, controls hidden when everything fits), facts from `getProjectFacts`, description links restyled via CSS only, credits only on the PhotoSwipe info slide, and the preview rule (first image in gallery order, else video poster; 440px variant; pointer devices only). Mention `npm test` and `tests/list/`.

- [ ] **Step 2: Run** `npm run check && npm run lint && npm test && npm run build` → all clean.

- [ ] **Step 3: Commit**

```bash
git add docs/galleries.md
git commit -m "docs(galleries): describe the redesigned project index list"
```
