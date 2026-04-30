/**
 * fill-image-dimensions.mjs
 * Reads all YAML files in src/content/images/, resolves each image's local
 * path from the `src` field, infers width/height via sharp, and writes those
 * values back into the YAML (inserting after the `src:` line).
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const YAML_DIR = path.join(ROOT, "src/content/images");

// Resolve the YAML `src` value (e.g. /src/assets/...) to an absolute path.
function resolveImagePath(src) {
  // src starts with /src/... — strip the leading slash and join from root
  return path.join(ROOT, src.replace(/^\//, ""));
}

// Insert or replace `width` and `height` lines in raw YAML text.
// Strategy: insert after the `src:` line; replace if already present.
function patchYaml(raw, width, height) {
  // Remove existing width/height lines wherever they are
  const cleaned = raw
    .split("\n")
    .filter((l) => !/^(width|height):\s/.test(l))
    .join("\n");

  // Insert after the `src:` line
  return cleaned.replace(
    /^(src:.+)$/m,
    `$1\nwidth: ${width}\nheight: ${height}`
  );
}

async function main() {
  const files = (await readdir(YAML_DIR)).filter((f) => f.endsWith(".yaml"));
  console.log(`Found ${files.length} YAML files.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const yamlPath = path.join(YAML_DIR, file);
    const raw = await readFile(yamlPath, "utf8");

    // Extract src value
    const srcMatch = raw.match(/^src:\s*(.+)$/m);
    if (!srcMatch) {
      console.warn(`  [SKIP] ${file} — no src field found`);
      skipped++;
      continue;
    }

    const src = srcMatch[1].trim();
    const imagePath = resolveImagePath(src);

    if (!existsSync(imagePath)) {
      console.warn(`  [SKIP] ${file} — image not found: ${imagePath}`);
      skipped++;
      continue;
    }

    let width, height;
    try {
      ({ width, height } = await sharp(imagePath).metadata());
    } catch (err) {
      console.error(`  [ERROR] ${file} — sharp failed: ${err.message}`);
      errors++;
      continue;
    }

    const patched = patchYaml(raw, width, height);

    if (patched === raw) {
      console.log(`  [OK]   ${file} — already up to date (${width}×${height})`);
      skipped++;
      continue;
    }

    await writeFile(yamlPath, patched, "utf8");
    console.log(`  [WRITE] ${file} — ${width}×${height}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped/unchanged: ${skipped}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
