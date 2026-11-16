import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyImageMetaChanges,
  parseImageMetaChanges,
} from "../../src/dev/imageMeta.ts";

const RAW = `src: /src/assets/projects/x/a.webp
width: 1400
height: 2000
tags:
  - 2D
  - Creature
metadata:
  project: chromaticdragons
  description_title: Mycen
  description_text: Inspired by dragons
  showInPortfolioGallery: 'no'
  showInProjectGallery: 'no'
  showInIndex: 'yes'
  year: '2025'
  role: Illustration, 2D
  topic: null
`;

test("parseImageMetaChanges trims text and turns blanks into null", () => {
  const changes = parseImageMetaChanges({
    metadata: { description_title: "  Abram ", topic: "", year: " 2019 " },
  });
  assert.deepEqual(changes.metadata, {
    description_title: "Abram",
    topic: null,
    year: "2019",
  });
});

test("parseImageMetaChanges rejects bad years, flags and unknown fields", () => {
  assert.throws(
    () => parseImageMetaChanges({ metadata: { year: "201905" } }),
    /YYYY/,
  );
  assert.throws(
    () => parseImageMetaChanges({ metadata: { showInIndex: "true" } }),
    /yes" or "no/,
  );
  assert.throws(
    () => parseImageMetaChanges({ metadata: { src: "x" } }),
    /Unknown field/,
  );
});

test("applyImageMetaChanges edits one line and keeps quoting", () => {
  const out = applyImageMetaChanges(RAW, { metadata: { year: "2019" } });
  assert.equal(out, RAW.replace("year: '2025'", "year: '2019'"));
});

test("applyImageMetaChanges returns the input untouched when nothing differs", () => {
  const out = applyImageMetaChanges(RAW, {
    metadata: { description_title: "Mycen", topic: null, showInIndex: "yes" },
    tags: ["2D", "Creature"],
  });
  assert.equal(out, RAW);
});

test("applyImageMetaChanges sets null fields and replaces tags", () => {
  const out = applyImageMetaChanges(RAW, {
    metadata: { topic: "Fantasy" },
    tags: ["2D"],
  });
  assert.match(out, /^ {2}topic: Fantasy$/m);
  assert.match(out, /^tags:\n {2}- 2D\nmetadata:/m);
});

test("applyImageMetaChanges adds a missing field to metadata", () => {
  const out = applyImageMetaChanges(RAW, {
    metadata: { program: "Procreate" },
  });
  assert.match(out, /^ {2}program: Procreate$/m);
});
