import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

// /dev/images: thumbnails next to their YAML metadata, for content upkeep.
// Injected only under `astro dev`, so it never ships in a build.
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
  },
});
