import type { ReactNode } from "react";

export function Callout({ children, title = "Note" }: { children: ReactNode; title?: string }) {
  return (
    <div className="my-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950">
      <div className="font-semibold text-blue-900 dark:text-blue-100">{title}</div>
      <div className="mt-1 text-blue-900/80 dark:text-blue-100/80">{children}</div>
    </div>
  );
}
