# 데이터 모델 해설

## 이 프로젝트의 데이터 흐름 큰 그림

문서 데이터는 Supabase `documents` 테이블에 저장됩니다. 태그는 `tags`, 문서-태그 연결은 `document_tags`, 공식문서 링크는 `official_docs`에 저장됩니다. 환경변수가 없거나 공개 조회가 실패하면 `lib/reference-documents.ts`의 `referenceDocuments`, `referenceTags`를 seed로 사용합니다.

## Entity/Model 목록

이름: `WikiDocument`  
파일 경로: `types/document.ts`  
역할: 앱에서 사용하는 문서 객체입니다.  
필드 목록: `id`, `slug`, `title`, `description`, `content`, `category`, `level`, `status`, `published_at`, `created_at`, `updated_at`, `deleted_at`, `tags`, `official_docs`, `related_documents`  
각 필드의 의미: `slug`는 URL 식별자, `content`는 Markdown 본문, `status`는 공개 상태, `deleted_at`은 soft delete입니다.  
어디서 생성되는가: Supabase 조회 결과를 `normalizeDocument()`가 변환하거나 `referenceDocuments` seed에서 생성합니다.  
어디서 사용되는가: 홈, 상세, DBMS 목록, 태그 목록, 관리자 화면입니다.  
DB에 저장되는가: 기본 필드는 `documents`에 저장됩니다.  
외부 응답으로 노출되는가: 공개 화면에 렌더링됩니다. JSON API는 코드에서 확인되지 않습니다.  
수정 시 영향받는 파일: `types/document.ts`, `lib/documents.ts`, `DocumentForm`, migration

이름: `Tag`  
파일 경로: `types/tag.ts`  
역할: 문서 분류 태그입니다.  
필드 목록: `id`, `name`, `type`, `created_at`  
각 필드의 의미: `name`은 화면 표시명, `type`은 DBMS/TOPIC/OPERATION 같은 분류입니다.  
어디서 생성되는가: `referenceTags`, Supabase `tags`, 관리자 태그 생성입니다.  
어디서 사용되는가: `TagBadge`, `TagSelector`, 검색, 태그 목록 페이지입니다.  
DB에 저장되는가: `tags` 테이블입니다.  
외부 응답으로 노출되는가: 태그명으로 화면에 표시됩니다.  
수정 시 영향받는 파일: `types/tag.ts`, `app/admin/tags/page.tsx`, migration

이름: `OfficialDoc`  
파일 경로: `types/official-doc.ts`  
역할: 공식문서 링크입니다.  
필드 목록: `id`, `document_id`, `dbms`, `title`, `url`, `note`, `version`, `created_at`  
각 필드의 의미: `dbms`는 DBMS 이름, `url`은 공식문서 URL입니다.  
어디서 생성되는가: `OfficialDocEditor`, `readDocumentInput`, `officialDocs()` seed helper입니다.  
어디서 사용되는가: `OfficialDocCard`, 관리자 공식문서 목록입니다.  
DB에 저장되는가: `official_docs` 테이블입니다.  
외부 응답으로 노출되는가: 상세 페이지에 노출됩니다. active DBMS가 있으면 같은 DBMS만 표시합니다.  
수정 시 영향받는 파일: `OfficialDocEditor`, `app/admin/documents/actions.ts`, `lib/documents.ts`

## DTO/Request/Response 목록

이름: `DocumentInput`  
파일 경로: `types/document.ts`  
역할: 관리자 form 값을 저장 함수로 넘기는 입력 타입입니다.  
필드 목록: `title`, `slug`, `description`, `content`, `category`, `level`, `status`, `tag_ids`, `official_docs`, `related_document_ids`  
각 필드의 의미: form에서 넘어온 문서 저장 대상 값입니다.  
어디서 생성되는가: `readDocumentInput(formData)`  
어디서 사용되는가: `createDocument`, `updateDocument`, `replaceDocumentJoins`  
DB에 저장되는가: 여러 테이블에 나뉘어 저장됩니다.  
외부 응답으로 노출되는가: 직접 JSON 응답은 코드에서 확인되지 않습니다.  
수정 시 영향받는 파일: 폼, action, 저장 함수, migration

