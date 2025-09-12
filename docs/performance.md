BuddyBudget — 성능 최적화 가이드

개요

- 본 문서는 목록 조회(특히 거래 메모 검색)와 인덱싱 전략, 커서 페이지네이션에 대한 권장 사항을 정리합니다.

1. 메모 검색 최적화

- 현재 구현: `WHERE memo ILIKE '%q%'`는 선행 와일드카드로 인해 일반 B-Tree 인덱스를 사용할 수 없습니다.
- 권장 방안 (PostgreSQL):
  1. Trigram 확장 사용
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_memo_trgm
  ON transactions USING GIN (memo gin_trgm_ops);
  ```

  2. 접두 검색으로 UX 변경 (예: `q%`) + B-Tree 인덱스 고려
  3. 메모를 토큰화/태그화하여 별도 컬럼에 저장 후 인덱싱
  4. Full-text 검색(tsvector)로 전환

2. 커서 기반 페이지네이션

- 커서: `(occurred_at DESC, id DESC)` 조합으로 안정적 순서 보장
- 인덱스: `(space_id, occurred_at)` + 보조 조건에 맞는 인덱스(type/category/from/to)
- 장점: OFFSET 기반보다 대용량에서 성능 및 일관성 우수

3. 거래 필터 인덱스

- 주요 인덱스 권장:
  - `(space_id, occurred_at DESC)`
  - `(space_id, type)`
  - `(space_id, category_id)`
  - `(space_id, from_holding_id)`
  - `(space_id, to_holding_id)`

4. 날짜 필터 처리

- 클라이언트가 `YYYY-MM-DD`만 전달할 경우, 서버에서 inclusive 처리를 위해 해당 일자 23:59:59.999로 보정
- 타임존 주의: `datetime-local`은 로컬 시간 기반, 서버 변환 시 UTC 기준 처리 일관성 확보 필요

5. 수치 값 처리

- 통화/금액은 문자열(numeric)로 저장하고, 앱에서 `toFixed(2)` 일관 적용
- 입력값은 NaN 방지 및 범위 체크를 통해 방어 코드 추가
