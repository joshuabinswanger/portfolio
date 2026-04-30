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
