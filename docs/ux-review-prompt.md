# UX review prompt (hand-off for a fresh session)

Paste everything below the line into a new Claude Code session opened in this repo.

---

You are doing a **UX review** of this portfolio site. This is a *review and report* task — **do not change any code** unless I explicitly ask for fixes afterward. Your deliverable is a written, prioritized report (plus screenshots as evidence).

## What this site is

Personal portfolio of Joshua Binswanger / Rhizome Visuals (rhizome.ch) — a visual artist / photographer / motion portfolio. Astro 6 static site, TypeScript, PostCSS (no Tailwind). Content is YAML collections + two remote Cloudinary collections loaded at build time. It is **visual-first**: image/video presentation, pacing, and feel matter as much as conventional usability. Treat it as a designer's portfolio, not a SaaS app.

## Surfaces to review (desktop AND mobile each)

Run `npm run dev` and use the preview tools (`preview_start`, `preview_snapshot`, `preview_click`, `preview_resize`, `preview_screenshot`, `preview_console_logs`, `preview_network`) to actually exercise the site. Check each route at a desktop width (~1440px) and a mobile width (~390px) — the site ships **separate mobile nav components**, so mobile is a first-class layout, not a reflow afterthought.

Routes:
- `/` — homepage gallery (keen-slider + PhotoSwipe lightbox)
- `/project-index` — project list gallery
- `/info` — about/contact/info page
- `/fire` — scroll-driven project page (GSAP scrolly)
- `/nzz-bewerbung` — standalone project/application page
- `/personal/` and `/personal/info` — a parallel variant of the site (different nav)

Interactive systems to actually test, not just look at:
- **Homepage gallery** — slider behavior, drag/swipe, keyboard, opening PhotoSwipe, captions, video-in-lightbox, closing/escape.
- **Archive filter/sort** — the MixItUp filter/sort UI (`src/components/archive`), thumbnail grid + zoom control, gap-fill animation. Test filtering, sorting, combinations, empty states, and mobile zoom range.
- **Video playback** — Mux player behavior, autoplay/poster, controls, mobile.
- **Scrolly `/fire`** — scroll pacing, GSAP triggers, what happens on fast scroll / scroll-up / reduced-motion / mobile.

## What to evaluate

For each surface, assess:
1. **First impression & clarity** — within 5 seconds, is it obvious what this is and how to move around?
2. **Navigation & wayfinding** — nav consistency across pages, the `/personal` variant, active states, how to get back, dead ends, the relationship between homepage / project-index / individual projects.
3. **Interaction feel** — slider/lightbox/filter responsiveness, drag affordances, loading/perceived performance, jank, layout shift (CLS) as images/video load.
4. **Mobile UX specifically** — tap target sizes, the mobile nav, gallery gestures, the archive zoom control, scrolly behavior, viewport/safe-area issues.
5. **Accessibility (pragmatic, not a full audit)** — keyboard operability of slider/lightbox/filters, focus visibility and focus trapping in PhotoSwipe, alt text on images, color contrast on UI chrome, `prefers-reduced-motion` handling for GSAP/animations, semantic landmarks.
6. **Content presentation** — image/video quality and sizing, captions, typography, whitespace/rhythm, how galleries pace the work.
7. **Consistency** — does `/personal` feel intentionally different or just inconsistent? Spacing/type/interaction patterns shared vs. forked.
8. **Errors & edge cases** — console errors/warnings, failed network requests, slow Cloudinary/Mux loads, empty archive filter results, very long/short content.

## Method

- Read the relevant per-system doc **before** judging that system: `docs/galleries.md`, `docs/archive-filters.md`, `docs/video-player.md`, `docs/image-optimization.md`, `docs/seo.md`, `docs/troubleshooting.md`. This tells you intended behavior so you flag real problems, not by-design choices.
- Capture screenshots as evidence for notable findings (desktop + mobile).
- Note console errors and slow/broken network requests as you go.
- Distinguish **UX problems** from **subjective taste** — flag taste calls as such.

## Also: library / tooling modernization check

Separately from the UX findings, review the current front-end libraries and flag where a newer or better-fitting option exists. Current stack (see `package.json`): `keen-slider`, `photoswipe` (+ dynamic-caption plugin), `mixitup` (+ multifilter), `gsap`, `lenis`, `@mux/mux-player` + `@mux/mux-video`, `astro-cloudinary` / `cloudinary`, `marked`, `js-yaml`, `sharp`.

For each library worth commenting on:
- Is it still actively maintained? Latest version vs. what's installed (check with `npm outdated`, and verify maintenance status / latest release on the web).
- Is there a modern, lighter, or better-supported alternative (e.g. is MixItUp — which is old and jQuery-era in feel — replaceable with a CSS/native or Astro-friendly approach; is there a more modern slider; native APIs that now cover what a dependency does)?
- Migration cost vs. benefit, and any UX-relevant upside (smaller bundle, better a11y, smoother animation).

Use `WebSearch`/`WebFetch` to confirm current versions and maintenance status — don't rely on memory. Keep this pragmatic: only recommend a swap when the payoff is real. Present it as its own section in the report with a short table (library → status → recommendation → effort).

## Deliverable

Write a single report (markdown) with:
1. **Summary** — overall impression in a few sentences + the 3–5 highest-impact issues.
2. **Findings by surface** (homepage, project-index, info, fire, nzz-bewerbung, personal, archive, global nav). For each finding: what, where (`file:line` if you traced it to source), why it matters, severity (Critical / High / Medium / Low / Nit), and a concrete suggested fix. Attach screenshots.
3. **Cross-cutting themes** — accessibility, mobile, performance/perceived-perf, consistency.
4. **Library modernization** — the table from the section above (library → status → recommendation → effort).
5. **Quick wins** — a short list of low-effort, high-value fixes.

Be specific and honest. It's fine to say a section is strong. Prioritize ruthlessly — a flat list of 40 nits is less useful than the 8 things actually worth fixing.
