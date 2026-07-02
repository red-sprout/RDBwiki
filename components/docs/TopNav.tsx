import Link from "next/link";
import { Database, Search } from "lucide-react";
import { navItems } from "@/lib/routes";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Database className="h-5 w-5" />
          <span>RDB Wiki</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/" className="ml-auto flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-white px-3 dark:bg-slate-950">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input name="q" placeholder="Search docs" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </form>
      </div>
    </header>
  );
}
