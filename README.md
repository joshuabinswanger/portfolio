# Rhizome Visuals — Portfolio

Personal portfolio of Joshua Binswanger, scientific illustrator and 3D designer. Live at [rhizome.ch](https://rhizome.ch).

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Astro 5](https://astro.build) |
| Gallery Slider | [Keen Slider](https://keen-slider.io) |
| Lightbox | [PhotoSwipe 5](https://photoswipe.com) |
| Media CDN | [Cloudinary](https://cloudinary.com) via `astro-cloudinary` |
| Styling | PostCSS (nesting, preset-env, autoprefixer) |
| Language | TypeScript |
| Analytics | [Umami](https://umami.is) (self-hosted, privacy-first) |
| Fonts | PowerGrotesk (Light / Regular / Medium) |

---

## Project Structure

```
src/
├── assets/          # Local images and static assets
├── components/
│   ├── gallery/     # Portfolio grid and gallery elements
│   ├── projects/    # Project-specific components
│   ├── nav/         # Navigation bars (desktop & mobile)
│   └── brackets/    # Decorative SVG bracket components
├── layouts/         # Main layout, grid layout, text wrappers
├── pages/           # Astro routes (index, info, project-index)
└── styles/          # Global CSS with custom media query breakpoints
```

---

## What Makes the Design Special

### Asymmetric Masonry Grid
The portfolio homepage uses a hand-crafted CSS Grid layout. Rather than an auto-flow masonry grid, each project is manually positioned with `grid-column-start` and `grid-row-start` across four responsive breakpoints (mobile, tablet, desktop, desktop-wide). This creates an intentional, editorial rhythm — alternating between left and right columns with staggered row offsets — that feels closer to print layout than a typical web gallery.

### PhotoSwipe Lightbox with Project Info Slides
The gallery lightbox is not just a standard image viewer. Each gallery is enriched with custom data slides:
1. A project title slide (injected before the images)
2. The image set with per-image captions and optional external links
3. A project description + details slide (injected after the images)

This turns the lightbox into a mini project presentation.

---

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

Images and videos are served from Cloudinary. The `astro-cloudinary` integration handles optimised delivery (WebP/AVIF, responsive sizes) without storing media in the repository.
