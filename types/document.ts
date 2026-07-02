import type { OfficialDoc } from "./official-doc";
import type { Tag } from "./tag";

export type DocumentCategory = "concept" | "dbms" | "advanced" | "case";
export type DocumentStatus = "draft" | "published" | "archived";

export type WikiDocument = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: DocumentCategory;
  level: string | null;
  status: DocumentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tags?: Tag[];
  official_docs?: OfficialDoc[];
  related_documents?: WikiDocument[];
};

export type DocumentInput = {
  title: string;
  slug: string;
  description?: string | null;
  content: string;
  category: DocumentCategory;
  level?: string | null;
  status: DocumentStatus;
  tag_ids?: string[];
  official_docs?: Array<{
    dbms: string;
    title: string;
    url: string;
    note?: string | null;
    version?: string | null;
  }>;
  related_document_ids?: string[];
};
