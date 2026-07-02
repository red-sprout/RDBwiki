# 이 프로젝트 코드로 배우는 언어 문법

## 이 문서의 목적

이 문서는 TypeScript/TSX 문법을 RDBwiki 실제 코드로 설명합니다. 언어 문법과 Next.js/React/Supabase 기능을 구분합니다.

## 이 프로젝트에서 자주 등장하는 문법 목록

- `import`, `export`, `import type`
- type alias와 union type
- const assertion `as const`
- async/await
- optional chaining `?.`
- nullish coalescing `??`
- 배열 `map`, `filter`, `some`, `includes`, `flatMap`
- object spread
- JSX props와 children
- type assertion `as`
- non-null assertion `!`
- 정규식
- `Set`, `Map`

## 파일별로 등장하는 문법

- `app/docs/[[...slug]]/page.tsx`: Promise props await, 조건부 렌더링, helper function
- `lib/dbms-filter.ts`: const assertion, union type, Map, Set, 정규식
- `components/docs/SqlCodeBlock.tsx`: tokenizer loop, union type, nested ternary
- `types/document.ts`: type alias, optional property
- `app/admin/documents/actions.ts`: FormData, type assertion, Server Action

## 문법별 상세 설명

## type alias와 union type

### 한 줄 설명

데이터 모양과 허용 값을 이름으로 정의합니다.

### 프로젝트 코드 예시

```ts
export type DocumentStatus = "draft" | "published" | "archived";
```

### 코드 해석

`DocumentStatus`에는 세 문자열 중 하나만 들어갈 수 있습니다.

### 이 프로젝트에서 쓰인 이유

문서 상태 값 오타를 줄이기 위해서입니다.

### 비슷한 문법과의 차이

DB `check` 제약은 저장 시점 검증이고, union type은 코드 작성 시점 검증입니다.

### 초심자가 자주 하는 오해

타입을 바꾸면 DB도 자동으로 바뀐다고 생각할 수 있습니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```ts
export type DocumentStatus = "draft" | "published" | "archived";
```

수정 후:

```ts
export type DocumentStatus = "draft" | "review" | "published" | "archived";
```

## const assertion `as const`

### 한 줄 설명

배열 값을 넓은 `string[]`이 아니라 정확한 문자열 값들의 묶음으로 고정합니다.

### 프로젝트 코드 예시

```ts
export const dbmsFilterValues = ["mysql", "postgresql", "oracle"] as const;
export type DbmsFilter = (typeof dbmsFilterValues)[number];
```

### 코드 해석

`DbmsFilter`는 `"mysql" | "postgresql" | "oracle"` 타입이 됩니다.

### 이 프로젝트에서 쓰인 이유

DBMS 필터 query 값을 제한하기 위해서입니다.

### 비슷한 문법과의 차이

`string[]`는 아무 문자열이나 가능하지만 `as const`는 실제 배열 값만 타입으로 사용합니다.

### 초심자가 자주 하는 오해

`as const`가 런타임 검증을 해준다고 생각할 수 있습니다. 실제 검증은 `normalizeDbmsFilter()`가 합니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```ts
export const dbmsFilterValues = ["mysql", "postgresql", "oracle"] as const;
```

수정 후:

```ts
export const dbmsFilterValues = ["mysql", "postgresql", "oracle", "mariadb"] as const;
```

## async/await

### 한 줄 설명

비동기 작업 결과를 기다리는 문법입니다.

### 프로젝트 코드 예시

```tsx
const { dbms } = await params;
const documents = await listPublishedDocuments();
```

### 코드 해석

라우트 params와 문서 목록 조회 결과를 기다립니다.

### 이 프로젝트에서 쓰인 이유

Next.js route props와 Supabase 조회가 비동기이기 때문입니다.

### 비슷한 문법과의 차이

`.then()`으로도 가능하지만 이 프로젝트는 `await`를 주로 씁니다.

### 초심자가 자주 하는 오해

`await`는 `async` 함수 안에서만 사용할 수 있습니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```ts
const documents = await listPublishedDocuments();
const dbmsDocs = await listDocumentsByDbms(dbms);
```

수정 후:

```ts
const [documents, dbmsDocs] = await Promise.all([
  listPublishedDocuments(),
  listDocumentsByDbms(dbms)
]);
```

## optional chaining과 nullish coalescing

