# 테스트 코드 해설

## 테스트 구조

현재 저장소에는 테스트 파일이 확인되지 않습니다. `package.json`에도 `test` 스크립트가 없습니다. 현재 실행 가능한 검증은 `npm run lint`입니다.

## 테스트 실행 명령어

```bash
npm run lint
```

테스트 실행 명령어는 현재 코드에서 확인되지 않습니다.

## 테스트 파일 목록

- `*.test.ts`: 코드에서 확인되지 않습니다.
- `*.test.tsx`: 코드에서 확인되지 않습니다.
- `*.spec.ts`: 코드에서 확인되지 않습니다.
- `__tests__/`: 코드에서 확인되지 않습니다.

## 테스트 종류

추가한다면 다음 순서가 좋습니다.

- 순수 함수 단위 테스트: `lib/dbms-filter.ts`, `lib/toc.ts`
- tokenizer 테스트: `SqlCodeBlock`의 tokenizer는 현재 export되지 않아 구조 변경이 필요합니다.
- 검색 테스트: `lib/search.ts`는 `listPublishedDocuments` mock이 필요합니다.
- 컴포넌트 테스트: `DocCard`, `DbmsSectionFilter`

## 대표 테스트 해설

테스트 파일: 코드에서 확인되지 않습니다.  
테스트 대상: 현재 없음  
테스트가 검증하는 것: 현재 없음  
given/when/then 구조: 현재 없음  
실행 방법: 현재 없음  
실패하면 의심해야 할 코드: 현재 없음  
초심자가 추가할 수 있는 테스트: `getDbmsSections`, `filterMarkdownByDbms`

## 테스트 코드 읽는 법

예시 테스트입니다. 현재 Vitest는 설치되어 있지 않습니다.

```ts
import { expect, test } from "vitest";
import { filterMarkdownByDbms } from "@/lib/dbms-filter";

test("keeps only selected DBMS section", () => {
  const markdown = "# Title\n\n## MySQL\nA\n\n## PostgreSQL\nB";
  expect(filterMarkdownByDbms(markdown, "mysql")).toContain("A");
  expect(filterMarkdownByDbms(markdown, "mysql")).not.toContain("B");
});
```

## 테스트 실패 시 확인할 것

- `package.json`에 `test` script가 있는지 확인합니다.
- 테스트 도구가 설치되어 있는지 확인합니다.
- `@/` alias를 테스트 도구가 이해하는지 확인합니다.
- Supabase 호출을 mock했는지 확인합니다.

## 초심자가 추가할 수 있는 테스트

1. `normalizeDbmsFilter("MYSQL")`이 `"mysql"`을 반환합니다.
2. `getDbmsSections()`가 Markdown heading을 찾습니다.
3. `slugifyHeading("Transaction Isolation")`이 `"transaction-isolation"`을 반환합니다.

## 테스트 추가 실습

수정 전 코드:

```json
"lint": "eslint ."
```

수정 후 코드:

```json
"lint": "eslint .",
"test": "vitest"
```

주의: 현재 Vitest는 설치되어 있지 않으므로 패키지 설치가 필요합니다.
