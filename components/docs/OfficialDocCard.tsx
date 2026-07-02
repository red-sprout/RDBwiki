import { ExternalLink } from "lucide-react";
import type { OfficialDoc } from "@/types/official-doc";
import { DbmsBadge } from "./DbmsBadge";

export function OfficialDocCard({ doc }: { doc: OfficialDoc }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-border bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3">
        <DbmsBadge name={doc.dbms} />
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{doc.title}</div>
      {doc.note ? <p className="mt-1 text-sm text-muted-foreground">{doc.note}</p> : null}
      {doc.version ? <p className="mt-2 text-xs text-muted-foreground">Version: {doc.version}</p> : null}
    </a>
  );
}
