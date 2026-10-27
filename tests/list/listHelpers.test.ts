import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatListSummary,
  getPerView,
  getProjectFacts,
  pickPreviewSrc,
  placePreview,
  shouldShowSliderControls,
} from "../../src/components/list/listHelpers.ts";

test("formatListSummary counts projects and spans first 4 year digits", () => {
  assert.equal(
    formatListSummary(["202504", "2024", "201906"]),
    "3 Projects · 2019 – 2025",
  );
});
test("formatListSummary collapses a single year and singularises", () => {
  assert.equal(formatListSummary(["202409"]), "1 Project · 2024");
  assert.equal(formatListSummary(["2024", "202412"]), "2 Projects · 2024");
});
test("formatListSummary handles an empty list", () => {
  assert.equal(formatListSummary([]), "0 Projects");
});
test("getProjectFacts keeps spec order and labels", () => {
  assert.deepEqual(
    getProjectFacts({
      collaborators: "A, B",
      tools: "Houdini",
      role: "Design",
      client: "HNE",
    }),
    [
      { label: "Client", value: "HNE" },
      { label: "Type", value: "Design" },
      { label: "Tools", value: "Houdini" },
      { label: "With", value: "A, B" },
    ],
  );
});
test("getProjectFacts omits empty and whitespace values", () => {
  assert.deepEqual(
    getProjectFacts({ client: " SLF ", collaborators: "", tools: "   " }),
    [{ label: "Client", value: "SLF" }],
  );
});

const vp = { width: 1440, height: 900 };
const img = { width: 220, height: 275 };
test("placePreview sits 20px right and 14px below the pointer", () => {
  assert.deepEqual(placePreview({ x: 600, y: 200 }, img, vp), {
    x: 620,
    y: 214,
  });
});
test("placePreview flips left of the pointer near the right edge", () => {
  assert.deepEqual(placePreview({ x: 1300, y: 200 }, img, vp), {
    x: 1060,
    y: 214,
  });
});
test("placePreview pulls up near the bottom edge", () => {
  assert.deepEqual(placePreview({ x: 600, y: 800 }, img, vp), {
    x: 620,
    y: 617,
  });
});
test("placePreview never leaves the top-left margin", () => {
  assert.deepEqual(
    placePreview(
      { x: 100, y: 10 },
      { width: 220, height: 2000 },
      { width: 300, height: 900 },
    ),
    { x: 8, y: 8 },
  );
});
test("pickPreviewSrc prefers the first image", () => {
  assert.equal(
    pickPreviewSrc([
      { data: { mediaType: "video", posterSrc: "/p.webp" } },
      { data: { src: "/a.webp" } },
      { data: { mediaType: "image", src: "/b.webp" } },
    ]),
    "/a.webp",
  );
});
test("pickPreviewSrc falls back to a video poster, then null", () => {
  assert.equal(
    pickPreviewSrc([{ data: { mediaType: "video", posterSrc: "/p.webp" } }]),
    "/p.webp",
  );
  assert.equal(pickPreviewSrc([]), null);
});
test("shouldShowSliderControls only when slides overflow the view", () => {
  assert.equal(shouldShowSliderControls(3, 4), false);
  assert.equal(shouldShowSliderControls(4, 4), false);
  assert.equal(shouldShowSliderControls(5, 4), true);
  assert.equal(shouldShowSliderControls(1, 1.2), false);
  assert.equal(shouldShowSliderControls(2, 1.2), true);
});

test("getPerView peeks when slides overflow, fills the row when they do not", () => {
  assert.equal(getPerView(6, 3.5), 3.5);
  assert.equal(getPerView(4, 3.5), 3.5);
  assert.equal(getPerView(3, 3.5), 3);
  assert.equal(getPerView(2, 3.5), 2);
  assert.equal(getPerView(2, 1.2), 1.2);
  assert.equal(getPerView(1, 1.2), 1);
  assert.equal(getPerView(0, 3.5), 1);
});
