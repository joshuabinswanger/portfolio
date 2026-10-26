import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatListSummary,
  getProjectFacts,
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
      { label: "Role", value: "Design" },
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
