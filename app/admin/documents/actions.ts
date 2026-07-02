"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentCategory, DocumentInput, DocumentStatus } from "@/types/document";
import { archiveDocument, createDocument, softDeleteDocument, updateDocument } from "@/lib/documents";
import { requireAdmin } from "@/lib/auth";

const documentCategories = new Set<DocumentCategory>(["concept", "dbms", "advanced", "case"]);
const documentStatuses = new Set<DocumentStatus>(["draft", "published", "archived"]);
const slugPattern = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxOfficialDocs = 50;

function readDocumentInput(formData: FormData): DocumentInput {
  const intent = String(formData.get("intent") ?? "");
  const status = parseStatus(intent === "publish" ? "published" : intent === "draft" ? "draft" : formData.get("status"));
  const category = parseCategory(formData.get("category"));
  const officialDocCount = Math.min(maxOfficialDocs, Math.max(0, Number(formData.get("official_docs_count") ?? 0) || 0));
  const officialDocs = Array.from({ length: officialDocCount }, (_, index) => ({
    dbms: clean(formData.get(`official_docs.${index}.dbms`)),
    title: clean(formData.get(`official_docs.${index}.title`)),
    url: clean(formData.get(`official_docs.${index}.url`)),
    note: clean(formData.get(`official_docs.${index}.note`)) || null,
    version: clean(formData.get(`official_docs.${index}.version`)) || null
  }));
  validateOfficialDocs(officialDocs);

  const title = clean(formData.get("title"));
  const slug = normalizeSlug(formData.get("slug"));
  const content = String(formData.get("content") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  if (!slugPattern.test(slug)) throw new Error("Slug must contain lowercase letters, numbers, /, or -.");
  if (!content) throw new Error("Content is required.");

  return {
    title,
    slug,
    description: clean(formData.get("description")) || null,
    content,
    category,
    level: clean(formData.get("level")) || null,
    status,
    tag_ids: formData.getAll("tag_ids").map(String).filter((id) => uuidPattern.test(id)),
    official_docs: officialDocs
  };
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeSlug(value: FormDataEntryValue | null) {
  return clean(value).toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
}

function parseCategory(value: FormDataEntryValue | null): DocumentCategory {
  const category = clean(value) as DocumentCategory;
  if (!documentCategories.has(category)) throw new Error("Invalid document category.");
  return category;
}

function parseStatus(value: FormDataEntryValue | null): DocumentStatus {
  const status = clean(value) as DocumentStatus;
  if (!documentStatuses.has(status)) throw new Error("Invalid document status.");
  return status;
}

function validateOfficialDocs(docs: NonNullable<DocumentInput["official_docs"]>) {
  for (const doc of docs) {
    if (!doc.title && !doc.url && !doc.dbms) continue;
    if (!doc.title || !doc.url) throw new Error("Official docs require both title and URL.");
    try {
      new URL(doc.url);
    } catch {
      throw new Error(`Invalid official docs URL: ${doc.url}`);
    }
  }
}

export async function createDocumentAction(formData: FormData) {
  await requireAdmin();
  await createDocument(readDocumentInput(formData));
  revalidatePath("/");
  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}

export async function updateDocumentAction(id: string, formData: FormData) {
  await requireAdmin();
  await updateDocument(id, readDocumentInput(formData));
  revalidatePath("/");
  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}

export async function archiveDocumentAction(formData: FormData) {
  await requireAdmin();
  const id = parseUuid(formData.get("id"));
  await archiveDocument(id);
  revalidatePath("/");
  revalidatePath("/admin/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  await requireAdmin();
  const id = parseUuid(formData.get("id"));
  await softDeleteDocument(id);
  revalidatePath("/");
  revalidatePath("/admin/documents");
}

function parseUuid(value: FormDataEntryValue | null) {
  const id = clean(value);
  if (!uuidPattern.test(id)) throw new Error("Valid document id is required.");
  return id;
}
