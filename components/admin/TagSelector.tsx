import type { Tag } from "@/types/tag";

export function TagSelector({ tags, selectedIds = [] }: { tags: Tag[]; selectedIds?: string[] }) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-3 dark:bg-slate-950">
      {tags.map((tag) => (
        <label key={tag.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="tag_ids" value={tag.id} defaultChecked={selectedIds.includes(tag.id)} className="h-4 w-4 rounded border-border" />
          <span>{tag.name}</span>
          <span className="text-xs text-muted-foreground">{tag.type}</span>
        </label>
      ))}
    </div>
  );
}
