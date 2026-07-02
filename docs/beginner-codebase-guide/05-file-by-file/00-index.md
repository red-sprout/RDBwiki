# 파일별 상세 해설 인덱스

## 이 디렉터리의 목적

이 디렉터리는 실제 코드 파일을 역할별로 묶어 설명합니다. 모든 파일을 같은 깊이로 다루지 않고, 요청 진입점, 데이터 흐름, 관리자 저장, DBMS 필터, 데이터 모델을 우선 설명합니다.

## 파일별 해설 문서 목록

- `01-entrypoint.md`: 실행 진입점과 공개 페이지입니다.
- `02-domain-or-feature-files.md`: 문서, 검색, DBMS 필터, 관리자 기능입니다.
- `03-global-and-common-files.md`: 공통 UI, Markdown, SQL 코드, 목차입니다.
- `04-configuration-files.md`: 환경변수, Supabase, TypeScript, Tailwind, migration입니다.
- `05-test-files.md`: 현재 테스트 상태와 추가 방향입니다.

## 도메인별 파일 묶음

- 공개 문서: `app/page.tsx`, `app/docs/[[...slug]]/page.tsx`, `components/docs/*`
- DBMS 필터: `lib/dbms-filter.ts`, `components/docs/DbmsSectionFilter.tsx`
- 관리자: `app/admin/**`, `components/admin/*`, `lib/auth.ts`
- 데이터: `lib/documents.ts`, `lib/reference-documents.ts`, `types/*`, `supabase/migrations/*`

## 초심자가 먼저 읽을 파일

1. `app/docs/[[...slug]]/page.tsx`
2. `lib/dbms-filter.ts`
3. `lib/documents.ts`
4. `components/docs/MarkdownRenderer.tsx`
5. `app/admin/documents/actions.ts`

## 상세 해설 생략 기준

`.next/`, `node_modules/`, `.git/`은 자동 생성 또는 외부 패키지라 설명하지 않습니다. `package-lock.json`은 직접 수정 대상이 아니므로 짧게만 다룹니다.

## 다음에 읽을 문서

`06-language-from-code.md`를 읽으면 파일별 해설에서 나온 TypeScript/TSX 문법을 코드 기준으로 다시 확인할 수 있습니다.
