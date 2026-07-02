# 설정 파일 해설

## 설정 파일 목록

- `package.json`
- `.env.example`
- `docs/env.md`
- `docs/deploy-vercel.md`
- `tsconfig.json`
- `tailwind.config.ts`
- `app/globals.css`
- `eslint.config.mjs`
- `next.config.mjs`
- `postcss.config.mjs`
- `proxy.ts`
- `supabase/migrations/*.sql`

## 빌드 설정

파일 경로: `package.json`  
역할: 실행 명령어와 패키지 의존성을 정의합니다.  
이 파일이 없으면 생기는 문제: `npm run dev`, `npm run build`, `npm run lint`를 실행할 수 없습니다.  
주요 설정 항목: `scripts`, `dependencies`, `devDependencies`  
설정값별 의미: `next`는 프레임워크, `typescript`는 타입 검사, `eslint`는 정적 검사입니다.  
초심자가 수정해도 되는 값: 새 script 추가입니다.  
수정하면 위험한 값: Next/React 버전 조합입니다.  
관련 실행 명령어: `npm run dev`, `npm run build`, `npm run lint`

## 실행 설정

파일 경로: `next.config.mjs`  
역할: Next.js 설정 파일입니다.  
이 파일이 없으면 생기는 문제: 현재 커스텀 설정은 없지만, 향후 설정 위치가 사라집니다.  
주요 설정 항목: `nextConfig = {}`  
설정값별 의미: 현재 코드에서 확인된 커스텀 설정은 없습니다.  
초심자가 수정해도 되는 값: 공식 문서를 보고 필요한 설정만 추가합니다.  
수정하면 위험한 값: 실험적 빌드 설정입니다.  
관련 실행 명령어: `npm run dev`, `npm run build`

## 환경변수

파일 경로: `.env.example`  
역할: 필요한 환경변수 이름을 안내합니다.  
이 파일이 없으면 생기는 문제: 새 개발자가 어떤 값을 준비해야 하는지 알기 어렵습니다.  
주요 설정 항목: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`  
설정값별 의미: URL/anon key는 공개 조회와 로그인, service role key는 관리자 서버 CRUD, admin emails는 관리자 허용 목록입니다.  
초심자가 수정해도 되는 값: 예시 이메일입니다.  
수정하면 위험한 값: 실제 비밀키를 커밋하는 것입니다.  
관련 실행 명령어: `npm run dev`

## 데이터베이스 설정

파일 경로: `supabase/migrations/001_initial_schema.sql`  
역할: 테이블, 인덱스, trigger, RLS 정책입니다.  
이 파일이 없으면 생기는 문제: Supabase DB에 저장 구조가 없습니다.  
주요 설정 항목: `documents`, `tags`, `document_tags`, `official_docs`, `profiles`, RLS policy  
설정값별 의미: 공개 문서는 `status='published'`와 `deleted_at is null` 조건으로 읽힙니다.  
초심자가 수정해도 되는 값: 새 컬럼 추가는 연습할 수 있지만 코드와 같이 수정해야 합니다.  
수정하면 위험한 값: RLS policy, foreign key, check 제약입니다.  
관련 실행 명령어: Supabase migration 적용 명령은 코드에서 확인되지 않습니다.

## 외부 서비스 설정

파일 경로: `lib/supabase/server.ts`  
역할: 서버용 Supabase client를 만듭니다.  
이 파일이 없으면 생기는 문제: 공개 Supabase 조회와 현재 사용자 조회가 어렵습니다.  
주요 설정 항목: cookie adapter, Supabase URL, anon key  
설정값별 의미: Next.js 서버 요청 쿠키와 Supabase 세션을 연결합니다.  
초심자가 수정해도 되는 값: 보통 수정하지 않습니다.  
수정하면 위험한 값: cookie set/get 로직입니다.  
관련 실행 명령어: `npm run dev`

파일 경로: `lib/supabase/admin.ts`  
역할: 관리자 CRUD용 Supabase client를 만듭니다.  
이 파일이 없으면 생기는 문제: 문서/태그 저장이 동작하지 않습니다.  
주요 설정 항목: `SUPABASE_SERVICE_ROLE_KEY`, `persistSession: false`  
설정값별 의미: service role key는 서버 전용 고권한 키입니다.  
초심자가 수정해도 되는 값: 없습니다.  
수정하면 위험한 값: service role key 노출입니다.  
관련 실행 명령어: `npm run dev`

## Docker 설정

Dockerfile 또는 `docker-compose.yml`은 현재 코드에서 확인되지 않습니다.

## 테스트 설정

테스트 설정 파일은 현재 코드에서 확인되지 않습니다. `package.json`에는 `lint` 스크립트만 있습니다.

## CI/CD 설정

`.github/workflows` 같은 CI/CD 설정은 현재 코드에서 확인되지 않습니다. 배포 안내는 `docs/deploy-vercel.md`에 있습니다.

## 초심자가 수정해도 되는 값

- `app/layout.tsx` metadata title/description
- `README.md` 문구
- `.env.example` 예시 이메일
- `.prose-docs` 문서 스타일
- `navItems`의 화면 표시 label

## 수정하면 위험한 값

- `SUPABASE_SERVICE_ROLE_KEY` 노출 범위
- RLS policy
- `documents.status`, `documents.category` check 제약
- `proxy.ts` matcher와 cookie 로직
- `tsconfig.json` path alias

## 설정 오류 해결 가이드

- 공개 문서가 seed로만 보입니다: Supabase URL/anon key를 확인합니다.
- 관리자 CRUD가 실패합니다: service role key를 확인합니다.
- 로그인 후 관리자 접근이 안 됩니다: `ADMIN_EMAILS`를 확인합니다.
- `@/` import가 깨집니다: `tsconfig.json` paths를 확인합니다.
- DBMS 필터가 안 보입니다: Markdown에 `## MySQL`, `## PostgreSQL`, `## Oracle` heading이 있는지 확인합니다.
