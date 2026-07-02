import type { WikiDocument } from "@/types/document";
import { listPublishedDocuments } from "./documents";

export async function searchDocuments(query: string, documents?: WikiDocument[]): Promise<WikiDocument[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const searchableDocuments = documents ?? await listPublishedDocuments();
  return searchableDocuments.filter((doc) => {
    const haystack = [
      doc.title,
      doc.description ?? "",
      doc.content,
      ...(doc.tags?.map((tag) => tag.name) ?? [])
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
