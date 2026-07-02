"use server";

import { revalidatePath } from "next/cache";
import type { TagType } from "@/types/tag";
import { requireAdmin } from "@/lib/auth";
import { createTag, deleteTag } from "@/lib/tags";

const tagTypes = new Set<TagType>(["DBMS", "TOPIC", "ADVANCED", "OPERATION", "CASE", "INTERNAL"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createTagAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim() as TagType;
  if (!name) throw new Error("Tag name is required.");
  if (!tagTypes.has(type)) throw new Error("Invalid tag type.");

  await createTag({
    name,
    type
  });
  revalidatePath("/admin/tags");
}

export async function deleteTagAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!uuidPattern.test(id)) throw new Error("Valid tag id is required.");
  await deleteTag(id);
  revalidatePath("/admin/tags");
}
