// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
import { cldAssetsLoader } from 'astro-cloudinary/loaders';


// 2. Define your collection(s)
/* const gallery = defineCollection({ 
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
    ), // Array of image objects
  }),
}); */
export const collections = { 
  galleryImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: 'Portfolio/Gallery/Xylopedia',
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
      ), // Array of image objects
    }),
  }),

}



// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"


