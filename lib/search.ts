import type { WikiDocument } from "@/types/document";
import { listPublishedDocuments } from "./documents";

export async function searchDocuments(query: string): Promise<WikiDocument[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const documents = await listPublishedDocuments();
  return documents.filter((doc) => {
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
