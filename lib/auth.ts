import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "./supabase/server";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user?.email) return false;
  return adminEmails().includes(user.email.toLowerCase());
}

export async function requireAdmin() {
  const allowed = await isAdmin();
  if (!allowed) redirect("/admin/login");
}
