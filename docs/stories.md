# Project Stories

A **story** is a smooth-scrolling narrative page for one project, built from an
ordered list of blocks. Prototype status (2026-10): one story exists,
`/projects/structure-of-wood`, and nothing links to story pages yet.

## Main files

- `src/content/stories/*.yaml` — one file per story; the file name is the URL
  slug (`structure-of-wood.yaml` → `/projects/structure-of-wood`). Files
  starting with `_` are ignored.
- `src/content.config.ts` — `stories` collection; `storyBlockSchema` is the
  discriminated union of block types (exported as `StoryBlock`).
- `src/pages/projects/[slug].astro` — static route, one page per entry.
- `src/components/story/Story.astro` — header + block renderer + all styles.
- `src/components/story/StoryImage.astro` — local asset → responsive `<Picture>`
  (avif/webp, `widths` 480–1600) with optional caption.
- `src/components/story/scroll.ts` — Lenis smooth scroll, reveal-on-scroll,
  sticky-step activation; torn down on `astro:before-swap`.

## Story file

```yaml
project: StructureOfWood   # matches metadata.project / projectName elsewhere
title: Structure of Wood
subtitle: ...              # optional
year: "2019"               # optional (string, like the other collections)
client: ...                # optional
role: ...                  # optional
tools: ...                 # optional
summary: ...               # optional; also used as the meta description
draft: false               # true → page still builds but gets <meta robots noindex>
blocks: [...]
```

Images are **local assets** (`/src/assets/projects/...`), resolved with
`resolveLocalImage` — same rule as the `images` collection. Note the asset
files keep their Cloudinary suffix (`..._Gallery_1_ytvxjm.webp`); use the real
file name. Text fields marked *markdown* are rendered with `marked`.

## Block types

| `type` | Fields | Renders as |
| --- | --- | --- |
| `hero` | `image`, `kicker?` | Full-column opener; kicker is a small pill in the corner. |
| `text` | `body` (md), `heading?`, `align?` (`left`/`center`) | 640px prose column. |
| `image` | `image`, `size?` (`full`/`wide`/`narrow`) | One image; `narrow` = 640px, others fill the column. |
| `split` | `image`, `body` (md), `heading?`, `imageSide?` (`left`/`right`) | Image beside text; stacks on mobile. |
| `gallery` | `images[]`, `columns?` (2–4) | Grid; 2 columns on mobile. |
| `sticky` | `image`, `steps[]` (`heading?`, `body` md) | **The storytelling block.** Image pins (`position: sticky`) while the steps scroll past; the step nearest the viewport centre gets `.is-active` (others dim). On mobile the image pins to the top. |
| `quote` | `text`, `source?` | Centred pull quote in brackets. |

An `image` object is `{ src, alt, caption? }`.

Blocks are deliberately flat, JSON-shaped objects with a `type` discriminator:
that is the contract a future admin editor would write to (see
[admin-editing-assessment](admin-editing-assessment.md)). Add a new block type
by extending `storyBlockSchema` and adding a `case` in `Story.astro`.

## Motion

- `scroll.ts` creates one Lenis instance per page visit and drives it from a
  `requestAnimationFrame` loop; both are destroyed on `astro:before-swap`, so
  View Transitions never double-init (the issue the `/fire` prototype has).
- Every `[data-reveal]` block fades/slides in once via IntersectionObserver.
- Under `prefers-reduced-motion: reduce` Lenis is skipped, reveals are shown
  immediately, and inactive sticky steps only dim.
- No GSAP/ScrollTrigger; pinning is CSS `position: sticky`, so the block
  degrades to a plain stack if sticky is unavailable.

## Not in the prototype

- Video blocks (Mux). `MediaElement.astro` already renders Mux players; a
  `video` block would reuse it.
- Links from the project index / homepage to story pages.
- Per-story accent colour (`bgcolor` exists on `projects` entries).
