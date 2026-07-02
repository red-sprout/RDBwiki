import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/lib/auth";
import { listAllDocuments } from "@/lib/documents";

export default async function AdminPage() {
  await requireAdmin();
  const documents = await listAllDocuments();
  const published = documents.filter((doc) => doc.status === "published").length;
  const draft = documents.filter((doc) => doc.status === "draft").length;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Documents" value={documents.length} />
        <Metric label="Published" value={published} />
        <Metric label="Drafts" value={draft} />
      </div>
      <div className="mt-8">
        <Link href="/admin/documents/new" className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">New document</Link>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 dark:bg-slate-950">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
