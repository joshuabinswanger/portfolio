// Pure, DOM-free helpers for the project list. Must not import from "astro:*"
// so the node test runner can load this file directly.

export type ProjectFact = {
  label: "Client" | "Role" | "Tools" | "With";
  value: string;
};

export function formatListSummary(years: string[]): string {
  const count = years.length;
  const noun = count === 1 ? "Project" : "Projects";
  if (count === 0) return `0 ${noun}`;

  const starts = years.map((year) => Number(year.slice(0, 4)));
  const first = Math.min(...starts);
  const last = Math.max(...starts);
  const span = first === last ? `${first}` : `${first} – ${last}`;
  return `${count} ${noun} · ${span}`;
}

export function getProjectFacts(data: {
  client?: string;
  role?: string;
  tools?: string;
  collaborators?: string;
}): ProjectFact[] {
  const entries: [ProjectFact["label"], string | undefined][] = [
    ["Client", data.client],
    ["Role", data.role],
    ["Tools", data.tools],
    ["With", data.collaborators],
  ];

  const facts: ProjectFact[] = [];
  for (const [label, raw] of entries) {
    const value = raw?.trim();
    if (value) facts.push({ label, value });
  }
  return facts;
}

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

const PREVIEW_OFFSET = { x: 20, y: 14 };
const PREVIEW_MARGIN = 8;

// Places a hover preview beside the pointer, flipping or pulling it back so it
// stays inside the viewport and never crosses the top-left margin.
export function placePreview(
  pointer: Point,
  preview: Size,
  viewport: Size,
): Point {
  let x = pointer.x + PREVIEW_OFFSET.x;
  if (x + preview.width > viewport.width - PREVIEW_MARGIN) {
    x = pointer.x - PREVIEW_OFFSET.x - preview.width;
  }
  x = Math.max(x, PREVIEW_MARGIN);

  let y = pointer.y + PREVIEW_OFFSET.y;
  if (y + preview.height > viewport.height - PREVIEW_MARGIN) {
    y = viewport.height - PREVIEW_MARGIN - preview.height;
  }
  y = Math.max(y, PREVIEW_MARGIN);

  return { x, y };
}

export type PreviewCandidate = {
  data:
    | { mediaType?: "image"; src: string }
    | { mediaType: "video"; posterSrc: string };
};

// Prefers the first still image; a video contributes its poster only when no
// image exists, so the preview stays on local images.
export function pickPreviewSrc(media: PreviewCandidate[]): string | null {
  for (const { data } of media) {
    if ("src" in data) return data.src;
  }
  for (const { data } of media) {
    if ("posterSrc" in data) return data.posterSrc;
  }
  return null;
}

export function shouldShowSliderControls(
  slideCount: number,
  perView: number,
): boolean {
  return slideCount > perView;
}
