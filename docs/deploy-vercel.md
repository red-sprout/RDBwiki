# Vercel Deployment Guide

이 문서는 RDB Wiki를 Vercel에 배포하는 절차를 설명합니다. GitHub 저장소를 Vercel 프로젝트로 import하고, Supabase 환경변수를 등록한 뒤, 배포 결과와 관리자 로그인을 확인하는 흐름을 기준으로 작성합니다.

## 한 줄 결론

Vercel 배포는 `GitHub 저장소 연결 -> 프로젝트 import -> 환경변수 등록 -> Deploy -> 배포 URL 확인` 순서로 진행합니다. Supabase key가 없거나 `SUPABASE_SERVICE_ROLE_KEY`가 잘못 등록되면 공개 문서는 보일 수 있어도 `/admin` 기능은 정상 동작하지 않습니다.

## 적용 범위

- Next.js App Router 기반 RDB Wiki 프로젝트
- GitHub 저장소를 Vercel에 연결하는 배포 방식
- Supabase Auth, Supabase Postgres, 관리자 CRUD를 사용하는 운영 환경

## 사전 준비

배포 전에 아래 항목을 먼저 끝냅니다.

- GitHub에 이 프로젝트 repository가 올라가 있어야 합니다.
- Supabase 프로젝트가 생성되어 있어야 합니다.
- Supabase migration SQL이 적용되어 있어야 합니다.
- Supabase Auth에 관리자 사용자가 생성되어 있어야 합니다.
- `.env`에 들어간 값과 동일한 값을 Vercel에 등록할 준비가 되어 있어야 합니다.

환경변수 값은 [docs/env.md](/Users/jujaewan/1_Projects/RDBwiki/docs/env.md)를 기준으로 준비합니다.

## 로컬에서 배포 전 확인

1. 터미널에서 프로젝트 폴더로 이동합니다.

```bash
cd /Users/jujaewan/1_Projects/RDBwiki
```

2. dependency가 설치되어 있는지 확인합니다.

```bash
npm install
```

3. lint를 실행합니다.

```bash
npm run lint
```

4. production build를 실행합니다.

```bash
npm run build
```

5. 위 명령이 실패하면 Vercel에 올리기 전에 먼저 수정합니다.

## GitHub에 코드 올리기

1. 브라우저에서 GitHub repository를 엽니다.
2. repository에 최신 코드가 올라가 있는지 확인합니다.
3. `.env` 파일이 올라가 있지 않은지 확인합니다.
4. `.env.example`은 올라가 있어도 됩니다.
5. `package.json`, `package-lock.json`, `app`, `components`, `lib`, `supabase`, `docs` 폴더가 포함되어 있는지 확인합니다.

주의할 점:

- `.env`는 절대 commit하지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`를 GitHub README, issue, PR comment에 붙여 넣지 않습니다.
- Vercel은 Git push를 기준으로 preview/production deployment를 생성하므로 `main` branch에 배포 가능한 코드만 merge합니다.

## Vercel 프로젝트 만들기

Vercel 공식 문서는 GitHub, GitLab, Bitbucket repository를 연결하면 branch push와 production branch merge 시 자동 배포가 생성된다고 안내합니다. 기본 production branch는 보통 `main`입니다.

### 1. Vercel Dashboard 접속

1. 브라우저에서 [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. 로그인합니다.
3. 오른쪽 위 또는 dashboard 화면의 `Add New...` 버튼을 클릭합니다.
4. 메뉴가 열리면 `Project`를 클릭합니다.

### 2. Git 저장소 선택

1. `Import Git Repository` 화면에서 GitHub 계정 또는 조직을 선택합니다.
2. repository 목록에서 RDB Wiki repository를 찾습니다.
3. repository 오른쪽의 `Import` 버튼을 클릭합니다.
4. repository가 보이지 않으면 `Adjust GitHub App Permissions` 또는 GitHub 권한 설정 링크를 클릭합니다.
5. GitHub 화면이 열리면 해당 repository에 Vercel 접근 권한을 부여합니다.
6. 다시 Vercel import 화면으로 돌아와 repository를 선택합니다.

### 3. 프로젝트 설정 확인

`Configure Project` 화면에서 아래 값을 확인합니다.

| 항목 | 설정 |
|---|---|
| Framework Preset | `Next.js` |
| Root Directory | repository root |
| Build Command | 기본값 또는 `npm run build` |
| Output Directory | 기본값 |
| Install Command | 기본값 또는 `npm install` |

Root Directory는 monorepo가 아니라면 건드리지 않습니다. 이 프로젝트는 repository root에 `package.json`이 있으므로 root directory를 비워 두거나 기본값으로 둡니다.

## Vercel 환경변수 등록

Vercel 공식 문서는 환경변수를 source code 밖에서 관리하는 key-value 값으로 설명하며, Build Step과 Function 실행에서 읽을 수 있다고 안내합니다. 또한 환경변수 변경은 이전 deployment에 자동 적용되지 않고 새 deployment부터 적용됩니다.

### 1. Configure Project 화면에서 등록

처음 import하는 중이라면 `Configure Project` 화면 아래쪽의 `Environment Variables` 영역에서 바로 등록합니다.

1. `Environment Variables` 섹션을 찾습니다.
2. `Name` 입력칸에 변수 이름을 입력합니다.
3. `Value` 입력칸에 값을 붙여 넣습니다.
4. `Add` 또는 `Add More` 버튼을 클릭합니다.
5. 아래 4개 변수를 모두 추가합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
```

