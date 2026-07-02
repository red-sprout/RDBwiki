"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/docs/MarkdownRenderer";

export function MarkdownEditor({ name = "content", initialValue = "" }: { name?: string; initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label className="text-sm font-medium" htmlFor={name}>Content</label>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-1 min-h-[520px] w-full resize-y rounded-md border border-border bg-white p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950"
        />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Preview</div>
        <div className="min-h-[520px] overflow-auto rounded-md border border-border bg-white p-5 dark:bg-slate-950">
          <MarkdownRenderer content={value} />
        </div>
      </div>
    </div>
  );
}
