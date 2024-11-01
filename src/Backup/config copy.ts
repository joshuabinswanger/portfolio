// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';



// 2. Define your collection(s)
const galleryCollection = defineCollection({ 
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
        src: z.string(),
        alt: z.string(),
        width: z.string().optional(),
        loading: z.enum(['eager', 'lazy']).optional(), // Define 'loading' as a Zod enum
        to: z.string().optional(),
        description: z.string(),
        imageTags: z.array(z.string()).optional(),
      })
    ), // Array of image objects
  }),
});




// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  'gallery': galleryCollection,
};