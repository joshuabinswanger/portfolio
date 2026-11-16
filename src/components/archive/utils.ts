import type { CollectionEntry } from "astro:content";

import { resolveHighResImage, resolveImageUrl } from "../images/localImages";

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

// Display titles for archive-only groups: project slugs on images that have no
// entry in the projects collection. Keys are lowercase slugs.
const ARCHIVE_GROUP_TITLES: Record<string, string> = {
  bardsofdawn: "Bards of Dawn",
  characters: "Characters",
  chromaticdragons: "Chromatic Dragons",
  figuredrawing: "Figure Drawing",
  gamesdesign101forkids: "Game Design 101 for Kids",
  hold: "Characters",
  illustration: "Illustration",
  misc3d: "Miscellaneous 3D",
};

// Humanise a project slug for display: "BardsOfDawn" -> "Bards Of Dawn".
// Last resort for slugs with neither a project entry nor a group title.
export function prettifyProjectName(slug: string | null | undefined): string {
  const value = (slug ?? "").trim();
  if (PLACEHOLDER_PROJECTS.has(value)) return "";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

// Map of lowercase projectName -> title, built from the projects collection.
export function buildProjectTitleMap(
  projects: CollectionEntry<"projects">[],
): Map<string, string> {
  return new Map(
    projects.map((p) => [p.data.projectName.toLowerCase(), p.data.title]),
  );
}

// Readable name for a project slug: the project's own title, then the
// archive-group title, then a humanised slug. Case-insensitive, so stray
// lowercase slugs ("structureofwood") still resolve.
export function getProjectDisplayName(
  slug: string | null | undefined,
  projectTitles: Map<string, string>,
): string {
  const key = (slug ?? "").trim().toLowerCase();
  return (
    projectTitles.get(key) ??
    ARCHIVE_GROUP_TITLES[key] ??
    prettifyProjectName(slug)
  );
}

// Sort key and year for the archive's "sort by Date" view (sections per year,
// see syncSortSections in filters.ts). metadata.year is plain YYYY; older
// YYYYMM values still parse. The key is always YYYYMM (month 00 when unknown)
// so mixed lengths never compare out of calendar order; images without a
// date get "000000", which the newest-first Date sort puts last, as
// "Undated".
export function getArchiveDate(image: ArchiveImage): {
  key: string;
  year: string;
} {
  const digits = (image.data.metadata?.year ?? "").replace(/\D/g, "");
  if (digits.length < 4) return { key: "000000", year: "Undated" };
  const year = digits.slice(0, 4);
  const month = digits.length >= 6 ? digits.slice(4, 6) : "00";
  return { key: `${year}${month}`, year };
}

// Sort key and section title for an image's project (the archive's "sort by
// Project" view groups by it, see syncSortSections in filters.ts). The title
// is the project's display name; the key is that name lowercased, so slugs
// that share a display name ("hold" / "characters", or "StructureOfWood" /
// "structureofwood") share one section, and sections sort alphabetically by
// what they show. Images without a project sort last, under "Other".
export const NO_PROJECT_KEY = "zzz_noproject";

export function getArchiveProject(
  image: ArchiveImage,
  projectTitles: Map<string, string>,
): { key: string; title: string } {
  const title = getProjectDisplayName(image.data.metadata?.project, projectTitles);
  if (!title) return { key: NO_PROJECT_KEY, title: "Other" };
  return { key: title.toLowerCase(), title };
}

// The image's display title: its description_title, falling back to the
// project's display name. Used for both the grid caption (single-column only)
// and the PhotoSwipe bottom title — see ArchiveGalleryElement.astro /
// archive/filters.ts.
export function getArchiveImageTitle(
  image: ArchiveImage,
  projectTitles: Map<string, string>,
): string {
  return (
    image.data.metadata?.description_title ||
    getProjectDisplayName(image.data.metadata?.project, projectTitles)
  );
}

export function buildArchiveHighResData(
  image: ArchiveImage,
): ArchiveHighResData {
  const highResId = image.data.metadata?.highres_public_id;
  const highRes = highResId ? resolveHighResImage(highResId) : undefined;

  if (highResId && !highRes) {
    console.error(`High-res image not found in src/assets/highres: ${highResId}`);
  }

  if (highRes) {
    return { width: highRes.width, height: highRes.height, url: highRes.src };
  }

  return {
    width: image.data.width,
    height: image.data.height,
    url: resolveImageUrl(image.data.src),
  };
}
