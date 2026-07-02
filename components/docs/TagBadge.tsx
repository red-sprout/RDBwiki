import Link from "next/link";
import type { Tag } from "@/types/tag";
import { tagHref } from "@/lib/routes";

const className =
  "inline-flex rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900";

export function TagBadge({ tag, linked = true, href }: { tag: Tag; linked?: boolean; href?: string }) {
  if (!linked) {
    return <span className={className}>{tag.name}</span>;
  }

  return (
    <Link
      href={href ?? tagHref(tag.name)}
      className={className}
    >
      {tag.name}
    </Link>
  );
}
