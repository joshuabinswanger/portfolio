import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://rhizome.ch",
  integrations: [
    sitemap({
      // /styleguide is an internal design-token reference, not site content.
      filter: (page) => !page.includes("/styleguide"),
    }),
    robotsTxt(),
  ],
  // Honor a PORT injected by the environment (e.g. the Claude Preview tool's
  // autoPort assignment). Falls back to Astro's default 4321 for plain `npm run dev`.
  server: process.env.PORT ? { port: Number(process.env.PORT) } : undefined,
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
