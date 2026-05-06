# Galleries

The portfolio has several gallery surfaces. They share concepts, but they do not all read media from the same source.

## Main Files

- `src/components/gallery/PortfolioGallery.astro`: homepage gallery grid, Keen Slider setup, PhotoSwipe data source.
- `src/components/gallery/GalleryElement.astro`: one homepage gallery instance.
- `src/components/gallery/utils.ts`: portfolio gallery data loading, ordering, high-resolution lookup.
- `src/components/list/ProjectList.astro`: expandable project list and project-list PhotoSwipe.
- `src/components/list/ImageSlide.astro`: project-list media slides.
- `src/components/archive/ArchiveGallery_BoxFilters.astro`: archive/filter gallery.
- `src/components/archive/utils.ts`: archive-safe image filtering.

## Homepage Portfolio Gallery

Data flow:

1. `src/content/portfolio/*.yaml` defines portfolio groups.
2. Each group lists `portfolioElementProjects`.
3. `src/components/gallery/utils.ts` fetches matching entries from `src/content/images`.
4. Entries are filtered by `metadata.showInPortfolioGallery === "yes"`.
5. Entries are sorted by `metadata.portfolioOrder`.
6. `GalleryElement.astro` renders each entry through `MediaElement.astro`.

Each homepage gallery also gets custom PhotoSwipe slides:

- project title slide before media
- image/video media slides
- project info/details slide after media

Because those custom slides count as PhotoSwipe slides, `startIndex` and `slidesCount` must stay correct.

## Project List Gallery

The project-list view combines two media systems:

- Cloudinary images from the `galleryImages` content collection.
- Local Mux videos from the `images` content collection where `mediaType: video` and `showInProjectGallery: "yes"`.

Both are sorted by `metadata.projectGalleryOrder`.

Cloudinary images render with `CldImage`. Mux videos render with `MediaElement`.

## Archive Gallery

The archive is image-only. Video entries are filtered out so archive views do not try to render Mux videos as static images.

## Sorting Fields

Use these fields in `src/content/images/*.yaml`:

```yaml
metadata:
  showInPortfolioGallery: "yes"
  portfolioOrder: 0
  showInProjectGallery: "yes"
  projectGalleryOrder: 0
  showInIndex: "no"
```

Guidelines:

- `portfolioOrder` controls homepage gallery order.
- `projectGalleryOrder` controls project-list gallery order.
- Set a missing order only when the item truly belongs at the end.
- To replace a homepage image with a video only on the homepage, set the original image's `showInPortfolioGallery` to `"no"` and leave its other flags unchanged.

## Slider Playback

Homepage galleries play only the active visible video slide.

Project-list galleries can show multiple slides per view, so visible autoplay videos may run while hidden/offscreen ones are paused.

PhotoSwipe pauses inline previews while open, then emits an internal close event so visible previews can resume.

## Change Checklist

When changing gallery behavior:

- Check both `PortfolioGallery.astro` and `ProjectList.astro`.
- Confirm `startIndex` and `slidesCount` still match PhotoSwipe data.
- Keep image and video entries working together.
- Preserve sorting by `portfolioOrder` and `projectGalleryOrder`.
- Run `npx astro check` and `npm run build`.
