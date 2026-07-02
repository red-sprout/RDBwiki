# 프로젝트 전체 개요

## 프로젝트 한 줄 요약

RDBwiki는 MySQL, PostgreSQL, Oracle의 아키텍처, 내부 구조, 고급 기능, 운영 사례를 공식문서 기준으로 비교하는 Next.js 기반 기술 문서 위키입니다.

## 이 프로젝트가 해결하는 문제

DBMS별 운영 지식은 공식문서, 시스템 뷰, 실행 계획, 실무 장애 사례에 흩어져 있습니다. RDBwiki는 이를 문서, 태그, 공식문서 링크, DBMS별 섹션 필터로 묶어 한 화면에서 비교할 수 있게 합니다.

## 핵심 기능 목록

- 공개 문서 목록과 검색: `app/page.tsx`, `lib/search.ts`
- 문서 상세 조회: `app/docs/[[...slug]]/page.tsx`
- 문서 내 MySQL/PostgreSQL/Oracle 섹션 필터: `lib/dbms-filter.ts`, `components/docs/DbmsSectionFilter.tsx`
- SQL 코드 하이라이팅: `components/docs/SqlCodeBlock.tsx`
- DBMS별 문서 목록: `app/dbms/[dbms]/page.tsx`
- 태그별 문서 목록: `app/tags/[tag]/page.tsx`
- 관리자 로그인: `components/admin/LoginForm.tsx`
- 관리자 문서 CRUD: `app/admin/documents/actions.ts`, `lib/documents.ts`
- 관리자 태그 CRUD: `app/admin/tags/actions.ts`, `lib/tags.ts`

## 사용 기술 스택

- 언어: TypeScript, TSX
- 프레임워크: Next.js App Router
- UI: React, Tailwind CSS
- 인증/DB: Supabase Auth, Supabase Postgres
- Markdown: `react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`
- 아이콘: `lucide-react`
- 스타일 조합: `clsx`
- 빌드/검사: npm, Next.js, ESLint, TypeScript

## 전체 실행 구조

`npm run dev`를 실행하면 Next.js 개발 서버가 시작됩니다. URL 요청은 `app/**/page.tsx` 파일로 연결됩니다. 서버 컴포넌트는 Supabase 또는 seed 데이터를 읽고 JSX를 반환합니다. `"use client"`가 붙은 컴포넌트는 브라우저에서 상태와 이벤트를 처리합니다.

## 초심자가 알아야 할 큰 그림

- `app/`: URL 진입점입니다.
- `components/`: 화면을 구성하는 재사용 컴포넌트입니다.
- `lib/`: 데이터 접근, 검색, 인증, 라우트, DBMS 필터 로직입니다.
- `types/`: TypeScript 데이터 타입입니다.
- `supabase/migrations/`: DB 테이블, RLS 정책, seed SQL입니다.

## 대표 요청 흐름 요약

문서 상세 요청:

Client  
→ `DocPage`  
→ `params`와 `searchParams` await  
→ `listPublishedDocuments()`  
→ `normalizeSlug()`로 slug 비교  
→ `getDbmsSections()`  
→ `filterMarkdownByDbms()`  
→ `MarkdownRenderer`  
→ Client

관리자 문서 생성:

Admin form  
→ `createDocumentAction(formData)`  
→ `readDocumentInput(formData)`  
→ `requireAdmin()`  
→ `createDocument(input)`  
→ `replaceDocumentJoins()`  
→ Supabase

## 문서에서 사용할 용어 기준

- 문서: `WikiDocument` 타입의 DB 학습 콘텐츠입니다.
- slug: `/docs/concepts/mvcc` 같은 URL로 연결되는 문서 식별자입니다.
- DBMS 필터: 문서 본문 중 `## MySQL`, `## PostgreSQL`, `## Oracle` 섹션만 골라 보는 기능입니다.
- 공식문서: `OfficialDoc` 타입의 외부 공식 링크입니다.
- seed fallback: Supabase 환경변수가 없거나 조회 실패 시 `lib/reference-documents.ts` 데이터를 사용하는 동작입니다.
