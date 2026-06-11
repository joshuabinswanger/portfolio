# Documentation Index

This folder holds problem-specific notes for the portfolio codebase. Keep each file focused on one system or recurring maintenance task.

## Topics

- [Video Player](./video-player.md): Mux videos, HLS URLs, inline previews, PhotoSwipe playback, and YAML toggles.
- [Galleries](./galleries.md): Homepage galleries, project-list galleries, PhotoSwipe indexing, sorting, and pause/play behavior.
- [Image Optimization](./image-optimization.md): Local Astro images, Cloudinary images, high-resolution lightbox images, and sizing rules.
- [Content YAML](./content-yaml.md): How project, portfolio, image, and video YAML entries fit together.
- [Troubleshooting](./troubleshooting.md): Common dev-server, Vite cache, PhotoSwipe, Mux, and content-schema issues.
- [Changelog 2026-04-30](./changelog-2026-04-30.md): Summary of the Astro 6 content-config migration and typecheck cleanup pass.

## Adding A New Doc

Create a new Markdown file in this folder when a topic starts to grow beyond a few README lines. Good doc files usually include:

- Purpose: what problem this file solves.
- Main files: the source files that own the behavior.
- Data contract: YAML fields, props, or environment variables involved.
- Change checklist: what to update when touching the feature.
- Verification: commands or browser checks to run.
