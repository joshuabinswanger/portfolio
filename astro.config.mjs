import { fileURLToPath } from "node:url";

import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

import {
  IMAGE_META_ENDPOINT,
  createImageMetaMiddleware,
} from "./src/dev/imageMetaMiddleware.ts";

// /dev/images: thumbnails next to their YAML metadata, editable in place, for
// content upkeep. Injected only under `astro dev`, so it never ships in a build.
const devImageReview = {
  name: "dev-image-review",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      if (command !== "dev") return;
      injectRoute({
        pattern: "/dev/images",
        entrypoint: "./src/dev/ImageReview.astro",
      });
    },
    "astro:server:setup": ({ server }) => {
      server.middlewares.use(
        IMAGE_META_ENDPOINT,
        createImageMetaMiddleware(fileURLToPath(new URL(".", import.meta.url))),
      );
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: "https://rhizome.ch",
  integrations: [sitemap(), robotsTxt(), devImageReview],
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    // Dev only: pre-bundle these at startup. PhotoSwipe's core is loaded with
    // a dynamic import on first click, so Vite otherwise discovers it late,
    // re-bundles, and the open page's import 504s ("Outdated Optimize Dep"):
    // the lightbox never opens until a reload.
    optimizeDeps: {
      include: [
        "photoswipe",
        "photoswipe/lightbox",
        "mixitup",
        "mixitup-multifilter",
      ],
    },
  },
});
