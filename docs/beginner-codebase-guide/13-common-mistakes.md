# 초심자가 자주 하는 실수

## 언어 문법 관련 실수

## `as`를 값 검증으로 착각하는 실수

### 왜 발생하는가

TypeScript 타입 단언이 런타임 값을 바꿔준다고 오해하기 때문입니다.

### 문제가 되는 이유

잘못된 문자열도 TypeScript만 통과하고 DB에서 실패할 수 있습니다.

### 잘못된 코드

```ts
type: String(formData.get("type") ?? "TOPIC") as TagType
```

### 올바른 코드

```ts
const rawType = String(formData.get("type") ?? "TOPIC");
if (!["DBMS", "TOPIC", "ADVANCED", "OPERATION", "CASE", "INTERNAL"].includes(rawType)) {
  throw new Error("Invalid tag type.");
}
const type = rawType as TagType;
```

### 관련 파일

`app/admin/tags/actions.ts`, `types/tag.ts`

### 예방 방법

외부 입력은 타입 단언 전에 런타임 검증을 합니다.

## 프레임워크 관련 실수

## `params`를 바로 객체로 쓰는 실수

### 왜 발생하는가

현재 코드에서 `params`가 Promise로 전달되는 패턴을 놓치기 때문입니다.

### 문제가 되는 이유

`await params` 없이 값을 읽으면 타입과 런타임 흐름이 맞지 않습니다.

### 잘못된 코드

```tsx
const dbms = params.dbms;
```

### 올바른 코드

```tsx
const { dbms } = await params;
```

### 관련 파일

`app/dbms/[dbms]/page.tsx`, `app/docs/[[...slug]]/page.tsx`

### 예방 방법

페이지 props 타입을 먼저 확인합니다.

## 프로젝트 구조 관련 실수

## `page.tsx`가 아닌 파일을 라우트로 기대하는 실수

### 왜 발생하는가

Next.js App Router 규칙을 모르기 때문입니다.

### 문제가 되는 이유

URL 페이지로 인식되지 않습니다.

### 잘못된 코드

```text
app/beginner/index.tsx
```

### 올바른 코드

```text
app/beginner/page.tsx
```

### 관련 파일

`app/page.tsx`, `app/advanced/page.tsx`

### 예방 방법

라우트는 `page.tsx` 파일로 만듭니다.

## 데이터 모델 관련 실수

## TypeScript 타입만 바꾸고 DB check를 안 바꾸는 실수

### 왜 발생하는가

타입과 DB 스키마가 다른 층이라는 점을 놓치기 때문입니다.

### 문제가 되는 이유

코드는 통과해도 Supabase 저장이 실패할 수 있습니다.

### 잘못된 코드

```ts
export type DocumentCategory = "concept" | "dbms" | "advanced" | "case" | "security";
```

DB migration은 그대로 둡니다.

### 올바른 코드

```sql
category text not null check (category in ('concept', 'dbms', 'advanced', 'case', 'security'))
```

### 관련 파일

`types/document.ts`, `supabase/migrations/001_initial_schema.sql`

### 예방 방법

타입, 폼, action, 저장 함수, migration을 함께 점검합니다.

## 설정 관련 실수

## 공개 seed fallback과 관리자 CRUD를 같은 것으로 보는 실수

### 왜 발생하는가

Supabase 설정이 없어도 공개 페이지가 보이기 때문입니다.

### 문제가 되는 이유

관리자 CRUD는 seed가 아니라 실제 Supabase admin client가 필요합니다.

### 잘못된 코드

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

### 올바른 코드

```bash
SUPABASE_SERVICE_ROLE_KEY=실제_서버전용키
```

### 관련 파일

`lib/documents.ts`, `lib/supabase/admin.ts`, `.env.example`

### 예방 방법

읽기 fallback과 쓰기 저장소를 구분합니다.

## 테스트 관련 실수

## `npm test`가 있다고 가정하는 실수

### 왜 발생하는가

많은 프로젝트에 test script가 있기 때문입니다.

### 문제가 되는 이유

현재 `package.json`에는 test script가 없습니다.

### 잘못된 코드

```bash
npm test
```

### 올바른 코드

```bash
npm run lint
```

### 관련 파일

`package.json`

### 예방 방법

항상 `scripts`를 먼저 확인합니다.

## 에러 처리 관련 실수

## DBMS 필터가 안 보이는 이유를 라우팅 문제로만 보는 실수

### 왜 발생하는가

필터가 문서 본문 heading을 기준으로 생성된다는 점을 놓치기 때문입니다.

### 문제가 되는 이유

문서에 `## MySQL` 같은 heading이 없으면 필터가 표시되지 않습니다.

### 잘못된 코드

```md
### MySQL
```

### 올바른 코드

```md
## MySQL
```

### 관련 파일

`lib/dbms-filter.ts`, `components/docs/DbmsSectionFilter.tsx`

### 예방 방법

DBMS별 섹션은 h2 heading으로 작성합니다.
