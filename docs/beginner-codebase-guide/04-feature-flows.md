# 공개 문서 상세 조회와 DBMS 섹션 필터

## 사용자가 하는 행동

사용자가 `/docs/concepts/mvcc` 또는 `/docs/concepts/mvcc?dbms=mysql`로 이동합니다.

## 외부 요청 또는 실행 명령

```text
GET /docs/concepts/mvcc?dbms=mysql
```

## 진입 파일과 진입 함수

파일: `app/docs/[[...slug]]/page.tsx`  
함수: `DocPage`

## 전체 실행 흐름

1. `params`에서 slug 배열을 await합니다.
2. `searchParams`에서 `dbms` query를 await합니다.
3. `listPublishedDocuments()`로 공개 문서를 모두 가져옵니다.
4. `normalizeSlug()`로 URL slug와 문서 slug를 비교합니다.
5. `getDbmsSections(document.content)`로 본문에 있는 DBMS 섹션을 찾습니다.
6. `normalizeDbmsFilter()`로 query 값을 검증합니다.
7. `filterMarkdownByDbms()`로 선택 DBMS 섹션과 선택 DBMS SQL 코드블록만 남깁니다.
8. `MarkdownRenderer`가 Markdown을 렌더링합니다.

## 텍스트 흐름도

Client  
→ `DocPage`  
→ `listPublishedDocuments()`  
→ `getDbmsSections()`  
→ `normalizeDbmsFilter()`  
→ `filterMarkdownByDbms()`  
→ `MarkdownRenderer`  
→ `SqlCodeBlock`

## 핵심 코드 블록

```tsx
const { slug: slugParts } = await params;
const resolvedSearchParams = searchParams ? await searchParams : {};
const slug = normalizeSlug(slugParts?.join("/") ?? "concepts/mvcc");
const document = documents.find((item) => normalizeSlug(item.slug) === slug);
```

```ts
const availableDbms = getDbmsSections(document.content);
const requestedDbms = normalizeDbmsFilter(resolvedSearchParams.dbms);
const activeDbms = requestedDbms && availableDbms.includes(requestedDbms) ? requestedDbms : null;
const content = filterMarkdownByDbms(document.content, activeDbms);
```

## 코드 블록별 해설

`params`와 `searchParams`는 현재 코드에서 Promise이므로 `await`합니다. `normalizeSlug`는 앞뒤 `/`를 제거하고 URL 인코딩을 풉니다. `activeDbms`는 query 값이 허용된 DBMS이고 실제 문서에 해당 섹션이 있을 때만 설정됩니다.

`filterMarkdownByDbms()`는 두 단계로 본문을 줄입니다. 먼저 `## MySQL`, `## PostgreSQL`, `## Oracle` 같은 h2 섹션을 기준으로 다른 DBMS 섹션을 건너뜁니다. 그 다음 코드펜스 언어가 `mysql`, `postgresql`, `oracle`이거나, 범용 `sql` 코드블록에서 DBMS 특징을 추론할 수 있으면 선택 DBMS와 맞지 않는 코드블록을 제거합니다.

## 데이터 모양 변화

URL path/query  
→ `slugParts: string[]`와 `dbms?: string`  
→ `slug: string`, `activeDbms: DbmsFilter | null`  
→ Markdown 원문  
→ 필터링된 Markdown  
→ React Markdown 화면

## 정상 흐름

문서가 있고 `dbms=mysql`이 유효하면 MySQL 섹션과 MySQL SQL 예시만 표시합니다. query가 없으면 전체 문서를 표시합니다.

## 에러 흐름

문서가 없으면 `notFound()`입니다. query가 잘못되었거나 해당 DBMS 섹션이 없으면 전체 문서를 표시합니다.

## 이 기능에서 수정 가능한 지점

- 기본 문서 slug: `app/docs/[[...slug]]/page.tsx`
- DBMS 허용 값: `lib/dbms-filter.ts`
- 필터 UI: `components/docs/DbmsSectionFilter.tsx`
- 태그 클릭 시 DBMS query 연결: `dbmsTagHref()`

