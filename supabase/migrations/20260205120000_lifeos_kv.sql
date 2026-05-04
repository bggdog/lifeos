-- Key-value mirror of former localStorage layout:
--   Branson.<key> | Kelsee.<key> | shared.<key>
-- Open access for anon (no auth) — acceptable only for private/low-risk deployments.

create table if not exists public.lifeos_kv (
  bucket text not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (bucket, key)
);

create index if not exists lifeos_kv_updated_at_idx on public.lifeos_kv (updated_at desc);

alter table public.lifeos_kv enable row level security;

drop policy if exists "lifeos_kv_anon_full_access" on public.lifeos_kv;
create policy "lifeos_kv_anon_full_access"
  on public.lifeos_kv
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.lifeos_kv to anon;
grant select, insert, update, delete on table public.lifeos_kv to authenticated;

-- Turn on Realtime for `lifeos_kv` in Supabase Dashboard → Database → Replication,
-- or run: alter publication supabase_realtime add table public.lifeos_kv;
