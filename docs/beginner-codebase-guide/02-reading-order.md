# 초심자용 파일 읽기 순서

## 전체 읽기 전략

URL 진입점에서 시작해 데이터 함수, 타입, DB 스키마, UI 컴포넌트 순서로 읽습니다. 이 프로젝트는 Next.js App Router를 사용하므로 `app/` 아래 `page.tsx`가 가장 중요한 시작점입니다.

## 1단계: 프로젝트 실행 구조 이해

읽을 파일: `package.json`, `app/layout.tsx`, `app/page.tsx`  
읽는 이유: 실행 명령어와 홈 화면 진입점을 파악하기 위해서입니다.  
이 파일에서 봐야 할 코드:

```json
"dev": "next dev"
```

이 파일을 읽고 나면 알아야 하는 것: `npm run dev`가 Next.js 서버를 시작하고 `/` 요청이 `app/page.tsx`로 들어갑니다.  
다음에 읽을 파일: `lib/documents.ts`

## 2단계: 외부 요청 진입점 이해

읽을 파일: `app/page.tsx`, `app/docs/[[...slug]]/page.tsx`, `app/dbms/[dbms]/page.tsx`, `app/tags/[tag]/page.tsx`  
읽는 이유: 사용자가 보는 공개 페이지가 어떤 함수로 데이터를 가져오는지 확인하기 위해서입니다.  
이 파일에서 봐야 할 코드:

```tsx
const { slug: slugParts } = await params;
const resolvedSearchParams = searchParams ? await searchParams : {};
```

이 파일을 읽고 나면 알아야 하는 것: 현재 코드에서는 `params`와 `searchParams`가 Promise로 전달되어 `await`합니다.  
다음에 읽을 파일: `lib/dbms-filter.ts`, `lib/documents.ts`

## 3단계: 비즈니스 로직 이해

읽을 파일: `lib/documents.ts`, `lib/dbms-filter.ts`, `lib/search.ts`, `lib/tags.ts`, `lib/auth.ts`  
읽는 이유: 문서 조회, DBMS 필터, 검색, 태그, 관리자 확인 로직이 여기에 있습니다.  
이 파일에서 봐야 할 코드:

```ts
if (!hasSupabaseEnv()) return seedDocuments.filter((doc) => doc.status === "published");
```

이 파일을 읽고 나면 알아야 하는 것: 공개 조회는 Supabase가 없으면 seed 데이터로 폴백합니다.  
다음에 읽을 파일: `lib/reference-documents.ts`, `types/document.ts`

## 4단계: 데이터 접근 이해

읽을 파일: `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/client.ts`  
읽는 이유: 서버 조회, 관리자 저장, 브라우저 로그인이 서로 다른 Supabase client를 쓰기 때문입니다.  
이 파일에서 봐야 할 코드:

```ts
process.env.SUPABASE_SERVICE_ROLE_KEY
```

이 파일을 읽고 나면 알아야 하는 것: service role key는 관리자 서버 작업에만 사용합니다.  
다음에 읽을 파일: `supabase/migrations/001_initial_schema.sql`

## 5단계: 데이터 구조 이해

읽을 파일: `types/document.ts`, `types/tag.ts`, `types/official-doc.ts`, `supabase/migrations/001_initial_schema.sql`  
읽는 이유: TypeScript 타입과 DB 컬럼을 연결하기 위해서입니다.  
이 파일에서 봐야 할 코드:

```ts
export type DocumentStatus = "draft" | "published" | "archived";
```

이 파일을 읽고 나면 알아야 하는 것: 타입의 허용 값과 DB의 `check` 제약이 함께 맞아야 합니다.  
다음에 읽을 파일: `components/admin/DocumentForm.tsx`

## 6단계: 설정과 실행 환경 이해

읽을 파일: `.env.example`, `docs/env.md`, `docs/deploy-vercel.md`, `tsconfig.json`, `proxy.ts`  
읽는 이유: Supabase 연결, 배포, alias, 인증 쿠키 처리를 이해하기 위해서입니다.  
이 파일에서 봐야 할 코드:

```json
"@/*": ["./*"]
```

이 파일을 읽고 나면 알아야 하는 것: `@/lib/documents`는 프로젝트 루트를 기준으로 import합니다.  
다음에 읽을 파일: `10-error-handling.md`

## 7단계: 에러 처리 이해

읽을 파일: `lib/documents.ts`, `lib/tags.ts`, `lib/auth.ts`, `app/docs/[[...slug]]/page.tsx`  
읽는 이유: `notFound`, `redirect`, `throw new Error`, seed fallback을 구분해야 합니다.  
이 파일에서 봐야 할 코드:

```ts
if (error) throw new Error(error.message);
```

이 파일을 읽고 나면 알아야 하는 것: 읽기 실패와 쓰기 실패는 다르게 처리됩니다.  
다음에 읽을 파일: `11-testing.md`

## 8단계: 테스트 이해

읽을 파일: `package.json`, `11-testing.md`  
읽는 이유: 현재 테스트 스크립트가 없고 lint만 있습니다.  
이 파일에서 봐야 할 코드:

```json
"lint": "eslint ."
```

이 파일을 읽고 나면 알아야 하는 것: 테스트 추가 전 테스트 도구 설치와 script 추가가 필요합니다.  
다음에 읽을 파일: `12-practice-tasks.md`

## 최종 체크리스트

- 홈 검색 흐름을 설명할 수 있습니다.
- 문서 상세의 slug 정규화와 DBMS 섹션 필터를 설명할 수 있습니다.
- 관리자 문서 저장 흐름을 설명할 수 있습니다.
- TypeScript 타입과 DB check 제약을 함께 볼 수 있습니다.
- Supabase 환경변수 유무에 따른 동작 차이를 설명할 수 있습니다.
