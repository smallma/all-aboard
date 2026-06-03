-- Wander-Fleet Supabase schema
-- 在 Supabase Dashboard → SQL Editor → New query 貼整段執行

-- 1. plans 表
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  passengers  jsonb not null default '[]'::jsonb,
  items       jsonb not null default '[]'::jsonb,
  cars        jsonb not null default '[]'::jsonb
);

-- 2. 索引
create index if not exists plans_updated_at_idx on public.plans(updated_at desc);

-- 3. 觸發 updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_plans_touch on public.plans;
create trigger trg_plans_touch
  before update on public.plans
  for each row execute function public.touch_updated_at();

-- 4. RLS — 所有人共享（沒登入也能讀寫）
-- 之後若要做帳號權限，移除這些 policy 再重新設計
alter table public.plans enable row level security;

drop policy if exists "anyone can read plans" on public.plans;
create policy "anyone can read plans"
  on public.plans for select
  using (true);

drop policy if exists "anyone can insert plans" on public.plans;
create policy "anyone can insert plans"
  on public.plans for insert
  with check (true);

drop policy if exists "anyone can update plans" on public.plans;
create policy "anyone can update plans"
  on public.plans for update
  using (true) with check (true);

drop policy if exists "anyone can delete plans" on public.plans;
create policy "anyone can delete plans"
  on public.plans for delete
  using (true);

-- 5. 啟用 Realtime
-- Supabase Dashboard → Database → Replication → 找到 plans → 開啟 realtime
-- 或執行以下 SQL：
alter publication supabase_realtime add table public.plans;
