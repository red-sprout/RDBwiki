import type { DocumentCategory } from "@/types/document";

export const categoryLabels: Record<DocumentCategory, string> = {
  concept: "Concepts",
  dbms: "DBMS",
  advanced: "Advanced",
  case: "Cases"
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/advanced", label: "Advanced" },
  { href: "/cases", label: "Cases" },
  { href: "/admin", label: "Admin" }
];

export const dbmsItems = ["mysql", "postgresql", "oracle"] as const;

export function docHref(slug: string) {
  return `/docs/${slug.replace(/^\/+/, "")}`;
}

export function tagPathSegment(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function tagHref(name: string) {
  return `/tags/${tagPathSegment(name)}`;
}
