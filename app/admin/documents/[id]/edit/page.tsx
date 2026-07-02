import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DocumentForm } from "@/components/admin/DocumentForm";
import { requireAdmin } from "@/lib/auth";
import { getAdminDocumentById } from "@/lib/documents";
import { listTags } from "@/lib/tags";
import { updateDocumentAction } from "../../actions";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const [document, tags] = await Promise.all([getAdminDocumentById(id), listTags()]);
  if (!document) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateDocumentAction(id, formData);
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-semibold">Edit document</h1>
      <DocumentForm document={document} tags={tags} action={action} />
    </AdminLayout>
  );
}
