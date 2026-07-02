# 실행 진입점과 페이지 파일

## 포함된 파일 목록

- `package.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/docs/[[...slug]]/page.tsx`
- `app/dbms/[dbms]/page.tsx`
- `app/tags/[tag]/page.tsx`
- `app/advanced/page.tsx`
- `app/cases/page.tsx`

## 이 파일 묶음의 역할

사용자가 접속하는 URL을 실제 화면과 연결합니다.

## 전체 연결 관계

`package.json`  
→ `next dev`  
→ `app/layout.tsx`  
→ `app/**/page.tsx`  
→ `lib/*`  
→ `components/*`

## 파일별 상세 설명

## `package.json`

### 이 파일의 역할

실행 명령어와 의존성 목록을 정의합니다.

### 이 파일이 필요한 이유

로컬 개발, 빌드, lint 명령어의 기준입니다.

### 이 파일과 연결된 다른 파일

`package-lock.json`, `next.config.mjs`, `eslint.config.mjs`

### 핵심 코드 블록

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint ."
}
```

### 코드 블록별 해설

`dev`는 개발 서버, `build`는 프로덕션 빌드, `start`는 빌드 결과 실행, `lint`는 정적 검사입니다.

### 이 파일에서 사용된 언어 문법

JSON 객체 문법입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js, React, Supabase, Tailwind, Markdown 렌더링 패키지를 npm이 관리합니다.

### 초심자가 수정할 수 있는 부분

새 script 추가입니다.

### 수정 전 코드

```json
"lint": "eslint ."
```

### 수정 후 코드

```json
"lint": "eslint .",
"typecheck": "tsc --noEmit"
```

### 수정 시 영향받는 파일

`tsconfig.json`과 CI 설정이 생기면 CI도 영향받습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

이 프로젝트는 직접 `node`로 페이지 파일을 실행하지 않고 Next.js CLI가 실행합니다.

## `app/layout.tsx`

### 이 파일의 역할

모든 페이지를 감싸는 최상위 HTML 구조와 전역 폰트를 설정합니다.

### 이 파일이 필요한 이유

Next.js App Router에서 루트 레이아웃은 `app/**/page.tsx`보다 바깥에서 한 번 적용됩니다. 여기에서 `<html>`, `<body>`, metadata, 전역 CSS, font variable을 연결합니다.

### 이 파일과 연결된 다른 파일

`app/globals.css`, `next/font/google`, 모든 `app/**/page.tsx`

### 핵심 코드 블록

```tsx
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
});
```

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
  {children}
</body>
```

### 코드 블록별 해설

`Geist`와 `Geist_Mono`는 `next/font/google`에서 가져옵니다. `variable`은 CSS custom property 이름입니다. `body`에 font variable class를 붙이고 `font-sans`를 적용하면 Tailwind와 전역 CSS가 같은 폰트 기준을 사용합니다.

### 이 파일에서 사용된 언어 문법

import, 함수 호출, 객체 리터럴, template literal, JSX children입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js metadata, Root Layout, `next/font/google`입니다.

### 초심자가 수정할 수 있는 부분

사이트 title/description, `<html lang>`, 전역 폰트입니다.

### 수정 전 코드

```tsx
<body>{children}</body>
```