## 수정 예시

수정 전 코드:

```ts
export const dbmsFilterValues = ["mysql", "postgresql", "oracle"] as const;
```

수정 후 코드:

```ts
export const dbmsFilterValues = ["mysql", "postgresql", "oracle", "mariadb"] as const;
```

이 변경만으로는 부족합니다. heading label, route DBMS 목록, 실제 문서 섹션도 함께 추가해야 합니다.

## 이 기능을 이해했는지 확인하는 체크리스트

- `?dbms=mysql`이 어떤 함수에서 검증되는지 찾을 수 있습니다.
- Markdown 섹션 필터가 DBMS h2 heading과 SQL 코드블록 추론을 함께 사용한다는 점을 설명할 수 있습니다.
- official docs도 active DBMS에 맞게 필터링된다는 점을 설명할 수 있습니다.

# DBMS별 문서 목록과 자동 선택

## 사용자가 하는 행동

사용자가 `/dbms/mysql`로 이동한 뒤 문서 카드를 클릭합니다.

## 외부 요청 또는 실행 명령

```text
GET /dbms/mysql
```

## 진입 파일과 진입 함수

파일: `app/dbms/[dbms]/page.tsx`  
함수: `DbmsPage`

## 전체 실행 흐름

1. `params`에서 `dbms` 값을 await합니다.
2. `dbmsItems`에 없는 값이면 `notFound()`를 호출합니다.
3. `listPublishedDocuments()`로 전체 공개 문서를 가져옵니다.
4. `filterDocumentsByDbms(documents, dbms)`로 관련 문서만 추립니다.
5. `DocCard`의 `href`에 `?dbms=${dbms}`를 붙여 렌더링합니다.
6. 사용자가 카드를 열면 상세 페이지에서 같은 DBMS가 자동 선택됩니다.

## 텍스트 흐름도

Client  
→ `DbmsPage`  
→ `listPublishedDocuments()`  
→ `filterDocumentsByDbms()`  
→ `DocCard href="/docs/...?..."`  
→ `DocPage`

## 핵심 코드 블록

```tsx
const documents = await listPublishedDocuments();
const dbmsDocs = filterDocumentsByDbms(documents, dbms);
```

```tsx
<DocCard key={document.id} document={document} href={`${docHref(document.slug)}?dbms=${dbms}`} />
```

## 코드 블록별 해설

`filterDocumentsByDbms()`는 slug, 태그, 본문 DBMS 섹션을 모두 봅니다. `href`에 query를 붙이는 부분이 “DBMS 목록에서 들어갔을 때 자동 선택”을 만드는 핵심입니다.

## 데이터 모양 변화

`/dbms/mysql`  
→ `dbms: "mysql"`  
→ `WikiDocument[]` 전체 목록  
→ MySQL 관련 문서 목록  
→ `/docs/...?...dbms=mysql` 링크

## 정상 흐름

DBMS 소개, 개념, 고급 기능, 사례 문서가 학습 순서에 맞게 정렬되어 보입니다.

## 에러 흐름

`/dbms/sqlserver`처럼 허용되지 않은 DBMS path는 404입니다.

## 이 기능에서 수정 가능한 지점

- 허용 DBMS 목록: `lib/routes.ts`
- 관련 문서 판정: `filterDocumentsByDbms()`
- 정렬 순서: `dbmsPageCategoryRank`, `dbmsPageTopicRank`
- 자동 선택 링크: `app/dbms/[dbms]/page.tsx`

# 홈 검색

## 사용자가 하는 행동

상단 검색창에 검색어를 입력합니다.

## 외부 요청 또는 실행 명령

```text
GET /?q=mvcc
```

## 진입 파일과 진입 함수

파일: `app/page.tsx`  
함수: `Home`

## 전체 실행 흐름

1. `searchParams`를 await합니다.
2. `q`를 읽습니다.
3. 전체 공개 문서를 가져옵니다.
4. 검색어가 있으면 `searchDocuments(q)`를 실행합니다.
5. 결과를 `DocCard`로 표시합니다.

