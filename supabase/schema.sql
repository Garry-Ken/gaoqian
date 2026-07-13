-- ============================================================
-- 搞钱局 · Supabase schema  (idempotent — safe to re-run)
-- Run this in your project's SQL Editor.
--
-- Model: a jsonb "mirror" (same shape the app uses in localStorage),
-- so the TypeScript types are the single source of truth and rows are
-- just { id, owner_id, data, updated_at }.
--
-- Security:
--   • private data (entries / metrics / metric_points) → owner-only.
--   • profiles → world-readable, self-writable (your rank card).
--   • social objects (teams / events / feed / endorsements) →
--     world-readable, any authenticated user may write (the client
--     upserts the whole merged object after join/RSVP/cheer).
--     Harden with the join_team / rsvp_event / cheer_feed RPCs at the
--     bottom before you scale.
-- ============================================================

-- ---------- private, owner-scoped ----------
create table if not exists public.entries (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.metrics (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.metric_points (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- public rank card ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  owner_id uuid,                    -- mirrors id; kept for a uniform cloud.ts write path
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- shared social objects ----------
create table if not exists public.teams (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.events (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.feed (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.comments (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.endorsements (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists entries_owner_idx on public.entries (owner_id);
create index if not exists metrics_owner_idx on public.metrics (owner_id);
create index if not exists metric_points_owner_idx on public.metric_points (owner_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.entries enable row level security;
alter table public.metrics enable row level security;
alter table public.metric_points enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.events enable row level security;
alter table public.feed enable row level security;
alter table public.comments enable row level security;
alter table public.endorsements enable row level security;

-- owner-only, private
do $$
declare t text;
begin
  foreach t in array array['entries','metrics','metric_points']
  loop
    execute format('drop policy if exists own_all on public.%I', t);
    execute format($p$create policy own_all on public.%I
      for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())$p$, t);
  end loop;
end $$;

-- profiles: world-readable, self-writable
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- shared social: world-readable, authenticated-writable
do $$
declare t text;
begin
  foreach t in array array['teams','events','feed','comments','endorsements']
  loop
    execute format('drop policy if exists social_read on public.%I', t);
    execute format('create policy social_read on public.%I for select using (true)', t);
    execute format('drop policy if exists social_write on public.%I', t);
    execute format($p$create policy social_write on public.%I
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated')$p$, t);
  end loop;
end $$;

-- ============================================================
-- Optional hardening RPCs (SECURITY DEFINER). Once you switch the
-- client to call these for cross-user mutations, you can tighten the
-- social_write policies to owner-only.
-- ============================================================
create or replace function public.join_team(p_team_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.teams
     set data = jsonb_set(data, '{memberIds}',
         (select to_jsonb(array(select distinct e from jsonb_array_elements_text(coalesce(data->'memberIds','[]'::jsonb)) e
                                 union select auth.uid()::text))))
   where id = p_team_id;
end $$;

create or replace function public.rsvp_event(p_event_id text, p_going boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_going then
    update public.events set data = jsonb_set(data, '{attendeeIds}',
        (select to_jsonb(array(select distinct e from jsonb_array_elements_text(coalesce(data->'attendeeIds','[]'::jsonb)) e
                                union select auth.uid()::text))))
     where id = p_event_id;
  else
    update public.events set data = jsonb_set(data, '{attendeeIds}',
        (select to_jsonb(array(select e from jsonb_array_elements_text(coalesce(data->'attendeeIds','[]'::jsonb)) e
                                where e <> auth.uid()::text))))
     where id = p_event_id;
  end if;
end $$;

create or replace function public.cheer_feed(p_feed_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.feed set data = jsonb_set(data, '{cheers}',
      (select to_jsonb(array(select distinct e from jsonb_array_elements_text(coalesce(data->'cheers','[]'::jsonb)) e
                              union select auth.uid()::text))))
   where id = p_feed_id;
end $$;

-- Done. Email OTP auth works immediately (Auth is on by default).
-- Phone: enable an SMS provider in Auth settings.
-- WeChat: deploy supabase/functions/wechat-auth (see SETUP.md).
