# 설정 파일

## 포함된 파일 목록

- `.env.example`
- `docs/env.md`
- `docs/deploy-vercel.md`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`
- `proxy.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `eslint.config.mjs`
- `supabase/migrations/*.sql`

## 이 파일 묶음의 역할

실행 환경, Supabase 연결, 인증 쿠키, 타입 검사, 스타일, DB 스키마와 seed를 정의합니다.

## 전체 연결 관계

`.env`  
→ `lib/supabase/*`  
→ `lib/documents.ts`, `lib/auth.ts`  
→ Supabase tables/RLS

## 파일별 상세 설명

## `.env.example`

### 이 파일의 역할

필요한 환경변수 이름을 안내합니다.

### 이 파일이 필요한 이유

실제 `.env`를 커밋하지 않기 때문에 예시가 필요합니다.

### 이 파일과 연결된 다른 파일

`docs/env.md`, `lib/supabase/*`, `lib/auth.ts`

### 핵심 코드 블록

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=admin@example.com
```

### 코드 블록별 해설

`NEXT_PUBLIC_*`는 브라우저에도 노출될 수 있습니다. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 관리자 키입니다.

### 이 파일에서 사용된 언어 문법

환경변수 `KEY=value` 형식입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js가 `.env` 값을 `process.env`로 읽습니다.

### 초심자가 수정할 수 있는 부분

예시 이메일입니다.

### 수정 전 코드

```bash
ADMIN_EMAILS=admin@example.com
```

### 수정 후 코드

```bash
ADMIN_EMAILS=dba@example.com
```

### 수정 시 영향받는 파일

예시 파일만 바뀝니다. 실제 접근 권한은 실제 `.env` 값을 봅니다.

### 이 파일을 이해한 뒤 알아야 하는 것

비밀값은 `.env.example`에 넣지 않습니다.

## `proxy.ts`

### 이 파일의 역할

Supabase 세션 쿠키 갱신을 돕습니다.

### 이 파일이 필요한 이유

로그인 세션을 서버 요청과 연결하기 위해 필요합니다.

### 이 파일과 연결된 다른 파일

`lib/supabase/server.ts`, `components/admin/LoginForm.tsx`

### 핵심 코드 블록

```ts
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  return NextResponse.next({ request });
}
```

### 코드 블록별 해설

Supabase 환경변수가 없으면 인증 쿠키 처리를 하지 않고 요청을 통과시킵니다.

### 이 파일에서 사용된 언어 문법

조건문, 객체 리터럴, async 함수입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

Next.js proxy, `NextRequest`, `NextResponse`, Supabase SSR client입니다.

### 초심자가 수정할 수 있는 부분

대부분 수정하지 않는 편이 안전합니다.

### 수정 전 코드

```ts
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```

### 수정 후 코드

```ts
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
```

동작 변경 예시는 권장하지 않습니다.

### 수정 시 영향받는 파일

로그인 세션과 모든 요청 경로가 영향받을 수 있습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

인증 관련 middleware/proxy는 작은 변경도 전체 접근 흐름에 영향을 줍니다.

## `supabase/migrations/001_initial_schema.sql`

### 이 파일의 역할

DB 테이블, 인덱스, trigger, RLS 정책을 만듭니다.

### 이 파일이 필요한 이유

TypeScript 타입만으로 실제 DB 구조가 만들어지지 않습니다.

### 이 파일과 연결된 다른 파일

`types/*`, `lib/documents.ts`, `lib/tags.ts`, `lib/auth.ts`

### 핵심 코드 블록

```sql
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  category text not null check (category in ('concept', 'dbms', 'advanced', 'case')),
  status text not null check (status in ('draft', 'published', 'archived')),
  deleted_at timestamptz
);
```

### 코드 블록별 해설

`slug`는 URL 식별자입니다. `category`와 `status`는 DB check 제약으로 허용 값을 제한합니다. `deleted_at`은 soft delete에 쓰입니다.

### 이 파일에서 사용된 언어 문법

SQL DDL, check, foreign key, trigger, RLS policy입니다.

### 이 파일에서 사용된 프레임워크/라이브러리 기능

PostgreSQL과 Supabase RLS입니다.

### 초심자가 수정할 수 있는 부분

새 컬럼 추가는 가능하지만 타입과 코드도 함께 바꿔야 합니다.

### 수정 전 코드

```sql
level text,
```

### 수정 후 코드

```sql
level text,
summary text,
```

### 수정 시 영향받는 파일

`types/document.ts`, `DocumentForm`, action, 저장 함수가 영향받습니다.

### 이 파일을 이해한 뒤 알아야 하는 것

`document_relations` 테이블은 스키마에 있지만 현재 앱 코드의 저장/조회 흐름에서는 확인되지 않습니다.
