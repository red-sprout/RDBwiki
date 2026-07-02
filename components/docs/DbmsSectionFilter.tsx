import Link from "next/link";
import { clsx } from "clsx";
import type { DbmsFilter } from "@/lib/dbms-filter";
import { dbmsFilterLabel } from "@/lib/dbms-filter";
import { docHref } from "@/lib/routes";

export function DbmsSectionFilter({
  slug,
  availableDbms,
  selectedDbms
}: {
  slug: string;
  availableDbms: DbmsFilter[];
  selectedDbms: DbmsFilter | null;
}) {
  if (availableDbms.length < 2) return null;

  return (
    <div className="mb-6 rounded-lg border border-border bg-slate-50 p-3 dark:bg-slate-900">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section filter</div>
      <div className="flex flex-wrap gap-2">
        <FilterLink href={docHref(slug)} active={!selectedDbms}>All</FilterLink>
        {availableDbms.map((dbms) => (
          <FilterLink key={dbms} href={`${docHref(slug)}?dbms=${dbms}`} active={selectedDbms === dbms}>
            {dbmsFilterLabel(dbms)}
          </FilterLink>
        ))}
      </div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors",
        active
          ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
          : "border-border bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
      )}
    >
      {children}
    </Link>
  );
}
