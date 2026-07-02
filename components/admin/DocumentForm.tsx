import type { WikiDocument } from "@/types/document";
import type { Tag } from "@/types/tag";
import { Button } from "@/components/ui/Button";
import { MarkdownEditor } from "./MarkdownEditor";
import { OfficialDocEditor } from "./OfficialDocEditor";
import { TagSelector } from "./TagSelector";

export function DocumentForm({
  document,
  tags,
  action
}: {
  document?: WikiDocument | null;
  tags: Tag[];
  action: (formData: FormData) => Promise<void>;
}) {
  const selectedIds = document?.tags?.map((tag) => tag.id) ?? [];

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title" name="title" defaultValue={document?.title} required />
        <Field label="Slug" name="slug" defaultValue={document?.slug} required placeholder="concepts/mvcc" />
        <div className="lg:col-span-2">
          <Field label="Description" name="description" defaultValue={document?.description ?? ""} />
        </div>
        <Select label="Category" name="category" defaultValue={document?.category ?? "concept"} options={["concept", "dbms", "advanced", "case"]} />
        <Select label="Status" name="status" defaultValue={document?.status ?? "draft"} options={["draft", "published", "archived"]} />
        <Field label="Level" name="level" defaultValue={document?.level ?? ""} placeholder="reference, operation, internal" />
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Tags</h2>
        <TagSelector tags={tags} selectedIds={selectedIds} />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Markdown</h2>
        <MarkdownEditor initialValue={document?.content ?? "# New Document\n\n"} />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Official Docs</h2>
        <OfficialDocEditor docs={document?.official_docs} />
      </section>

      <div className="flex gap-2">
        <Button type="submit">{document ? "Update" : "Create"}</Button>
        <Button type="submit" name="intent" value="publish" variant="secondary">Publish</Button>
        <Button type="submit" name="intent" value="draft" variant="secondary">Save draft</Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950" />
    </label>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select name={name} defaultValue={defaultValue} className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
