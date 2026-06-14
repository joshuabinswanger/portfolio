// 1. Import utilities from Astro
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { cldAssetsLoader } from "astro-cloudinary/loaders";

const commaSeparatedField = z.union([z.string(), z.array(z.string())]);

const localImageMetadataSchema = z.object({
  project: z.string().nullish(),
  description_title: z.string().nullish(),
  description_text: z.string().nullish(),
  showInPortfolioGallery: z.enum(["yes", "no"]),
  portfolioOrder: z.number().nullish(),
  showInProjectGallery: z.enum(["yes", "no"]),
  projectGalleryOrder: z.number().nullish(),
  showInIndex: z.enum(["yes", "no"]),
  year: z.string().nullish(),
  client: z.string().nullish(),
  collaborators: z.string().nullish(),
  role: z.string().nullish(),
  program: z.string().nullish(),
  topic: z.string().nullish(),
  link: z.string().nullish(),
  highres_public_id: z.string().nullish(),
  // Archive thumbnail crop focal point, e.g. "70% 30%". Maps to CSS
  // `object-position`; omit for a centered crop.
  focus: z.string().nullish(),
});

const muxVideoSchema = z.object({
  provider: z.literal("mux"),
  playbackId: z.string(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  controls: z.boolean().optional(),
  maxResolution: z.string().optional(),
});

const imageMetadataSchema = z.looseObject({
    project: z.string().nullish(),
    description_title: z.string().nullish(),
    description_text: z.string().nullish(),
    showInPortfolioGallery: z.string().nullish(),
    portfolioOrder: z.coerce.number().nullish(),
    showInProjectGallery: z.string().nullish(),
    projectGalleryOrder: z.coerce.number().nullish(),
    showInIndex: z.string().nullish(),
    year: z.string().nullish(),
    client: z.string().nullish(),
    collaborators: z.string().nullish(),
    role: commaSeparatedField.nullish(),
    program: commaSeparatedField.nullish(),
    topic: commaSeparatedField.nullish(),
    link: z.string().nullish(),
    highres_public_id: z.string().nullish(),
});

const cloudinaryAssetSchema = z.looseObject({
    asset_id: z.string(),
    bytes: z.number(),
    created_at: z.string(),
    folder: z.string(),
    format: z.string(),
    height: z.number(),
    metadata: imageMetadataSchema.optional(),
    public_id: z.string(),
    resource_type: z.string(),
    secure_url: z.string(),
    tags: z.array(z.string()).optional(),
    type: z.string(),
    url: z.string(),
    version: z.number(),
    width: z.number(),
});

export const collections = {
  galleryImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: "Portfolio/Gallery",
      tags: true,
      metadata: true,
      limit: 300,
    }),
    schema: cloudinaryAssetSchema,
  }),

  highResImages: defineCollection({
    loader: cldAssetsLoader({
      context: true,
      folder: "Portfolio/HighRes",
      tags: true,
      metadata: true,
      limit: 300,
    }),
    schema: cloudinaryAssetSchema,
  }),

  images: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.yaml",
      base: "./src/content/images",
    }),
    schema: z.union([
      z.object({
        mediaType: z.literal("video"),
        posterSrc: z.string(),
        width: z.number(),
        height: z.number(),
        tags: z.array(z.string()).optional(),
        video: muxVideoSchema,
        metadata: localImageMetadataSchema,
      }),
      z.object({
        mediaType: z.literal("image").optional(),
        src: z.string(),
        width: z.number(),
        height: z.number(),
        tags: z.array(z.string()).optional(),
        metadata: localImageMetadataSchema,
      }),
    ]),
  }),

  portfolio: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.yaml",
      base: "./src/content/portfolio",
    }),
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

      images: z
        .array(
          z.object({
            loading: z.enum(["eager", "lazy"]).optional(), // Define 'loading' as a Zod enum
            to: z.string().optional(),
          }),
        )
        .optional(),
    }),
  }),

  projects: defineCollection({
    loader: glob({ pattern: "**/*.yaml", base: "./src/content/projects" }),
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
      tags: z.array(z.string()),
      bgcolor: z.string().optional(),
      projectDescription: z.string(),
      credits: z.string(),
    }),
  }),

  links: defineCollection({
    loader: glob({ pattern: "**.yaml", base: "./src/content/links" }),
    schema: z.object({
      sortOrder: z.number(),
      text: z.string(),
      link: z.string(),
    }),
  }),
};
