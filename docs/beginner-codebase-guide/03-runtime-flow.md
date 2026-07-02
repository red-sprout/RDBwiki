# 프로젝트 실행 흐름

## 실행 명령어

```bash
npm run dev
npm run build
npm run lint
```

## 실행 진입점

직접 작성한 `main` 함수는 없습니다. `package.json`의 `"dev": "next dev"`가 Next.js 개발 서버를 실행합니다. Next.js는 `app/` 디렉터리의 `layout.tsx`, `page.tsx`를 읽어 라우트를 구성합니다.

## 프로그램이 시작될 때 일어나는 일

1. `next dev`가 개발 서버를 시작합니다.
2. Next.js가 `app/**/page.tsx`를 URL로 연결합니다.
3. 요청 URL에 맞는 페이지 컴포넌트가 서버에서 실행됩니다.
4. 페이지는 `lib/*` 함수를 호출해 데이터를 가져옵니다.
5. JSX가 생성되고 브라우저에 전달됩니다.
6. `"use client"` 컴포넌트는 브라우저에서 상태와 이벤트를 처리합니다.

## 런타임 객체 생성 흐름

공개 조회:

```ts
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}
```

관리자 저장:

```ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

브라우저 로그인:

```ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## 의존성 연결 흐름

Spring 같은 DI 컨테이너는 없습니다. 각 파일에서 필요한 함수를 import합니다.

```tsx
import { listPublishedDocuments } from "@/lib/documents";
```

`@/`는 `tsconfig.json`의 `paths` 설정으로 프로젝트 루트를 뜻합니다.

## 외부 요청을 받을 준비가 되는 과정

- `/`: `app/page.tsx`
- `/docs`: `app/docs/[[...slug]]/page.tsx`
- `/docs/concepts/mvcc`: `app/docs/[[...slug]]/page.tsx`
- `/docs/concepts/mvcc?dbms=mysql`: 같은 문서에서 MySQL 섹션만 필터링합니다.
- `/dbms/mysql`: `app/dbms/[dbms]/page.tsx`
- `/tags/MVCC`: `app/tags/[tag]/page.tsx`
- `/admin/documents`: `app/admin/documents/page.tsx`

## 종료 또는 예외 상황

```tsx
if (!document) notFound();
```

문서가 없으면 404로 갑니다.

```ts
if (!allowed) redirect("/admin/login");
```

관리자가 아니면 로그인 페이지로 이동합니다.

```ts
if (error) throw new Error(error.message);
```

Supabase 쓰기 실패는 예외를 던집니다.

## 초심자용 실행 흐름 요약

`npm run dev`  
→ Next.js 서버 실행  
→ URL에 맞는 `page.tsx` 실행  
→ Supabase 또는 seed 데이터 조회  
→ DBMS 필터와 Markdown 렌더링  
→ React 컴포넌트 출력
