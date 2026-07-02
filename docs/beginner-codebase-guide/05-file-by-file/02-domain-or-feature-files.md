# 도메인과 기능 파일

## 포함된 파일 목록

- `lib/documents.ts`
- `lib/dbms-filter.ts`
- `lib/search.ts`
- `lib/reference-documents.ts`
- `lib/tags.ts`
- `lib/auth.ts`
- `app/admin/documents/actions.ts`
- `app/admin/tags/actions.ts`
- `components/admin/DocumentForm.tsx`
- `types/document.ts`

## 이 파일 묶음의 역할

문서 조회, seed fallback, DBMS 필터, 검색, 관리자 저장, 타입 정의를 담당합니다.

## 전체 연결 관계

`DocumentForm`  
→ `app/admin/documents/actions.ts`  
→ `lib/auth.ts`  
→ `lib/documents.ts`  
→ Supabase 또는 seed

## 파일별 상세 설명

## `lib/documents.ts`

### 이 파일의 역할

문서 목록, 관리자 목록, slug 조회, 카테고리/DBMS/태그 필터, 문서 생성/수정/보관/삭제를 담당합니다.

### 이 파일이 필요한 이유

페이지와 관리자 action이 Supabase query 세부 구현을 직접 알지 않아도 됩니다.

### 이 파일과 연결된 다른 파일

`app/page.tsx`, `app/docs/[[...slug]]/page.tsx`, `app/admin/documents/actions.ts`, `lib/supabase/*`

### 핵심 코드 블록

```ts
const dbmsPageCategoryRank: Record<WikiDocument["category"], number> = {
  dbms: 0,
  concept: 1,
  advanced: 2,
  case: 3
};
```

```ts
const documentSelect = `
  *,
  tags:document_tags(tags(*)),
  official_docs(*)
`;
```

```ts
function normalizeDocument(row: any): WikiDocument {
  return {
    ...row,
    tags: row.tags?.map((item: any) => item.tags).filter(Boolean) ?? [],
    official_docs: row.official_docs ?? []
  };
}
```

### 코드 블록별 해설

`dbmsPageCategoryRank`는 DBMS별 목록에서 문서가 보일 순서를 정합니다. DBMS 소개 문서를 먼저 보여주고, 개념, 고급 기능, 사례 순서로 이어집니다.

Supabase join 결과는 앱에서 쓰기 쉬운 `WikiDocument` 형태로 바꿉니다. `tags`는 중첩된 join 결과라 `map`으로 한 단계 꺼냅니다.

```ts
export function filterDocumentsByDbms(documents: WikiDocument[], dbms: string) {
  const normalizedDbms = normalizeDbmsFilter(dbms);
  if (!normalizedDbms) return [];

  return documents
    .filter((doc) => {
      const slug = doc.slug.toLowerCase().replace(/^\/+/, "");
      const slugMatch = slug.startsWith(`dbms/${normalizedDbms}/`);
      const tagMatch = doc.tags?.some((tag) => tagPathSegment(tag.name) === normalizedDbms);
      const sectionMatch = getDbmsSections(doc.content).includes(normalizedDbms);
      return slugMatch || tagMatch || sectionMatch;
    })
    .sort(compareDbmsPageDocuments);
}
```

DBMS별 목록은 세 가지 근거를 봅니다. slug가 `dbms/mysql/...`처럼 시작하는지, 태그가 DBMS명인지, 본문에 `## MySQL` 같은 섹션이 있는지 확인합니다. 마지막에 `compareDbmsPageDocuments()`로 학습 순서에 맞게 정렬합니다.

### 이 파일에서 사용된 언어 문법

template literal, object spread, optional chaining, nullish coalescing, async/await입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Supabase query builder입니다.

### 초심자가 수정할 수 있는 부분

정렬 기준, 필터 조건, 저장 필드입니다. DBMS 목록 순서를 바꾸려면 `dbmsPageCategoryRank`와 `dbmsPageTopicRank`를 함께 봅니다.