## Schema/Table/Collection 목록

이름: `public.documents`  
파일 경로: `supabase/migrations/001_initial_schema.sql`  
역할: 문서 본문과 메타데이터 저장입니다.  
필드 목록: `id`, `slug`, `title`, `description`, `content`, `category`, `level`, `status`, `published_at`, `created_at`, `updated_at`, `deleted_at`  
각 필드의 의미: `category`는 목록 분류, `status`는 공개 상태, `deleted_at`은 soft delete입니다.  
어디서 생성되는가: `createDocument`  
어디서 사용되는가: 공개 조회와 관리자 목록입니다.  
DB에 저장되는가: 예.  
외부 응답으로 노출되는가: 공개 화면에 렌더링됩니다.  
수정 시 영향받는 파일: 타입, form, action, 저장 함수

이름: `public.document_tags`  
파일 경로: `supabase/migrations/001_initial_schema.sql`  
역할: 문서와 태그의 다대다 연결입니다.  
필드 목록: `document_id`, `tag_id`  
각 필드의 의미: 어떤 문서에 어떤 태그가 연결되는지 나타냅니다.  
어디서 생성되는가: `replaceDocumentJoins`  
어디서 사용되는가: `documentSelect` join입니다.  
DB에 저장되는가: 예.  
외부 응답으로 노출되는가: 태그명으로 화면에 표시됩니다.  
수정 시 영향받는 파일: `lib/documents.ts`, `TagSelector`

이름: `public.document_relations`  
파일 경로: `supabase/migrations/001_initial_schema.sql`  
역할: 문서 간 관계 저장용 테이블입니다.  
필드 목록: `source_document_id`, `target_document_id`, `relation_type`  
각 필드의 의미: 원본 문서와 대상 문서의 관계입니다.  
어디서 생성되는가: 현재 앱 코드에서 확인되지 않습니다.  
어디서 사용되는가: 현재 앱 코드에서 확인되지 않습니다.  
DB에 저장되는가: 테이블은 존재합니다.  
외부 응답으로 노출되는가: 코드에서 확인되지 않습니다.  
수정 시 영향받는 파일: 관련 기능 구현 시 타입, 조회 함수, UI가 필요합니다.

## Enum/Value Object 목록

- `DocumentCategory`: `"concept" | "dbms" | "advanced" | "case"`
- `DocumentStatus`: `"draft" | "published" | "archived"`
- `TagType`: `"DBMS" | "TOPIC" | "ADVANCED" | "OPERATION" | "CASE" | "INTERNAL"`
- `DbmsFilter`: `"mysql" | "postgresql" | "oracle"`

## 데이터 변환 흐름

공개 상세:

Supabase joined row 또는 seed  
→ `WikiDocument`  
→ slug 비교  
→ Markdown 본문  
→ DBMS 섹션 필터  
→ React 화면

관리자 저장:

HTML form  
→ `FormData`  
→ `DocumentInput`  
→ `documents` row  
→ `document_tags` rows  
→ `official_docs` rows

## 필드 추가 시 수정해야 하는 파일

1. `supabase/migrations/*.sql`
2. `types/document.ts`
3. `components/admin/DocumentForm.tsx`
4. `app/admin/documents/actions.ts`
5. `lib/documents.ts`
6. 표시가 필요하면 `DocCard` 또는 상세 페이지

## 민감 정보 또는 노출 주의 필드

- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용입니다.
- `profiles.email`: 관리자 판별에 사용됩니다.
- `deleted_at`: 공개 조회 조건에 영향을 줍니다.

## 데이터 모델 변경 체크리스트

- TypeScript 타입을 바꿨습니까?
- DB migration을 바꿨습니까?
- 관리자 form과 action을 바꿨습니까?
- insert/update object에 필드를 넣었습니까?
- 공개 화면에 노출해도 되는 필드인지 확인했습니까?