### 수정 후 코드

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>{children}</body>
```

### 수정 시 영향받는 파일

전체 페이지의 폰트와 기본 렌더링이 바뀝니다. 빌드 환경에서 Google font fetch가 필요할 수 있습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

특정 페이지 하나만의 스타일이 아니라 앱 전체의 기본 스타일을 정하는 파일입니다.

## `app/page.tsx`

### 이 파일의 역할

홈 화면과 검색 결과를 렌더링합니다.

### 이 파일이 필요한 이유

`/` 요청의 진입점입니다.

### 이 파일과 연결된 다른 파일

`DocsLayout`, `DocCard`, `listPublishedDocuments`, `searchDocuments`

### 핵심 코드 블록

```tsx
const resolvedSearchParams = searchParams ? await searchParams : {};
const q = resolvedSearchParams.q ?? "";
const documents = await listPublishedDocuments();
const results = q ? await searchDocuments(q) : documents;
```

### 코드 블록별 해설

`searchParams`를 await한 뒤 `q`를 읽습니다. 검색어가 있으면 검색 결과를, 없으면 전체 문서를 보여줍니다.

### 이 파일에서 사용된 언어 문법

async/await, optional property, nullish coalescing, 삼항 연산자, JSX입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js Server Component와 App Router `searchParams`입니다.

### 초심자가 수정할 수 있는 부분

홈 소개 문구, 검색 결과 제목, 카드 grid입니다.

### 수정 전 코드

```tsx
<span className="text-sm text-muted-foreground">{results.length} documents</span>
```

### 수정 후 코드

```tsx
<span className="text-sm text-muted-foreground">{results.length} docs found</span>
```

### 수정 시 영향받는 파일

홈 화면 텍스트만 바뀝니다.

### 이 파일을 이해한 뒤 알아야 하는 것

검색 form은 `TopNav`에 있지만 결과 처리는 홈 페이지가 합니다.

## `app/docs/[[...slug]]/page.tsx`

### 이 파일의 역할

문서 상세 화면과 DBMS 섹션 필터를 처리합니다.

### 이 파일이 필요한 이유

`/docs`, `/docs/concepts/mvcc`, `/docs/concepts/mvcc?dbms=mysql`을 처리합니다.

### 이 파일과 연결된 다른 파일

`lib/documents.ts`, `lib/dbms-filter.ts`, `MarkdownRenderer`, `DbmsSectionFilter`, `TableOfContents`

### 핵심 코드 블록

```tsx
const availableDbms = getDbmsSections(document.content);
const requestedDbms = normalizeDbmsFilter(resolvedSearchParams.dbms);
const activeDbms = requestedDbms && availableDbms.includes(requestedDbms) ? requestedDbms : null;
const content = filterMarkdownByDbms(document.content, activeDbms);
```

### 코드 블록별 해설

문서 본문에 있는 DBMS heading을 찾고, query string이 유효하면 `filterMarkdownByDbms()`가 해당 DBMS 내용만 남깁니다. 필터링은 h2 섹션뿐 아니라 SQL 코드블록 추론도 함께 사용합니다.

### 이 파일에서 사용된 언어 문법

Promise props await, 배열 `includes`, 조건부 값 생성, JSX 조건부 렌더링입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js catch-all optional route `[[...slug]]`와 `notFound()`입니다.

### 초심자가 수정할 수 있는 부분

기본 문서 slug, DBMS 필터 안내 문구, 공식문서 섹션 제목입니다.

### 수정 전 코드

```tsx
const slug = normalizeSlug(slugParts?.join("/") ?? "concepts/mvcc");
```

### 수정 후 코드

```tsx
const slug = normalizeSlug(slugParts?.join("/") ?? "concepts/index");
```

### 수정 시 영향받는 파일

`/docs` 기본 문서가 바뀝니다.

### 이 파일을 이해한 뒤 알아야 하는 것

상세 페이지는 `getPublishedDocumentBySlug()` 대신 전체 공개 문서 배열에서 slug를 비교합니다.

## `app/dbms/[dbms]/page.tsx`

### 이 파일의 역할

DBMS별 문서 목록을 보여줍니다.

### 이 파일이 필요한 이유

`/dbms/mysql`, `/dbms/postgresql`, `/dbms/oracle`을 처리합니다.

### 이 파일과 연결된 다른 파일

`dbmsItems`, `filterDocumentsByDbms`, `listPublishedDocuments`, `DocCard`, `docHref`

### 핵심 코드 블록

```tsx
const { dbms } = await params;
if (!dbmsItems.includes(dbms as any)) notFound();
const documents = await listPublishedDocuments();
const dbmsDocs = filterDocumentsByDbms(documents, dbms);
```

### 코드 블록별 해설

허용된 DBMS가 아니면 404를 반환합니다. 정상 DBMS이면 전체 공개 문서를 가져온 뒤 `filterDocumentsByDbms()`로 해당 DBMS와 관련 있는 문서만 추립니다.

```tsx
{dbmsDocs.map((document) => (
  <DocCard key={document.id} document={document} href={`${docHref(document.slug)}?dbms=${dbms}`} />
))}
```

`href`에 `?dbms=${dbms}`를 붙이기 때문에 DBMS 목록에서 문서를 열면 상세 페이지에서도 같은 DBMS가 자동 선택됩니다.

### 이 파일에서 사용된 언어 문법

type assertion, 배열 `includes`, async/await입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js 동적 라우트 `[dbms]`입니다.

### 초심자가 수정할 수 있는 부분

지원 DBMS 추가 시 `lib/routes.ts`와 `lib/dbms-filter.ts`도 함께 봐야 합니다.

### 수정 전 코드

```ts
export const dbmsItems = ["mysql", "postgresql", "oracle"] as const;
```

### 수정 후 코드

```ts
export const dbmsItems = ["mysql", "postgresql", "oracle", "mariadb"] as const;
```

### 수정 시 영향받는 파일

사이드바, DBMS 필터, seed 문서, 실제 문서 데이터가 영향받습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

목록 필터는 slug prefix, 태그명, 문서 본문 안의 DBMS h2 섹션을 함께 봅니다. 정렬은 카테고리 순서와 topic rank를 우선하고, 마지막에 제목과 slug로 정리합니다.
