// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
import { cldAssetsLoader } from 'astro-cloudinary/loaders';

const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;



export const collections = { 
  galleryImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: 'Portfolio/Gallery',
      tags: true,
      metadata: true,
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
      ),
    }),
  }),

}
