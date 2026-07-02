# 용어 사전

## 언어 문법

용어: TypeScript  
분류: 언어  
한 줄 설명: JavaScript에 타입 시스템을 더한 언어입니다.  
프로젝트 코드 예시: `export type DocumentStatus = "draft" | "published" | "archived";`  
관련 파일: `types/document.ts`  
주의할 점: 타입은 DB 제약을 대신하지 않습니다.

용어: TSX  
분류: 언어/React 문법  
한 줄 설명: TypeScript 파일 안에서 JSX를 쓰는 파일 형식입니다.  
프로젝트 코드 예시: `<DocCard key={document.id} document={document} />`  
관련 파일: `app/page.tsx`  
주의할 점: HTML과 비슷하지만 `className`을 씁니다.

용어: const assertion  
분류: TypeScript 문법  
한 줄 설명: 배열이나 객체 값을 좁은 literal 타입으로 고정합니다.  
프로젝트 코드 예시: `["mysql", "postgresql", "oracle"] as const`  
관련 파일: `lib/dbms-filter.ts`  
주의할 점: 런타임 검증은 별도 함수가 해야 합니다.

용어: 정규식  
분류: JavaScript 문법  
한 줄 설명: 문자열 패턴을 찾는 표현식입니다.  
프로젝트 코드 예시: `/^##\s+(MySQL|PostgreSQL|Oracle)(?:\s|\/|:|-|$)/i`  
관련 파일: `lib/dbms-filter.ts`  
주의할 점: 현재 코드는 DBMS h2 heading과 코드펜스만 직접 검사합니다.

## 프레임워크

용어: Next.js  
분류: 프레임워크  
한 줄 설명: React 기반 웹 애플리케이션 프레임워크입니다.  
프로젝트 코드 예시: `app/page.tsx`가 `/` 페이지가 됩니다.  
관련 파일: `app/`, `next.config.mjs`  
주의할 점: App Router는 파일 구조가 라우트입니다.

용어: App Router  
분류: Next.js 기능  
한 줄 설명: `app/` 디렉터리 기반 라우팅 방식입니다.  
프로젝트 코드 예시: `app/docs/[[...slug]]/page.tsx`  
관련 파일: `app/`  
주의할 점: 동적 라우트 파일명 대괄호는 의미가 있습니다.

용어: Server Action  
분류: Next.js 기능  
한 줄 설명: form 제출을 서버 함수로 처리하는 기능입니다.  
프로젝트 코드 예시: `export async function createDocumentAction(formData: FormData)`  
관련 파일: `app/admin/documents/actions.ts`  
주의할 점: 서버에서 다시 입력 검증을 해야 합니다.

용어: Client Component  
분류: React/Next.js 기능  
한 줄 설명: 브라우저에서 실행되는 컴포넌트입니다.  
프로젝트 코드 예시: `"use client";`  
관련 파일: `components/admin/LoginForm.tsx`  
주의할 점: 서버 비밀키를 쓰면 안 됩니다.

## 라이브러리

용어: Supabase  
분류: DB/Auth 서비스  
한 줄 설명: Postgres와 Auth 기능을 제공합니다.  
프로젝트 코드 예시: `supabase.from("documents").select(documentSelect)`  
관련 파일: `lib/supabase/*`, `lib/documents.ts`  
주의할 점: service role key는 서버 전용입니다.

용어: React Markdown  
분류: Markdown 렌더링 라이브러리  
한 줄 설명: Markdown 문자열을 React 요소로 바꿉니다.  
프로젝트 코드 예시: `<ReactMarkdown remarkPlugins={[remarkGfm]}>`  
관련 파일: `components/docs/MarkdownRenderer.tsx`  
주의할 점: SQL 코드 블록은 별도 컴포넌트가 처리합니다.

용어: Tailwind CSS  
분류: CSS 프레임워크  
한 줄 설명: className으로 스타일을 조합합니다.  
프로젝트 코드 예시: `className="text-3xl font-semibold"`  
관련 파일: `tailwind.config.ts`, `app/globals.css`  
주의할 점: 동적 className은 scan에서 빠질 수 있습니다.

용어: clsx  
분류: 유틸리티 라이브러리  
한 줄 설명: 조건부 className을 합칩니다.  
프로젝트 코드 예시: `clsx("language-sql sql-code", dialect !== "sql" && "sql-mysql")`  
관련 파일: `DbmsSectionFilter`, `Button`, `SqlCodeBlock`  
주의할 점: false 값은 출력되지 않습니다.

## 빌드 도구

