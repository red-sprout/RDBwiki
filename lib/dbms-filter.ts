export const dbmsFilterValues = ["mysql", "postgresql", "oracle"] as const;

export type DbmsFilter = (typeof dbmsFilterValues)[number];

const dbmsHeadingLabels: Record<DbmsFilter, string> = {
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  oracle: "Oracle"
};

const headingToFilter = new Map(
  Object.entries(dbmsHeadingLabels).map(([value, label]) => [label.toLowerCase(), value as DbmsFilter])
);

export function normalizeDbmsFilter(value: string | undefined): DbmsFilter | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return dbmsFilterValues.includes(normalized as DbmsFilter) ? (normalized as DbmsFilter) : null;
}

export function getDbmsSections(markdown: string): DbmsFilter[] {
  const sections = new Set<DbmsFilter>();
  for (const line of markdown.split("\n")) {
    const match = line.match(/^##\s+(MySQL|PostgreSQL|Oracle)\s*$/i);
    if (!match) continue;
    const dbms = headingToFilter.get(match[1].toLowerCase());
    if (dbms) sections.add(dbms);
  }
  return dbmsFilterValues.filter((dbms) => sections.has(dbms));
}

export function dbmsFilterLabel(dbms: DbmsFilter) {
  return dbmsHeadingLabels[dbms];
}

export function filterMarkdownByDbms(markdown: string, selectedDbms: DbmsFilter | null) {
  if (!selectedDbms) return markdown;

  const availableSections = getDbmsSections(markdown);
  if (!availableSections.includes(selectedDbms)) return markdown;

  const lines = markdown.split("\n");
  const filtered: string[] = [];
  let activeDbmsSection: DbmsFilter | null = null;
  let skipping = false;

  for (const line of lines) {
    const dbmsHeading = line.match(/^##\s+(MySQL|PostgreSQL|Oracle)\s*$/i);
    const h2Heading = line.match(/^##\s+/);

    if (dbmsHeading) {
      activeDbmsSection = headingToFilter.get(dbmsHeading[1].toLowerCase()) ?? null;
      skipping = activeDbmsSection !== selectedDbms;
    } else if (h2Heading) {
      activeDbmsSection = null;
      skipping = false;
    }

    if (!skipping) filtered.push(line);
  }

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n");
}
