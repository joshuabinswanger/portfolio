# Portfolio (rhizome.ch)

Personal portfolio of Joshua Binswanger (Rhizome Visuals). Astro 6 static site,
TypeScript, PostCSS (preset-env + nesting, no Tailwind). Content comes from
YAML collections plus two remote Cloudinary collections loaded at build time.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (needs Cloudinary credentials in `.env` and network)
- `npm run check` — `astro check` typecheck (keep at 0 errors/warnings/hints)
- `npm run lint` / `npm run format` — ESLint / Prettier

## Read the docs first

`docs/` has per-system notes. Before touching galleries, video playback,
image handling, or content YAML, read the matching file:
[galleries](docs/galleries.md), [video-player](docs/video-player.md),
[image-optimization](docs/image-optimization.md), [content-yaml](docs/content-yaml.md),
[troubleshooting](docs/troubleshooting.md).

## Layout

- `src/pages` — routes: `index` (homepage gallery), `project-index`, `info`,
  `fire`, `nzz-bewerbung`; `personal/` is a parallel variant of the site.
- `src/components/gallery` — homepage gallery (keen-slider + PhotoSwipe).
  Shared PhotoSwipe helpers live here: `photoswipeCaption.ts`, `photoswipeVideo.ts`.
- `src/components/list` — project-list gallery; `archive` — filterable archive
  (MixItUp); `media` — shared image/video rendering incl. Mux.
- `src/content.config.ts` — zod schemas for all collections.
- `scripts/` — Node maintenance scripts for Cloudinary/YAML upkeep.

## Conventions

- UI is `.astro` components; client logic in plain `.ts` helpers colocated per
  system (`gallery/utils.ts`, `list/utils.ts`, `archive/utils.ts`).
- Relative import paths only (no path aliases).
- YAML visibility flags are string enums `"yes"`/`"no"`, not booleans.
- Content YAML files starting with `_` are excluded from the `images`/`portfolio`
  collections.
- Cloudinary-sourced schemas use `z.looseObject`; local YAML schemas are strict.
- Env: `PUBLIC_MUX_ENV_KEY` (client, Mux metrics) and Cloudinary credentials
  (build-time loaders) live in `.env`.
