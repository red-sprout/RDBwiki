# Environment Variables

RDB Wiki는 Supabase Auth, Supabase Postgres, 관리자 권한 검증을 위해 환경변수를 사용합니다.

## Quick Start

로컬에서는 먼저 `.env.example`을 기준으로 `.env`를 만듭니다.

```bash
cp .env.example .env
```

그다음 아래 순서대로 Supabase dashboard에서 값을 복사해 `.env`에 붙여 넣습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=admin@example.com
```

`.env`는 `.gitignore`에 포함되어 있으므로 커밋하지 않습니다. 공유 가능한 예시는 `.env.example`에만 남깁니다.

## Supabase에서 값 찾기

Supabase 공식 문서는 API key를 프로젝트의 `Connect` dialog 또는 Dashboard의 `Settings > API Keys`에서 확인할 수 있다고 안내합니다. Secret key와 legacy `service_role` key는 높은 권한을 가지며, 브라우저나 공개 저장소에 노출하면 안 됩니다.

### 1. 프로젝트 열기

1. 브라우저에서 [Supabase Dashboard](https://supabase.com/dashboard)에 접속합니다.
2. 로그인합니다.
3. 왼쪽 또는 메인 화면의 프로젝트 목록에서 이 앱에 사용할 Supabase 프로젝트를 클릭합니다.
4. 아직 프로젝트가 없다면 `New project`를 클릭해서 프로젝트를 먼저 생성합니다.

### 2. `NEXT_PUBLIC_SUPABASE_URL` 복사

1. 프로젝트 화면 왼쪽 사이드바 하단의 `Project Settings`를 클릭합니다.
2. 설정 메뉴에서 `API Keys` 또는 `API`를 클릭합니다.
3. `Project URL` 값을 찾습니다.
4. 오른쪽의 copy 아이콘을 클릭합니다.
5. 로컬 `.env`의 `NEXT_PUBLIC_SUPABASE_URL=` 뒤에 붙여 넣습니다.

예시 형식:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

### 3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 복사

Supabase dashboard가 새 API key 화면이면 `Publishable key`를 사용합니다. Legacy key 화면이면 `anon` key를 사용합니다.

1. 같은 화면에서 `API Keys` 섹션을 봅니다.
2. 새 key 방식이면 `Publishable key` 영역의 값을 복사합니다.
3. legacy 방식이면 `Legacy API Keys` 탭 또는 섹션을 열고 `anon public` 값을 복사합니다.
4. 로컬 `.env`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY=` 뒤에 붙여 넣습니다.

예시 형식:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. `SUPABASE_SERVICE_ROLE_KEY` 복사

이 값은 관리자 CRUD에서만 서버가 사용합니다. 이름에 `NEXT_PUBLIC_`을 붙이면 안 됩니다.

1. 같은 `API Keys` 화면에 머무릅니다.
2. 새 key 방식이면 `Secret keys` 섹션에서 서버용 secret key를 복사합니다.
3. legacy 방식이면 `Legacy API Keys` 탭 또는 섹션에서 `service_role` 값을 복사합니다.
4. 경고가 나오면 내용을 확인하고 reveal/copy 버튼을 누릅니다.
5. 로컬 `.env`의 `SUPABASE_SERVICE_ROLE_KEY=` 뒤에 붙여 넣습니다.

예시 형식:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. 관리자 계정 만들기

현재 앱은 Supabase Auth의 email/password 로그인을 사용합니다.

1. Supabase 프로젝트 왼쪽 사이드바에서 `Authentication`을 클릭합니다.
2. `Users` 메뉴를 클릭합니다.
3. `Add user` 또는 `Create user` 버튼을 클릭합니다.
4. 관리자 이메일을 입력합니다.
5. 비밀번호를 입력합니다.
6. 이메일 확인 옵션이 보이면, 테스트용으로는 `Auto Confirm User` 또는 이메일 확인 완료 옵션을 켭니다.
7. `Create user`를 클릭합니다.

### 6. `ADMIN_EMAILS` 설정

1. 위에서 만든 관리자 이메일을 확인합니다.
2. 로컬 `.env`에서 `ADMIN_EMAILS=` 뒤에 이메일을 넣습니다.
3. 관리자가 여러 명이면 쉼표로 구분합니다. 공백은 넣지 않는 편이 안전합니다.

```bash
ADMIN_EMAILS=admin@example.com,dba@example.com
```

로그인한 사용자의 이메일이 `ADMIN_EMAILS`에 들어 있어야 `/admin` 접근이 허용됩니다.

