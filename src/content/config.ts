// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';
import { z } from 'zod';z
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

  portfolio: defineCollection({ 
    loader: glob({ pattern: '**\/[^_]*.yaml', base: "./src/content/portfolio" }),
    schema: z.object({
      portfolioElementProjects: z.array(z.string()),
      portfolioElementName: z.string(),
      priority: z.number(),
      title: z.string(),
      subtitle: z.string(),
      shortDescription: z.string().optional(),
      year: z.string(),
      client: z.string().optional(),
      collaborators: z.string().optional(),
      role: z.string().optional(),
      tools: z.string().optional(),
      portfolio: z.boolean(),
      tags: z.array(z.string()),
      bgcolor: z.string().optional(),
      projectDescription: z.string(),
      credits: z.string(),
      containedProjects: z.string().optional(),
  
      images: z.array(
        z.object({
          loading: z.enum(['eager', 'lazy']).optional(), // Define 'loading' as a Zod enum
          to: z.string().optional(),
        })
      ).optional(),
    }),
  }),

  projects: defineCollection({ 
    loader: glob({ pattern: '**/*.yaml', base: "./src/content/projects" }),
    schema: z.object({
      projectName: z.string(),
      title: z.string(),
      subtitle: z.string(),
      shortDescription: z.string().optional(),
      year: z.string(),
      client: z.string().optional(),
      collaborators: z.string().optional(),
      role: z.string().optional(),
      tools: z.string().optional(),
      portfolio: z.boolean(),
      tags: z.array(z.string()),
      bgcolor: z.string().optional(),
      projectDescription: z.string(),
      credits: z.string(),
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
