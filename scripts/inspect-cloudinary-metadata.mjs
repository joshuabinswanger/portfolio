/**
 * inspect-cloudinary-metadata.mjs
 *
 * Prints all structured metadata field definitions from your Cloudinary account,
 * plus a sample of context keys actually used on your assets.
 *
 * Run with:
 *   node scripts/inspect-cloudinary-metadata.mjs
 *
 * Prerequisites:
 *   npm install cloudinary dotenv
 */

import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// Astro prefixes public env vars with PUBLIC_ — fall back to unprefixed
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

const SAMPLE_FOLDER = "Portfolio/Gallery";

async function inspect() {
  // ── 1. Structured Metadata Fields ────────────────────────────────────────────
  // Uses the REST API directly since not all SDK versions expose this method.
  console.log("\n━━━ STRUCTURED METADATA FIELDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const url = `https://api.cloudinary.com/v1_1/${cloud_name}/metadata_fields`;
    const credentials = Buffer.from(`${api_key}:${api_secret}`).toString("base64");
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const { metadata_fields } = await res.json();

    if (!metadata_fields.length) {
      console.log("  (none — no structured metadata fields defined yet)");
    } else {
      for (const field of metadata_fields) {
        console.log(`  external_id : ${field.external_id}`);
        console.log(`  label       : ${field.label}`);
        console.log(`  type        : ${field.type}`);
        if (field.mandatory) console.log(`  mandatory   : true`);
        if (field.default_value !== undefined)
          console.log(`  default     : ${field.default_value}`);
        if (field.datasource?.values?.length) {
          const options = field.datasource.values.map((v) => v.value).join(", ");
          console.log(`  options     : ${options}`);
        }
        console.log("");
      }
    }
  } catch (err) {
    console.error("  Could not fetch metadata fields:", err.message);
  }

  // ── 2. Context Keys (sampled from assets) ────────────────────────────────────
  console.log("━━━ CONTEXT KEYS (sampled from assets) ━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  Sampling from: ${SAMPLE_FOLDER}\n`);

  try {
    const result = await cloudinary.search
      .expression(`resource_type:image AND folder:${SAMPLE_FOLDER}`)
      .with_field("context")
      .max_results(50)
      .execute();

    const keySet = new Set();
    for (const asset of result.resources) {
      const custom = asset.context?.custom ?? {};
      Object.keys(custom).forEach((k) => keySet.add(k));

      const topLevel = { ...asset.context };
      delete topLevel.custom;
      Object.keys(topLevel).forEach((k) => keySet.add(`[top-level] ${k}`));
    }

    if (!keySet.size) {
      console.log("  (no context keys found on sampled assets)");
    } else {
      console.log("  Keys found:");
      [...keySet].sort().forEach((k) => console.log(`    - ${k}`));
    }

    console.log(`\n  Assets sampled: ${result.resources.length}`);
  } catch (err) {
    console.error("  Could not sample context keys:", err.message);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

inspect();
