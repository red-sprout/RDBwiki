import { AdminLayout } from "@/components/admin/AdminLayout";
import { requireAdmin } from "@/lib/auth";
import { listOfficialDocs } from "@/lib/official-docs";

export default async function OfficialDocsPage() {
  await requireAdmin();
  const docs = await listOfficialDocs();

  return (
    <AdminLayout>
      <h1 className="text-3xl font-semibold">Official Docs</h1>
      <p className="mt-2 text-sm text-muted-foreground">공식문서 링크는 문서 작성/수정 화면에서 관리합니다.</p>
      <div className="mt-6 rounded-lg border border-border bg-white dark:bg-slate-950">
        {docs.length ? docs.map((doc) => (
          <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="block border-b border-border px-4 py-3 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900">
            <div className="font-medium">{doc.title}</div>
            <div className="text-sm text-muted-foreground">{doc.dbms} · {doc.url}</div>
          </a>
        )) : <div className="px-4 py-8 text-sm text-muted-foreground">No official docs yet.</div>}
      </div>
    </AdminLayout>
  );
}
