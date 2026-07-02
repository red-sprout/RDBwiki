import { extractToc } from "@/lib/toc";

export function TableOfContents({ content }: { content: string }) {
  const items = extractToc(content);

  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-20 border-l border-border pl-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</div>
        <nav className="space-y-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={item.depth === 3 ? "block pl-3 text-sm text-muted-foreground hover:text-slate-950 dark:hover:text-white" : "block text-sm text-muted-foreground hover:text-slate-950 dark:hover:text-white"}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
