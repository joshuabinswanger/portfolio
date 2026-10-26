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