## 텍스트 흐름도

Search form  
→ `Home`  
→ `searchDocuments()`  
→ `listPublishedDocuments()`  
→ 제목/설명/본문/태그 검색  
→ `DocCard[]`

## 핵심 코드 블록

```tsx
const resolvedSearchParams = searchParams ? await searchParams : {};
const q = resolvedSearchParams.q ?? "";
const results = q ? await searchDocuments(q) : documents;
```

## 코드 블록별 해설

검색어가 없으면 전체 문서를 보여주고, 검색어가 있으면 `searchDocuments`의 필터 결과를 보여줍니다.

## 데이터 모양 변화

query string  
→ `q: string`  
→ 정규화된 검색어  
→ `WikiDocument[]` 필터  
→ 카드 목록

## 정상 흐름

검색어가 제목, 설명, 본문, 태그명 중 하나에 포함되면 결과에 남습니다.

## 에러 흐름

검색 함수는 별도 예외를 던지지 않습니다. 내부 공개 문서 조회 실패 시 seed fallback이 사용될 수 있습니다.

## 이 기능에서 수정 가능한 지점

- 검색 대상 필드: `lib/search.ts`
- 검색 UI: `components/docs/TopNav.tsx`
- 결과 표시: `app/page.tsx`

## 수정 예시

수정 전 코드:

```ts
doc.content,
```

수정 후 코드:

```ts
doc.content,
doc.level ?? "",
```

## 이 기능을 이해했는지 확인하는 체크리스트

- 검색이 DB full text search가 아니라 메모리 필터라는 점을 설명할 수 있습니다.
- `TopNav` form의 `name="q"`가 `searchParams.q`로 이어진다는 점을 설명할 수 있습니다.

# 관리자 문서 생성과 수정

## 사용자가 하는 행동

관리자가 문서 생성 또는 수정 화면에서 form을 제출합니다.

## 외부 요청 또는 실행 명령

Next.js Server Action form submit입니다.

## 진입 파일과 진입 함수

파일: `app/admin/documents/actions.ts`  
함수: `createDocumentAction`, `updateDocumentAction`, `readDocumentInput`

## 전체 실행 흐름

1. `DocumentForm`이 `action` prop을 form에 연결합니다.
2. Server Action이 `requireAdmin()`으로 관리자 여부를 확인합니다.
3. `readDocumentInput()`이 `FormData`를 `DocumentInput`으로 바꿉니다.
4. `createDocument()` 또는 `updateDocument()`가 `documents` 테이블을 갱신합니다.
5. `replaceDocumentJoins()`가 태그와 공식문서 연결을 다시 저장합니다.
6. `revalidatePath()`와 `redirect()`를 실행합니다.

## 텍스트 흐름도

Admin form  
→ `createDocumentAction`  
→ `requireAdmin`  
→ `readDocumentInput`  
→ `createDocument`  
→ `replaceDocumentJoins`  
→ Supabase

## 핵심 코드 블록

```ts
export async function createDocumentAction(formData: FormData) {
  await requireAdmin();
  await createDocument(readDocumentInput(formData));
  revalidatePath("/");
  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}
```

## 코드 블록별 해설

`requireAdmin()`은 저장 전 권한 검사입니다. `revalidatePath()`는 캐시된 경로를 갱신합니다. `redirect()`는 저장 성공 후 관리자 목록으로 이동합니다.

## 데이터 모양 변화

HTML form  
→ `FormData`  
→ `DocumentInput`  
→ Supabase insert/update object  
→ `documents`, `document_tags`, `official_docs`

## 정상 흐름

관리자이고 Supabase 쓰기가 성공하면 `/admin/documents`로 이동합니다.

## 에러 흐름

관리자가 아니면 `/admin/login`으로 redirect합니다. Supabase 쓰기 실패는 `throw new Error(error.message)`로 중단됩니다.

## 이 기능에서 수정 가능한 지점

