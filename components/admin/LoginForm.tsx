"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password"))
    });

    setLoading(false);
    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-sm dark:bg-slate-950">
      <div>
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="mt-1 h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="mt-1 h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}
