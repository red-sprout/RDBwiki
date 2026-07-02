import Link from "next/link";
import type { WikiDocument } from "@/types/document";
import { categoryLabels, dbmsItems, docHref } from "@/lib/routes";

export function Sidebar({ documents }: { documents: WikiDocument[] }) {
  const groups = Object.entries(categoryLabels).map(([category, label]) => ({
    category,
    label,
    documents: documents.filter((doc) => doc.category === category)
  }));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">DBMS</div>
          <div className="space-y-1">
            {dbmsItems.map((dbms) => (
              <Link key={dbms} href={`/dbms/${dbms}`} className="block rounded-md px-2 py-1.5 text-sm capitalize text-muted-foreground hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white">
                {dbms}
              </Link>
            ))}
          </div>
        </div>
        {groups.map((group) => (
          <div key={group.category} className="mb-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>
            <div className="space-y-1">
              {group.documents.map((document) => (
                <Link key={document.id} href={docHref(document.slug)} className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white">
                  {document.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
