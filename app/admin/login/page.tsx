import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-semibold">Admin login</h1>
        <p className="mb-6 text-sm text-muted-foreground">Supabase email/password 계정으로 로그인합니다. ADMIN_EMAILS에 포함된 이메일만 관리자입니다.</p>
        <LoginForm />
      </div>
    </main>
  );
}