### 2. 이미 만든 프로젝트에서 등록

프로젝트를 이미 만든 뒤라면 아래 순서로 들어갑니다.

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 RDB Wiki 프로젝트를 클릭합니다.
2. 상단 또는 왼쪽 메뉴에서 `Settings`를 클릭합니다.
3. 왼쪽 설정 메뉴에서 `Environment Variables`를 클릭합니다.
4. `Name`에 `NEXT_PUBLIC_SUPABASE_URL`을 입력합니다.
5. `Value`에 Supabase Project URL을 붙여 넣습니다.
6. `Environment`에서 `Production`, `Preview`, `Development`를 선택합니다.
7. `Save`를 클릭합니다.
8. 같은 방식으로 나머지 변수를 추가합니다.

등록할 값:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key 또는 legacy anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key 또는 legacy service_role key |
| `ADMIN_EMAILS` | 관리자 이메일. 여러 명이면 comma로 구분 |

예시:

```bash
ADMIN_EMAILS=admin@example.com,dba@example.com
```

주의할 점:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저에서 사용되는 공개 값입니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀 값입니다.
- `SUPABASE_SERVICE_ROLE_KEY`에는 절대 `NEXT_PUBLIC_`을 붙이지 않습니다.
- Vercel에서 환경변수를 수정한 뒤에는 반드시 새 deployment를 만들어야 반영됩니다.

## 첫 배포 실행

1. `Configure Project` 화면에서 설정과 환경변수를 모두 확인합니다.
2. `Deploy` 버튼을 클릭합니다.
3. Vercel이 dependency install, build, deployment를 순서대로 실행합니다.
4. build가 끝날 때까지 기다립니다.
5. `Congratulations` 또는 deployment 완료 화면이 보이면 배포 URL을 클릭합니다.

배포가 실패하면 `Build Logs`를 엽니다.

주요 확인 지점:

- `npm install` 단계에서 dependency 설치가 실패했는지 확인합니다.
- `npm run build` 단계에서 TypeScript 또는 lint 관련 오류가 있는지 확인합니다.
- 환경변수 누락 메시지가 있는지 확인합니다.
- Supabase 연결 오류가 server log에 찍히는지 확인합니다.

## 배포 후 확인

배포 URL이 `https://example.vercel.app`이라면 아래 순서로 확인합니다.

1. `https://example.vercel.app/`에 접속합니다.
2. 첫 화면에 문서 카드가 표시되는지 확인합니다.
3. `https://example.vercel.app/docs/concepts/index`에 접속합니다.
4. 문서 본문, Tags, Table of Contents가 표시되는지 확인합니다.
5. `https://example.vercel.app/tags/MySQL` 또는 UI의 `MySQL` 태그를 클릭합니다.
6. 404가 발생하지 않는지 확인합니다.
7. `https://example.vercel.app/admin/login`에 접속합니다.
8. Supabase Auth에 만든 관리자 이메일과 비밀번호로 로그인합니다.
9. `/admin` 화면으로 이동하는지 확인합니다.
10. 관리자 문서 목록에서 문서가 조회되는지 확인합니다.

## 환경변수 수정 후 재배포

Vercel 공식 문서는 환경변수 변경, Build & Development Settings 변경 같은 경우 재배포를 권장합니다.

1. Vercel Dashboard에서 프로젝트를 클릭합니다.
2. 왼쪽 또는 상단 메뉴에서 `Deployments`를 클릭합니다.
3. 최신 production deployment를 찾습니다.
4. deployment 오른쪽의 `...` 메뉴를 클릭합니다.
5. `Redeploy`를 클릭합니다.
6. 확인 창이 뜨면 build cache 사용 여부를 선택합니다.
7. 환경변수 변경을 확실히 반영하려면 문제가 있을 때 `Use existing Build Cache`를 끄고 재배포합니다.
8. `Redeploy` 버튼을 클릭합니다.
9. 배포 완료 후 `/admin/login`과 주요 문서 페이지를 다시 확인합니다.

