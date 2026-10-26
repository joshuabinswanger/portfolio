// 1. Import utilities from Astro
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

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

// ---- Project stories ------------------------------------------------------

const storyImageSchema = z.object({
  // Local asset path, e.g. "/src/assets/projects/structureofwood/x.webp"
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const storyStepSchema = z.object({
  heading: z.string().optional(),
  body: z.string(), // markdown
});

const storyBlockSchema = z.discriminatedUnion("type", [
  // Full-width opener: image with the title overlaid.
  z.object({
    type: z.literal("hero"),
    image: storyImageSchema,
    kicker: z.string().optional(),
  }),
  // A paragraph or two of markdown.
  z.object({
    type: z.literal("text"),
    heading: z.string().optional(),
    body: z.string(),
    align: z.enum(["left", "center"]).optional(),
  }),
  // One image at a chosen width.
  z.object({
    type: z.literal("image"),
    image: storyImageSchema,
    size: z.enum(["full", "wide", "narrow"]).optional(),
  }),
  // Image beside text.
  z.object({
    type: z.literal("split"),
    image: storyImageSchema,
    heading: z.string().optional(),
    body: z.string(),
    imageSide: z.enum(["left", "right"]).optional(),
  }),
  // Image grid.
  z.object({
    type: z.literal("gallery"),
    images: z.array(storyImageSchema).min(1),
    columns: z.number().int().min(2).max(4).optional(),
  }),
  // The "story" block: one image stays pinned while short text steps scroll
  // past it, each lighting up as it reaches the middle of the screen.
  z.object({
    type: z.literal("sticky"),
    image: storyImageSchema,
    steps: z.array(storyStepSchema).min(1),
  }),
  z.object({
    type: z.literal("quote"),
    text: z.string(),
    source: z.string().optional(),
  }),
]);

export type StoryBlock = z.infer<typeof storyBlockSchema>;

export const collections = {
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

  // Project stories: an ordered list of blocks rendered as a smooth-scrolling
  // narrative page at /projects/<slug>. Block-based on purpose — each block is
  // a flat object with a `type`, so a story is reordered or extended by
  // editing YAML only. See docs/stories.md.
  stories: defineCollection({
    loader: glob({ pattern: "**/[^_]*.yaml", base: "./src/content/stories" }),
    schema: z.object({
      project: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      year: z.string().optional(),
      client: z.string().optional(),
      role: z.string().optional(),
      tools: z.string().optional(),
      summary: z.string().optional(),
      draft: z.boolean().default(false),
      blocks: z.array(storyBlockSchema),
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
