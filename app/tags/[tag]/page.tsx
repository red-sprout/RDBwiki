import { DocCard } from "@/components/docs/DocCard";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { listDocumentsByTag, listPublishedDocuments } from "@/lib/documents";
import { tagPathSegment } from "@/lib/routes";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const documents = await listPublishedDocuments();
  const tagDocs = await listDocumentsByTag(tag);
  const label =
    documents
      .flatMap((document) => document.tags ?? [])
      .find((item) => tagPathSegment(item.name) === tagPathSegment(tag))?.name ?? decodeURIComponent(tag);

  return (
    <DocsLayout documents={documents}>
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">#{label}</h1>
        <p className="mt-3 text-muted-foreground">이 태그와 연결된 문서입니다.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tagDocs.map((document) => <DocCard key={document.id} document={document} />)}
        </div>
      </div>
    </DocsLayout>
  );
}
