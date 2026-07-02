import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DocumentTable } from "@/components/admin/DocumentTable";
import { requireAdmin } from "@/lib/auth";
import { listAllDocuments } from "@/lib/documents";
import { archiveDocumentAction, deleteDocumentAction } from "./actions";

export default async function DocumentsPage() {
  await requireAdmin();
  const documents = await listAllDocuments();

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Documents</h1>
          <p className="mt-2 text-sm text-muted-foreground">문서 작성, 수정, 보관, 삭제를 관리합니다.</p>
        </div>
        <Link href="/admin/documents/new" className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">New</Link>
      </div>
      <DocumentTable documents={documents} archiveAction={archiveDocumentAction} deleteAction={deleteDocumentAction} />
    </AdminLayout>
  );
}
