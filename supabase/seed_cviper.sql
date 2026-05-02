-- C.VIPER master moves and frame data
-- Source: Notion page "C.VIPER フレームデータ（2026-04-21取得）"
-- Note: C.Viper is not in the SF6 base roster — commands are approximations
-- using Numpad notation based on her classic SF4 inputs.

DO $$
DECLARE
  cv_id uuid;
BEGIN
  SELECT id INTO cv_id FROM public.characters WHERE name = 'C.Viper';
  IF cv_id IS NULL THEN
    RAISE EXCEPTION 'Character "C.Viper" not found. Run add_extra_characters.sql first.';
  END IF;

  DELETE FROM public.frame_data WHERE character_id = cv_id;
  DELETE FROM public.master_moves WHERE character_id = cv_id;

  INSERT INTO public.master_moves
    (character_id, move_name, command, category, display_order, notes) VALUES
    -- 通常技
    (cv_id, '立弱P',                              '5LP',  '通常技', 10, '上段 / Cキャンセル / 連打キャンセル / ハイジャンプC可'),
    (cv_id, '立弱K',                              '5LK',  '通常技', 11, '上段 / Cキャンセル / ハイジャンプC可'),
    (cv_id, '立中P',                              '5MP',  '通常技', 12, '上段 / Cキャンセル / ハイジャンプC可'),
    (cv_id, '立中K',                              '5MK',  '通常技', 13, '上段 / 空振り時硬直+2F / ハイジャンプC可'),
    (cv_id, '立強P',                              '5HP',  '通常技', 14, '上段 / ハイジャンプC可'),
    (cv_id, '立強K',                              '5HK',  '通常技', 15, '上段 / 空中ヒットグラウンドバウンド / PC時+19F / ハイジャンプC可'),
    (cv_id, 'しゃがみ弱P',                        '2LP',  '通常技', 16, '上段 / Cキャンセル / 連打キャンセル / ハイジャンプC可'),
    (cv_id, 'しゃがみ弱K',                        '2LK',  '通常技', 17, '下段 / 連打キャンセル / ハイジャンプC可'),
    (cv_id, 'しゃがみ中P',                        '2MP',  '通常技', 18, '上段 / Cキャンセル / ハイジャンプC可'),
    (cv_id, 'しゃがみ中K',                        '2MK',  '通常技', 19, '下段 / ハイジャンプC可'),
    (cv_id, 'しゃがみ強P',                        '2HP',  '通常技', 20, '上段 / Cキャンセル / 強制立ち / ハイジャンプC可'),
    (cv_id, 'しゃがみ強K',                        '2HK',  '通常技', 21, '下段 / PC時HKD'),
    (cv_id, 'ジャンプ弱P',                        'j.LP', '通常技', 22, '中段 / 着地後3F'),
    (cv_id, 'ジャンプ弱K',                        'j.LK', '通常技', 23, '中段 / 着地後3F'),
    (cv_id, 'ジャンプ中P',                        'j.MP', '通常技', 24, '中段 / Cキャンセル / 着地後3F'),
    (cv_id, 'ジャンプ中K',                        'j.MK', '通常技', 25, '中段 / そり抜け性能 / 着地後3F'),
    (cv_id, 'ジャンプ強P',                        'j.HP', '通常技', 26, '中段 / 着地後3F / 空中ヒットダウン'),
    (cv_id, 'ジャンプ強K',                        'j.HK', '通常技', 27, '中段 / Cキャンセル / そり抜け性能 / 着地後3F'),
    (cv_id, '垂直ジャンプ強K',                    'nj.HK','通常技', 28, '中段 / 垂直ジャンプ専用 / 着地後3F'),
    -- 特殊技
    (cv_id, 'Viper Elbow',                        '6MP',         '特殊技', 30, '中段 / 16-27F脚無敵'),
    (cv_id, 'ダブルキック',                        '6HK',         '特殊技', 31, '上段 / 始動補正20% / 持続11-13,29-31'),
    (cv_id, 'ハイジャンプ(前方)',                 'High Jump 6',  '特殊技', 32, 'Driveゲージ10000消費 / 7-46F空中判定 / 必殺技C可'),
    (cv_id, 'ハイジャンプ(中立)',                 'High Jump 8',  '特殊技', 33, 'Driveゲージ10000消費 / 7-46F空中判定 / 必殺技C可'),
    -- 必殺技 (Thunder Dash / Knuckle)
    (cv_id, 'L Thunder Dash',                     '236LP', '必殺技', 40, '上段 / SA3キャンセル / Feint転掫可 / 派生攻撃20F〜'),
    (cv_id, 'M Thunder Dash',                     '236MP', '必殺技', 41, '上段 / SA3キャンセル / Feint転掫可 / 派生攻撃19F〜'),
    (cv_id, 'H Thunder Dash',                     '236HP', '必殺技', 42, '上段 / 1-9F空中飛び道具/中空打撃無敵 / 9-31F空中判定 / Feint転掫可'),
    (cv_id, 'OD Thunder Dash',                    '236PP', 'OD必殺技', 43, '上段 / SA2キャンセル / 始動補正30%・コンボ補正20% / 持続18-21,38-41'),
    (cv_id, 'L Tracer Combination',               '214LP', '必殺技', 44, '上段 / SA3キャンセル / Driveゲージ10000消費'),
    (cv_id, 'M Tracer Combination',               '214MP', '必殺技', 45, '上段 / SA3キャンセル / Driveゲージ10000消費 / 空中ヒット時GB'),
    (cv_id, 'H Tracer Combination',               '214HP', '必殺技', 46, '上段 / Driveゲージ10000消費'),
    (cv_id, '[Thunder Dash]Feint',                '236P > Cancel', '必殺技', 47, 'フェイント / 全体12F'),
    -- 必殺技 (Burning Kick系)
    (cv_id, 'L Burning Kick',                     '623LK', '必殺技', 50, '上段 / 5-34F空中判定 / 27-29F派生可'),
    (cv_id, 'M Burning Kick',                     '623MK', '必殺技', 51, '上段 / 5-36F空中判定 / 29-31F派生可'),
    (cv_id, 'H Burning Kick',                     '623HK', '必殺技', 52, '上段 / 5-38F空中判定 / 31-33F派生可'),
    (cv_id, 'OD Burning Kick',                    '623KK', 'OD必殺技', 53, '上段 / SA2キャンセル / 始動補正30%・コンボ補正20% / 11-43F空中判定'),
    (cv_id, 'Knuckled Pursuit',                   'Burning Kick > P','必殺技', 54, '上段派生 / Driveゲージ10000消費'),
    (cv_id, 'Double Burn',                        'Burning Kick > K','必殺技', 55, '上段派生 / Driveゲージ10000消費'),
    -- 必殺技 (Aerial Burning Kick)
    (cv_id, 'L Aerial Burning Kick',              'j.214LK', '必殺技', 60, '上段 / そり抜け性能 / PC時しゃがみガード崩れ'),
    (cv_id, 'M Aerial Burning Kick',              'j.214MK', '必殺技', 61, '上段 / そり抜け性能 / PC時しゃがみガード崩れ'),
    (cv_id, 'H Aerial Burning Kick',              'j.214HK', '必殺技', 62, '上段 / そり抜け性能 / PC時しゃがみガード崩れ'),
    (cv_id, 'OD Aerial Burning Kick',             'j.214KK', 'OD必殺技', 63, '上段 / そり抜け性能 / PC時しゃがみガード崩れ'),
    -- 必殺技 (Seismic Hammer)
    (cv_id, 'L Seismic Hammer',                   '22LP',  '必殺技', 70, '下段・弾 / SA3キャンセル / 始動補正20% / Feint転掫可 / ハイジャンプC可'),
    (cv_id, 'M Seismic Hammer',                   '22MP',  '必殺技', 71, '下段・弾 / SA3キャンセル / 始動補正20% / Feint転掫可 / ハイジャンプC可'),
    (cv_id, 'H Seismic Hammer',                   '22HP',  '必殺技', 72, '下段・弾 / SA3キャンセル / 始動補正20% / Feint転掫可 / ハイジャンプC可'),
    (cv_id, 'OD Seismic Hammer',                  '22PP',  'OD必殺技', 73, '下段・弾 / SA2キャンセル / 始動補正20% / ハイジャンプC可'),
    (cv_id, '[Seismic Hammer]Feint',              '22P > Cancel','必殺技', 74, 'フェイント / 全体16F'),
    -- 必殺技 (Focus Force)
    (cv_id, 'Focus Force(Lv1)',                   '41236P',         '必殺技', 80, '上段 / 始動補正50% / 6-13Fアーマー判定 / 11-13F前方DRC可 / ホールド変化'),
    (cv_id, 'Focus Force(Lv2) Hold',              '41236P (20F以上保持)', '必殺技', 81, '上段 / 始動補正50% / PC時毛洋日井(側)生成'),
    (cv_id, 'Focus Force(Lv3) Hold',              '41236P (59F以上保持)', '必殺技', 82, '上段 / 始動補正20% / ヒット時毛洋日井(側)生成'),
    (cv_id, 'OD Focus Force(Lv1)',                '41236PP',         'OD必殺技', 83, '上段 / 始動補正50% / 3-10Fアーマー判定 / 8-10F前方DRC可'),
    (cv_id, 'OD Focus Force(Lv2) Hold',           '41236PP (20F以上保持)','OD必殺技', 84, '上段 / 始動補正50% / PC時毛洋日井(側)生成'),
    (cv_id, 'OD Focus Force(Lv3) Hold',           '41236PP (57F以上保持)','OD必殺技', 85, '上段 / 始動補正20% / ヒット時毛洋日井(側)生成'),
    (cv_id, '[Focus Force]Forward Dash',          'Focus > 6','必殺技', 86, '前方DR派生 / 全体21F / 動作中常に被PC判定'),
    -- スーパーアーツ
    (cv_id, 'SA1 Limit Decoupler',                '236236P', 'SA1', 90, '上段 / 1-11F打撃/投げ無敵 / 12-20F空中飛び道具/中空打撃無敵 / 12-42F空中判定 / 700Fタイマー中Drive消費なしで派生・High Jump可 / 最低保障30%'),
    (cv_id, 'SA2 Mission Complete',               '214214P', 'SA2', 91, '上段 / 1-10F完全無敵 / 最低保障40%'),
    (cv_id, 'SA3 Hard Luck Rejector',             '236236K', 'SA3', 92, '上段 / 1-13F完全無敵 / 最低保障50% / 即時補正10%'),
    (cv_id, 'CA Hard Luck Rejector',              '236236K (体力25%以下)', 'SA3', 93, '上段 / 1-13F完全無敵 / 体力25%以下 / 最低保障50%'),
    -- 通常投げ
    (cv_id, 'High Impulse',                       'LP+LK',  '投げ', 95, '近距離 / 即時補正20% / PC時HKD'),
    (cv_id, 'Thunder Cradle',                     '4LP+LK', '投げ', 96, '近距離・後方 / 即時補正20% / PC時HKD');

  INSERT INTO public.frame_data
    (character_id, move_name, command, startup, active, recovery, on_hit, on_block, notes) VALUES
    -- 通常技
    (cv_id, '立弱P',                              '5LP',  4,  3,  8,  4, -2, 'ダメージ300 / 始動補正20% / 連打キャンセル / ハイジャンプC可'),
    (cv_id, '立弱K',                              '5LK',  5,  3, 11,  3, -2, 'ダメージ300 / 始動補正20% / ハイジャンプC可'),
    (cv_id, '立中P',                              '5MP',  8,  4, 12,  6,  1, 'ダメージ600 / ハイジャンプC可'),
    (cv_id, '立中K',                              '5MK',  8,  3, 18,  4, -3, 'ダメージ700 / 空振り時硬直+2F / ハイジャンプC可'),
    (cv_id, '立強P',                              '5HP', 12,  3, 21,  3, -2, 'ダメージ900 / ハイジャンプC可'),
    (cv_id, '立強K',                              '5HK', 10,  4, 20,  4, -3, 'ダメージ900 / 空中ヒットGB / PC時+19F / ハイジャンプC可'),
    (cv_id, 'しゃがみ弱P',                        '2LP',  4,  3,  8,  5, -1, 'ダメージ300 / 始動補正20% / 連打キャンセル'),
    (cv_id, 'しゃがみ弱K',                        '2LK',  5,  2,  9,  4, -1, 'ダメージ200 / 始動補正20% / 下段 / 連打キャンセル'),
    (cv_id, 'しゃがみ中P',                        '2MP',  6,  4, 16,  5, -2, 'ダメージ600'),
    (cv_id, 'しゃがみ中K',                        '2MK',  8,  3, 17,  5, -1, 'ダメージ600 / 始動補正20% / 下段'),
    (cv_id, 'しゃがみ強P',                        '2HP',  9,  3, 20,  2, -5, 'ダメージ800 / 強制立ち'),
    (cv_id, 'しゃがみ強K',                        '2HK', 10,  3, 25,  0, -11, 'ダメージ900 / ダウン / 下段 / PC時HKD'),
    (cv_id, 'ジャンプ弱P',                        'j.LP', 5,  6,  3,  0,  0, 'ダメージ300 / 着地後3F / 中段'),
    (cv_id, 'ジャンプ弱K',                        'j.LK', 5,  7,  3,  0,  0, 'ダメージ300 / 着地後3F / 中段'),
    (cv_id, 'ジャンプ中P',                        'j.MP', 8,  6,  3,  0,  0, 'ダメージ600 / 着地後3F / 中段'),
    (cv_id, 'ジャンプ中K',                        'j.MK', 7,  6,  3,  0,  0, 'ダメージ500 / 着地後3F / 中段 / そり抜け'),
    (cv_id, 'ジャンプ強P',                        'j.HP',11,  5,  3,  0,  0, 'ダメージ800 / 着地後3F / 中段 / 空中ヒットダウン'),
    (cv_id, 'ジャンプ強K',                        'j.HK', 8,  7,  3,  0,  0, 'ダメージ700 / 着地後3F / 中段 / そり抜け'),
    (cv_id, '垂直ジャンプ強K',                    'nj.HK',10, 7,  3,  0,  0, 'ダメージ800 / 着地後3F / 中段'),
    -- 特殊技
    (cv_id, 'Viper Elbow',                        '6MP',  22,  3, 20, 2, -3, 'ダメージ600 / 中段 / 16-27F脚無敵'),
    (cv_id, 'ダブルキック',                        '6HK',  11,  6, 16, 4, -2, 'ダメージ900 / 始動補正20% / 持続11-13,29-31'),
    (cv_id, 'ハイジャンプ(前方)',                 'High Jump 6',  0, 0, 49, 0, 0, '全体46+着地後3 / Driveゲージ10000消費 / 7-46F空中判定'),
    (cv_id, 'ハイジャンプ(中立)',                 'High Jump 8',  0, 0, 49, 0, 0, '全体46+着地後3 / Driveゲージ10000消費 / 7-46F空中判定'),
    -- 必殺技 (Thunder Dash)
    (cv_id, 'L Thunder Dash',                     '236LP', 17,  4, 23,  1, -4, 'ダメージ900 / Feint転掫可 / 派生攻撃20F〜'),
    (cv_id, 'M Thunder Dash',                     '236MP', 16,  4, 22,  1, -3, 'ダメージ900 / Feint転掫可 / 派生攻撃19F〜'),
    (cv_id, 'H Thunder Dash',                     '236HP',  7, 10, 37,  0, -24, 'ダメージ900 / ダウン / 1-9F空中飛び道具/中空打撃無敵'),
    (cv_id, 'OD Thunder Dash',                    '236PP', 18,  8, 21,  0, -2, 'ダメージ1600 / ダウン / 始動補正30%・コンボ補正20% / 持続18-21,38-41'),
    -- 必殺技 (Tracer)
    (cv_id, 'L Tracer Combination',               '214LP', 15,  3, 28,  0, -15, 'ダメージ600 / ダウン / Driveゲージ10000消費'),
    (cv_id, 'M Tracer Combination',               '214MP', 21,  4, 25,  0, -13, 'ダメージ600 / ダウン / Driveゲージ10000消費 / 空中ヒット時GB'),
    (cv_id, 'H Tracer Combination',               '214HP', 17,  4, 37,  0, 0,   'ダメージ500 / ダウン / Driveゲージ10000消費 / on_block不明'),
    (cv_id, '[Thunder Dash]Feint',                '236P > Cancel', 0, 0, 12, 0, 0, '全体12F / フェイント'),
    -- 必殺技 (Burning Kick系)
    (cv_id, 'L Burning Kick',                     '623LK', 23,  5, 20,  0, -2, 'ダメージ900 / ダウン / 5-34F空中判定 / 派生27-29F'),
    (cv_id, 'M Burning Kick',                     '623MK', 25,  5, 20,  0, -2, 'ダメージ900 / ダウン / 5-36F空中判定 / 派生29-31F'),
    (cv_id, 'H Burning Kick',                     '623HK', 27,  5, 20,  0, -2, 'ダメージ900 / ダウン / 5-38F空中判定 / 派生31-33F'),
    (cv_id, 'OD Burning Kick',                    '623KK',  8,  7, 21,  0, -4, 'ダメージ1500 / ダウン / 始動補正30%・コンボ補正20% / 11-43F空中判定'),
    (cv_id, 'Knuckled Pursuit',                   'Burning Kick > P', 12, 4, 34, 0, -15, 'ダメージ800 / ダウン / Driveゲージ10000消費'),
    (cv_id, 'Double Burn',                        'Burning Kick > K', 21, 5, 20, 0,  2,  'ダメージ600 / ダウン / Driveゲージ10000消費'),
    -- 必殺技 (Aerial Burning Kick)
    (cv_id, 'L Aerial Burning Kick',              'j.214LK', 22, 7, 13, 0,  0, 'ダメージ900 / 着地後13F / そり抜け / on_block-3〜2'),
    (cv_id, 'M Aerial Burning Kick',              'j.214MK', 20, 7, 13, 0,  0, 'ダメージ900 / 着地後13F / そり抜け / on_block-3〜3'),
    (cv_id, 'H Aerial Burning Kick',              'j.214HK', 18, 7, 13, 0,  0, 'ダメージ900 / 着地後13F / そり抜け / on_block-4〜1'),
    (cv_id, 'OD Aerial Burning Kick',             'j.214KK', 18, 7, 13, 0,  4, 'ダメージ1000 / 着地後13F / そり抜け / on_block 1〜7'),
    -- 必殺技 (Seismic Hammer)
    (cv_id, 'L Seismic Hammer',                   '22LP',  24, 8, 26, 0, -10, 'ダメージ700 / 下段・弾 / 始動補正20% / Feint可 / ハイジャンプC可'),
    (cv_id, 'M Seismic Hammer',                   '22MP',  24, 8, 26, 0, -10, 'ダメージ700 / 下段・弾 / 始動補正20% / Feint可 / ハイジャンプC可'),
    (cv_id, 'H Seismic Hammer',                   '22HP',  24, 8, 26, 0, -10, 'ダメージ700 / 下段・弾 / 始動補正20% / Feint可 / ハイジャンプC可'),
    (cv_id, 'OD Seismic Hammer',                  '22PP',  19, 8, 26, 0,  -8, 'ダメージ900 / 下段・弾 / 始動補正20% / ハイジャンプC可'),
    (cv_id, '[Seismic Hammer]Feint',              '22P > Cancel', 0, 0, 16, 0, 0, '全体16F / フェイント'),
    -- 必殺技 (Focus Force)
    (cv_id, 'Focus Force(Lv1)',                   '41236P',         23, 8, 36, 0, -16, 'ダメージ1000 / 始動補正50% / 6-13Fアーマー / 11-13F前方DRC可 / 持続23-26,31-34'),
    (cv_id, 'Focus Force(Lv2) Hold',              '41236P (20F以上保持)', 30, 8, 36, 0, -16, 'ダメージ1200 / 始動補正50% / PC時毛洋日井生成 / 持続30-33,38-41'),
    (cv_id, 'Focus Force(Lv3) Hold',              '41236P (59F以上保持)', 69, 8, 36, 0, -10, 'ダメージ1400 / 始動補正20% / ヒット時毛洋日井生成 / 持続69-72,77-80'),
    (cv_id, 'OD Focus Force(Lv1)',                '41236PP',         20, 8, 36, 0, -16, 'ダメージ1500 / 始動補正50% / 3-10Fアーマー / 8-10F前方DRC可 / 持続20-23,28-31'),
    (cv_id, 'OD Focus Force(Lv2) Hold',           '41236PP (20F以上保持)', 30, 8, 36, 0, -16, 'ダメージ1700 / 始動補正50% / PC時毛洋日井生成'),
    (cv_id, 'OD Focus Force(Lv3) Hold',           '41236PP (57F以上保持)', 67, 8, 36, 0, -10, 'ダメージ2000 / 始動補正20% / ヒット時毛洋日井生成 / 持続67-70,75-78'),
    (cv_id, '[Focus Force]Forward Dash',          'Focus > 6',  0, 0, 21, 0, 0, '全体21F / 動作中常に被PC判定'),
    -- スーパーアーツ
    (cv_id, 'SA1 Limit Decoupler',                '236236P',  8, 10, 53, 0, -34, 'ダメージ2000 / ダウン / 1-11F打撃/投げ無敵 / 12-20F空中飛び道具/中空打撃無敵 / 12-42F空中判定 / 700Fタイマー中Drive消費なし派生 / 最低保障30%'),
    (cv_id, 'SA2 Mission Complete',               '214214P',  7,  4, 45, 0, -29, 'ダメージ3000 / ダウン / 1-10F完全無敵 / 最低保障40%'),
    (cv_id, 'SA3 Hard Luck Rejector',             '236236K', 10,  4, 54, 0, -38, 'ダメージ4000 / ダウン / 1-13F完全無敵 / 即時補正10% / 最低保障50%'),
    (cv_id, 'CA Hard Luck Rejector',              '236236K (体力25%以下)', 10, 4, 54, 0, -38, 'ダメージ4500 / ダウン / 体力25%以下 / 1-13F完全無敵 / 最低保障50%'),
    -- 通常投げ
    (cv_id, 'High Impulse',                       'LP+LK',  5, 3, 23, 0, 0, 'ダメージ1200 / ダウン / 即時補正20% / PC時2040 / SAゲージ+4000 / HKD'),
    (cv_id, 'Thunder Cradle',                     '4LP+LK', 5, 3, 23, 0, 0, 'ダメージ1200 / ダウン / 即時補正20% / PC時2040 / SAゲージ+4000 / HKD');

END $$;
