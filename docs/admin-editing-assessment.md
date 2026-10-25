# Admin login & edit workspace — assessment (2026-10-25)

Goal: an authenticated workspace where Josh can edit projects, stories and
image metadata on the fly, while larger changes keep going through AI/code
sessions in git.

## What the site is today

- **Static** Astro build (`output: static`, no adapter, no server). Nothing at
  runtime can authenticate anyone or write a file.
- **Content lives in three places:**
  1. YAML in git — `src/content/{projects,portfolio,images,stories,links}`.
  2. Local assets in git — `src/assets/projects/**` (already the reason `.git`
     is ~386 MB).
  3. **Cloudinary** — the `galleryImages` / `highResImages` collections are
     pulled at build time from Cloudinary folders, and their metadata
     (`project`, `projectGalleryOrder`, `description_*`, …) is Cloudinary
     *contextual metadata*, not YAML.
- **Build needs secrets** (Cloudinary credentials in `.env`) and network.
- **No deploy pipeline in the repo** (no `.github/workflows`, no host config);
  builds are run locally and uploaded.

## The hurdles

1. **No backend.** A static host cannot host a login. Every option below adds
   one of: a git-based CMS that talks to GitHub from the browser (needs only a
   tiny OAuth proxy), a hosted CMS service, or SSR routes on a Node-capable host.
   Building our own auth + file-writing API on top of the current setup is the
   most work and the least safe option; don't.
2. **Build-on-save.** An edit is only live after `astro build` + upload.
   "On the fly" therefore means: commit → CI build (with the Cloudinary
   secrets) → deploy, ~2–4 min per change, and that pipeline does not exist
   yet. It is the prerequisite for everything else.
3. **Two sources of truth for images.** A CMS edits YAML. It cannot edit
   Cloudinary contextual metadata, so the project-list ordering/captions would
   still be edited in Cloudinary's Media Library (which is itself a console),
   or that metadata is migrated into YAML (there are already scripts for this:
   `scripts/inspect-cloudinary-metadata.mjs`, `scripts/generate-project-yaml.mjs`).
4. **Uploads vs. repo bloat.** Git-based CMSs store uploads in the repo by
   default. With `.git` already at 386 MB, new images must go to Cloudinary
   (Decap has a Cloudinary media-library integration; Keystatic Cloud hosts
   images itself; otherwise a signed-upload widget) and be referenced by URL /
   public_id — which means the `images` YAML gains a Cloudinary variant of
   `src`, or local-asset uploads are simply not offered in v1 ("pick from
   existing assets" only).
5. **Schema coupling + conventions.** `content.config.ts` (zod) is the
   contract; the CMS gets its own schema definition that must mirror it,
   including the odd bits: `"yes"/"no"` string enums, `_`-prefixed files being
   excluded, HTML tables inside `credits`, `year` as `"202003"`. The story
   blocks were designed as flat `{ type, ... }` objects precisely so a CMS
   "blocks" field maps 1:1.
6. **Preview.** Git-mode CMSs show a form, not the page. Keystatic's *local
   mode* (runs inside `npm run dev`, writes files directly) gives instant
   preview at home; remote edits only show up after the rebuild.
7. **Security.** Use GitHub login (2FA) and scope the CMS to the repo; never
   ship a password-in-config admin. Keep secrets in CI, not in the CMS.
8. **Coexistence with AI sessions.** Everything stays in git, so Claude and
   the CMS edit the same files. Conflicts only happen if both touch the same
   file at the same time; the CMS committing to `master` (or a `content`
   branch that auto-merges) keeps it simple.

## Options

| | Decap / Sveltia CMS | Keystatic | Hosted headless (Sanity, Payload Cloud) | Custom admin (Astro SSR + auth) |
| --- | --- | --- | --- | --- |
| Backend needed | OAuth proxy only (Cloudflare Worker, ~30 lines) | SSR for `/keystatic` routes in GitHub mode (none in local mode) | Their service | Node host + DB/API |
| Works on a plain static host | **Yes** (`/admin` is a static page) | Local mode yes; GitHub mode needs SSR (Cloudflare/Netlify/Vercel or Infomaniak Node) | Yes (content fetched at build) | No |
| Editing UX | Good; form-based | **Best** (blocks editor, drag ordering) | Best, but content leaves git | Whatever we build |
| YAML in repo | Yes | Yes (YAML format supported) | No — migration | Yes |
| Image uploads | Repo, or Cloudinary media library (Decap) | Repo or Keystatic Cloud; Cloudinary via custom field | Their CDN | Cloudinary API |
| Effort | ~1 day | ~1–2 days | ~1 week + migration | weeks |

## Recommendation

**Phase 0 — deploy pipeline (do this first, ~half a day).** GitHub Actions:
on push to `master`, `npm ci` → `npm run build` with Cloudinary secrets →
deploy. If hosting stays on Infomaniak: rsync/SFTP step. If hosting is still
open: Cloudflare Pages or Netlify hook straight into the repo, give preview
deploys per branch, and can run the SSR admin routes — this unlocks the best
option below.

**Phase 1 — Keystatic (`@keystatic/astro`), local mode (~1 day).**
`keystatic.config.ts` mirrors `content.config.ts` for `stories`, `projects`
and `images`; stories use a `blocks` field with one schema per block type.
Running `npm run dev` gives `/keystatic` immediately: a real editing UI for
on-the-fly changes at home, writing the same YAML Claude edits, no auth
needed because it only exists locally.

**Phase 2 — remote editing.** Either
- **2a (host can run SSR, e.g. Cloudflare Pages):** switch Keystatic to GitHub
  mode (Keystatic Cloud is free for personal use and handles auth + image
  hosting). Edit from any device; each save is a commit; Phase 0 rebuilds.
- **2b (host stays plain static):** add Sveltia/Decap at `/admin` with a
  Cloudflare Worker OAuth proxy, same YAML collections, Cloudinary media
  library for picking existing images. Slightly plainer UI, zero SSR.

**Phase 3 — images.** Point uploads at Cloudinary (signed upload from the CMS,
store `public_id` + dimensions in YAML; `scripts/fill-image-dimensions.mjs`
already exists for the dimension step). Optionally migrate the project-list
metadata from Cloudinary context into YAML so there is one source of truth
and one editor.

What stays with AI/code sessions: schema changes, new block types, layout and
motion, anything touching `src/components`. What moves to the console: copy,
ordering, visibility flags, focal points, swapping images, publishing drafts.