### 수정 전 코드

```ts
.order("slug");
```

### 수정 후 코드

```ts
.order("updated_at", { ascending: false });
```

### 수정 시 영향받는 파일

홈과 사이드바 문서 순서가 바뀝니다.

### 이 파일을 이해한 뒤 알아야 하는 것

읽기 함수는 seed fallback이 있지만 쓰기 함수는 실제 Supabase admin client가 필요합니다.

## `lib/dbms-filter.ts`

### 이 파일의 역할

문서 Markdown에서 DBMS별 h2 섹션을 찾고 선택 DBMS 섹션만 남깁니다. 또한 `sql` 코드블록 내용으로 MySQL/PostgreSQL/Oracle 예시를 추론해 선택한 DBMS와 맞지 않는 SQL 블록을 숨깁니다.

### 이 파일이 필요한 이유

하나의 비교 문서에서 MySQL/PostgreSQL/Oracle 섹션만 골라 볼 수 있게 합니다. 기존 문서처럼 코드펜스가 모두 `sql`로 저장되어 있어도 런타임에서 DBMS를 추론해 보정합니다.

### 이 파일과 연결된 다른 파일

`app/docs/[[...slug]]/page.tsx`, `components/docs/DbmsSectionFilter.tsx`

### 핵심 코드 블록

```ts
const dbmsH2Pattern = /^##\s+(MySQL|PostgreSQL|Oracle)(?:\s|\/|:|-|$)/i;
```

```ts
export function getDbmsSections(markdown: string): DbmsFilter[] {
  const sections = new Set<DbmsFilter>();
  for (const line of markdown.split("\n")) {
    const match = line.match(dbmsH2Pattern);
    if (!match) continue;
    const dbms = headingToFilter.get(match[1].toLowerCase());
    if (dbms) sections.add(dbms);
  }
  return dbmsFilterValues.filter((dbms) => sections.has(dbms));
}
```

### 코드 블록별 해설

`dbmsH2Pattern`은 `## MySQL`, `## MySQL / PostgreSQL`, `## Oracle: 구조`처럼 DBMS명 뒤에 공백, `/`, `:`, `-`가 오는 h2를 찾습니다. 각 줄을 검사해 찾은 DBMS만 필터 버튼에 표시됩니다.

```ts
export function detectSqlDialect(code: string): DbmsFilter | null {
  const normalized = code.toLowerCase();

  if (normalized.includes("performance_schema") || normalized.includes("show processlist")) {
    return "mysql";
  }

  if (normalized.includes("pg_stat") || normalized.includes("jsonb")) {
    return "postgresql";
  }

  if (normalized.includes("v$") || normalized.includes("dbms_")) {
    return "oracle";
  }

  return null;
}
```

`detectSqlDialect()`는 SQL 문자열 안의 대표 키워드와 시스템 뷰 이름을 보고 DBMS를 추론합니다. 완전한 SQL parser가 아니라 화면 필터링을 위한 보조 규칙입니다.

```ts
const explicitDbms = normalizeDbmsFilter(activeCodeFenceLanguage);
const inferredDbms = activeCodeFenceLanguage === "sql" ? detectSqlDialect(activeCodeFenceLines.slice(1, -1).join("\n")) : null;
const codeFenceDbms = explicitDbms ?? inferredDbms;

if (!skipping && (!codeFenceDbms || codeFenceDbms === selectedDbms)) {
  filtered.push(...activeCodeFenceLines);
}
```

코드펜스 언어가 `mysql`, `postgresql`, `oracle`이면 명시 DBMS로 봅니다. 언어가 `sql`이면 본문을 추론합니다. 추론된 DBMS가 선택 DBMS와 다르면 해당 코드블록은 결과 Markdown에 넣지 않습니다.

### 이 파일에서 사용된 언어 문법

