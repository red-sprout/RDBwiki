import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-3xl font-semibold">Admin login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
