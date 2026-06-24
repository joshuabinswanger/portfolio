# SEO & AI Discoverability

How the site presents itself to search engines and AI answer engines
(ChatGPT, Perplexity, Google AI Overviews, etc.). The site is static SSG, so
all of this ships as plain HTML/XML that crawlers can read without running JS.

## Main Files

- `src/layouts/Main.astro`: owns the entire `<head>` — title, meta description,
  canonical, Open Graph, Twitter Card, and the JSON-LD structured data block.
  Every page renders through this layout.
- `astro.config.mjs`: registers `@astrojs/sitemap` and `astro-robots-txt`. The
  `site` value (`https://rhizome.ch`) is the base for canonical URLs and the
  sitemap — it must stay correct.
- `public/llms.txt`: curated plain-text summary for AI agents (bio, services,
  clients, page map). Served verbatim at `/llms.txt`.
- Page files in `src/pages/**`: each passes a unique `title` and `description`
  to `Main`.

## Data Contract

`Main.astro` accepts two props; both have safe defaults so a page never ships
an empty title or description:

```astro
<Main
  title="Projects — Rhizome Visuals | Joshua Binswanger"
  description="Index of scientific illustration, 3D and visualisation projects…"
>
```

Everything else is derived, not passed:

- `canonical` and `og:url` come from `Astro.url.pathname` + `Astro.site`. They
  are **per-page** — do not hardcode them back to the homepage (doing so tells
  crawlers every page is a duplicate of `/`, which drops them from indexes).
- `og:title` / `og:description` / `twitter:*` reuse the `title` / `description`
  props. Set them once via the props and they propagate.
- `og:image` / `twitter:image` use the shared OG image
  (`src/assets/Rhizome_OpenGraphImage_Main_ScientficIllustration.jpg`),
  resolved to an absolute URL.

## Structured Data (JSON-LD)

`Main.astro` emits one `application/ld+json` block (a `@graph`) on every page:

- `Person` (`#person`) — Joshua Binswanger: job title, `knowsAbout`, `worksFor`.
- `ProfessionalService` (`#org`) — Rhizome Visuals: `serviceType`, `founder`.
- `WebSite` (`#website`) — publisher points back to `#person`.

Entities are linked by `@id` so engines resolve one graph rather than three
loose objects. This is the highest-leverage AI-SEO surface: it states the
who/what/relationships explicitly instead of leaving them to be inferred.

Not yet implemented (future work): per-project `CreativeWork` / `ImageObject`
schema, and `sameAs` social links on the `Person`.

## Sitemap & robots

- `@astrojs/sitemap` generates `sitemap-index.xml` + `sitemap-0.xml` at build.
- `astro-robots-txt` generates `robots.txt` with `User-agent: * / Allow: /` and
  a `Sitemap:` line pointing at the index. The `Allow: /` policy intentionally
  permits AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) so the
  site can be cited in AI answers. Tighten here if that changes.

Both are produced only by `npm run build`, not `astro check`.

## Content for crawlers

Real text content already ships in the static HTML (no JS gating):

- `GalleryElement.astro` renders an `<h1>` (project title) + `<h2>` (subtitle)
  per project, plus the description prose (visually hidden but in the DOM).
- `MediaElement.astro` sets `alt` from the image's `description_title`. Keep
  `description_title` populated in image YAML — empty titles mean empty `alt`.
- Video elements (`mux-video`) only carry `aria-label`; they have no text
  fallback for text-only crawlers.

## Change Checklist

- Adding a page? Pass a **unique** `title` + `description` to `Main`. Don't
  reuse another page's strings.
- Never hardcode `canonical` or `og:url` — let `Main.astro` derive them.
- Changing services/clients/bio? Update three places to keep them in sync:
  `Information.astro`, the JSON-LD in `Main.astro`, and `public/llms.txt`.
- Changing the domain? Update `site` in `astro.config.mjs` and the absolute
  `https://rhizome.ch` URLs hardcoded in the JSON-LD `@id`s.

## Verification

```bash
npm run check   # 0 errors/warnings/hints
npm run build   # must log: `sitemap-index.xml` created, robots.txt created
```

After build, confirm in `dist/`:

- Each page's `canonical` / `og:url` match its own path (not `/`).
- Titles are unique across pages.
- `dist/index.html` contains exactly one `application/ld+json` block.
- `dist/sitemap-index.xml` and `dist/llms.txt` exist.

Validate live structured data with Google's Rich Results Test and
schema.org validator after deploy.