### 한 줄 설명

값이 없을 때 안전하게 접근하고 기본값을 넣습니다.

### 프로젝트 코드 예시

```ts
const slug = normalizeSlug(slugParts?.join("/") ?? "concepts/mvcc");
```

### 코드 해석

slug 배열이 있으면 `/`로 합치고, 없으면 기본 slug를 씁니다.

### 이 프로젝트에서 쓰인 이유

`/docs`처럼 slug가 없는 URL도 처리해야 하기 때문입니다.

### 비슷한 문법과의 차이

`??`는 `null` 또는 `undefined`에만 반응합니다. `||`는 빈 문자열에도 반응합니다.

### 초심자가 자주 하는 오해

`?.`가 모든 에러를 막지는 않습니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```ts
document.official_docs?.filter(...)
```

수정 후:

```ts
(document.official_docs ?? []).filter(...)
```

## 정규식

### 한 줄 설명

문자열 패턴을 찾고 바꾸는 문법입니다.

### 프로젝트 코드 예시

```ts
line.match(/^##\s+(MySQL|PostgreSQL|Oracle)(?:\s|\/|:|-|$)/i);
```

### 코드 해석

Markdown 줄이 `## MySQL`, `## PostgreSQL`, `## Oracle` 중 하나로 시작하는 h2인지 확인합니다. DBMS 이름 뒤에는 공백, `/`, `:`, `-`, 줄 끝이 올 수 있습니다.

### 이 프로젝트에서 쓰인 이유

문서 본문에서 DBMS 섹션 heading을 찾아야 하기 때문입니다. 상세 페이지 필터 버튼과 DBMS별 문서 목록 판정에서 이 결과를 사용합니다.

### 비슷한 문법과의 차이

일반 `includes()`는 대략적인 포함 여부만 보고, 정규식은 줄 전체 형식을 검사합니다.

### 초심자가 자주 하는 오해

정규식이 Markdown parser를 완전히 대신한다고 생각할 수 있습니다. 현재 코드는 필요한 h2 heading과 코드펜스만 직접 검사합니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```ts
/^##\s+(MySQL|PostgreSQL|Oracle)(?:\s|\/|:|-|$)/i
```

수정 후:

```ts
/^##\s+(MySQL|PostgreSQL|Oracle|MariaDB)(?:\s|\/|:|-|$)/i
```

## JSX

### 한 줄 설명

TypeScript 안에 HTML처럼 UI를 작성하는 문법입니다.

### 프로젝트 코드 예시

```tsx
<DocCard key={document.id} document={document} />
```

### 코드 해석

`DocCard` 컴포넌트에 `document` prop을 전달합니다.

### 이 프로젝트에서 쓰인 이유

React 화면을 컴포넌트 단위로 만들기 위해서입니다.

### 비슷한 문법과의 차이

HTML과 비슷하지만 `class` 대신 `className`을 씁니다.

### 초심자가 자주 하는 오해

배열 렌더링에서 `key`를 빼도 된다고 생각할 수 있습니다.

### 직접 수정해볼 수 있는 예시

수정 전:

```tsx
<h1 className="text-3xl font-semibold">Cases</h1>
```

수정 후:

```tsx
<h1 className="text-3xl font-semibold">Case Studies</h1>
```

## 초심자가 자주 헷갈리는 문법

- `as`: 타입 단언이지 값 검증이 아닙니다.
- `as const`: 타입 추론을 좁히지만 런타임 검증은 아닙니다.
- `?.`: 왼쪽 값이 없을 때만 멈춥니다.
- `...props`: 나머지 props를 전달합니다.
- `"use client"`와 `"use server"`: 언어 문법처럼 보이지만 프레임워크 지시어입니다.

## 다른 언어 사용자 관점의 비교

- Spring Controller 대신 `app/**/page.tsx`와 Server Action이 요청 진입점입니다.
- Repository 클래스 대신 `lib/documents.ts` 함수들이 DB 접근을 담당합니다.
- DTO class 대신 `types/*.ts`의 type alias를 씁니다.
- Annotation 대신 파일 경로와 `"use client"`, `"use server"` 지시어가 동작을 바꿉니다.

## 이 프로젝트를 수정하기 위해 먼저 알아야 할 문법

1. async/await
2. JSX props
3. union type
4. optional chaining
5. 배열 메서드
6. FormData
7. 정규식
