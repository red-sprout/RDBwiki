import { clsx } from "clsx";

const styles: Record<string, string> = {
  mysql: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  postgresql: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  oracle: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
};

export function DbmsBadge({ name }: { name: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        styles[name.toLowerCase()] ?? "border-border bg-muted text-muted-foreground"
      )}
    >
      {name}
    </span>
  );
}
