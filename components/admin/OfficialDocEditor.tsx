import type { OfficialDoc } from "@/types/official-doc";

export function OfficialDocEditor({ docs = [] }: { docs?: OfficialDoc[] }) {
  const rows = docs.length ? docs : [{ id: "empty", dbms: "", title: "", url: "", note: "", version: "" } as OfficialDoc];

  return (
    <div className="space-y-3">
      {rows.map((doc, index) => (
        <div key={doc.id ?? index} className="grid gap-3 rounded-md border border-border bg-white p-3 lg:grid-cols-5 dark:bg-slate-950">
          <input name={`official_docs.${index}.dbms`} defaultValue={doc.dbms} placeholder="DBMS" className="h-9 rounded-md border border-border bg-transparent px-3 text-sm" />
          <input name={`official_docs.${index}.title`} defaultValue={doc.title} placeholder="Title" className="h-9 rounded-md border border-border bg-transparent px-3 text-sm lg:col-span-2" />
          <input name={`official_docs.${index}.url`} defaultValue={doc.url} placeholder="URL" className="h-9 rounded-md border border-border bg-transparent px-3 text-sm lg:col-span-2" />
          <input name={`official_docs.${index}.note`} defaultValue={doc.note ?? ""} placeholder="Note" className="h-9 rounded-md border border-border bg-transparent px-3 text-sm lg:col-span-3" />
          <input name={`official_docs.${index}.version`} defaultValue={doc.version ?? ""} placeholder="Version" className="h-9 rounded-md border border-border bg-transparent px-3 text-sm lg:col-span-2" />
        </div>
      ))}
    </div>
  );
}
