import { notFound } from "next/navigation";
import { DocCard } from "@/components/docs/DocCard";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { dbmsItems } from "@/lib/routes";
import { listDocumentsByDbms, listPublishedDocuments } from "@/lib/documents";

export default async function DbmsPage({ params }: { params: Promise<{ dbms: string }> }) {
  const { dbms } = await params;
  if (!dbmsItems.includes(dbms as any)) notFound();
  const documents = await listPublishedDocuments();
  const dbmsDocs = await listDocumentsByDbms(dbms);

  return (
    <DocsLayout documents={documents}>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold capitalize">{dbms}</h1>
        <p className="mt-3 text-muted-foreground">DBMS별 문서와 비교 자료를 모아봅니다.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {dbmsDocs.map((document) => <DocCard key={document.id} document={document} />)}
        </div>
      </div>
    </DocsLayout>
  );
}
