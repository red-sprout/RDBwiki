import Link from "next/link";
import type { WikiDocument } from "@/types/document";
import { docHref } from "@/lib/routes";
import { TagBadge } from "./TagBadge";

export function DocCard({ document }: { document: WikiDocument }) {
  return (
    <Link
      href={docHref(document.slug)}
      className="block rounded-lg border border-border bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
    >
      <div className="text-base font-semibold text-slate-950 dark:text-white">{document.title}</div>
      {document.description ? <p className="mt-2 text-sm text-muted-foreground">{document.description}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {document.tags?.slice(0, 4).map((tag) => <TagBadge key={tag.id} tag={tag} linked={false} />)}
      </div>
    </Link>
  );
}
