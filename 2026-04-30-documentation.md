# 2026-04-30 Change Summary

## Astro 6.2 Content Config

- Migrated `src/content.config.ts` to the Astro 6-compatible content config shape.
- Replaced deprecated schema imports with `astro/zod`.
- Updated permissive Cloudinary schemas to use `z.looseObject(...)` instead of deprecated passthrough patterns.
- Fixed JSON schema generation warnings for the content collections:
  - `galleryImages`
  - `highResImages`
  - `images`
  - `links`
  - `portfolio`
  - `projects`

## Typecheck And Hint Cleanup

- Brought `astro check` to a clean state: 0 errors, 0 warnings, 0 hints.
- Removed unused imports, unused props, stale local variables, and empty script blocks across gallery, archive, nav, list, layout, and page files.
- Added small type annotations for DOM helpers, PhotoSwipe callbacks, Keen Slider callbacks, and GSAP helper functions.
- Added local vendor declarations in `src/types/vendor.d.ts` for third-party packages without bundled type declarations.

## Gallery And PhotoSwipe Cleanup

- Extracted repeated PhotoSwipe caption registration into `src/components/gallery/photoswipeCaption.ts`.
- Reused the shared caption helper in:
  - `PortfolioGallery.astro`
  - `ProjectList.astro`
  - `ArchiveGallery_BoxFilters.astro`
- Tightened PhotoSwipe option literal typing.
- Improved archive gallery PhotoSwipe click handling so handlers do not stack each time filters change.

## Archive Gallery Maintenance

- Slimmed `ArchiveGallery_BoxFilters.astro` by removing unused MixItUp query plumbing and unused callback arguments.
- Replaced broad helper logic with a focused archive container lookup.
- Added safer DOM guards for filter and reset controls.
- Typed active filter and PhotoSwipe data handling.

## Layout And Scrollbar Behavior

- Updated `src/layouts/Main.astro` so short pages no longer force a visible vertical scrollbar.
- Added `scrollbar-gutter: stable` globally on `html` to prevent layout shifts when long pages need a scrollbar.
- Set `html`, `body`, scrollbar track, and scrollbar corner backgrounds to `var(--bg-color)`.
- Added standard `scrollbar-color` support for browsers that use it.

## Verification

- `npx.cmd astro check` passes with 0 errors, 0 warnings, and 0 hints.
- `npm.cmd run build` completes successfully.
