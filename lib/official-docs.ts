import type { OfficialDoc } from "@/types/official-doc";
import { createAdminClient, hasSupabaseAdminEnv } from "./supabase/admin";

export async function listOfficialDocs(): Promise<OfficialDoc[]> {
  if (!hasSupabaseAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("official_docs").select("*").order("dbms");
  if (error) return [];
  return data as OfficialDoc[];
}
