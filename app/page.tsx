import { DocCard } from "@/components/docs/DocCard";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { listPublishedDocuments } from "@/lib/documents";
import { searchDocuments } from "@/lib/search";

export default async function Home({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const q = resolvedSearchParams.q ?? "";
  const documents = await listPublishedDocuments();
  const results = q ? await searchDocuments(q) : documents;

  return (
    <DocsLayout documents={documents}>
      <div className="mx-auto max-w-5xl">
        <section className="border-b border-border pb-10">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">MySQL · PostgreSQL · Oracle</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950 dark:text-white md:text-5xl">RDB Wiki</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            DBMS별 아키텍처, 내부 구조, 고급 기능, 실무 패턴을 공식문서 기준으로 비교하는 기술 문서 위키입니다.
          </p>
        </section>

        <section className="py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{q ? `"${q}" 검색 결과` : "Documents"}</h2>
            <span className="text-sm text-muted-foreground">{results.length} documents</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((document) => <DocCard key={document.id} document={document} />)}
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
