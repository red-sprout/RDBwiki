"use server";

import { revalidatePath } from "next/cache";
import type { TagType } from "@/types/tag";
import { requireAdmin } from "@/lib/auth";
import { createTag, deleteTag } from "@/lib/tags";

export async function createTagAction(formData: FormData) {
  await requireAdmin();
  await createTag({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "TOPIC") as TagType
  });
  revalidatePath("/admin/tags");
}

export async function deleteTagAction(formData: FormData) {
  await requireAdmin();
  await deleteTag(String(formData.get("id")));
  revalidatePath("/admin/tags");
}
