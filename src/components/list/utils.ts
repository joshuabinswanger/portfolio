import { getEntry, getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";


export function sortProjectsByYear(
  projects: CollectionEntry<"projects">,
) {
  return [...projects].sort((a, b) => b.data.year.localeCompare(a.data.year));
}
