# 전역과 공통 파일

## 포함된 파일 목록

- `components/docs/DocsLayout.tsx`
- `components/docs/TopNav.tsx`
- `components/docs/Sidebar.tsx`
- `components/docs/MarkdownRenderer.tsx`
- `components/docs/SqlCodeBlock.tsx`
- `components/docs/DbmsSectionFilter.tsx`
- `components/docs/TableOfContents.tsx`
- `components/ui/Button.tsx`
- `lib/routes.ts`
- `lib/toc.ts`

## 이 파일 묶음의 역할

여러 페이지에서 재사용되는 레이아웃, 내비게이션, Markdown 렌더링, SQL 표시, 링크 생성, 목차 생성을 담당합니다.

## 전체 연결 관계

`app/**/page.tsx`  
→ `DocsLayout`  
→ `TopNav`, `Sidebar`  
→ `MarkdownRenderer`, `DbmsSectionFilter`, `TableOfContents`

## 파일별 상세 설명

## `components/docs/MarkdownRenderer.tsx`

### 이 파일의 역할

Markdown 문자열을 React 화면으로 렌더링합니다.

### 이 파일이 필요한 이유

문서 본문은 DB나 seed에서 Markdown으로 저장됩니다.

### 이 파일과 연결된 다른 파일

`SqlCodeBlock`, `lib/dbms-filter.ts`, `app/docs/[[...slug]]/page.tsx`, `MarkdownEditor`

### 핵심 코드 블록

```tsx
const sqlLanguages = new Set(["sql", "mysql", "postgresql", "oracle"]);

function sqlDialectFromClassName(className: string | undefined): SqlDialect | null {
  const language = className?.match(/language-([a-z0-9-]+)/i)?.[1]?.toLowerCase();
  if (!language || !sqlLanguages.has(language)) return null;
  return language as SqlDialect;
}
```

```tsx
const displayContent = content.replace(/<!--[\s\S]*?-->/g, "");
```

```tsx
components={{
  code({ className, children, ...props }) {
    const code = String(children).replace(/\n$/, "");
    const dialect = sqlDialectFromClassName(className);
    if (dialect) {
      return <SqlCodeBlock code={code} dialect={dialect === "sql" ? detectSqlDialect(code) ?? "sql" : dialect} />;
    }
    return (
      <InlineCode className={className} {...props}>
        {children}
      </InlineCode>
    );
  }
}}
```

### 코드 블록별 해설

`sqlDialectFromClassName()`은 Markdown 코드펜스 언어를 읽습니다. `sql`, `mysql`, `postgresql`, `oracle`만 SQL 렌더링 대상으로 봅니다.

`displayContent`는 Markdown 안의 HTML 주석을 제거합니다. 문서 작성용 내부 메모나 reference marker가 화면에 노출되지 않게 하기 위한 처리입니다.

SQL 코드 블록은 `SqlCodeBlock`으로 보내고, 나머지 code는 `InlineCode`로 렌더링합니다. 코드펜스 언어가 `sql`이면 `detectSqlDialect()`로 MySQL/PostgreSQL/Oracle 여부를 추론해 라벨과 필터링에 사용할 dialect를 넘깁니다.

### 이 파일에서 사용된 언어 문법

객체 리터럴, 함수 props, optional chaining, JSX입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

`react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`입니다.

### 초심자가 수정할 수 있는 부분

다른 언어 code block 처리, HTML 주석 제거 규칙, SQL dialect 감지 대상 추가입니다.

### 수정 전 코드

```tsx
const sqlLanguages = new Set(["sql", "mysql", "postgresql", "oracle"]);
```

### 수정 후 코드

```tsx
const sqlLanguages = new Set(["sql", "mysql", "postgresql", "oracle", "mariadb"]);
```

### 수정 시 영향받는 파일

Markdown 코드 블록 렌더링이 바뀝니다. 새 dialect를 실제로 표시하려면 `SqlDialect` 타입, CSS 라벨, `detectSqlDialect()`도 함께 수정해야 합니다.

### 이 파일을 이해한 뒤 알아야 하는 것

Markdown 파싱과 실제 스타일 적용은 다른 층입니다. 스타일은 `app/globals.css`에 있고, SQL dialect 판단은 `lib/dbms-filter.ts`와 연결됩니다.

## `components/docs/SqlCodeBlock.tsx`

### 이 파일의 역할

SQL 코드 문자열을 토큰으로 나눠 색상 span으로 표시합니다.

### 이 파일이 필요한 이유

DB Wiki 문서에는 SQL 예제가 많아 읽기 쉽게 표시해야 합니다.

### 이 파일과 연결된 다른 파일

`MarkdownRenderer`, `app/globals.css`

### 핵심 코드 블록

```tsx
export type SqlDialect = "sql" | "mysql" | "postgresql" | "oracle";
```

```tsx
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
```

```ts
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
  }
}
```

### 코드 블록별 해설

`SqlDialect`는 코드블록 라벨과 CSS class를 구분하기 위한 타입입니다. `dialect`가 `mysql`이면 `<code>`에 `sql-mysql` class가 붙고, `app/globals.css`가 라벨을 `MySQL`로 바꿉니다.

영문 identifier를 찾고 keyword/function/identifier 중 하나로 분류합니다.

### 이 파일에서 사용된 언어 문법

union type, `Set`, 정규식, while loop, nested ternary입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

React 컴포넌트입니다. SQL parser 라이브러리는 사용하지 않습니다.

### 초심자가 수정할 수 있는 부분

키워드 목록, 색상 class, dialect class입니다.

### 수정 전 코드

```ts
"select",
```

### 수정 후 코드

```ts
"select",
"explain",
```

### 수정 시 영향받는 파일

SQL 코드 표시 색상이 바뀝니다. dialect 관련 변경은 `MarkdownRenderer`, `app/globals.css`, `lib/dbms-filter.ts`에도 영향이 있습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

이 tokenizer는 SQL 실행이나 문법 검증을 하지 않습니다. DBMS 라벨도 parser 결과가 아니라 코드펜스 언어 또는 `detectSqlDialect()` 추론 결과입니다.

## `lib/routes.ts`

### 이 파일의 역할

내비게이션, DBMS 목록, 문서/태그 URL 생성 함수를 제공합니다.

### 이 파일이 필요한 이유

URL 생성 규칙을 한 곳에 모읍니다.

### 이 파일과 연결된 다른 파일

`TopNav`, `Sidebar`, `TagBadge`, `DbmsPage`, `DocCard`

### 핵심 코드 블록

```ts
export function tagPathSegment(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

### 코드 블록별 해설

태그 이름을 URL path에 넣기 좋은 문자열로 바꿉니다.

### 이 파일에서 사용된 언어 문법

method chaining, 정규식, const assertion입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

프레임워크 기능이 아니라 프로젝트 라우트 규칙입니다.

### 초심자가 수정할 수 있는 부분

nav menu, 지원 DBMS 목록입니다.

### 수정 전 코드

```ts
{ href: "/cases", label: "Cases" },
```

### 수정 후 코드

```ts
{ href: "/cases", label: "Cases" },
{ href: "/admin", label: "Admin" },
```

### 수정 시 영향받는 파일

상단 내비게이션 표시가 바뀝니다.

### 이 파일을 이해한 뒤 알아야 하는 것

태그 URL과 DBMS 필터 URL은 서로 다른 규칙입니다.