## Production Branch 확인

Vercel은 production branch에 push 또는 merge가 발생하면 production deployment를 만듭니다. 기본값은 보통 `main`입니다.

확인 절차:

1. Vercel Dashboard에서 프로젝트를 클릭합니다.
2. `Settings`를 클릭합니다.
3. `Environments`를 클릭합니다.
4. `Production` environment를 클릭합니다.
5. `Branch Tracking`에서 production branch가 `main`인지 확인합니다.
6. 다른 branch를 운영 배포로 쓰려면 branch 이름을 수정하고 `Save`를 클릭합니다.

## Custom Domain 연결

기본 Vercel 도메인으로 먼저 검증한 뒤 custom domain을 연결합니다.

1. Vercel Dashboard에서 프로젝트를 클릭합니다.
2. `Settings`를 클릭합니다.
3. `Domains`를 클릭합니다.
4. `Add` 입력칸에 사용할 domain을 입력합니다.
5. `Add` 버튼을 클릭합니다.
6. Vercel이 안내하는 DNS record를 도메인 관리 업체에 등록합니다.
7. Vercel Domains 화면에서 `Valid Configuration` 또는 정상 상태가 표시될 때까지 기다립니다.
8. custom domain으로 `/`, `/docs/concepts/index`, `/admin/login`을 확인합니다.

## Supabase 설정 확인

Vercel 배포 자체가 성공해도 Supabase 설정이 빠지면 관리자 기능은 실패합니다.

### Migration 적용 확인

1. Supabase Dashboard에서 프로젝트를 클릭합니다.
2. 왼쪽 메뉴에서 `SQL Editor`를 클릭합니다.
3. `New query`를 클릭합니다.
4. 아래 SQL을 실행합니다.

```sql
select slug, title, status
from public.documents
order by slug
limit 20;
```

5. 결과가 비어 있으면 `supabase/migrations`의 SQL이 아직 적용되지 않은 상태입니다.

### 관리자 사용자 확인

1. Supabase Dashboard에서 프로젝트를 클릭합니다.
2. 왼쪽 메뉴에서 `Authentication`을 클릭합니다.
3. `Users`를 클릭합니다.
4. `ADMIN_EMAILS`에 넣은 이메일이 실제 user로 존재하는지 확인합니다.
5. 이메일 확인이 필요한 설정이면 해당 사용자가 confirmed 상태인지 확인합니다.

## 장애 대응

### 공개 문서는 보이는데 `/admin`이 실패합니다

- `SUPABASE_SERVICE_ROLE_KEY`가 Vercel에 등록되어 있는지 확인합니다.
- 변수 이름에 오타가 없는지 확인합니다.
- `SUPABASE_SERVICE_ROLE_KEY`에 `NEXT_PUBLIC_`을 붙이지 않았는지 확인합니다.
- 환경변수 수정 후 redeploy했는지 확인합니다.
- Supabase Auth user 이메일이 `ADMIN_EMAILS`에 포함되어 있는지 확인합니다.

### 배포 후 404가 발생합니다

- Vercel build log에서 build가 성공했는지 확인합니다.
- URL slug가 실제 문서 slug와 일치하는지 확인합니다.
- Supabase documents table에 해당 slug가 있는지 확인합니다.
- fallback seed로 보이는 로컬 문서와 Supabase DB 문서가 다른 상태인지 확인합니다.

### 환경변수를 바꿨는데 반영되지 않습니다

- Vercel 환경변수 변경은 이전 deployment에 자동 적용되지 않습니다.
- `Deployments`에서 최신 deployment를 `Redeploy`합니다.
- Preview deployment를 보고 있는지 Production deployment를 보고 있는지 확인합니다.
- 환경변수를 `Production`에만 넣고 Preview URL을 보고 있지 않은지 확인합니다.

## 운영 체크리스트

- GitHub repository에 `.env`가 올라가지 않았다.
- Vercel Project의 Framework Preset이 `Next.js`이다.
- `NEXT_PUBLIC_SUPABASE_URL`이 등록되어 있다.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 등록되어 있다.
- `SUPABASE_SERVICE_ROLE_KEY`가 server-only 이름으로 등록되어 있다.
- `ADMIN_EMAILS`에 관리자 이메일이 들어 있다.
- Supabase migration SQL이 적용되어 documents/tags 데이터가 있다.
- Supabase Auth에 관리자 user가 있다.
- 배포 후 `/`, `/docs/concepts/index`, `/tags/MySQL`, `/admin/login`을 확인했다.
- 환경변수 변경 후 redeploy했다.

## 공식문서 참고

- [Vercel Git Deployments](https://vercel.com/docs/git)
- [Vercel Next.js Framework Guide](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Managing Deployments](https://vercel.com/docs/deployments/managing-deployments)
