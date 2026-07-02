import { AdminLayout } from "@/components/admin/AdminLayout";
import { DocumentForm } from "@/components/admin/DocumentForm";
import { requireAdmin } from "@/lib/auth";
import { listTags } from "@/lib/tags";
import { createDocumentAction } from "../actions";

export default async function NewDocumentPage() {
  await requireAdmin();
  const tags = await listTags();

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-semibold">New document</h1>
      <DocumentForm tags={tags} action={createDocumentAction} />
    </AdminLayout>
  );
}
