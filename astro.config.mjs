import { defineConfig } from 'astro/config';

import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: 'https://rhizome.ch',
  integrations: [robotsTxt()],
});

import { imageService } from "@unpic/astro/service";
export default defineConfig({
  image: {
    service: imageService({
      placeholder: "lqip",
   }),
  },
});