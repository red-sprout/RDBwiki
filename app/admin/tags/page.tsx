import { Button } from "@/components/ui/Button";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/lib/auth";
import { listTags } from "@/lib/tags";
import { createTagAction, deleteTagAction } from "./actions";

const tagTypes = ["DBMS", "TOPIC", "ADVANCED", "OPERATION", "CASE", "INTERNAL"];

export default async function TagsPage() {
  await requireAdmin();
  const tags = await listTags();

  return (
    <AdminLayout>
      <h1 className="text-3xl font-semibold">Tags</h1>
      <form action={createTagAction} className="mt-6 grid gap-3 rounded-lg border border-border bg-white p-4 md:grid-cols-[1fr_180px_auto] dark:bg-slate-950">
        <input name="name" required placeholder="Tag name" className="h-10 rounded-md border border-border bg-transparent px-3 text-sm" />
        <select name="type" className="h-10 rounded-md border border-border bg-transparent px-3 text-sm">
          {tagTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <Button type="submit">Create</Button>
      </form>
      <div className="mt-6 rounded-lg border border-border bg-white dark:bg-slate-950">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
            <div>
              <div className="font-medium">{tag.name}</div>
              <div className="text-xs text-muted-foreground">{tag.type}</div>
            </div>
            <form action={deleteTagAction}>
              <input type="hidden" name="id" value={tag.id} />
              <Button type="submit" variant="danger">Delete</Button>
            </form>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
