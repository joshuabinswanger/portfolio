# Troubleshooting

Use this file for recurring fixes and quick diagnostics.

## Video Shows Player UI When It Should Not

Check the video YAML:

```yaml
video:
  controls: false
```

Expected behavior:

- `controls: false`: PhotoSwipe uses UI-less `<mux-video>`.
- `controls: true`: PhotoSwipe uses `<mux-player>` with controls.

If controls still show after a code change, restart the dev server so Vite re-optimizes the Mux packages.

## Video Does Not Resume

Check:

- `video.autoplay` is `true`.
- The gallery/list item is in the viewport.
- PhotoSwipe is closed.
- The browser tab is visible.
- The video is muted. Browser autoplay policies usually require muted playback.

## PhotoSwipe Opens The Wrong Slide

PhotoSwipe indexes include custom slides:

- one project title slide before media
- all media slides
- one project info slide after media

If the wrong slide opens, inspect:

- `startIndex`
- `slidesCount`
- gallery data source length
- custom title/info slides

Relevant files:

- `src/components/gallery/PortfolioGallery.astro`
- `src/components/gallery/GalleryElement.astro`
- `src/components/list/ProjectList.astro`
- `src/components/list/ImageSlide.astro`

## Images Are Too Large

Check:

- `MediaElement.astro` CSS for image/video constraints.
- `GalleryElement.astro` `.ImageElement` rules.
- The `sizes` prop passed to `MediaElement`.
- YAML `width` and `height`.

Then run:

```bash
npx astro check
npm run build
```

## Local Image Cannot Be Found

Local image entries must use paths like:

```yaml
src: /src/assets/projects/example/example.webp
```

The path must start with `/src/assets/`. `resolveLocalImage()` also keeps a lowercase lookup fallback, but the best fix is still to match the real file path.

## Cloudinary Data Missing

Cloudinary content collections depend on environment variables and network access.

Relevant collections:

- `galleryImages`
- `highResImages`

If Cloudinary metadata is missing, check the asset metadata in Cloudinary and verify that `metadata.project`, ordering fields, and `highres_public_id` are present where expected.

## Standard Verification Commands

```bash
npx astro check
npm run build
```
