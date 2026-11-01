// Validation and YAML patching behind the /dev/images edit forms. Pure
// functions over strings so they can be unit-tested; the dev-server middleware
// in imageMetaMiddleware.ts does the file IO.
import { isScalar, parseDocument } from "yaml";

const TEXT_FIELDS = [
  "description_title",
  "description_text",
  "project",
  "role",
  "program",
  "topic",
] as const;
const FLAG_FIELDS = [
  "showInIndex",
  "showInPortfolioGallery",
  "showInProjectGallery",
] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type FlagField = (typeof FLAG_FIELDS)[number];

export type ImageMetaChanges = {
  metadata: Partial<Record<TextField | "year", string | null>> &
    Partial<Record<FlagField, "yes" | "no">>;
  tags?: string[];
};

// Turn an untrusted request body into a typed change set, or throw with a
// message the page can show. Empty strings become null.
export function parseImageMetaChanges(body: unknown): ImageMetaChanges {
  if (!body || typeof body !== "object") throw new Error("Expected an object");
  const input = body as { metadata?: unknown; tags?: unknown };
  const meta = (input.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta !== "object") throw new Error("metadata must be an object");

  const allowed = new Set<string>([...TEXT_FIELDS, ...FLAG_FIELDS, "year"]);
  const unknown = Object.keys(meta).filter((k) => !allowed.has(k));
  if (unknown.length) throw new Error(`Unknown field: ${unknown.join(", ")}`);

  const changes: ImageMetaChanges = { metadata: {} };

  for (const key of TEXT_FIELDS) {
    if (!(key in meta)) continue;
    const value = meta[key];
    if (value === null) {
      changes.metadata[key] = null;
    } else if (typeof value === "string") {
      changes.metadata[key] = value.trim() || null;
    } else {
      throw new Error(`${key} must be text`);
    }
  }

  for (const key of FLAG_FIELDS) {
    if (!(key in meta)) continue;
    if (meta[key] !== "yes" && meta[key] !== "no") {
      throw new Error(`${key} must be "yes" or "no"`);
    }
    changes.metadata[key] = meta[key];
  }

  if ("year" in meta) {
    const year = typeof meta.year === "string" ? meta.year.trim() : meta.year;
    if (year === null || year === "") {
      changes.metadata.year = null;
    } else if (typeof year === "string" && /^\d{6}$/.test(year)) {
      changes.metadata.year = year;
    } else {
      throw new Error("year must be six digits, YYYYMM");
    }
  }

  if ("tags" in input) {
    if (
      !Array.isArray(input.tags) ||
      input.tags.some((t) => typeof t !== "string")
    ) {
      throw new Error("tags must be a list of text");
    }
    changes.tags = (input.tags as string[])
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return changes;
}

// Apply a change set to an image YAML file's text. Only fields whose value
// actually changes are touched, and existing scalars keep their quoting, so an
// edit shows up as a one-line diff. Returns the input unchanged when nothing
// differs.
export function applyImageMetaChanges(
  raw: string,
  changes: ImageMetaChanges,
): string {
  const doc = parseDocument(raw);
  if (doc.errors.length) throw new Error(doc.errors[0].message);

  let changed = false;

  for (const [key, value] of Object.entries(changes.metadata)) {
    const path = ["metadata", key];
    const current = doc.getIn(path);
    if ((current ?? null) === value) continue;
    const node = doc.getIn(path, true);
    if (isScalar(node)) {
      node.value = value;
    } else {
      doc.setIn(path, value);
    }
    changed = true;
  }

  if (changes.tags) {
    const current = (doc.toJS().tags ?? []) as string[];
    if (current.join("\n") !== changes.tags.join("\n")) {
      doc.set("tags", changes.tags.length ? changes.tags : null);
      changed = true;
    }
  }

  return changed ? doc.toString({ lineWidth: 0 }) : raw;
}
