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

## High-Res Image Missing In The Lightbox

The build logs `High-res image not found in src/assets/highres: <id>` when an
image YAML's `metadata.highres_public_id` has no matching file. Add the original
as `src/assets/highres/<id>.<ext>` or set the field to `null`.

## Bracket Lines Off The Bar Edge (iPhone)

The horizontal brackets (mobile navs and the gallery caption bar in
`GalleryElement.astro`) use `src/components/brackets/Bracket.astro`
(`kind="open" | "mid" | "close"`), a bordered box, not SVG. A `border-box` border always sits on the
cell edge and snaps to whole device pixels. The SVGs did not: in WebKit (every
iPhone browser) they grew the row to ~52px, and their bottom stroke hung 1px
below the bar. The bracket stretches to its grid row, so the row's height sets
the bracket height (the gallery bar pins it with `min-height: 56px`). The
vertical `Bracket*V` SVGs in the desktop nav are unchanged. Check changes in Playwright WebKit
with the iPhone 15 device profile, since Chromium does not show these bugs.

## Standard Verification Commands

```bash
npx astro check
npm run build
```
