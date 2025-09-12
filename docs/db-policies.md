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

---

BuddyBudget — DB RLS 정책(Categories/Holdings)

개요

- Space 멤버만 categories/holdings 접근이 가능하도록 RLS를 구성합니다.

SQL

```
-- Enable RLS
alter table categories enable row level security;
alter table holdings enable row level security;

-- Assuming members(space_id, user_id) exists and is maintained on join/leave

-- SELECT: member-only visibility
create policy "categories_select_members" on categories
  for select using (exists(
    select 1 from members m where m.space_id = categories.space_id and m.user_id = auth.uid()
  ));

create policy "holdings_select_members" on holdings
  for select using (exists(
    select 1 from members m where m.space_id = holdings.space_id and m.user_id = auth.uid()
  ));

-- INSERT: member-only creation
create policy "categories_insert_members" on categories
  for insert with check (exists(
    select 1 from members m where m.space_id = categories.space_id and m.user_id = auth.uid()
  ));

create policy "holdings_insert_members" on holdings
  for insert with check (exists(
    select 1 from members m where m.space_id = holdings.space_id and m.user_id = auth.uid()
  ));

-- UPDATE: member-only update
create policy "categories_update_members" on categories
  for update using (exists(
    select 1 from members m where m.space_id = categories.space_id and m.user_id = auth.uid()
  ));

create policy "holdings_update_members" on holdings
  for update using (exists(
    select 1 from members m where m.space_id = holdings.space_id and m.user_id = auth.uid()
  ));

-- DELETE: member-only delete (옵션)
create policy "categories_delete_members" on categories
  for delete using (exists(
    select 1 from members m where m.space_id = categories.space_id and m.user_id = auth.uid()
  ));

create policy "holdings_delete_members" on holdings
  for delete using (exists(
    select 1 from members m where m.space_id = holdings.space_id and m.user_id = auth.uid()
  ));
```

비고

- FK 제약과 UNIQUE(space_id, name)를 조합하여 데이터 무결성을 보장하세요.
- 거래 테이블이 도입되면 FK(on delete restrict)를 통해 참조 무결성을 강제할 것을 권장합니다.

---

BuddyBudget — DB RLS 정책(Transactions)

개요

- Space 멤버만 transactions 레코드에 접근 가능하도록 RLS를 구성합니다.
- 생성/수정/삭제 모두 멤버십이 있어야 하며, space_id 범위 내에서만 동작해야 합니다.

SQL

```
alter table transactions enable row level security;

-- SELECT: space 멤버만 조회
create policy "tx_select_members" on transactions
  for select using (exists(
    select 1 from members m where m.space_id = transactions.space_id and m.user_id = auth.uid()
  ));

-- INSERT: space 멤버만 생성, 입력되는 space_id가 본인이 속한 space여야 함
create policy "tx_insert_members" on transactions
  for insert with check (exists(
    select 1 from members m where m.space_id = transactions.space_id and m.user_id = auth.uid()
  ));

-- UPDATE: space 멤버만 수정
create policy "tx_update_members" on transactions
  for update using (exists(
    select 1 from members m where m.space_id = transactions.space_id and m.user_id = auth.uid()
  ));

-- DELETE: space 멤버만 삭제
create policy "tx_delete_members" on transactions
  for delete using (exists(
    select 1 from members m where m.space_id = transactions.space_id and m.user_id = auth.uid()
  ));
```

비고

- 금액, 타입별 정합성(이체 from≠to 등)은 애플리케이션 레벨 검증으로 처리합니다.
- 집계 시 이체는 수입/지출 집계에서 제외되는 점을 고려해 쿼리를 작성하세요.

---

BuddyBudget — DB RLS 정책(Budgets)

개요

- Space 멤버만 budgets/budgets_history 접근이 가능하도록 RLS를 구성합니다.
- budgets_history는 서버 액션을 통해서만 INSERT 되며, 클라이언트에서 직접 쓰지 않습니다.

SQL

```
alter table budgets enable row level security;
alter table budgets_history enable row level security;

-- SELECT: space 멤버만 조회
create policy "budgets_select_members" on budgets
  for select using (exists(
    select 1 from members m where m.space_id = budgets.space_id and m.user_id = auth.uid()
  ));

create policy "budgets_history_select_members" on budgets_history
  for select using (exists(
    select 1 from budgets b
    where b.id = budgets_history.budget_id
      and exists(
        select 1 from members m where m.space_id = b.space_id and m.user_id = auth.uid()
      )
  ));

-- INSERT/UPDATE/DELETE: space 멤버만 가능 (서버 액션이 교차 인가 검증 수행)
create policy "budgets_cud_members" on budgets
  for all using (exists(
    select 1 from members m where m.space_id = budgets.space_id and m.user_id = auth.uid()
  )) with check (exists(
    select 1 from members m where m.space_id = budgets.space_id and m.user_id = auth.uid()
  ));

-- budgets_history는 서버 액션 트랜잭션으로만 기록 (옵션: INSERT 허용)
create policy "budgets_history_insert_members" on budgets_history
  for insert with check (exists(
    select 1 from budgets b
    where b.id = budgets_history.budget_id
      and exists(
        select 1 from members m where m.space_id = b.space_id and m.user_id = auth.uid()
      )
  ));
```

비고

- 애플리케이션 검증으로 `categories.kind = 'expense'`만 예산 허용.
- 모든 CUD 쿼리는 `space_id` 범위를 WHERE에 포함.
- 업서트/수정 시 `budgets_history`에 prev/new 금액을 기록하며 트랜잭션으로 원자성 보장.