용어: npm script  
분류: 빌드 도구  
한 줄 설명: `package.json`에 정의된 실행 명령어입니다.  
프로젝트 코드 예시: `"dev": "next dev"`  
관련 파일: `package.json`  
주의할 점: 현재 test script는 없습니다.

용어: ESLint  
분류: 정적 검사 도구  
한 줄 설명: 코드 규칙 위반을 검사합니다.  
프로젝트 코드 예시: `"lint": "eslint ."`  
관련 파일: `eslint.config.mjs`  
주의할 점: 동작 테스트와 다릅니다.

## 데이터베이스

용어: RLS  
분류: Supabase/Postgres 보안 기능  
한 줄 설명: Row Level Security로 행 단위 접근을 제한합니다.  
프로젝트 코드 예시: `alter table public.documents enable row level security;`  
관련 파일: `supabase/migrations/001_initial_schema.sql`  
주의할 점: 정책 변경은 공개/관리자 접근에 직접 영향이 있습니다.

용어: soft delete  
분류: 데이터 삭제 패턴  
한 줄 설명: 실제 삭제 대신 삭제 시각을 기록합니다.  
프로젝트 코드 예시: `deleted_at: new Date().toISOString()`  
관련 파일: `lib/documents.ts`  
주의할 점: 공개 조회에서 `deleted_at is null` 조건이 필요합니다.

## 프로젝트 규칙

용어: slug  
분류: 프로젝트 규칙  
한 줄 설명: 문서를 URL에서 찾는 문자열 식별자입니다.  
프로젝트 코드 예시: `concepts/mvcc`  
관련 파일: `app/docs/[[...slug]]/page.tsx`, `lib/routes.ts`  
주의할 점: DB에서 unique입니다.

용어: DBMS 필터  
분류: 프로젝트 규칙  
한 줄 설명: 문서 본문 중 특정 DBMS h2 섹션과 SQL 예시만 보여주는 기능입니다.  
프로젝트 코드 예시: `filterMarkdownByDbms(document.content, activeDbms)`  
관련 파일: `lib/dbms-filter.ts`  
주의할 점: 필터 버튼은 h2 heading에서 만들고, SQL 예시는 코드펜스 언어 또는 `detectSqlDialect()` 추론으로 거릅니다.

용어: SQL dialect 추론  
분류: 프로젝트 규칙  
한 줄 설명: 범용 `sql` 코드블록을 MySQL/PostgreSQL/Oracle 예시로 추정하는 규칙입니다.  
프로젝트 코드 예시: `detectSqlDialect(code)`  
관련 파일: `lib/dbms-filter.ts`, `components/docs/MarkdownRenderer.tsx`  
주의할 점: 완전한 SQL parser가 아니라 화면 필터링용 휴리스틱입니다.

용어: seed fallback  
분류: 프로젝트 규칙  
한 줄 설명: Supabase 조회가 불가능할 때 로컬 seed 데이터를 쓰는 방식입니다.  
프로젝트 코드 예시: `seedDocuments.filter((doc) => doc.status === "published")`  
관련 파일: `lib/documents.ts`, `lib/reference-documents.ts`  
주의할 점: 관리자 CRUD는 seed에 저장되지 않습니다.

## 테스트

용어: lint  
분류: 정적 검사  
한 줄 설명: 코드를 실행하지 않고 규칙 위반을 검사합니다.  
프로젝트 코드 예시: `npm run lint`  
관련 파일: `package.json`  
주의할 점: 기능 테스트가 아닙니다.

용어: unit test  
분류: 테스트  
한 줄 설명: 작은 함수 하나의 동작을 검증합니다.  
프로젝트 코드 예시: 코드에서 확인되지 않습니다.  
관련 파일: 미래의 `lib/dbms-filter.test.ts`  
주의할 점: 현재 테스트 도구가 설치되어 있지 않습니다.

## 배포/인프라

용어: migration  
분류: 데이터베이스 인프라  
한 줄 설명: DB 구조와 seed를 적용하는 SQL 파일입니다.  
프로젝트 코드 예시: `create table if not exists public.documents`  
관련 파일: `supabase/migrations/*.sql`  
주의할 점: 코드 타입과 함께 관리해야 합니다.

용어: Vercel 환경변수  
분류: 배포 설정  
한 줄 설명: 배포 환경에서 앱이 읽는 환경변수입니다.  
프로젝트 코드 예시: `docs/deploy-vercel.md`에 절차가 있습니다.  
관련 파일: `docs/env.md`, `docs/deploy-vercel.md`  
주의할 점: 값을 바꾼 뒤 재배포가 필요할 수 있습니다.
