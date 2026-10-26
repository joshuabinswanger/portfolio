# Portfolio (rhizome.ch)

Personal portfolio of Joshua Binswanger (Rhizome Visuals). Astro 6 static site,
TypeScript, PostCSS (preset-env + nesting, no Tailwind). Content comes from
YAML collections and local assets; no remote image service (Cloudinary was removed
2026-10-26). Videos are Mux streams or local MP4s in `public/videos`.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (no credentials needed)
- `npm run check` — `astro check` typecheck (keep at 0 errors/warnings/hints)
- `npm run lint` / `npm run format` — ESLint / Prettier

## Read the docs first

`docs/` has per-system notes. Before touching galleries, the archive
filter/sort UI, project story pages, video playback, image handling, content
YAML, or head metadata/SEO, read the matching file: [galleries](docs/galleries.md),
[archive-filters](docs/archive-filters.md), [stories](docs/stories.md),
[video-player](docs/video-player.md), [image-optimization](docs/image-optimization.md),
[content-yaml](docs/content-yaml.md), [seo](docs/seo.md),
[troubleshooting](docs/troubleshooting.md).

## Layout

- `src/pages` — routes: `index` (homepage gallery), `project-index`, `info`,
  `projects/[slug]` (block-based story pages), `fire`, `nzz-bewerbung`;
  `personal/` is a parallel variant of the site.
- `src/components/gallery` — homepage gallery (keen-slider + PhotoSwipe).
  Shared PhotoSwipe helpers live here: `photoswipeCaption.ts`, `photoswipeVideo.ts`.
- `src/components/list` — project-list gallery; `archive` — filterable archive
  (MixItUp); `story` — project story pages (Lenis + reveal); `media` — shared
  image/video rendering incl. Mux.
- `src/components/nav` — desktop + mobile nav (mobile is a floating pill; its
  geometry tokens `--mobile-nav-*` / `--surface-*` live in `src/styles/global.css`
  and are shared with the archive toolbar).
- `src/content.config.ts` — zod schemas for all collections.
- `scripts/` — Node maintenance scripts for YAML upkeep.

## Conventions

- UI is `.astro` components; client logic in plain `.ts` helpers colocated per
  system (`gallery/utils.ts`, `list/utils.ts`, `archive/utils.ts`).
- Relative import paths only (no path aliases).
- YAML visibility flags are string enums `"yes"`/`"no"`, not booleans.
- Content YAML files starting with `_` are excluded from the `images`/`portfolio`
  collections.
- Env: `PUBLIC_MUX_ENV_KEY` (client, Mux metrics) lives in `.env`.
