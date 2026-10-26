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

The project-list view reads only the local `images` collection: every image
or Mux video whose `metadata.project` equals the project's `projectName` and
whose `showInProjectGallery` is `"yes"`, sorted by `metadata.projectGalleryOrder`
(missing order sorts last). `getProjectMedia()` in `src/components/list/utils.ts`
is the single source for both the slide count (`ProjectList.astro`, used for
PhotoSwipe indices) and the slides themselves (`ImageSlide.astro`), which
render through the shared `MediaElement`.

Until 2026-10 the images came from the Cloudinary `galleryImages` collection
and the `showInProjectGallery` flag was ignored for images. The local YAML was
already a mirror, so the switch kept every project's images and order; four
entries that were displayed despite a `"no"` flag were set to `"yes"`.

### Rows

Each project in `src/components/list/ProjectList.astro` is a `.ListElement`
(`id` = project name) that holds one `button.row-bar`. The button is the whole
clickable row: year, client, title, role and a `+` / `–` toggle. Its
`aria-expanded` and `aria-controls` point at the panel `#<projectName>-panel`.

- Opening a row adds `open` to `.ListElement` and sets `aria-expanded="true"`.
- Closed `.flip-out` panels carry `inert`, so they are skipped by Tab and
  hidden from assistive tech. The attribute is removed when the row opens.
- The client cell is hidden at the tablet and mobile breakpoints, and the role
  cell at mobile only.

The inverted band (ink background, background-coloured text) is set in the
component's `<style>`:

- It shows on open rows and on `:focus-visible` everywhere.
- It shows on hover only under `(hover: hover)`, so touch devices do not keep a
  sticky hover state.

### Slider

The first time a row opens, its `.project-images` container gets a Keen Slider
with `loop: false`, 4 slides per view, 3 below 1120px and 1.2 below 768px
(12px spacing). The slider is marked with `data-keen-slider-initialized` and
is reused on later opens.

- The `← n / N →` controls (`.slider-controls`) show only when there are more
  slides than fit in view. `shouldShowSliderControls()` in
  `src/components/list/listHelpers.ts` makes that decision. Prev and next
  disable at the ends.
- Control clicks stop propagation, so they do not toggle the row.

### Facts, description and credits

- `getProjectFacts()` in `src/components/list/listHelpers.ts` builds the
  `dl.facts` list from client, role, tools and collaborators (labelled "With").
  Blank values are dropped.
- The description is rendered from the project's markdown. Its links are
  restyled by CSS only (`.description a` uses PowerGrotesk-Medium and adds a
  trailing `↗`), so the markdown output stays unchanged.
- `credits` is passed as `data-project-credits` and appears only on the
  PhotoSwipe info slide (`.pswp__project-details`), not in the row panel.

### Hover preview

- Each project's `data-preview-src` is the 440px `getImage` variant of its first
  gallery image. If the project has no image, the first video's poster is used.
  `pickPreviewSrc()` in `listHelpers.ts` makes that choice. The intrinsic
  width and height are stored alongside it.
- `initListPreview()` in `src/components/list/preview.ts` drives a 220px
  `.list-preview` image that follows the pointer. `placePreview()` in
  `listHelpers.ts` flips it to the left of the pointer or pulls it back inside
  the viewport.
- The preview is hidden for open rows, on pointer leave and on click. The first
  pointer enter preloads every row's preview image once.
- JavaScript enables it only for `(hover: hover) and (pointer: fine)`. CSS also
  hides it on `(hover: none), (pointer: coarse)`.

### Tests

`npm test` runs `tests/**/*.test.ts` with Node's built-in test runner.
`tests/list/listHelpers.test.ts` covers the DOM-free helpers
(`formatListSummary`, `getProjectFacts`, `placePreview`, `pickPreviewSrc`,
`shouldShowSliderControls`). `listHelpers.ts` must not import from `astro:*`,
or the test runner cannot load it.

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