const assertion, union type, `Set`, `Map`, 정규식, 반복문입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

프레임워크 기능이 아니라 TypeScript/JavaScript 기능입니다.

### 초심자가 수정할 수 있는 부분

지원 DBMS 추가, heading 패턴 변경, SQL 추론 키워드 추가입니다.

### 수정 전 코드

```ts
const dbmsH2Pattern = /^##\s+(MySQL|PostgreSQL|Oracle)(?:\s|\/|:|-|$)/i;
```

### 수정 후 코드

```ts
const dbmsH2Pattern = /^##\s+(MySQL|PostgreSQL|Oracle|MariaDB)(?:\s|\/|:|-|$)/i;
```

### 수정 시 영향받는 파일

`dbmsFilterValues`, `dbmsHeadingLabels`, `lib/routes.ts`, 실제 문서 heading이 함께 영향받습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

이 필터는 Markdown h2 heading 규칙과 SQL 코드블록 추론 규칙에 의존합니다. 추론되지 않는 범용 SQL은 선택 DBMS와 관계없이 남습니다.

## `app/admin/documents/actions.ts`

### 이 파일의 역할

문서 생성, 수정, 보관, 삭제 Server Action을 정의합니다.

### 이 파일이 필요한 이유

관리자 form submit을 서버에서 처리합니다.

### 이 파일과 연결된 다른 파일

`DocumentForm`, `DocumentTable`, `lib/documents.ts`, `lib/auth.ts`

### 핵심 코드 블록

```ts
const officialDocs = [0, 1, 2, 3, 4].map((index) => ({
  dbms: String(formData.get(`official_docs.${index}.dbms`) ?? ""),
  title: String(formData.get(`official_docs.${index}.title`) ?? ""),
  url: String(formData.get(`official_docs.${index}.url`) ?? "")
}));
```

### 코드 블록별 해설

공식문서 입력 5개 row를 `FormData`에서 읽어 배열로 만듭니다.

### 이 파일에서 사용된 언어 문법

배열 `map`, template literal, type assertion, 삼항 연산자입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js Server Action, `revalidatePath`, `redirect`입니다.

### 초심자가 수정할 수 있는 부분

입력값 trim, 검증 추가, 저장 후 이동 경로입니다.

### 수정 전 코드

```ts
slug: String(formData.get("slug") ?? ""),
```

### 수정 후 코드

```ts
slug: String(formData.get("slug") ?? "").trim(),
```

### 수정 시 영향받는 파일

문서 slug 저장 방식이 바뀝니다.

### 이 파일을 이해한 뒤 알아야 하는 것

폼 `name`과 `FormData.get()` 키가 일치해야 합니다.

## `types/document.ts`

### 이 파일의 역할

문서 데이터의 TypeScript 타입을 정의합니다.

### 이 파일이 필요한 이유

문서 객체의 필드를 코드 전체에서 일관되게 사용합니다.

### 이 파일과 연결된 다른 파일

`lib/documents.ts`, `components/docs/*`, `components/admin/*`, Supabase migration

### 핵심 코드 블록

```ts
export type DocumentCategory = "concept" | "dbms" | "advanced" | "case";
export type DocumentStatus = "draft" | "published" | "archived";
```

### 코드 블록별 해설

유니언 타입으로 허용 문자열을 제한합니다.

### 이 파일에서 사용된 언어 문법

type alias, union type, optional property입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

프레임워크 기능이 아니라 TypeScript 기능입니다.

### 초심자가 수정할 수 있는 부분

새 필드나 새 카테고리 추가입니다.

### 수정 전 코드

```ts
level: string | null;
```

### 수정 후 코드

```ts
level: string | null;
summary: string | null;
```

### 수정 시 영향받는 파일

DB migration, 관리자 form, action, 저장 함수, 화면 표시가 영향받습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

타입만 바꾸면 DB 컬럼은 생기지 않습니다.
