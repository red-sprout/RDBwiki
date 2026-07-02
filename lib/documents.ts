import type { DocumentInput, WikiDocument } from "@/types/document";
import { getDbmsSections, normalizeDbmsFilter } from "./dbms-filter";
import { seedDocuments } from "./seed";
import { tagPathSegment } from "./routes";
import { createAdminClient, hasSupabaseAdminEnv } from "./supabase/admin";
import { createClient, hasSupabaseEnv } from "./supabase/server";

const documentSelect = `
  *,
  tags:document_tags(tags(*)),
  official_docs(*)
`;

const dbmsPageCategoryRank: Record<WikiDocument["category"], number> = {
  dbms: 0,
  concept: 1,
  advanced: 2,
  case: 3
};

const dbmsPageTopicRank: Record<string, number> = {
  architecture: 0,
  index: 10,
  mvcc: 20,
  "transaction-isolation": 30,
  lock: 40,
  "execution-plan": 50,
  "optimizer-statistics": 60,
  partitioning: 100,
  replication: 110,
  "materialized-view": 120,
  "json-jsonb": 130,
  "full-text-search": 140,
  "monitoring-observability": 150,
  "large-upload": 200,
  "batch-insert": 210,
  "read-replica": 220,
  "large-table-migration": 230,
  "backup-recovery": 240,
  "connection-pool-exhaustion": 250,
  "deadlock-analysis": 260,
  "slow-query-tuning": 270
};

function normalizeDocument(row: any): WikiDocument {
  return {
    ...row,
    tags: row.tags?.map((item: any) => item.tags).filter(Boolean) ?? [],
    official_docs: row.official_docs ?? []
  };
}

export async function listPublishedDocuments(): Promise<WikiDocument[]> {
  if (!hasSupabaseEnv()) return seedDocuments.filter((doc) => doc.status === "published");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("slug");

  if (error) throw new Error(`Failed to list published documents: ${error.message}`);
  if (!data) return [];
  return data.map(normalizeDocument);
}

export async function listAllDocuments(): Promise<WikiDocument[]> {
  if (!hasSupabaseAdminEnv()) return seedDocuments;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list admin documents: ${error.message}`);
  if (!data) return [];
  return data.map(normalizeDocument);
}

export async function getPublishedDocumentBySlug(slug: string): Promise<WikiDocument | null> {
  if (!hasSupabaseEnv()) {
    return seedDocuments.find((doc) => doc.slug === slug && doc.status === "published") ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return normalizeDocument(data);
}

export async function getAdminDocumentById(id: string): Promise<WikiDocument | null> {
  if (!hasSupabaseAdminEnv()) return seedDocuments.find((doc) => doc.id === id) ?? null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return normalizeDocument(data);
}

export async function listDocumentsByCategory(category: WikiDocument["category"]) {
  const documents = await listPublishedDocuments();
  return documents.filter((doc) => doc.category === category);
}

export async function listDocumentsByDbms(dbms: string) {
  const documents = await listPublishedDocuments();
  return filterDocumentsByDbms(documents, dbms);
}

export function filterDocumentsByDbms(documents: WikiDocument[], dbms: string) {
  const normalizedDbms = normalizeDbmsFilter(dbms);
  if (!normalizedDbms) return [];

  return documents
    .filter((doc) => {
      const slug = doc.slug.toLowerCase().replace(/^\/+/, "");
      const slugMatch = slug.startsWith(`dbms/${normalizedDbms}/`);
      const tagMatch = doc.tags?.some((tag) => tagPathSegment(tag.name) === normalizedDbms);
      const sectionMatch = getDbmsSections(doc.content).includes(normalizedDbms);
      return slugMatch || tagMatch || sectionMatch;
    })
    .sort(compareDbmsPageDocuments);
}

function compareDbmsPageDocuments(a: WikiDocument, b: WikiDocument) {
  return (
    dbmsPageCategoryRank[a.category] - dbmsPageCategoryRank[b.category] ||
    topicRank(a.slug) - topicRank(b.slug) ||
    a.title.localeCompare(b.title) ||
    a.slug.localeCompare(b.slug)
  );
}

function topicRank(slug: string) {
  const topic = slug.toLowerCase().replace(/^\/+/, "").split("/").at(-1) ?? "";
  return dbmsPageTopicRank[topic] ?? 999;
}

export async function listDocumentsByTag(tag: string) {
  const documents = await listPublishedDocuments();
  return filterDocumentsByTag(documents, tag);
}

export function filterDocumentsByTag(documents: WikiDocument[], tag: string) {
  const normalizedTag = tagPathSegment(decodeURIComponent(tag));
  return documents.filter((doc) =>
    doc.tags?.some((item) => tagPathSegment(item.name) === normalizedTag)
  );
}

export async function createDocument(input: DocumentInput) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description,
      content: input.content,
      category: input.category,
      level: input.level,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Document was created without an id.");
  await replaceDocumentJoins(data.id, input);
  return data.id as string;
}

export async function updateDocument(id: string, input: DocumentInput) {
  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("documents")
    .select("published_at")
    .eq("id", id)
    .single();

  if (existingError) throw new Error(existingError.message);

  const { error } = await supabase
    .from("documents")
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description,
      content: input.content,
      category: input.category,
      level: input.level,
      status: input.status,
      published_at: input.status === "published" ? existing?.published_at ?? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  await replaceDocumentJoins(id, input);
}

export async function archiveDocument(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("documents")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteDocument(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function replaceDocumentJoins(documentId: string, input: DocumentInput) {
  const supabase = createAdminClient();
  const officialDocs = input.official_docs?.filter((doc) => doc.title && doc.url) ?? [];
  const { error } = await supabase.rpc("replace_document_joins", {
    p_document_id: documentId,
    p_tag_ids: input.tag_ids ?? [],
    p_official_docs: officialDocs
  });
  if (error) throw new Error(error.message);
}
