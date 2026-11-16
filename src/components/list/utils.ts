import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export function sortProjectsByYear(projects: CollectionEntry<"projects">[]) {
  return [...projects].sort((a, b) => b.data.year.localeCompare(a.data.year));
}

/**
 * Media shown in a project's slider on the project index: local images and
 * Mux videos from the `images` collection whose `metadata.project` matches
 * and `showInProjectGallery === "yes"`, ordered by `projectGalleryOrder`
 * (missing order sorts last). Used both to count slides (PhotoSwipe indices
 * in ProjectList.astro) and to render them (ImageSlide.astro), so the two can
 * never disagree.
 */
export async function getProjectMedia(projectName: string) {
  const media = await getCollection("images", ({ data }) => {
    return (
      data.metadata?.project === projectName &&
      data.metadata.showInProjectGallery === "yes"
    );
  });

  return media.sort((a, b) => {
    const orderA = a.data.metadata?.projectGalleryOrder ?? Infinity;
    const orderB = b.data.metadata?.projectGalleryOrder ?? Infinity;
    return orderA - orderB;
  });
}
