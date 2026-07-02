import Link from "next/link";
import type { ReactNode } from "react";
import { FileText, LinkIcon, LayoutDashboard, Tags } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/official-docs", label: "Official Docs", icon: LinkIcon }
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white p-4 dark:bg-slate-950 md:block">
        <Link href="/" className="mb-8 block text-lg font-semibold">RDB Wiki Admin</Link>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
