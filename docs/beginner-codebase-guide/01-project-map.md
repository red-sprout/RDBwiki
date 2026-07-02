# 프로젝트 파일 지도

## 전체 디렉터리 트리

```text
RDBwiki/
├── app/
│   ├── page.tsx
│   ├── docs/[[...slug]]/page.tsx
│   ├── dbms/[dbms]/page.tsx
│   ├── tags/[tag]/page.tsx
│   ├── advanced/page.tsx
│   ├── cases/page.tsx
│   └── admin/
├── components/
│   ├── docs/
│   ├── admin/
│   └── ui/
├── lib/
│   ├── documents.ts
│   ├── dbms-filter.ts
│   ├── reference-documents.ts
│   ├── search.ts
│   └── supabase/
├── types/
├── supabase/migrations/
└── docs/
```

## 루트 파일 설명

파일 경로: `package.json`  
역할: 실행 스크립트와 의존성을 정의합니다.  
이 파일이 필요한 이유: `npm run dev`, `npm run build`, `npm run lint`가 여기서 결정됩니다.  
연결된 파일: `package-lock.json`, `next.config.mjs`, `eslint.config.mjs`  
초심자가 봐야 할 핵심: `scripts`, `dependencies`  
설명 깊이: 상세 설명 필요

파일 경로: `README.md`  
역할: 프로젝트 요약과 setup 문서 링크입니다.  
이 파일이 필요한 이유: 처음 보는 사람이 환경변수, 배포, 콘텐츠 기준 문서로 이동할 수 있습니다.  
연결된 파일: `docs/env.md`, `docs/deploy-vercel.md`, `docs/content-quality.md`  
초심자가 봐야 할 핵심: 로컬 실행 명령과 문서 링크  
설명 깊이: 짧은 설명으로 충분

## 소스 코드 디렉터리 설명

파일 경로: `app/`  
역할: Next.js URL 라우트입니다.  
이 파일이 필요한 이유: `page.tsx` 파일이 실제 페이지 진입점입니다.  
연결된 파일: `components/`, `lib/`  
초심자가 봐야 할 핵심: 동적 라우트 `[dbms]`, `[[...slug]]`, Promise 형태의 `params`  
설명 깊이: 상세 설명 필요

파일 경로: `components/docs/`  
역할: 공개 문서 UI입니다.  
이 파일이 필요한 이유: 레이아웃, 문서 카드, Markdown 렌더러, SQL 코드 블록, DBMS 필터를 제공합니다.  
연결된 파일: `lib/routes.ts`, `lib/toc.ts`, `lib/dbms-filter.ts`  
초심자가 봐야 할 핵심: `DocsLayout`, `MarkdownRenderer`, `DbmsSectionFilter`, `SqlCodeBlock`  
설명 깊이: 상세 설명 필요

파일 경로: `components/admin/`  
역할: 관리자 화면 UI입니다.  
이 파일이 필요한 이유: 문서와 태그를 만들고 수정합니다.  
연결된 파일: `app/admin/**`, `lib/documents.ts`, `lib/tags.ts`  
초심자가 봐야 할 핵심: `DocumentForm`, `LoginForm`, `MarkdownEditor`  
설명 깊이: 상세 설명 필요

파일 경로: `lib/`  
역할: 데이터, 검색, 인증, 라우트, DBMS 필터 로직입니다.  
이 파일이 필요한 이유: 페이지가 DB와 문자열 처리 세부 구현을 직접 알지 않아도 됩니다.  
연결된 파일: `types/`, `supabase/migrations/`, `components/`  
초심자가 봐야 할 핵심: `documents.ts`, `dbms-filter.ts`, `reference-documents.ts`, `auth.ts`  
설명 깊이: 상세 설명 필요

## 설정 파일 설명

파일 경로: `.env.example`  
역할: 필요한 환경변수 이름을 보여줍니다.  
이 파일이 필요한 이유: 실제 `.env` 작성 기준입니다.  
연결된 파일: `docs/env.md`, `lib/supabase/*`, `lib/auth.ts`  
초심자가 봐야 할 핵심: `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다.  
설명 깊이: 상세 설명 필요

파일 경로: `tailwind.config.ts`, `app/globals.css`  
역할: Tailwind 색상 토큰과 문서 본문 스타일입니다.  
이 파일이 필요한 이유: `.prose-docs`, `.sql-code` 같은 표시 스타일이 여기서 적용됩니다.  
연결된 파일: 모든 TSX 컴포넌트  
초심자가 봐야 할 핵심: `content` 경로와 `.prose-docs`  
설명 깊이: 중간 설명 필요

## 테스트 디렉터리 설명

현재 저장소에서 `*.test.ts`, `*.spec.ts`, `__tests__`는 확인되지 않습니다. 테스트 상태와 추가 예시는 `11-testing.md`에 정리합니다.

## 배포/인프라 파일 설명

파일 경로: `supabase/migrations/001_initial_schema.sql`  
역할: 테이블, 인덱스, 트리거, RLS 정책입니다.  
이 파일이 필요한 이유: Supabase DB의 실제 저장 구조입니다.  
연결된 파일: `types/*`, `lib/documents.ts`, `lib/tags.ts`  
초심자가 봐야 할 핵심: `documents`, `tags`, `document_tags`, `official_docs`, RLS  
설명 깊이: 상세 설명 필요

파일 경로: `supabase/migrations/003_reference_quality_seed.sql`, `004_deepen_reference_documents.sql`  
역할: 참고 문서 품질과 깊이를 보강하는 seed SQL입니다.  
이 파일이 필요한 이유: DB 초기 콘텐츠를 운영 관점으로 보강합니다.  
연결된 파일: `lib/reference-documents.ts`  
초심자가 봐야 할 핵심: 앱 코드와 별개로 DB에 넣는 콘텐츠 SQL입니다.  
설명 깊이: 중간 설명 필요

## 초심자가 몰라도 되는 파일

- `.next/`: 빌드 산출물입니다.
- `node_modules/`: 설치된 외부 패키지입니다.
- `.git/`: Git 내부 데이터입니다.
- `package-lock.json`: 의존성 잠금 파일입니다. 직접 편집하지 않습니다.

## 파일 간 연결 관계 요약

`app/**/page.tsx`가 요청을 받고, `lib/*`가 데이터를 가져오거나 가공하며, `components/*`가 화면을 만듭니다. `types/*`는 데이터 모양을 설명하고, `supabase/migrations/*`는 실제 DB 저장 구조를 정의합니다.