## 로컬에서 확인하기

1. `.env` 저장 후 실행 중인 개발 서버가 있으면 중지합니다.
2. 개발 서버를 다시 시작합니다.

```bash
npm run dev
```

3. 브라우저에서 `http://localhost:3000/admin/login`으로 이동합니다.
4. Supabase Auth에 만든 관리자 이메일과 비밀번호로 로그인합니다.
5. 로그인 후 `/admin`으로 이동하면 설정이 완료된 것입니다.

## Variables

| Name | Required | Exposure | Description |
|---|---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server | Supabase 프로젝트 URL입니다. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server | Supabase publishable key 또는 legacy anon public key입니다. RLS 정책을 전제로 공개 클라이언트에서 사용합니다. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin CRUD only | Server only | 관리자 CRUD와 서버 전용 작업에 사용하는 service role key입니다. 절대 클라이언트에 노출하면 안 됩니다. |
| `ADMIN_EMAILS` | Admin only | Server only | 관리자 접근을 허용할 이메일 목록입니다. 여러 명이면 comma로 구분합니다. |

## Supabase 값 매핑

| Supabase Dashboard | Environment Variable |
|---|---|
| Project Settings > API Keys/API > Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project Settings > API Keys/API > Publishable key 또는 Legacy API Keys > anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project Settings > API Keys/API > Secret keys 또는 Legacy API Keys > service_role | `SUPABASE_SERVICE_ROLE_KEY` |

`service_role` key는 RLS를 우회할 수 있으므로 로컬 `.env`, Vercel server environment variable에만 저장합니다.

## Vercel에 환경변수 등록하기

Vercel 공식 문서는 프로젝트 선택 후 `Environment Variables` 화면에서 Name, Value, 적용할 Environment를 입력하고 `Save`를 누르도록 안내합니다. 변경한 환경변수는 기존 배포에는 적용되지 않으므로 새 배포가 필요합니다.

### 1. 프로젝트 설정 열기

1. 브라우저에서 [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. 로그인합니다.
3. 배포할 프로젝트를 클릭합니다.
4. 상단 탭 또는 왼쪽 메뉴에서 `Settings`를 클릭합니다.
5. 왼쪽 설정 메뉴에서 `Environment Variables`를 클릭합니다.

### 2. 변수 하나씩 추가

아래 과정을 변수 4개에 대해 반복합니다.

1. `Add New` 영역에서 `Name` 입력칸을 클릭합니다.
2. 변수 이름을 입력합니다. 예: `NEXT_PUBLIC_SUPABASE_URL`
3. `Value` 입력칸을 클릭합니다.
4. 로컬 `.env`에 넣은 값과 같은 값을 붙여 넣습니다.
5. `Environment`에서 적용할 환경을 선택합니다.
6. 처음에는 보통 `Production`, `Preview`, `Development`를 모두 선택합니다.
7. `Save`를 클릭합니다.

등록할 변수:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
```

### 3. 재배포

1. Vercel 프로젝트에서 `Deployments` 탭을 클릭합니다.
2. 최신 deployment 오른쪽의 메뉴 버튼을 클릭합니다.
3. `Redeploy`를 클릭합니다.
4. 재배포가 끝난 뒤 배포 URL에서 `/admin/login` 접속을 확인합니다.

주의할 점:

- `NEXT_PUBLIC_*` 변수는 브라우저 번들에 포함될 수 있습니다.
- `SUPABASE_SERVICE_ROLE_KEY`에는 절대 `NEXT_PUBLIC_`을 붙이지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 GitHub, README, issue, chat에 붙여 넣지 않습니다.
- Vercel에서 값을 바꾼 뒤에는 반드시 새 배포를 해야 반영됩니다.

## Fallback Behavior

Supabase 환경변수가 비어 있으면 공개 문서 페이지는 로컬 seed 데이터를 사용해 렌더링됩니다. 이 모드는 UI 확인용입니다.

관리자 CRUD는 실제 Supabase 연결과 `SUPABASE_SERVICE_ROLE_KEY`가 있어야 정상 동작합니다.

## Checklist

- `.env`가 `.env.example`을 기준으로 생성되어 있다.
- Supabase migration SQL이 적용되어 있다.
- Supabase Auth에 관리자 이메일 계정이 생성되어 있다.
- `ADMIN_EMAILS`에 관리자 이메일이 포함되어 있다.
- Vercel에는 실제 키를 등록하고 `.env` 파일은 커밋하지 않는다.

## References

- [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Auth Users](https://supabase.com/docs/guides/auth/users)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Managing Environment Variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
