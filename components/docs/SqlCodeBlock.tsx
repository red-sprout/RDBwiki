import type { ReactNode } from "react";
import { clsx } from "clsx";

type SqlTokenType = "keyword" | "function" | "string" | "number" | "comment" | "operator" | "identifier";
export type SqlDialect = "sql" | "mysql" | "postgresql" | "oracle";

type SqlToken = {
  value: string;
  type: SqlTokenType;
};

const keywords = new Set([
  "add",
  "alter",
  "and",
  "as",
  "asc",
  "between",
  "by",
  "case",
  "create",
  "delete",
  "desc",
  "distinct",
  "drop",
  "else",
  "end",
  "exists",
  "fetch",
  "first",
  "from",
  "full",
  "group",
  "having",
  "in",
  "inner",
  "insert",
  "into",
  "is",
  "join",
  "left",
  "like",
  "limit",
  "not",
  "null",
  "offset",
  "on",
  "or",
  "order",
  "outer",
  "over",
  "partition",
  "right",
  "select",
  "set",
  "then",
  "union",
  "update",
  "values",
  "when",
  "where",
  "with"
]);

const functions = new Set([
  "avg",
  "coalesce",
  "count",
  "current_timestamp",
  "date_trunc",
  "max",
  "min",
  "now",
  "sum"
]);

const tokenClassName: Record<SqlTokenType, string> = {
  keyword: "text-sky-300",
  function: "text-violet-300",
  string: "text-emerald-300",
  number: "text-amber-300",
  comment: "text-slate-500",
  operator: "text-rose-300",
  identifier: "text-slate-100"
};

export function SqlCodeBlock({ code, dialect = "sql" }: { code: string; dialect?: SqlDialect }) {
  return (
    <code className={clsx("language-sql sql-code", dialect !== "sql" && `sql-${dialect}`)}>
      {tokenizeSql(code).map((token, index) => (
        <span key={`${index}-${token.value}`} className={tokenClassName[token.type]}>
          {token.value}
        </span>
      ))}
    </code>
  );
}

export function InlineCode({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={className}>{children}</code>;
}

function tokenizeSql(code: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let index = 0;

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === "-" && next === "-") {
      const end = code.indexOf("\n", index);
      const value = code.slice(index, end === -1 ? code.length : end);
      tokens.push({ value, type: "comment" });
      index += value.length;
      continue;
    }

    if (char === "/" && next === "*") {
      const end = code.indexOf("*/", index + 2);
      const value = code.slice(index, end === -1 ? code.length : end + 2);
      tokens.push({ value, type: "comment" });
      index += value.length;
      continue;
    }

    if (char === "'") {
      const end = findStringEnd(code, index);
      const value = code.slice(index, end);
      tokens.push({ value, type: "string" });
      index = end;
      continue;
    }

    if (/[0-9]/.test(char)) {
      const match = code.slice(index).match(/^\d+(\.\d+)?/);
      if (match) {
        tokens.push({ value: match[0], type: "number" });
        index += match[0].length;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = code.slice(index).match(/^[A-Za-z_][A-Za-z0-9_$]*/);
      if (match) {
        const value = match[0];
        const normalized = value.toLowerCase();
        const type = keywords.has(normalized)
          ? "keyword"
          : functions.has(normalized)
            ? "function"
            : "identifier";
        tokens.push({ value, type });
        index += value.length;
        continue;
      }
    }

    if (/[=<>!+\-*/%.,;()[\]]/.test(char)) {
      tokens.push({ value: char, type: "operator" });
      index += 1;
      continue;
    }

    tokens.push({ value: char, type: "identifier" });
    index += 1;
  }

  return tokens;
}

function findStringEnd(code: string, start: number) {
  let index = start + 1;
  while (index < code.length) {
    if (code[index] === "'" && code[index + 1] === "'") {
      index += 2;
      continue;
    }
    if (code[index] === "'") return index + 1;
    index += 1;
  }
  return code.length;
}
