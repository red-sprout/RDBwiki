import { DocCard } from "@/components/docs/DocCard";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { listDocumentsByCategory, listPublishedDocuments } from "@/lib/documents";

export default async function CasesPage() {
  const documents = await listPublishedDocuments();
  const caseDocs = await listDocumentsByCategory("case");

  return (
    <DocsLayout documents={documents}>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Cases</h1>
        <p className="mt-3 text-muted-foreground">실무 문제를 해결할 때 바로 참고할 수 있는 운영 케이스입니다.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {caseDocs.map((document) => <DocCard key={document.id} document={document} />)}
        </div>
      </div>
    </DocsLayout>
  );
}
