create extension if not exists "pgcrypto";

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  style_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.frame_data (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  move_name text not null,
  command text not null,
  startup integer not null,
  active integer not null,
  recovery integer not null,
  on_hit integer not null,
  on_block integer not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  combo_name text not null,
  difficulty text not null check (difficulty in ('Easy', 'Normal', 'Hard')),
  damage integer not null,
  drive_gauge_change integer not null,
  combo_route text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.characters enable row level security;
alter table public.frame_data enable row level security;
alter table public.combos enable row level security;

drop policy if exists "public read characters" on public.characters;
create policy "public read characters" on public.characters for select using (true);
drop policy if exists "public write characters" on public.characters;
create policy "public write characters" on public.characters for insert with check (true);

drop policy if exists "public read frame_data" on public.frame_data;
create policy "public read frame_data" on public.frame_data for select using (true);
drop policy if exists "public write frame_data" on public.frame_data;
create policy "public write frame_data" on public.frame_data for insert with check (true);

drop policy if exists "public read combos" on public.combos;
create policy "public read combos" on public.combos for select using (true);
drop policy if exists "public write combos" on public.combos;
create policy "public write combos" on public.combos for insert with check (true);
