# Content YAML

The site is driven by Astro content collections. Most presentation issues can be traced back to which collection a YAML file belongs to and which metadata flags are set.

## Main Collections

Defined in `src/content.config.ts`:

- `portfolio`: homepage portfolio groups from `src/content/portfolio`.
- `projects`: individual project entries from `src/content/projects`.
- `images`: local image and Mux video entries from `src/content/images`.
- `links`: external links from `src/content/links`.
- `galleryImages`: Cloudinary gallery images from `Portfolio/Gallery`.
- `highResImages`: Cloudinary high-resolution images from `Portfolio/HighRes`.

## Portfolio Entries

Portfolio entries group one or more project names for the homepage gallery.

Important fields:

```yaml
portfolioElementProjects:
  - GameDesign101
portfolioElementName: GameDesign101
priority: 1
title: Games Design 101
subtitle: ...
portfolio: true
```

`priority` controls homepage group ordering.

`portfolioElementProjects` must match `metadata.project` values from image/video entries.

## Project Entries

Project entries power project details and the project list.

Important fields:

```yaml
projectName: GameDesign101
title: Games Design 101
year: "2026"
tags: []
projectDescription: ...
credits: ...
```

`projectName` must match Cloudinary metadata and local video/image metadata when the media should appear in that project.

## Local Image Entries

Local image entries live in `src/content/images` and use local files under `src/assets/projects`.

```yaml
src: /src/assets/projects/GameDesign101/example.webp
width: 1500
height: 1500
metadata:
  project: GameDesign101
  description_title: Example
  description_text: Caption text
  showInPortfolioGallery: "yes"
  portfolioOrder: 1
  showInProjectGallery: "no"
  projectGalleryOrder: null
  showInIndex: "yes"
```

`mediaType: image` is optional for existing image entries.

## Mux Video Entries

Mux videos are also stored in `src/content/images`.

```yaml
mediaType: video
posterSrc: /src/assets/projects/GameDesign101/poster.webp
width: 1500
height: 1500
video:
  provider: mux
  playbackId: playback_id
  autoplay: true
  loop: true
  muted: true
  controls: false
  maxResolution: 1080p
metadata:
  project: GameDesign101
  showInPortfolioGallery: "yes"
  portfolioOrder: 0
  showInProjectGallery: "no"
  showInIndex: "no"
```

## Visibility Flags

Use these flags deliberately:

- `showInPortfolioGallery`: homepage portfolio gallery.
- `showInProjectGallery`: project-list expandable gallery.
- `showInIndex`: archive/index views.

Example: replacing the first homepage image with a video only on the homepage:

1. Add a video entry with the same `metadata.project`.
2. Give it the desired `portfolioOrder`.
3. Set the original image's `showInPortfolioGallery` to `"no"`.
4. Leave the original image's `showInProjectGallery` and `showInIndex` as they were.

## Validation

Run:

```bash
npx astro check
```

Common schema failures:

- Missing `width` or `height`.
- `showIn...` field is not exactly `"yes"` or `"no"`.
- Video entry uses an asset ID instead of a playback ID.
- Local image path does not start with `/src/assets/`.
