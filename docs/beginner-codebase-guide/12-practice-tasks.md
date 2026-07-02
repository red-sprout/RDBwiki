# 응답 메시지 변경

## 난이도

낮음

## 목표

홈 화면 문서 개수 표시를 바꿉니다.

## 배우는 개념

JSX 텍스트 수정

## 수정할 파일

`app/page.tsx`

## 수정 전 코드

```tsx
<span className="text-sm text-muted-foreground">{results.length} documents</span>
```

## 수정 후 코드

```tsx
<span className="text-sm text-muted-foreground">{results.length} docs found</span>
```

## 왜 이렇게 수정하는가

데이터 로직을 건드리지 않고 화면 문구만 바꿉니다.

## 동작 확인 방법

`npm run dev` 후 홈 화면을 확인합니다.

## 실패할 경우 확인할 것

파일 저장과 개발 서버 로그를 확인합니다.

## 관련 문서

`05-file-by-file/01-entrypoint.md`

# 로그 추가

## 난이도

낮음

## 목표

검색어를 서버 로그로 확인합니다.

## 배우는 개념

서버 컴포넌트 로그

## 수정할 파일

`app/page.tsx`

## 수정 전 코드

```tsx
const q = resolvedSearchParams.q ?? "";
```

## 수정 후 코드

```tsx
const q = resolvedSearchParams.q ?? "";
if (q) console.log("Search query:", q);
```

## 왜 이렇게 수정하는가

`app/page.tsx`는 서버에서 실행되므로 로그가 터미널에 나옵니다.

## 동작 확인 방법

`/?q=mvcc`로 접속합니다.

## 실패할 경우 확인할 것

브라우저 콘솔이 아니라 서버 터미널을 봅니다.

## 관련 문서

`03-runtime-flow.md`

# 요청 필드 하나 추가

## 난이도

중간

## 목표

문서에 `summary` 필드를 추가합니다.

## 배우는 개념

DB 컬럼, 타입, FormData, 저장 object 연결

## 수정할 파일

`types/document.ts`, `DocumentForm`, `actions.ts`, `lib/documents.ts`, migration

## 수정 전 코드

```tsx
<Field label="Description" name="description" defaultValue={document?.description ?? ""} />
```

## 수정 후 코드

```tsx
<Field label="Description" name="description" defaultValue={document?.description ?? ""} />
<Field label="Summary" name="summary" defaultValue={document?.summary ?? ""} />
```

## 왜 이렇게 수정하는가

form의 `name`이 있어야 `FormData.get("summary")`로 읽을 수 있습니다.

## 동작 확인 방법

관리자 문서 form에서 Summary 입력칸을 확인합니다.

## 실패할 경우 확인할 것

타입과 DB 컬럼을 함께 추가했는지 확인합니다.

## 관련 문서

`08-data-model.md`

# 응답 필드 하나 추가

## 난이도

중간

## 목표

문서 카드에 `level`을 표시합니다.

## 배우는 개념

조건부 렌더링

## 수정할 파일

`components/docs/DocCard.tsx`

## 수정 전 코드

```tsx
{document.description ? <p className="mt-2 text-sm text-muted-foreground">{document.description}</p> : null}
```

## 수정 후 코드

```tsx
{document.description ? <p className="mt-2 text-sm text-muted-foreground">{document.description}</p> : null}
{document.level ? <p className="mt-2 text-xs text-muted-foreground">Level: {document.level}</p> : null}
```

## 왜 이렇게 수정하는가

`level`은 이미 타입과 DB에 있으므로 표시만 추가합니다.

## 동작 확인 방법

홈 문서 카드에서 Level을 확인합니다.

## 실패할 경우 확인할 것

seed 또는 DB 문서에 `level` 값이 있는지 확인합니다.

## 관련 문서

`08-data-model.md`

# 검증 조건 추가

## 난이도

중간

## 목표

slug 앞뒤 공백을 제거합니다.

