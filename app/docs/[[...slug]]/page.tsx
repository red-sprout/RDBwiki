import { notFound } from "next/navigation";
import { DbmsSectionFilter } from "@/components/docs/DbmsSectionFilter";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer";
import { OfficialDocCard } from "@/components/docs/OfficialDocCard";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { TagBadge } from "@/components/docs/TagBadge";
import {
  dbmsFilterLabel,
  filterMarkdownByDbms,
  getDbmsSections,
  normalizeDbmsFilter
} from "@/lib/dbms-filter";
import { listPublishedDocuments } from "@/lib/documents";
import { docHref, tagPathSegment } from "@/lib/routes";

export default async function DocPage({
  params,
  searchParams
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<{ dbms?: string }>;
}) {
  const { slug: slugParts } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const documents = await listPublishedDocuments();
  const slug = normalizeSlug(slugParts?.join("/") ?? "concepts/mvcc");
  const document = documents.find((item) => normalizeSlug(item.slug) === slug);

  if (!document) notFound();

  const availableDbms = getDbmsSections(document.content);
  const requestedDbms = normalizeDbmsFilter(resolvedSearchParams.dbms);
  const activeDbms = requestedDbms && availableDbms.includes(requestedDbms) ? requestedDbms : null;
  const content = filterMarkdownByDbms(document.content, activeDbms);
  const officialDocs = activeDbms
    ? document.official_docs?.filter((doc) => tagPathSegment(doc.dbms) === activeDbms)
    : document.official_docs;

  return (
    <DocsLayout documents={documents}>
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {document.tags?.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  href={dbmsTagHref(tag.name, slug, availableDbms)}
                />
              ))}
            </div>
            {document.description ? <p className="text-lg text-muted-foreground">{document.description}</p> : null}
            {activeDbms ? (
              <p className="mt-3 text-sm text-muted-foreground">
                현재 문서는 {dbmsFilterLabel(activeDbms)} 섹션만 표시하고 있습니다.
              </p>
            ) : null}
          </div>
          <DbmsSectionFilter slug={slug} availableDbms={availableDbms} selectedDbms={activeDbms} />
          <MarkdownRenderer content={content} />
          {officialDocs?.length ? (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="mb-4 text-xl font-semibold">Official references</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {officialDocs.map((doc) => <OfficialDocCard key={doc.id} doc={doc} />)}
              </div>
            </section>
          ) : null}
        </div>
        <TableOfContents content={content} />
      </div>
    </DocsLayout>
  );
}

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug).replace(/^\/+/, "").replace(/\/+$/, "");
}

function dbmsTagHref(tagName: string, slug: string, availableDbms: ReturnType<typeof getDbmsSections>) {
  const normalizedTag = tagPathSegment(tagName);
  const matchingDbms = availableDbms.find((dbms) => dbms === normalizedTag);
  return matchingDbms ? `${docHref(slug)}?dbms=${matchingDbms}` : undefined;
}
