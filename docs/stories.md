# Project Stories

A **story** is a smooth-scrolling narrative page for one project. Page order
is fixed: **title + short description** (header), then the ordered list of
blocks (usually a `scrolly` sequence first), then the **project facts and
links** (footer). Prototype status (2026-10): one story exists,
`/projects/structure-of-wood`, and nothing links to story pages yet.

## Main files

- `src/content/stories/*.yaml` — one file per story; the file name is the URL
  slug (`structure-of-wood.yaml` → `/projects/structure-of-wood`). Files
  starting with `_` are ignored.
- `src/content.config.ts` — `stories` collection; `storyBlockSchema` is the
  discriminated union of block types (exported as `StoryBlock`).
- `src/pages/projects/[slug].astro` — static route, one page per entry.
- `src/components/story/Story.astro` — header, block renderer, facts footer
  and all styles.
- `src/components/story/StoryImage.astro` — local asset → responsive `<Picture>`
  (avif/webp, `widths` 480–1600) with optional caption.
- `src/components/story/scroll.ts` — Lenis smooth scroll, reveal-on-scroll,
  sticky-step activation and scrolly frame switching; torn down on
  `astro:before-swap`.

## Story file

```yaml
project: StructureOfWood   # matches metadata.project / projectName elsewhere
title: Structure of Wood
subtitle: ...              # optional; small line under the title
summary: ...               # optional; the short description under the title,
                           # also used as the meta description
# Facts — all optional, shown at the end in this order (Project = title):
year: "2019"               # string, like the other collections
context: BA Diploma
client: ...
role: ...
tools: ...
collaborators: ...
links:                     # listed after the facts, open in a new tab
  - label: Publication
    url: https://...
draft: false               # true → page still builds but gets <meta robots noindex>
blocks: [...]
```

The footer renders the facts as ruled rows (`[ LABEL ]` left, value right;
stacked on mobile), then the links, then a square "All projects" button.

Images are **local assets** (`/src/assets/projects/...`), resolved with
`resolveLocalImage` — same rule as the `images` collection. Note the asset
files keep their old Cloudinary suffix (`..._Gallery_1_ytvxjm.webp`); use the real
file name. Text fields marked *markdown* are rendered with `marked`.

## Block types

| `type` | Fields | Renders as |
| --- | --- | --- |
| `hero` | `image`, `kicker?` | Full-column opener; kicker is a small square frosted label in the corner. |
| `text` | `body` (md), `heading?`, `align?` (`left`/`center`) | 640px prose column. |
| `image` | `image`, `size?` (`full`/`wide`/`narrow`) | One image; `narrow` = 640px, others fill the column. |
| `split` | `image`, `body` (md), `heading?`, `imageSide?` (`left`/`right`) | Image beside text; stacks on mobile. |
| `gallery` | `images[]`, `columns?` (2–4) | Grid; 2 columns on mobile. |
| `scrolly` | `steps[]` (`image?`, `heading?`, `body` md, `position?` `left`/`right`/`center`) | **Classic scrollytelling.** A full-height stage pins to the viewport and the steps' text cards (square, near-opaque paper over a heavy 40px blur, small shadow) scroll up over it. Each step's `image` cross-fades in when its card crosses the middle of the screen; a step without `image` keeps the previous one. The first step must have an image. Images are fitted with `contain`, never cropped. |
| `sticky` | `image`, `steps[]` (`heading?`, `body` md) | Side-by-side variant: Image pins (`position: sticky`) while the steps scroll past; the step nearest the viewport centre gets `.is-active` (others dim). On mobile the image pins to the top. |
| `quote` | `text`, `source?` | Centred pull quote in brackets. |

An `image` object is `{ src, alt, caption? }`.

Blocks are deliberately flat objects with a `type` discriminator, so a story
is rewritten or reordered by editing its YAML alone. Add a new block type by
extending `storyBlockSchema` and adding a `case` in `Story.astro`.

## Motion

- `scroll.ts` creates one Lenis instance per page visit and drives it from a
  `requestAnimationFrame` loop; both are destroyed on `astro:before-swap`, so
  View Transitions never double-init (the issue the `/fire` prototype has).
- Every `[data-reveal]` block fades/slides in once via IntersectionObserver.
- `scrolly` blocks: an IntersectionObserver with a zero-height band at the
  viewport centre (`rootMargin: -50% 0px -50% 0px`) sets `.is-active` on the
  stage frame named by the step's `data-frame`; frames cross-fade with a CSS
  opacity transition. The step list is pulled over the stage with
  `margin-top: -100svh`, with spacers before (55svh) and after (45svh) so the
  first and last pictures get a moment alone.
- Under `prefers-reduced-motion: reduce` Lenis is skipped, reveals are shown
  immediately, and inactive sticky steps only dim.
- No GSAP/ScrollTrigger; pinning is CSS `position: sticky`, so the block
  degrades to a plain stack if sticky is unavailable.

## Not in the prototype

- Video blocks (Mux). `MediaElement.astro` already renders Mux players; a
  `video` block would reuse it.
- Links from the project index / homepage to story pages.
- Per-story accent colour (`bgcolor` exists on `projects` entries).
