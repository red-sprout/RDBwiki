# 프레임워크와 라이브러리 해설

## 이 문서의 목적

TypeScript 언어 기능과 Next.js, React, Supabase, Tailwind, Markdown 라이브러리 기능을 구분합니다.

## 언어 자체 기능과 외부 기능 구분 기준

`type`, `async`, `Map`, 정규식은 언어/런타임 기능입니다. `next/navigation`, `react`, `@supabase/*`, `react-markdown`에서 import하는 것은 프레임워크 또는 라이브러리 기능입니다.

## 프레임워크 기능 목록

이름: App Router  
분류: Next.js 기능  
등장 위치: `app/**/page.tsx`  
역할: 파일 경로를 URL로 연결합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 공개 문서와 관리자 페이지를 파일 구조로 관리하기 위해서입니다.  
초심자가 주의할 점: 페이지 파일명은 `page.tsx`여야 합니다.

이름: `notFound()`  
분류: Next.js 기능  
등장 위치: `app/docs/[[...slug]]/page.tsx`, `app/dbms/[dbms]/page.tsx`  
역할: 404 흐름으로 보냅니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 없는 문서와 잘못된 DBMS 경로를 처리합니다.  
초심자가 주의할 점: 빈 화면을 반환하는 것과 다릅니다.

이름: `redirect()`  
분류: Next.js 기능  
등장 위치: `lib/auth.ts`, `app/admin/documents/actions.ts`  
역할: 다른 URL로 이동합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 관리자 미인증 사용자를 로그인으로 보내고 저장 후 목록으로 이동합니다.  
초심자가 주의할 점: 호출 후 일반 흐름이 계속된다고 가정하지 않습니다.

이름: `"use server"`  
분류: Next.js Server Action 지시어  
등장 위치: `app/admin/documents/actions.ts`, `app/admin/tags/actions.ts`  
역할: 서버에서 실행되는 action임을 표시합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: form 제출로 DB 저장을 실행합니다.  
초심자가 주의할 점: 브라우저 전용 API를 사용하지 않습니다.

이름: `"use client"`  
분류: React/Next.js 지시어  
등장 위치: `LoginForm`, `MarkdownEditor`, `lib/supabase/client.ts`  
역할: 브라우저에서 실행될 컴포넌트나 client helper임을 표시합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: `useState`, `useRouter`, 브라우저 Supabase client를 쓰기 위해서입니다.  
초심자가 주의할 점: 서버 비밀키를 사용하면 안 됩니다.

## 외부 라이브러리 목록

이름: Supabase  
분류: DB/Auth 라이브러리와 서비스  
등장 위치: `lib/supabase/*`, `lib/documents.ts`, `LoginForm`  
역할: Auth와 Postgres 접근입니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 문서와 태그를 저장하고 관리자 로그인을 처리합니다.  
초심자가 주의할 점: anon key와 service role key의 권한이 다릅니다.

이름: `react-markdown`  
분류: Markdown 렌더링 라이브러리  
등장 위치: `MarkdownRenderer`  
역할: Markdown 문자열을 React 요소로 바꿉니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 문서 본문이 Markdown으로 저장됩니다.  
초심자가 주의할 점: SQL 코드 블록은 custom component로 렌더링됩니다.

이름: Tailwind CSS  
분류: CSS 프레임워크  
등장 위치: TSX `className`, `app/globals.css`, `tailwind.config.ts`  
역할: utility class로 스타일을 구성합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 빠르고 일관된 UI 스타일을 위해서입니다.  
초심자가 주의할 점: 동적 className은 Tailwind content scan에서 빠질 수 있습니다.

이름: `clsx`  
분류: className 조합 라이브러리  
등장 위치: `Button`, `DbmsBadge`, `DbmsSectionFilter`, `SqlCodeBlock`  
역할: 조건부 className을 합칩니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: active/variant 상태와 SQL dialect class를 다룹니다.  
초심자가 주의할 점: false 조건은 출력되지 않습니다.

이름: `next/font/google`  
분류: Next.js 폰트 최적화 기능  
등장 위치: `app/layout.tsx`  
역할: Geist, Geist Mono 폰트를 Next.js 방식으로 로드하고 CSS variable을 제공합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 로컬과 배포 환경의 글꼴 차이를 줄이기 위해서입니다.  
초심자가 주의할 점: 빌드 시 폰트 fetch가 필요할 수 있습니다.

## 빌드 도구 기능 목록

이름: npm scripts  
분류: 빌드 도구  
등장 위치: `package.json`  
역할: 개발, 빌드, lint 명령 실행입니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 명령어를 표준화합니다.  
초심자가 주의할 점: `test` script는 현재 없습니다.

이름: TypeScript compiler 설정  
분류: 타입/빌드 설정  
등장 위치: `tsconfig.json`  
역할: strict 모드, JSX, alias를 설정합니다.  
언어 자체 기능인지 여부: 도구 설정입니다.  
프로젝트에서 쓰인 이유: 타입 안정성과 `@/` import를 위해서입니다.  
초심자가 주의할 점: alias를 테스트 도구가 자동으로 이해하지 못할 수 있습니다.

## 프로젝트 자체 규칙 목록

이름: 공개 문서 조건  
분류: 프로젝트 규칙  
등장 위치: `lib/documents.ts`, Supabase RLS  
역할: `published`이고 `deleted_at`이 없는 문서만 공개합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: draft와 soft delete 문서를 숨깁니다.  
초심자가 주의할 점: 관리자 목록은 다른 조건을 씁니다.

이름: DBMS 섹션 heading 규칙  
분류: 프로젝트 규칙  
등장 위치: `lib/dbms-filter.ts`  
역할: `## MySQL`, `## PostgreSQL`, `## Oracle`로 시작하는 h2를 필터 기준으로 삼습니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 비교 문서에서 특정 DBMS만 볼 수 있게 합니다.  
초심자가 주의할 점: h3인 `### MySQL`은 필터에 잡히지 않습니다.

이름: SQL dialect 추론 규칙  
분류: 프로젝트 규칙  
등장 위치: `lib/dbms-filter.ts`, `components/docs/MarkdownRenderer.tsx`  
역할: 범용 `sql` 코드블록을 MySQL/PostgreSQL/Oracle 예시로 추론합니다.  
언어 자체 기능인지 여부: 아닙니다.  
프로젝트에서 쓰인 이유: 기존 문서가 모두 `sql` 코드펜스로 저장되어 있어도 DBMS 선택 시 맞는 예시만 보이게 하기 위해서입니다.  
초심자가 주의할 점: 추론 키워드에 걸리지 않는 범용 SQL은 모든 DBMS에서 남습니다.

## 초심자가 헷갈리기 쉬운 구분

- `DbmsFilter`는 TypeScript 타입이고 `normalizeDbmsFilter()`는 런타임 검증입니다.
- `TagType` 타입과 DB `check` 제약은 별개입니다.
- `SqlCodeBlock`은 SQL parser가 아니라 표시용 tokenizer입니다.
- `detectSqlDialect()`는 SQL 실행기가 아니라 화면 필터링을 위한 휴리스틱입니다.
- `seedDocuments`는 이제 `referenceDocuments`에서 옵니다.
- `service role key`는 관리자 서버 코드에서만 사용합니다.