## 배우는 개념

Server Action 입력 정리

## 수정할 파일

`app/admin/documents/actions.ts`

## 수정 전 코드

```ts
slug: String(formData.get("slug") ?? ""),
```

## 수정 후 코드

```ts
slug: String(formData.get("slug") ?? "").trim(),
```

## 왜 이렇게 수정하는가

URL 식별자인 slug의 의도하지 않은 공백을 제거합니다.

## 동작 확인 방법

관리자 문서 생성 후 slug를 확인합니다.

## 실패할 경우 확인할 것

빈 slug 검증까지 필요하면 별도 `throw new Error`를 추가합니다.

## 관련 문서

`10-error-handling.md`

# 에러 처리 추가

## 난이도

중간

## 목표

빈 태그 이름을 막습니다.

## 배우는 개념

런타임 검증

## 수정할 파일

`app/admin/tags/actions.ts`

## 수정 전 코드

```ts
name: String(formData.get("name") ?? ""),
```

## 수정 후 코드

```ts
const name = String(formData.get("name") ?? "").trim();
if (!name) throw new Error("Tag name is required.");
```

## 왜 이렇게 수정하는가

HTML required만으로 서버 입력 검증을 대신하지 않기 위해서입니다.

## 동작 확인 방법

빈 값 제출을 우회한 상황에서 저장이 중단되는지 확인합니다.

## 실패할 경우 확인할 것

`createTag` 호출에 `name` 변수를 넣었는지 확인합니다.

## 관련 문서

`10-error-handling.md`

# 간단한 API 또는 함수 추가

## 난이도

중간

## 목표

DBMS 필터 label을 외부에서 재사용합니다.

## 배우는 개념

export 함수 사용

## 수정할 파일

`lib/dbms-filter.ts`

## 수정 전 코드

```ts
export function dbmsFilterLabel(dbms: DbmsFilter) {
  return dbmsHeadingLabels[dbms];
}
```

## 수정 후 코드

```ts
export function dbmsFilterLabel(dbms: DbmsFilter) {
  return dbmsHeadingLabels[dbms];
}

export function isSupportedDbmsFilter(value: string) {
  return normalizeDbmsFilter(value) !== null;
}
```

## 왜 이렇게 수정하는가

DBMS query 검증을 다른 파일에서도 재사용할 수 있습니다.

## 동작 확인 방법

필요한 페이지에서 import해 사용합니다.

## 실패할 경우 확인할 것

순환 import가 생기지 않았는지 확인합니다.

## 관련 문서

`04-feature-flows.md`

# 테스트 코드 추가

## 난이도

중간

## 목표

`filterMarkdownByDbms` 테스트를 추가합니다.

## 배우는 개념

단위 테스트

## 수정할 파일

`package.json`, 새 테스트 파일

## 수정 전 코드

```json
"lint": "eslint ."
```

## 수정 후 코드

```json
"lint": "eslint .",
"test": "vitest"
```

## 왜 이렇게 수정하는가

테스트 실행 명령어를 추가합니다.

## 동작 확인 방법

Vitest 설치 후 `npm run test`를 실행합니다.

## 실패할 경우 확인할 것

현재 Vitest는 설치되어 있지 않습니다.

## 관련 문서

`11-testing.md`

# 설정값 변경

## 난이도

낮음

## 목표

metadata title을 바꿉니다.

## 배우는 개념

Next.js metadata

## 수정할 파일

`app/layout.tsx`

## 수정 전 코드

```ts
title: "RDB Wiki",
```

## 수정 후 코드

```ts
title: "RDBwiki - DBMS 비교 학습",
```

## 왜 이렇게 수정하는가

브라우저 탭과 메타 정보 제목을 바꿉니다.

## 동작 확인 방법

브라우저 탭 제목을 확인합니다.

## 실패할 경우 확인할 것

개발 서버 새로고침을 확인합니다.

## 관련 문서

`09-configuration.md`
