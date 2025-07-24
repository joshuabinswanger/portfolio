import { getEntry, getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

/**
 * Sort All Projects by date (ascending)
 * @param projects - Array of projects collection entries to sort
 * @returns New sorted array of projects
 */
export function sortProjectsByYear<T extends CollectionEntry<"projects">>(
  projects: T[]
): T[] {
  return [...projects].sort((a, b) => b.data.year.localeCompare(a.data.year));
}
