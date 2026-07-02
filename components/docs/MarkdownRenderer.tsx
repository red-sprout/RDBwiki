import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { detectSqlDialect } from "@/lib/dbms-filter";
import { InlineCode, SqlCodeBlock, type SqlDialect } from "./SqlCodeBlock";

const sqlLanguages = new Set(["sql", "mysql", "postgresql", "oracle"]);

function sqlDialectFromClassName(className: string | undefined): SqlDialect | null {
  const language = className?.match(/language-([a-z0-9-]+)/i)?.[1]?.toLowerCase();
  if (!language || !sqlLanguages.has(language)) return null;
  return language as SqlDialect;
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <article className="prose-docs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap"
            }
          ]
        ]}
        components={{
          code({ className, children, ...props }) {
            const code = String(children).replace(/\n$/, "");
            const dialect = sqlDialectFromClassName(className);
            if (dialect) {
              return <SqlCodeBlock code={code} dialect={dialect === "sql" ? detectSqlDialect(code) ?? "sql" : dialect} />;
            }
            return (
              <InlineCode {...props}>
                {children}
              </InlineCode>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
