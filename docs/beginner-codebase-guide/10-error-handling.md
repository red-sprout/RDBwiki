# 에러 처리 흐름

## 에러 처리 큰 그림

이 프로젝트에는 커스텀 전역 에러 핸들러가 없습니다. 대신 Next.js의 `notFound`, `redirect`, JavaScript `Error`, seed fallback을 사용합니다.

## 예외 클래스 목록

직접 정의한 커스텀 예외 클래스는 코드에서 확인되지 않습니다. 쓰기 실패 시 일반 `Error`를 던집니다.

```ts
if (error) throw new Error(error.message);
```

## 예외가 발생하는 위치

- `lib/documents.ts`: 문서 생성, 수정, 보관, 삭제, join 저장 실패
- `lib/tags.ts`: 태그 생성/삭제 실패
- `app/docs/[[...slug]]/page.tsx`: 문서 없음
- `app/dbms/[dbms]/page.tsx`: 허용되지 않은 DBMS
- `lib/auth.ts`: 관리자가 아님
- `LoginForm`: 로그인 실패를 state로 표시

## 예외를 던지는 코드

```ts
const { error } = await supabase
  .from("documents")
  .update({ status: "archived", updated_at: new Date().toISOString() })
  .eq("id", id);
if (error) throw new Error(error.message);
```

## 예외를 잡는 코드

Supabase 쓰기 에러를 직접 잡는 `try/catch`는 확인되지 않습니다. 쿠키 쓰기 실패만 제한적으로 catch합니다.

```ts
try {
  cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
} catch {
  // Server Components cannot set cookies; Server Actions and Route Handlers can.
}
```

## 최종 응답 형태

- 없는 문서: `notFound()`로 404
- 잘못된 DBMS path: `notFound()`로 404
- 관리자 아님: `/admin/login` redirect
- 저장 성공: `/admin/documents` redirect
- Supabase 쓰기 실패: `Error` 발생
- 공개 조회 실패: seed fallback 또는 `null`

## HTTP 상태 코드 또는 에러 코드

- 문서 없음: 404
- 허용되지 않은 DBMS: 404
- 관리자 미인증: redirect
- 쓰기 실패: 명시적 HTTP 상태 코드 매핑은 코드에서 확인되지 않습니다.

## 새 에러를 추가하는 방법

예: slug가 비어 있으면 저장을 막습니다.

수정 전 코드:

```ts
slug: String(formData.get("slug") ?? ""),
```

수정 후 코드:

```ts
const slug = String(formData.get("slug") ?? "").trim();
if (!slug) throw new Error("Slug is required.");
```

반환 객체에서는 `slug,`를 사용합니다.

## 에러 처리 수정 실습

태그 이름 검증을 추가합니다.

수정 전 코드:

```ts
name: String(formData.get("name") ?? ""),
```

수정 후 코드:

```ts
const name = String(formData.get("name") ?? "").trim();
if (!name) throw new Error("Tag name is required.");
```

## 초심자가 자주 하는 실수

- `as TagType`을 런타임 검증이라고 생각합니다.
- 공개 페이지가 seed로 보인다고 관리자 CRUD도 seed에 저장된다고 생각합니다.
- `redirect()` 뒤에 코드가 계속 실행된다고 생각합니다.
- DBMS query가 잘못되면 에러가 아니라 전체 문서가 표시된다는 점을 놓칩니다.
