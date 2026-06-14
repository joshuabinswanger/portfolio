# Image Optimization

Images come from two places: local Astro assets and Cloudinary. The rendering path depends on which gallery/view owns the image.

## Main Files

- `src/components/images/localImages.ts`: resolves local assets under `src/assets/projects`.
- `src/components/media/MediaElement.astro`: renders local images with Astro `Picture`.
- `src/components/list/ImageSlide.astro`: renders Cloudinary project-list images with `CldImage`.
- `src/content.config.ts`: defines Cloudinary and local image content collections.
- `astro.config.mjs`: sets `assetsInlineLimit: 0` so assets are emitted as files instead of being inlined.

## Local Images

Local image YAML entries live in `src/content/images`.

```yaml
src: /src/assets/projects/example/example.webp
width: 2000
height: 1200
metadata:
  project: exampleproject
  showInPortfolioGallery: "yes"
  portfolioOrder: 1
  showInProjectGallery: "no"
  projectGalleryOrder: null
  showInIndex: "yes"
```

`MediaElement.astro` resolves local image paths with `resolveLocalImage()` and renders them with:

```astro
<Picture formats={["avif", "webp"]} />
```

This lets Astro generate responsive optimized output.

## Cloudinary Images

Cloudinary images are loaded through `astro-cloudinary` collections:

- `galleryImages`: `Portfolio/Gallery`
- `highResImages`: `Portfolio/HighRes`

Project-list slides render Cloudinary images with `CldImage`.

## High-Resolution Lightbox Images

Cloudinary gallery images can point to high-resolution versions through:

```yaml
metadata:
  highres_public_id: cloudinary_public_id
```

When present, the project-list lightbox uses the high-resolution asset dimensions and URL. Otherwise it falls back to the base gallery image.

Local image support for high-resolution lightbox data exists in `gallery/utils.ts`, but the `GalleryElement.astro` markup currently keeps that path commented as a TODO.

## Width And Height Rules

Always set real `width` and `height` in YAML. These values are used for:

- Astro image optimization.
- PhotoSwipe aspect ratio and sizing.
- Mux video aspect ratio in the lightbox.
- Preventing layout shifts.

If images appear too large, check:

- `MediaElement.astro` image CSS.
- `GalleryElement.astro` `.ImageElement` CSS.
- The YAML `width` and `height`.
- The `sizes` prop passed to `MediaElement`.

## Archive Square Thumbnails

Archive thumbnails are forced into a 1:1 grid and cropped to fill, instead of
being uploaded as pre-cropped squares (the previous Cloudinary `g_auto`
approach). Since archive images are local Astro assets, cropping happens in CSS.

Owned by `src/components/archive/ArchiveGalleryElement.astro`:

- `#Image` sets `aspect-ratio: 1` — the cell is always square.
- `picture { display: block; width: 100%; height: 100% }` — the Astro `<Picture>`
  wrapper is inline/shrink-wrapped by default, so without this the `<img>`'s
  `width/height: 100%` resolves against an unsized box and the crop never
  happens. This rule is required for the square crop to take effect.
- `img { object-fit: cover }` — fills the square, cropping the overflow.

### Focal Point (`focus`)

By default images crop from the center. To control where the crop centers,
add an optional `focus` field to the image's YAML metadata
(`src/content/images`, `localImageMetadataSchema` in `src/content.config.ts`):

```yaml
metadata:
  focus: "70% 30%" # x% y% — maps directly to CSS object-position
```

The value is passed straight through to `object-position` on the `<img>`;
omit it for a centered crop. Accepts any `object-position` syntax
(`"top"`, `"left 25%"`, `"50% 50%"`, etc.). This is per-image and manual — it is
not automatic saliency detection. Only set it on images where the center crop
cuts off the important part.

## Verification

Run:

```bash
npx astro check
npm run build
```

Browser checks:

- Images do not overflow gallery columns.
- PhotoSwipe opens with the correct aspect ratio.
- Local image paths resolve case-insensitively but still start with `/src/assets/`.
- Project-list Cloudinary images still load after changing gallery logic.
