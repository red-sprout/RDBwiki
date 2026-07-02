"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentCategory, DocumentInput, DocumentStatus } from "@/types/document";
import { archiveDocument, createDocument, softDeleteDocument, updateDocument } from "@/lib/documents";
import { requireAdmin } from "@/lib/auth";

function readDocumentInput(formData: FormData): DocumentInput {
  const intent = String(formData.get("intent") ?? "");
  const status = intent === "publish" ? "published" : intent === "draft" ? "draft" : String(formData.get("status"));
  const officialDocs = [0, 1, 2, 3, 4].map((index) => ({
    dbms: String(formData.get(`official_docs.${index}.dbms`) ?? ""),
    title: String(formData.get(`official_docs.${index}.title`) ?? ""),
    url: String(formData.get(`official_docs.${index}.url`) ?? ""),
    note: String(formData.get(`official_docs.${index}.note`) ?? "") || null,
    version: String(formData.get(`official_docs.${index}.version`) ?? "") || null
  }));

  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    content: String(formData.get("content") ?? ""),
    category: String(formData.get("category") ?? "concept") as DocumentCategory,
    level: String(formData.get("level") ?? "") || null,
    status: status as DocumentStatus,
    tag_ids: formData.getAll("tag_ids").map(String),
    official_docs: officialDocs
  };
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
  await archiveDocument(String(formData.get("id")));
  revalidatePath("/");
  revalidatePath("/admin/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  await requireAdmin();
  await softDeleteDocument(String(formData.get("id")));
  revalidatePath("/");
  revalidatePath("/admin/documents");
}
