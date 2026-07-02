import GithubSlugger from "github-slugger";

export type TocItem = {
  id: string;
  text: string;
  depth: number;
};

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const matches = markdown.matchAll(/^(#{2,3})\s+(.+)$/gm);
  return Array.from(matches).map((match) => {
    const text = cleanHeadingText(match[2]);
    return {
      id: slugger.slug(text),
      text,
      depth: match[1].length
    };
  });
}

function cleanHeadingText(text: string) {
  return text.replace(/[#`*_]/g, "").trim();
}
