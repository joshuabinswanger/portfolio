import { getEntry, getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

/**
 * Interface for enriched project data
 */
export interface EnrichedProject {
  entry: CollectionEntry<"portfolio">;
  projectName: string;
  startIndex: number;
  galleryImages: CollectionEntry<"galleryImages">[];
  slidesCount: number;
}


export function sortPortfolioProjects(
  portfolioProjects: CollectionEntry<"portfolio">,
) {
  return [...portfolioProjects].sort((a, b) => {
    const priorityA = Number(a.data.priority);
    const priorityB = Number(b.data.priority);
    return priorityA - priorityB;
  });
}



export async function fetchGalleryImagesForProjects(
  targetProjects: string[],
): Promise<CollectionEntry<"galleryImages">[]> {
  const galleryImages = await getCollection("galleryImages", ({ data }) => {
    return (
      data.metadata?.project &&
      targetProjects.includes(data.metadata.project) &&
      data.metadata.showInPortfolioGallery === "yes"
    );
  });

  return galleryImages;
}



export async function enrichPortfolioProjects(
  portfolioProjects: CollectionEntry<"portfolio">[],
): Promise<{ enrichedProjects: EnrichedProject[]; totalGlobalIndex: number }> {
  const enrichedProjects: EnrichedProject[] = [];
  let globalIndex = 0;

  for (const entry of portfolioProjects) {
    const projectName = entry.data.portfolioElementName;
    const startIndex = globalIndex;
    const targetProjects = entry.data.portfolioElementProjects;

    // Skip if portfolioElementProjects is not an array
    if (!Array.isArray(targetProjects)) {
      continue;
    }

    // Fetch gallery images for this project
    const galleryImages = await fetchGalleryImagesForProjects(targetProjects);

    const slidesCount = galleryImages.length;
    globalIndex += slidesCount + 2;

    const projectData: EnrichedProject = {
      entry,
      projectName,
      startIndex,
      galleryImages,
      slidesCount,
    };

    enrichedProjects.push(projectData);
  }

  return {
    enrichedProjects,
    totalGlobalIndex: globalIndex,
  };
}


export async function getPortfolioGalleryData(): Promise<{
  enrichedProjects: EnrichedProject[];
  totalGlobalIndex: number;
}> {
  // Fetch all portfolio projects
  const portfolioProjects = await getCollection("portfolio");

  // Sort projects by priority
  const sortedProjects = sortPortfolioProjects(portfolioProjects);

  // Enrich projects with gallery data
  return enrichPortfolioProjects(sortedProjects);
}


export async function getGalleryProject(projectSlug: string) {
  try {
    const project = await getEntry("portfolio", projectSlug.toLowerCase());

    if (!project || !project.data) {
      console.warn(`Gallery project not found for ${projectSlug}`);
      return null;
    }

    console.log(
      `Gallery Project Fetched: ${project.data.portfolioElementName}`,
    );
    return project;
  } catch (error) {
    console.error(`Error fetching gallery project ${projectSlug}:`, error);
    return null;
  }
}



export function extractContainedProjects(
  galleryProject: CollectionEntry<"portfolio"> | null,
): string[] {
  if (galleryProject?.data?.portfolioElementProjects) {
    return galleryProject.data.portfolioElementProjects;
  }

  console.warn("portfolioElementProjects not found or invalid");
  return [];
}



export async function getFilteredGalleryImages(containedProjects: string[]) {
  const galleryImages = await getCollection("galleryImages", ({ data }) => {
    return (
      data.metadata?.project &&
      containedProjects.includes(data.metadata.project) &&
      data.metadata.showInPortfolioGallery === "yes"
    );
  });

  return sortImagesByPortfolioOrder(galleryImages);
}


export function sortImagesByPortfolioOrder(images: CollectionEntry<"galleryImages">) {
  return [...images].sort((a, b) => {
    const orderA = a.data.metadata?.portfolioOrder ?? Infinity;
    const orderB = b.data.metadata?.portfolioOrder ?? Infinity;
    return orderA - orderB;
  });
}

/**
 * Builds high resolution data for gallery images
 * @param galleryImages - Collection of gallery images
 * @returns Array of image data with high resolution information
 */
export async function buildHighResData(
  galleryImages: CollectionEntry<"galleryImages">[],
) {
  const highResData = [];

  for (const image of galleryImages) {
    let highResEntry = null;

    if (image.data.metadata?.highres_public_id) {
      try {
        highResEntry = await getEntry(
          "highResImages",
          image.data.metadata.highres_public_id,
        );
      } catch (error) {
        console.error(
          `Failed to fetch highResImages for ${image.data.metadata.highres_public_id}:`,
          error,
        );
      }
    }

    highResData.push({
      ...image.data,
      highResWidth: highResEntry?.data.width ?? image.data.width,
      highResHeight: highResEntry?.data.height ?? image.data.height,
      highResSecureUrl: highResEntry?.data.secure_url ?? image.data.secure_url,
    });
  }

  return highResData;
}

/**
 * Checks if any image in the collection has high resolution data
 * @param images - Collection of gallery images
 * @returns true if at least one image has highres_public_id
 */
export function hasHighResImages(
  images: CollectionEntry<"galleryImages">[],
): boolean {
  return images.some((image) => image.data?.metadata?.highres_public_id);
}


export async function getGalleryData(projectSlug: string) {
  // Fetch the gallery project
  const galleryProject = await getGalleryProject(projectSlug);

  if (!galleryProject) {
    return {
      galleryProject: null,
      galleryImages: [],
      highResData: [],
      imagesAmount: 0,
      hasHighRes: false,
    };
  }

  // Extract contained projects
  const containedProjects = extractContainedProjects(galleryProject);

  // Get filtered and sorted gallery images
  const galleryImages = await getFilteredGalleryImages(containedProjects);

  // Build high resolution data
  const highResData = await buildHighResData(galleryImages);

  // Check if any images have high resolution versions
  const hasHighRes = hasHighResImages(galleryImages);

  return {
    galleryProject,
    galleryImages,
    highResData,
    imagesAmount: galleryImages.length,
    hasHighRes,
  };
}
