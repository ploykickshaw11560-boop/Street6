-- Adds non-SF6 base roster characters that appear in the Notion frame data
-- source. Stats are left NULL because ultimateframedata.com's SF6 page does
-- not list them.
--
-- Run before the per-character seed files (seed_alex.sql, seed_cviper.sql).

insert into public.characters (name, archetype) values
  ('Alex',     'グラップラー (Notion 取り込み, SF6 非公式)'),
  ('C.Viper', 'ラッシュダウン (Notion 取り込み, SF6 非公式)')
on conflict (name) do nothing;
