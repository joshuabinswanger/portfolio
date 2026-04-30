/**
 * generate-project-yaml.mjs
 *
 * Downloads images from Cloudinary and generates YAML files matching the
 * `images` content collection schema (src/content/config.ts).
 *
 * Images are saved to: src/assets/projects/{baseName}/{baseName}.{ext}
 * The `src` field in the YAML uses the Astro-friendly path: /src/assets/...
 *
 * Run with:
 *   node scripts/generate-project-yaml.mjs
 *
 * Prerequisites:
 *   npm install cloudinary js-yaml dotenv
 */

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import "dotenv/config";

const cloud_name =
  process.env.PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const api_key =
  process.env.PUBLIC_CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error(
    "Missing credentials. Make sure your .env has:\n" +
    "  PUBLIC_CLOUDINARY_CLOUD_NAME\n" +
    "  PUBLIC_CLOUDINARY_API_KEY\n" +
    "  CLOUDINARY_API_SECRET"
  );
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret });

const CLOUDINARY_FOLDER = "Portfolio/Gallery";
const YAML_OUTPUT_DIR   = "./src/content/images";
const ASSETS_BASE_DIR   = "./src/assets/projects";

async function downloadImage(url, destPath) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function run() {
  console.log(`Fetching assets from: ${CLOUDINARY_FOLDER}\n`);

  const result = await cloudinary.search
    .expression(`resource_type:image AND folder:${CLOUDINARY_FOLDER}`)
    .with_field("tags")
    .with_field("metadata")
    .max_results(500)
    .execute();

  fs.mkdirSync(YAML_OUTPUT_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;

  for (const asset of result.resources) {
    const baseName = asset.public_id.split("/").pop();
    const ext = asset.format ?? "jpg";
    const m = asset.metadata ?? {};

    // Sanitize a metadata value for use in a filename
    const slug = (val) =>
      (val ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");

    const projectFolder = slug(m.project) || baseName;
    const descPart      = slug(m.description_title);
    const yearPart      = slug(m.year);

    // {project}_{description_title}_{year}.{ext} — omit empty parts
    const imageFilename = [projectFolder, descPart, yearPart]
      .filter(Boolean)
      .join("_") + `.${ext}`;

    const yamlPath = path.join(YAML_OUTPUT_DIR, `${baseName}.yaml`);
    if (fs.existsSync(yamlPath)) {
      console.log(`⏭  Skipping (already exists): ${baseName}.yaml`);
      skipped++;
      continue;
    }

    // Download image into src/assets/projects/{projectFolder}/
    const imageDir = path.join(ASSETS_BASE_DIR, projectFolder);
    fs.mkdirSync(imageDir, { recursive: true });
    const imageDest = path.join(imageDir, imageFilename);
    console.log(`⬇  Downloading: ${projectFolder}/${imageFilename}`);
    await downloadImage(asset.secure_url, imageDest);

    const src = `/src/assets/projects/${projectFolder}/${imageFilename}`;
    const tags = asset.tags ?? [];

    const entry = {
      src,
      cloudinary_url: asset.secure_url,
      width: asset.width,
      height: asset.height,
      tags,
      metadata: {
        project:                m.project               ?? null,
        description_title:      m.description_title     ?? null,
        description_text:       m.description_text      ?? null,
        showInPortfolioGallery: m.showInPortfolioGallery ?? "no",
        portfolioOrder:         m.portfolioOrder         ?? 9,
        showInProjectGallery:   m.showInProjectGallery   ?? "no",
        projectGalleryOrder:    m.projectGalleryOrder    ?? null,
        showInIndex:            m.showInIndex            ?? "yes",
        year:                   m.year                  ?? asset.created_at?.slice(0, 6).replace("-", "") ?? "",
        client:                 m.client                ?? null,
        collaborators:          m.collaborators         ?? null,
        role:                   m.role                  ?? null,
        program:                m.program               ?? null,
        topic:                  m.topic                 ?? null,
        link:                   m.link                  ?? null,
        highres_public_id:      m.highres_public_id     ?? null,
      },
    };

    fs.writeFileSync(yamlPath, yaml.dump(entry, { lineWidth: -1 }));
    console.log(`✅ Created: ${baseName}.yaml`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
