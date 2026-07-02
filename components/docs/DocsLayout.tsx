import type { ReactNode } from "react";
import type { WikiDocument } from "@/types/document";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

export function DocsLayout({ documents, children }: { documents: WikiDocument[]; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto flex max-w-[1440px]">
        <Sidebar documents={documents} />
        <main className="min-w-0 flex-1 px-5 py-10 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
