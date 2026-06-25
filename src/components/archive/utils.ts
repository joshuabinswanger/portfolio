import { getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";

import { resolveImageUrl } from "../images/localImages";

const tagConversion: Record<string, string> = {
  "2D": "twoD",
  "3D": "threeD",
};

type LocalImageData = Extract<CollectionEntry<"images">["data"], { src: string }>;

export type ArchiveImage = CollectionEntry<"images"> & {
  data: LocalImageData;
};

export function isArchiveImage(
  image: CollectionEntry<"images">,
): image is ArchiveImage {
  return image.data.mediaType !== "video";
}

export interface ArchiveHighResData {
  width: number;
  height: number;
  url: string;
}

export function ensureArray(
  value: string | string[] | null | undefined,
): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value.split(",").map((item) => item.trim());
}

export function convertTagForCss(tag: string): string {
  return tagConversion[tag] || tag;
}

export function getArchiveTags(image: ArchiveImage): string[] {
  return Array.from(
    new Set([
      ...ensureArray(image.data.metadata?.role),
      ...ensureArray(image.data.metadata?.program),
      ...ensureArray(image.data.metadata?.topic),
      ...ensureArray(image.data.tags),
    ]),
  );
}

export function getArchiveTagClassString(image: ArchiveImage): string {
  return getArchiveTags(image).map(convertTagForCss).join(" ");
}

export function getArchiveRoleTags(image: ArchiveImage): string[] {
  return ensureArray(image.data.metadata?.role).map(convertTagForCss);
}

// Placeholder project slugs that carry no real title.
const PLACEHOLDER_PROJECTS = new Set(["none", "aaa_noproject", ""]);

// Humanise a project slug for display: "BardsOfDawn" -> "Bards Of Dawn".
export function prettifyProjectName(slug: string | null | undefined): string {
  const value = (slug ?? "").trim();
  if (PLACEHOLDER_PROJECTS.has(value)) return "";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

// The image's display title: its description_title, falling back to a humanised
// project name. Used for both the grid caption (single-column only) and the
// PhotoSwipe bottom title — see ArchiveGalleryElement.astro / archive/filters.ts.
export function getArchiveImageTitle(image: ArchiveImage): string {
  return (
    image.data.metadata?.description_title ||
    prettifyProjectName(image.data.metadata?.project)
  );
}

export async function buildArchiveHighResData(
  image: ArchiveImage,
): Promise<ArchiveHighResData> {
  const highResPublicId = image.data.metadata?.highres_public_id;

  if (highResPublicId) {
    try {
      const highResImage = await getEntry("highResImages", highResPublicId);

      if (highResImage?.data) {
        return {
          width: highResImage.data.width,
          height: highResImage.data.height,
          url: highResImage.data.secure_url,
        };
      }

      console.error(`High-res image data is invalid for public ID: ${highResPublicId}`);
    } catch (error) {
      console.error(`Failed to fetch highResImages for ${highResPublicId}:`, error);
    }
  }

  return {
    width: image.data.width,
    height: image.data.height,
    url: resolveImageUrl(image.data.src),
  };
}
