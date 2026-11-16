// Dev-server endpoint that saves the /dev/images edit forms back to the image
// YAML files. Mounted by the dev-image-review integration in astro.config.mjs,
// only under `astro dev`.
import { readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

import { applyImageMetaChanges, parseImageMetaChanges } from "./imageMeta";

export const IMAGE_META_ENDPOINT = "/dev/api/image-meta";

function send(res: ServerResponse, status: number, body: object) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}

export function createImageMetaMiddleware(root: string) {
  const imagesDir = path.join(root, "src/content/images");

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });

    // Requiring JSON forces a CORS preflight, which this endpoint never
    // answers, so other sites open in the browser cannot post here.
    if (!req.headers["content-type"]?.startsWith("application/json")) {
      return send(res, 415, { error: "Expected application/json" });
    }

    try {
      const { file, ...rest } = JSON.parse(await readBody(req));
      const target = path.resolve(root, String(file ?? ""));
      if (path.dirname(target) !== imagesDir || !target.endsWith(".yaml")) {
        return send(res, 400, { error: "Not an image YAML file" });
      }

      const changes = parseImageMetaChanges(rest);
      const raw = await readFile(target, "utf8");
      const updated = applyImageMetaChanges(raw, changes);
      if (updated !== raw) await writeFile(target, updated);

      send(res, 200, { ok: true, changed: updated !== raw });
    } catch (error) {
      send(res, 400, { error: (error as Error).message });
    }
  };
}
