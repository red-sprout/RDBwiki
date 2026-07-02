import Link from "next/link";
import type { WikiDocument } from "@/types/document";
import { Button } from "@/components/ui/Button";
import { TagBadge } from "@/components/docs/TagBadge";

export function DocumentTable({
  documents,
  archiveAction,
  deleteAction
}: {
  documents: WikiDocument[];
  archiveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-950">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="border-b border-border bg-slate-50 text-left dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Slug</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Tags</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{document.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{document.slug}</td>
              <td className="px-4 py-3">{document.category}</td>
              <td className="px-4 py-3">{document.status}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {document.tags?.slice(0, 3).map((tag) => <TagBadge key={tag.id} tag={tag} />)}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(document.updated_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/admin/documents/${document.id}/edit`} className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">Edit</Link>
                  <form action={archiveAction}>
                    <input type="hidden" name="id" value={document.id} />
                    <Button type="submit" variant="secondary">Archive</Button>
                  </form>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={document.id} />
                    <Button type="submit" variant="danger">Delete</Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
