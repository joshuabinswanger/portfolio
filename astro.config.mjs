import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://rhizome.ch",
  integrations: [robotsTxt()],
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
