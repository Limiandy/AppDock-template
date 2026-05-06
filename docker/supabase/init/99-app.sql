create extension if not exists pgcrypto;

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  shelter_name text not null,
  shelter_code text not null unique,
  type text,
  total_area numeric,
  contact text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.shelters enable row level security;

drop policy if exists "shelters anon read" on public.shelters;
create policy "shelters anon read"
  on public.shelters
  for select
  to anon, authenticated
  using (true);

drop policy if exists "shelters anon write" on public.shelters;
create policy "shelters anon write"
  on public.shelters
  for all
  to anon, authenticated
  using (true)
  with check (true);

insert into public.shelters (shelter_name, shelter_code, type, total_area, contact, phone)
values
  ('中心城区应急避难所', 'YJBN-001', '室外', 12000, '李四', '13800000001'),
  ('地下空间临时安置点', 'YJBN-002', '室内', 6800, '王五', '13800000002')
on conflict (shelter_code) do nothing;
