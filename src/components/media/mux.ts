import type { CollectionEntry } from "astro:content";

export type LocalMediaEntry = CollectionEntry<"images">;
export type LocalMediaData = LocalMediaEntry["data"];
export type MuxVideoData = Extract<LocalMediaData, { mediaType: "video" }>;

export function isMuxVideoData(data: LocalMediaData): data is MuxVideoData {
  return data.mediaType === "video" && data.video.provider === "mux";
}

export function isMuxVideoEntry(
  entry: LocalMediaEntry,
): entry is LocalMediaEntry & { data: MuxVideoData } {
  return isMuxVideoData(entry.data);
}

export function getMuxHlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getMuxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp`;
}
