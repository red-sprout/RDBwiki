# 초심자용 코드베이스 완전 해설서

## 이 문서 세트의 목적

이 문서 세트는 RDBwiki 프로젝트를 처음 보는 사람이 IDE를 켜지 않아도 전체 구조, 실행 흐름, 데이터 흐름, 설정, 에러 처리, 테스트 상태, 수정 포인트를 이해하도록 돕습니다. 이 프로젝트는 MySQL, PostgreSQL, Oracle 비교 학습 문서를 제공하는 Next.js 기반 DB Wiki입니다.

## 문서를 읽는 추천 순서

1. `99-index.md`: 전체 안내를 봅니다.
2. `00-overview.md`: 프로젝트의 큰 그림을 잡습니다.
3. `01-project-map.md`: 파일과 디렉터리 위치를 확인합니다.
4. `02-reading-order.md`: 어떤 파일부터 읽을지 정합니다.
5. `03-runtime-flow.md`: `npm run dev` 이후 흐름을 이해합니다.
6. `04-feature-flows.md`: 대표 기능 흐름을 따라갑니다.
7. `05-file-by-file/00-index.md`: 파일별 해설로 들어갑니다.
8. `06-language-from-code.md`부터 `14-glossary.md`: 문법, 프레임워크, 데이터, 설정, 실습을 보강합니다.

## 각 문서의 역할

- `00-overview.md`: 프로젝트 요약과 핵심 흐름입니다.
- `01-project-map.md`: 전체 파일 지도입니다.
- `02-reading-order.md`: 초심자용 읽기 순서입니다.
- `03-runtime-flow.md`: Next.js 실행 모델입니다.
- `04-feature-flows.md`: 공개 문서, DBMS 필터, 검색, 관리자 저장 흐름입니다.
- `05-file-by-file/`: 실제 파일 단위 해설입니다.
- `06-language-from-code.md`: TypeScript/TSX 문법을 실제 코드로 설명합니다.
- `07-framework-and-libraries.md`: 언어 기능과 외부 기능을 구분합니다.
- `08-data-model.md`: 타입과 Supabase 스키마를 연결합니다.
- `09-configuration.md`: 설정과 환경변수를 설명합니다.
- `10-error-handling.md`: `notFound`, `redirect`, `throw Error`, seed fallback 흐름입니다.
- `11-testing.md`: 현재 테스트 상태와 추가 방향입니다.
- `12-practice-tasks.md`: 수정 실습입니다.
- `13-common-mistakes.md`: 자주 하는 실수입니다.
- `14-glossary.md`: 용어 사전입니다.

## 이 문서만 보고 할 수 있어야 하는 것

- 공개 문서 상세 페이지가 slug와 DBMS query를 어떻게 처리하는지 설명할 수 있습니다.
- 문서 생성/수정 폼이 `FormData`에서 Supabase row로 바뀌는 흐름을 설명할 수 있습니다.
- Supabase 환경변수가 없을 때 seed 데이터가 쓰이는 이유를 설명할 수 있습니다.
- 필드 추가, 검증 추가, 검색 대상 추가, DBMS 필터 수정 지점을 찾을 수 있습니다.

## 프로젝트를 이해하는 핵심 흐름

Client  
→ `app/docs/[[...slug]]/page.tsx`  
→ `listPublishedDocuments()`  
→ Supabase 또는 `lib/reference-documents.ts` seed  
→ `filterMarkdownByDbms()`  
→ `MarkdownRenderer`와 `SqlCodeBlock`  
→ Client

관리자 저장 흐름은 다음과 같습니다.

Admin Browser  
→ `components/admin/DocumentForm.tsx`  
→ `app/admin/documents/actions.ts`  
→ `requireAdmin()`  
→ `createDocument()` 또는 `updateDocument()`  
→ Supabase `documents`, `document_tags`, `official_docs`

## 처음 읽는 사람이 가장 먼저 봐야 할 5개 파일

1. `package.json`
2. `app/page.tsx`
3. `app/docs/[[...slug]]/page.tsx`
4. `lib/documents.ts`
5. `lib/dbms-filter.ts`

## 다음 단계 안내

먼저 `00-overview.md`를 읽고, 이후 `04-feature-flows.md`에서 실제 요청 흐름을 따라가십시오. 직접 수정하려면 `12-practice-tasks.md`의 낮은 난이도 실습부터 시작하면 됩니다.
