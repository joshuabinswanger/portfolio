import type { ImageMetadata } from "astro";

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/projects/**/*.{avif,gif,jpeg,jpg,png,webp}",
  { eager: true },
);

const localImagesByLowercasePath = new Map(
  Object.entries(localImages).map(([path, image]) => [
    path.toLowerCase(),
    image.default,
  ]),
);

export function resolveLocalImage(src: string): ImageMetadata {
  if (!src.startsWith("/src/assets/")) {
    throw new Error(`Expected a local asset path, got "${src}"`);
  }

  const image =
    localImages[src]?.default ??
    localImagesByLowercasePath.get(src.toLowerCase());

  if (!image) {
    throw new Error(`Local image asset not found for "${src}"`);
  }

  return image;
}

export function resolveImageUrl(src: string): string {
  return resolveLocalImage(src).src;
}

// High-res originals for the lightbox, keyed by file name without extension —
// the value of `metadata.highres_public_id` in the image YAML.
const highResImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/highres/*.{avif,jpeg,jpg,png,webp}",
  { eager: true },
);

const highResImagesById = new Map(
  Object.entries(highResImages).map(([path, image]) => [
    path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")),
    image.default,
  ]),
);

export function resolveHighResImage(id: string): ImageMetadata | undefined {
  return highResImagesById.get(id);
}
