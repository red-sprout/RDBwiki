import { slugifyHeading } from "./toc";

export function headingId(children: React.ReactNode) {
  const text = String(children).replace(/,/g, "");
  return slugifyHeading(text);
}