- 폼 필드: `components/admin/DocumentForm.tsx`
- FormData 읽기: `app/admin/documents/actions.ts`
- 저장 object: `lib/documents.ts`
- 타입: `types/document.ts`
- DB 컬럼: `supabase/migrations/*.sql`

## 수정 예시

수정 전 코드:

```ts
title: String(formData.get("title") ?? ""),
```

수정 후 코드:

```ts
title: String(formData.get("title") ?? "").trim(),
```

## 이 기능을 이해했는지 확인하는 체크리스트

- form `name`과 `FormData.get()` 키가 연결된다는 점을 설명할 수 있습니다.
- 태그와 공식문서는 별도 테이블에 저장된다는 점을 설명할 수 있습니다.

# SQL 코드 렌더링

## 사용자가 하는 행동

문서 본문에서 fenced code block을 봅니다.

## 외부 요청 또는 실행 명령

Markdown 안에 다음 형태가 있습니다.

```text
```sql
select * from documents;
```
```

## 진입 파일과 진입 함수

파일: `components/docs/MarkdownRenderer.tsx`  
함수: `components.code`, `SqlCodeBlock`

## 전체 실행 흐름

1. `ReactMarkdown`이 Markdown을 파싱합니다.
2. HTML 주석을 제거한 `displayContent`를 렌더링합니다.
3. code block의 `className`에서 `sql`, `mysql`, `postgresql`, `oracle` 언어를 찾습니다.
4. SQL 계열이면 `SqlCodeBlock`을 렌더링합니다.
5. 범용 `sql`이면 `detectSqlDialect()`로 DBMS를 추론합니다.
6. `tokenizeSql()`이 keyword, function, string, number, comment 등을 분류합니다.

## 텍스트 흐름도

Markdown code block  
→ `ReactMarkdown components.code`  
→ `sqlDialectFromClassName`  
→ `detectSqlDialect`  
→ `SqlCodeBlock`  
→ `tokenizeSql`  
→ colored spans

## 핵심 코드 블록

```tsx
const dialect = sqlDialectFromClassName(className);
if (dialect) {
  return <SqlCodeBlock code={code} dialect={dialect === "sql" ? detectSqlDialect(code) ?? "sql" : dialect} />;
}
```

## 코드 블록별 해설

SQL 계열 코드 블록만 직접 하이라이팅하고, 나머지 inline code는 `InlineCode`로 렌더링합니다. `mysql`, `postgresql`, `oracle` 코드펜스는 그대로 dialect가 되고, `sql` 코드펜스는 코드 내용으로 DBMS를 추론합니다.

## 데이터 모양 변화

Markdown 문자열  
→ code block children  
→ dialect  
→ SQL token 배열  
→ `<span>` 목록

## 정상 흐름

SQL 키워드와 문자열 등이 색상 class로 표시됩니다. DBMS를 알 수 있는 코드블록은 라벨이 `SQL` 대신 `MySQL`, `PostgreSQL`, `Oracle`로 표시됩니다.

## 에러 흐름

지원하지 않는 SQL 문법도 텍스트로는 출력됩니다. 완전한 SQL parser는 코드에서 확인되지 않습니다.

## 이 기능에서 수정 가능한 지점

- 키워드 목록: `components/docs/SqlCodeBlock.tsx`
- 색상 class: `tokenClassName`
- Markdown code override: `MarkdownRenderer`

## 수정 예시

수정 전 코드:

```ts
"select",
```

수정 후 코드:

```ts
"select",
"explain",
```

## 이 기능을 이해했는지 확인하는 체크리스트

- `language-sql`, `language-mysql`, `language-postgresql`, `language-oracle` 여부가 어디서 판단되는지 찾을 수 있습니다.
- 범용 `sql` 코드블록의 DBMS 추론이 `detectSqlDialect()`에서 이루어진다는 점을 설명할 수 있습니다.
- `SqlCodeBlock`이 SQL 실행기가 아니라 표시용 tokenizer라는 점을 설명할 수 있습니다.
