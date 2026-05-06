# Video Player

This portfolio uses Mux for videos. Videos are defined as entries in `src/content/images` and are rendered through shared media components so they can appear beside normal images.

## Main Files

- `src/content.config.ts`: validates image and video YAML entries.
- `src/components/media/MediaElement.astro`: renders either a local image or a Mux preview.
- `src/components/media/mux.ts`: derives Mux URLs and type guards.
- `src/components/gallery/PortfolioGallery.astro`: homepage gallery slider and PhotoSwipe video handling.
- `src/components/list/ProjectList.astro`: project-list slider and PhotoSwipe video handling.

## YAML Shape

Use the Mux playback ID, not the asset ID.

```yaml
mediaType: video
posterSrc: /src/assets/projects/example/video-poster.webp
width: 1920
height: 1080
tags: []
video:
  provider: mux
  playbackId: your_mux_playback_id
  autoplay: true
  loop: true
  muted: true
  controls: false
  maxResolution: 1080p
metadata:
  project: exampleproject
  description_title: Example Video
  description_text: Short caption text
  showInPortfolioGallery: "yes"
  portfolioOrder: 1
  showInProjectGallery: "yes"
  projectGalleryOrder: 1
  showInIndex: "no"
```

The HLS URL is derived in code:

```text
https://stream.mux.com/{playbackId}.m3u8
```

## Playback Behavior

Inline videos are lightweight previews:

- They render with `<mux-video>`.
- They are muted and play inline.
- They play when their gallery/list item is visible.
- They pause when their gallery/list item leaves the viewport.
- They pause while PhotoSwipe is open.
- Visible previews resume when PhotoSwipe closes.

`video.autoplay` controls this preview behavior:

- `true`: preview can start/resume automatically when visible.
- `false`: preview stays paused unless a controlled player starts it.

## PhotoSwipe Behavior

PhotoSwipe uses custom HTML slides for videos.

- `video.controls: false` renders a UI-less `<mux-video>`.
- `video.controls: true` renders `<mux-player>` with player controls.
- Slide changes pause all videos, then restart the active PhotoSwipe video if it has `autoplay`.
- Closing/destroying PhotoSwipe pauses the lightbox video and allows visible inline previews to resume.

## Environment

Mux environment values are read from `.env` through public Astro variables:

```env
PUBLIC_MUX_ENV_ID=...
PUBLIC_MUX_ENV_KEY=...
```

Do not commit real secret values. Values in `.env` are local-only.

## Verification

Run:

```bash
npx astro check
npm run build
```

Browser checks:

- The video preview plays when visible on the homepage gallery.
- The preview pauses when swiped away or scrolled out of view.
- Opening PhotoSwipe pauses the inline preview.
- `controls: false` shows no Mux UI in PhotoSwipe.
- `controls: true` shows the full Mux player UI.
