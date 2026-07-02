import { DocCard } from "@/components/docs/DocCard";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { listDocumentsByCategory, listPublishedDocuments } from "@/lib/documents";

export default async function AdvancedPage() {
  const documents = await listPublishedDocuments();
  const advancedDocs = await listDocumentsByCategory("advanced");

  return (
    <DocsLayout documents={documents}>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Advanced</h1>
        <p className="mt-3 text-muted-foreground">Partitioning, Replication, Materialized View 같은 고급 기능 카탈로그입니다.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {advancedDocs.map((document) => <DocCard key={document.id} document={document} />)}
        </div>
      </div>
    </DocsLayout>
  );
}
