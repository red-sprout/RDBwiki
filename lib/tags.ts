import type { Tag, TagType } from "@/types/tag";
import { seedTags } from "./seed";
import { createAdminClient, hasSupabaseAdminEnv } from "./supabase/admin";

export async function listTags(): Promise<Tag[]> {
  if (!hasSupabaseAdminEnv()) return seedTags;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) return seedTags;
  return data as Tag[];
}

export async function createTag(input: { name: string; type: TagType }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteTag(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
