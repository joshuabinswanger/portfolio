import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://rhizome.ch",
  integrations: [sitemap(), robotsTxt()],
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
