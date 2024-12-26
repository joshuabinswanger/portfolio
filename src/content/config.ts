// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
import { cldAssetsLoader } from 'astro-cloudinary/loaders';


export const collections = { 

  galleryImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: 'Portfolio/Gallery',
      tags: true,
      metadata: true,
      limit: 110,
    })
  }),

  highResImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: 'Portfolio/HighRes',
      tags: true,
      metadata: true,
      limit: 110,
    })
  }),

  gallery: defineCollection({ 
    loader: glob({ pattern: '**\/[^_]*.yaml', base: "./src/content/gallery" }),
    schema: z.object({
      projectName: z.string(),
      title: z.string(),
      subtitle: z.string(),
      tags: z.array(z.string()),
      bgcolor: z.string().optional(),
      projectDescription: z.string(),
      credits: z.string(),
  
      images: z.array(
        z.object({
          loading: z.enum(['eager', 'lazy']).optional(), // Define 'loading' as a Zod enum
          to: z.string().optional(),
        })
      ).optional(),
    }),
  }),

  links: defineCollection({ 
    loader: glob({ pattern: '**.yaml', base: "./src/content/links" }),
    schema: z.object({
      sortOrder: z.number(),
      text: z.string(),
      link: z.string(),
    }),
  }),

}
