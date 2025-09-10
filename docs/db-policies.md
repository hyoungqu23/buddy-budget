BuddyBudget — DB RLS 정책(Profiles)

개요

- `profiles` 테이블에 대해 사용자 본인만 읽기/쓰기 가능하도록 RLS를 구성합니다.
- Supabase(PostgreSQL) 기준 SQL 예시를 제공합니다.

SQL

```
-- RLS 활성화
alter table profiles enable row level security;

-- SELECT: 본인만 조회 가능
create policy "profiles_select_self" on profiles
  for select using (auth.uid() = user_id);

-- INSERT: 본인 레코드만 생성 가능
create policy "profiles_insert_self" on profiles
  for insert with check (auth.uid() = user_id);

-- UPDATE: 본인 레코드만 수정 가능
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = user_id);

-- (옵션) DELETE: 필요 시 본인 레코드만 삭제 가능
create policy "profiles_delete_self" on profiles
  for delete using (auth.uid() = user_id);
```

비고

- Supabase SQL Editor에서 위 스크립트를 실행하세요.
- `auth.uid()`는 현재 세션 사용자 ID를 반환합니다.
- 앱 코드에서는 세션 유지가 올바르게 동작해야 정책이 기대대로 적용됩니다.
