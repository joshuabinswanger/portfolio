# Rhizome Visuals Portfolio

Personal portfolio of Joshua Binswanger, scientific illustrator and 3D designer.

Live site: [rhizome.ch](https://rhizome.ch)

## Stack

- Astro
- TypeScript
- PostCSS
- Keen Slider
- PhotoSwipe
- Cloudinary via `astro-cloudinary`
- Mux via `@mux/mux-video` and `@mux/mux-player`

## Development

```bash
npm run dev
npm run build
npm run preview
```

Useful checks:

```bash
npx astro check
npm run build
```

## Documentation

Problem-specific docs live in [docs](./docs/README.md):

- [Video Player](./docs/video-player.md)
- [Galleries](./docs/galleries.md)
- [Image Optimization](./docs/image-optimization.md)
- [Content YAML](./docs/content-yaml.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Key Paths

- `src/content`: YAML content collections
- `src/content/images`: local image and Mux video entries
- `src/assets/projects`: local project media assets
- `src/components/gallery`: homepage gallery system
- `src/components/list`: project-list gallery system
- `src/components/media`: shared image/video rendering
- `src/styles`: global CSS and breakpoints
