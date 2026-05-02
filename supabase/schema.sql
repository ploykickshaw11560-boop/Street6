create extension if not exists "pgcrypto";

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  style_notes text,
  created_at timestamptz not null default now()
);

-- Master stat columns (idempotent additions for existing deployments).
alter table public.characters add column if not exists health integer;
alter table public.characters add column if not exists walk_fwd numeric;
alter table public.characters add column if not exists walk_bwd numeric;
alter table public.characters add column if not exists dash_fwd_frames integer;
alter table public.characters add column if not exists dash_bwd_frames integer;
alter table public.characters add column if not exists dash_fwd_distance numeric;
alter table public.characters add column if not exists dash_bwd_distance numeric;
alter table public.characters add column if not exists pre_jump integer;
alter table public.characters add column if not exists archetype text;

create table if not exists public.master_moves (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  move_name text not null,
  command text not null,
  category text not null check (category in (
    '通常技','特殊技','必殺技','OD必殺技','SA1','SA2','SA3','投げ','その他'
  )),
  display_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (character_id, move_name, command)
);

create index if not exists master_moves_character_id_idx
  on public.master_moves(character_id);

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
alter table public.master_moves enable row level security;
alter table public.frame_data enable row level security;
alter table public.combos enable row level security;

drop policy if exists "public read characters" on public.characters;
create policy "public read characters" on public.characters for select using (true);
drop policy if exists "public write characters" on public.characters;
create policy "public write characters" on public.characters for insert with check (true);
drop policy if exists "public update characters" on public.characters;
create policy "public update characters" on public.characters for update using (true) with check (true);
drop policy if exists "public delete characters" on public.characters;
create policy "public delete characters" on public.characters for delete using (true);

drop policy if exists "public read master_moves" on public.master_moves;
create policy "public read master_moves" on public.master_moves for select using (true);
drop policy if exists "public write master_moves" on public.master_moves;
create policy "public write master_moves" on public.master_moves for insert with check (true);
drop policy if exists "public update master_moves" on public.master_moves;
create policy "public update master_moves" on public.master_moves for update using (true) with check (true);
drop policy if exists "public delete master_moves" on public.master_moves;
create policy "public delete master_moves" on public.master_moves for delete using (true);

drop policy if exists "public read frame_data" on public.frame_data;
create policy "public read frame_data" on public.frame_data for select using (true);
drop policy if exists "public write frame_data" on public.frame_data;
create policy "public write frame_data" on public.frame_data for insert with check (true);
drop policy if exists "public update frame_data" on public.frame_data;
create policy "public update frame_data" on public.frame_data for update using (true) with check (true);
drop policy if exists "public delete frame_data" on public.frame_data;
create policy "public delete frame_data" on public.frame_data for delete using (true);

drop policy if exists "public read combos" on public.combos;
create policy "public read combos" on public.combos for select using (true);
drop policy if exists "public write combos" on public.combos;
create policy "public write combos" on public.combos for insert with check (true);
drop policy if exists "public update combos" on public.combos;
create policy "public update combos" on public.combos for update using (true) with check (true);
drop policy if exists "public delete combos" on public.combos;
create policy "public delete combos" on public.combos for delete using (true);

-- Seed master character stats from ultimateframedata.com (SF6 stats).
insert into public.characters (
  name, health, walk_fwd, walk_bwd,
  dash_fwd_frames, dash_bwd_frames,
  dash_fwd_distance, dash_bwd_distance,
  pre_jump
) values
  ('A.K.I.',   10000, 4.52, 3.2,  19, 23, 130.000, 108.000, 4),
  ('Akuma',     9000, 5.2,  3.5,  19, 23, 135.000,  92.000, 4),
  ('Blanka',   10000, 4.7,  3.2,  19, 23, 157.780, 116.896, 4),
  ('Cammy',    10000, 5.05, 3.3,  18, 23, 132.000, 100.207, 4),
  ('Chun Li',  10000, 5.0,  3.7,  19, 25, 150.777, 121.107, 4),
  ('Dee Jay',  10000, 4.3,  3.2,  19, 23, 150.000,  90.000, 4),
  ('Dhalsim',  10000, 2.8,  2.5,  25, 23, 146.745, 100.000, 4),
  ('Ed',       10000, 4.75, 3.2,  18, 23, 134.800,  80.300, 4),
  ('E. Honda', 10500, 4.5,  2.5,  19, 23, 105.797,  60.076, 4),
  ('Elena',    10000, 4.8,  3.3,  20, 23, 143.000, 139.100, 4),
  ('Guile',    10000, 4.3,  3.2,  21, 23, 156.700,  74.013, 4),
  ('Jamie',    10000, 4.8,  3.5,  19, 25, 150.000,  85.000, 4),
  ('JP',       10000, 3.7,  2.5,  22, 23, 145.391, 100.250, 4),
  ('Juri',     10000, 4.7,  3.2,  22, 23, 190.298, 111.418, 4),
  ('Ken',      10000, 4.7,  3.2,  19, 23, 132.321,  92.300, 4),
  ('Kimberly', 10000, 5.61, 3.66, 18, 23, 140.882,  89.286, 4),
  ('Lily',     10000, 4.2,  2.7,  21, 24, 126.100,  93.852, 5),
  ('Luke',     10000, 4.7,  3.2,  19, 23, 146.747,  75.051, 4),
  ('M. Bison', 10000, 4.8,  3.12, 19, 23, 154.000,  75.400, 4),
  ('Mai',      10000, 5.0,  3.5,  18, 23, 145.000,  90.000, 4),
  ('Manon',    10000, 4.52, 3.1,  21, 25, 149.904, 125.434, 4),
  ('Marisa',   10500, 3.9,  2.7,  22, 25, 140.000,  90.000, 4),
  ('Rashid',   10000, 4.5,  3.2,  18, 25, 120.000, 110.000, 4),
  ('Ryu',      10000, 4.7,  3.2,  19, 23, 125.208,  92.300, 4),
  ('Sagat',    10000, 3.9,  2.7,  23, 23, 140.000,  90.000, 4),
  ('Terry',    10000, 4.8,  3.2,  19, 23, 150.000,  98.500, 4),
  ('Zangief',  11000, 3.64, 2.5,  22, 25, 100.656,  71.220, 5)
on conflict (name) do update set
  health            = excluded.health,
  walk_fwd          = excluded.walk_fwd,
  walk_bwd          = excluded.walk_bwd,
  dash_fwd_frames   = excluded.dash_fwd_frames,
  dash_bwd_frames   = excluded.dash_bwd_frames,
  dash_fwd_distance = excluded.dash_fwd_distance,
  dash_bwd_distance = excluded.dash_bwd_distance,
  pre_jump          = excluded.pre_jump;
