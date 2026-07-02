import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { InlineCode, SqlCodeBlock } from "./SqlCodeBlock";

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
            if (className?.includes("language-sql")) {
              return <SqlCodeBlock code={code} />;
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
