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

export function detectSqlDialect(code: string): DbmsFilter | null {
  const normalized = code.toLowerCase();

  if (
    normalized.includes("performance_schema") ||
    normalized.includes("information_schema.innodb") ||
    normalized.includes("json_unquote") ||
    normalized.includes("json_extract") ||
    normalized.includes("show engine innodb") ||
    normalized.includes("show processlist")
  ) {
    return "mysql";
  }

  if (
    normalized.includes("pg_stat") ||
    normalized.includes("pg_locks") ||
    normalized.includes("pg_blocking_pids") ||
    normalized.includes("jsonb") ||
    normalized.includes("->>") ||
    normalized.includes(" ilike ")
  ) {
    return "postgresql";
  }

  if (
    normalized.includes("v$") ||
    normalized.includes("dbms_") ||
    normalized.includes("json_value") ||
    normalized.includes("json_table") ||
    normalized.includes("varchar2") ||
    normalized.includes("fetch first")
  ) {
    return "oracle";
  }

  return null;
}

export function filterMarkdownByDbms(markdown: string, selectedDbms: DbmsFilter | null) {
  if (!selectedDbms) return markdown;

  const lines = markdown.split("\n");
  const filtered: string[] = [];
  let activeDbmsSection: DbmsFilter | null = null;
  let activeCodeFenceLanguage: string | null = null;
  let activeCodeFenceLines: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const codeFence = line.match(/^```\s*([A-Za-z0-9_-]+)?\s*$/);
    if (codeFence && activeCodeFenceLanguage === null) {
      activeCodeFenceLanguage = codeFence[1]?.toLowerCase() ?? "";
      activeCodeFenceLines = [line];
      continue;
    }

    if (line.match(/^```\s*$/) && activeCodeFenceLanguage !== null) {
      activeCodeFenceLines.push(line);
      const explicitDbms = normalizeDbmsFilter(activeCodeFenceLanguage);
      const inferredDbms = activeCodeFenceLanguage === "sql" ? detectSqlDialect(activeCodeFenceLines.slice(1, -1).join("\n")) : null;
      const codeFenceDbms = explicitDbms ?? inferredDbms;

      if (!skipping && (!codeFenceDbms || codeFenceDbms === selectedDbms)) {
        filtered.push(...activeCodeFenceLines);
      }

      activeCodeFenceLanguage = null;
      activeCodeFenceLines = [];
      continue;
    }

    if (activeCodeFenceLanguage !== null) {
      activeCodeFenceLines.push(line);
      continue;
    }

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
