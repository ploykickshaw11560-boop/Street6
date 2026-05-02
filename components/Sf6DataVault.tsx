'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MOVE_CATEGORIES,
  type Character,
  type Combo,
  type FrameData,
  type MasterMove,
  type MoveCategory
} from '@/lib/types';

type FrameForm = {
  character_id: string;
  master_move_id: string;
  startup: number;
  active: number;
  recovery: number;
  on_hit: number;
  on_block: number;
  notes: string;
};

type MasterMoveForm = {
  character_id: string;
  move_name: string;
  command: string;
  category: MoveCategory;
  display_order: number;
  notes: string;
};

type ComboForm = {
  character_id: string;
  combo_name: string;
  difficulty: 'Easy' | 'Normal' | 'Hard';
  damage: number;
  drive_gauge_change: number;
  combo_route: string;
  notes: string;
};

type CsvRow = Record<string, string>;

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(value.trim());
      value = '';
      continue;
    }

    value += char;
  }

  values.push(value.trim());
  return values;
};

const parseCsv = (text: string) => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSVにヘッダーと1件以上のデータ行を入れてください。');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
};

const toInt = (value: string, field: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} が数値ではありません: ${value}`);
  }
  return parsed;
};

const normalizeDifficulty = (value: string): ComboForm['difficulty'] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'normal') return 'Normal';
  if (normalized === 'hard') return 'Hard';
  throw new Error(`difficulty は Easy / Normal / Hard で指定してください: ${value}`);
};

type ViewMode = 'register' | 'records' | 'characters';

export default function Sf6DataVault({ mode }: { mode: ViewMode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [masterMoves, setMasterMoves] = useState<MasterMove[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [status, setStatus] = useState('読み込み中...');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');

  const [characterName, setCharacterName] = useState('');
  const [characterNotes, setCharacterNotes] = useState('');

  const [frameCsvFile, setFrameCsvFile] = useState<File | null>(null);
  const [comboCsvFile, setComboCsvFile] = useState<File | null>(null);

  const [frameForm, setFrameForm] = useState<FrameForm>({
    character_id: '',
    master_move_id: '',
    startup: 0,
    active: 0,
    recovery: 0,
    on_hit: 0,
    on_block: 0,
    notes: ''
  });

  const [masterMoveForm, setMasterMoveForm] = useState<MasterMoveForm>({
    character_id: '',
    move_name: '',
    command: '',
    category: '通常技',
    display_order: 0,
    notes: ''
  });

  const [unlocked, setUnlocked] = useState(false);
  const [editingFrame, setEditingFrame] = useState<FrameData | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [editingMasterMove, setEditingMasterMove] = useState<MasterMove | null>(null);

  const [comboForm, setComboForm] = useState<ComboForm>({
    character_id: '',
    combo_name: '',
    difficulty: 'Normal',
    damage: 0,
    drive_gauge_change: 0,
    combo_route: '',
    notes: ''
  });

  const totalDamage = useMemo(() => combos.reduce((sum, combo) => sum + combo.damage, 0), [combos]);

  type StatsSortKey =
    | 'name'
    | 'health'
    | 'walk_fwd'
    | 'walk_bwd'
    | 'dash_fwd_frames'
    | 'dash_bwd_frames'
    | 'dash_fwd_distance'
    | 'dash_bwd_distance'
    | 'pre_jump';

  const [statsSort, setStatsSort] = useState<{ key: StatsSortKey; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc'
  });

  const toggleStatsSort = (key: StatsSortKey) => {
    setStatsSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' }
    );
  };

  const sortedCharacters = useMemo(() => {
    const list = [...characters];
    const { key, dir } = statsSort;
    list.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return dir === 'asc' ? an - bn : bn - an;
    });
    return list;
  }, [characters, statsSort]);

  const loadData = async () => {
    setStatus('データを同期しています...');
    const [charactersResult, masterMovesResult, framesResult, combosResult] = await Promise.all([
      supabase.from('characters').select('*').order('name', { ascending: true }),
      supabase
        .from('master_moves')
        .select('*, character:characters(name)')
        .order('display_order', { ascending: true }),
      supabase
        .from('frame_data')
        .select('*, character:characters(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('combos')
        .select('*, character:characters(name)')
        .order('created_at', { ascending: false })
    ]);

    if (
      charactersResult.error ||
      masterMovesResult.error ||
      framesResult.error ||
      combosResult.error
    ) {
      setStatus('読み込みに失敗しました。Supabaseのテーブル作成とRLS設定を確認してください。');
      return;
    }

    const characterRows = (charactersResult.data ?? []) as Character[];
    const masterMoveRows = (masterMovesResult.data ?? []) as MasterMove[];
    const frameRows = (framesResult.data ?? []) as FrameData[];
    const comboRows = (combosResult.data ?? []) as Combo[];

    setCharacters(characterRows);
    setMasterMoves(masterMoveRows);
    setFrames(frameRows);
    setCombos(comboRows);

    const firstCharacterId = characterRows[0]?.id ?? '';
    setSelectedCharacterId((prev) => prev || firstCharacterId);
    setFrameForm((prev) => ({ ...prev, character_id: prev.character_id || firstCharacterId }));
    setComboForm((prev) => ({ ...prev, character_id: prev.character_id || firstCharacterId }));
    setMasterMoveForm((prev) => ({ ...prev, character_id: prev.character_id || firstCharacterId }));

    setStatus('同期完了');
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('sf6_edit_unlocked') === '1') {
      setUnlocked(true);
    }
  }, []);

  const toggleUnlock = () => {
    if (unlocked) {
      window.sessionStorage.removeItem('sf6_edit_unlocked');
      setUnlocked(false);
      setStatus('編集モードを解除しました');
      return;
    }
    const pw = window.prompt('編集モードのパスワードを入力してください');
    if (pw === null) return;
    if (pw === 'test') {
      window.sessionStorage.setItem('sf6_edit_unlocked', '1');
      setUnlocked(true);
      setStatus('編集モードを有効化しました');
    } else {
      window.alert('パスワードが違います');
    }
  };

  const handleFrameUpdate = async () => {
    if (!editingFrame) return;
    const { error } = await supabase
      .from('frame_data')
      .update({
        character_id: editingFrame.character_id,
        move_name: editingFrame.move_name,
        command: editingFrame.command,
        startup: editingFrame.startup,
        active: editingFrame.active,
        recovery: editingFrame.recovery,
        on_hit: editingFrame.on_hit,
        on_block: editingFrame.on_block,
        notes: editingFrame.notes?.toString().trim() ? editingFrame.notes : null
      })
      .eq('id', editingFrame.id);
    if (error) {
      setStatus(`フレームデータ更新エラー: ${error.message}`);
      return;
    }
    setEditingFrame(null);
    await loadData();
  };

  const handleFrameDelete = async (id: string) => {
    if (!confirm('このフレームデータを削除しますか?')) return;
    const { error } = await supabase.from('frame_data').delete().eq('id', id);
    if (error) {
      setStatus(`フレームデータ削除エラー: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleComboUpdate = async () => {
    if (!editingCombo) return;
    const { error } = await supabase
      .from('combos')
      .update({
        character_id: editingCombo.character_id,
        combo_name: editingCombo.combo_name,
        difficulty: editingCombo.difficulty,
        damage: editingCombo.damage,
        drive_gauge_change: editingCombo.drive_gauge_change,
        combo_route: editingCombo.combo_route,
        notes: editingCombo.notes?.toString().trim() ? editingCombo.notes : null
      })
      .eq('id', editingCombo.id);
    if (error) {
      setStatus(`コンボ更新エラー: ${error.message}`);
      return;
    }
    setEditingCombo(null);
    await loadData();
  };

  const handleComboDelete = async (id: string) => {
    if (!confirm('このコンボを削除しますか?')) return;
    const { error } = await supabase.from('combos').delete().eq('id', id);
    if (error) {
      setStatus(`コンボ削除エラー: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleMasterMoveUpdate = async () => {
    if (!editingMasterMove) return;
    const { error } = await supabase
      .from('master_moves')
      .update({
        move_name: editingMasterMove.move_name,
        command: editingMasterMove.command,
        category: editingMasterMove.category,
        display_order: editingMasterMove.display_order,
        notes: editingMasterMove.notes?.toString().trim() ? editingMasterMove.notes : null
      })
      .eq('id', editingMasterMove.id);
    if (error) {
      setStatus(`技マスタ更新エラー: ${error.message}`);
      return;
    }
    setEditingMasterMove(null);
    await loadData();
  };

  const ensureCharacters = async (names: string[]) => {
    const uniqueNames = Array.from(new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)));
    if (uniqueNames.length === 0) {
      throw new Error('CSVの character カラムを確認してください。');
    }

    const { error: upsertError } = await supabase.from('characters').upsert(
      uniqueNames.map((name) => ({ name })),
      { onConflict: 'name', ignoreDuplicates: false }
    );

    if (upsertError) {
      throw new Error(`キャラクター作成に失敗: ${upsertError.message}`);
    }

    const { data, error } = await supabase.from('characters').select('id, name').in('name', uniqueNames);
    if (error || !data) {
      throw new Error(`キャラクター取得に失敗: ${error?.message}`);
    }

    return data.reduce<Record<string, string>>((map, character) => {
      map[character.name] = character.id;
      return map;
    }, {});
  };

  const handleFrameCsvImport = async () => {
    if (!frameCsvFile) {
      setStatus('フレームデータCSVファイルを選択してください。');
      return;
    }

    try {
      setStatus('フレームデータCSVをインポート中...');
      const text = await frameCsvFile.text();
      const rows = parseCsv(text);

      const requiredHeaders = ['character', 'move_name', 'command', 'startup', 'active', 'recovery', 'on_hit', 'on_block'];
      const missingHeaders = requiredHeaders.filter((header) => !(header in rows[0]));
      if (missingHeaders.length > 0) {
        throw new Error(`不足ヘッダー: ${missingHeaders.join(', ')}`);
      }

      const characterMap = await ensureCharacters(rows.map((row) => row.character));

      const payload = rows.map((row) => ({
        character_id: characterMap[row.character.trim()],
        move_name: row.move_name,
        command: row.command,
        startup: toInt(row.startup, 'startup'),
        active: toInt(row.active, 'active'),
        recovery: toInt(row.recovery, 'recovery'),
        on_hit: toInt(row.on_hit, 'on_hit'),
        on_block: toInt(row.on_block, 'on_block'),
        notes: row.notes?.trim() ? row.notes.trim() : null
      }));

      if (payload.some((row) => !row.character_id)) {
        throw new Error('character カラムに空欄があります。');
      }

      const { error } = await supabase.from('frame_data').insert(payload);
      if (error) {
        throw new Error(`フレームデータ登録に失敗: ${error.message}`);
      }

      setFrameCsvFile(null);
      await loadData();
      setStatus(`フレームデータCSVインポート完了 (${payload.length} 件)`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'フレームCSVインポート中にエラーが発生しました。');
    }
  };

  const handleComboCsvImport = async () => {
    if (!comboCsvFile) {
      setStatus('コンボCSVファイルを選択してください。');
      return;
    }

    try {
      setStatus('コンボCSVをインポート中...');
      const text = await comboCsvFile.text();
      const rows = parseCsv(text);

      const requiredHeaders = [
        'character',
        'combo_name',
        'difficulty',
        'damage',
        'drive_gauge_change',
        'combo_route'
      ];
      const missingHeaders = requiredHeaders.filter((header) => !(header in rows[0]));
      if (missingHeaders.length > 0) {
        throw new Error(`不足ヘッダー: ${missingHeaders.join(', ')}`);
      }

      const characterMap = await ensureCharacters(rows.map((row) => row.character));

      const payload = rows.map((row) => ({
        character_id: characterMap[row.character.trim()],
        combo_name: row.combo_name,
        difficulty: normalizeDifficulty(row.difficulty),
        damage: toInt(row.damage, 'damage'),
        drive_gauge_change: toInt(row.drive_gauge_change, 'drive_gauge_change'),
        combo_route: row.combo_route,
        notes: row.notes?.trim() ? row.notes.trim() : null
      }));

      if (payload.some((row) => !row.character_id)) {
        throw new Error('character カラムに空欄があります。');
      }

      const { error } = await supabase.from('combos').insert(payload);
      if (error) {
        throw new Error(`コンボ登録に失敗: ${error.message}`);
      }

      setComboCsvFile(null);
      await loadData();
      setStatus(`コンボCSVインポート完了 (${payload.length} 件)`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'コンボCSVインポート中にエラーが発生しました。');
    }
  };

  const handleCharacterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!characterName.trim()) {
      setStatus('キャラクター名を入力してください。');
      return;
    }

    const { error } = await supabase
      .from('characters')
      .insert({ name: characterName.trim(), style_notes: characterNotes.trim() || null });

    if (error) {
      setStatus(`キャラクター登録エラー: ${error.message}`);
      return;
    }

    setCharacterName('');
    setCharacterNotes('');
    await loadData();
  };

  const handleFrameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedMove = masterMoves.find((move) => move.id === frameForm.master_move_id);
    if (!selectedMove) {
      setStatus('技マスタから技を選択してください。');
      return;
    }

    const { error } = await supabase.from('frame_data').insert({
      character_id: frameForm.character_id,
      move_name: selectedMove.move_name,
      command: selectedMove.command,
      startup: frameForm.startup,
      active: frameForm.active,
      recovery: frameForm.recovery,
      on_hit: frameForm.on_hit,
      on_block: frameForm.on_block,
      notes: frameForm.notes.trim() || null
    });

    if (error) {
      setStatus(`フレームデータ登録エラー: ${error.message}`);
      return;
    }

    setFrameForm((prev) => ({
      ...prev,
      master_move_id: '',
      startup: 0,
      active: 0,
      recovery: 0,
      on_hit: 0,
      on_block: 0,
      notes: ''
    }));
    await loadData();
  };

  const handleMasterMoveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!masterMoveForm.character_id) {
      setStatus('キャラクターを選択してください。');
      return;
    }
    if (!masterMoveForm.move_name.trim() || !masterMoveForm.command.trim()) {
      setStatus('技名とコマンドは必須です。');
      return;
    }

    const { error } = await supabase.from('master_moves').insert({
      character_id: masterMoveForm.character_id,
      move_name: masterMoveForm.move_name.trim(),
      command: masterMoveForm.command.trim(),
      category: masterMoveForm.category,
      display_order: masterMoveForm.display_order,
      notes: masterMoveForm.notes.trim() || null
    });

    if (error) {
      setStatus(`技マスター登録エラー: ${error.message}`);
      return;
    }

    setMasterMoveForm((prev) => ({
      ...prev,
      move_name: '',
      command: '',
      notes: ''
    }));
    await loadData();
  };

  const handleMasterMoveDelete = async (id: string) => {
    if (!confirm('この技マスタを削除しますか? (該当キャラの過去フレームデータには影響しません)')) {
      return;
    }
    const { error } = await supabase.from('master_moves').delete().eq('id', id);
    if (error) {
      setStatus(`技マスター削除エラー: ${error.message}`);
      return;
    }
    await loadData();
  };

  const handleComboSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { error } = await supabase.from('combos').insert({
      ...comboForm,
      notes: comboForm.notes.trim() || null
    });

    if (error) {
      setStatus(`コンボ登録エラー: ${error.message}`);
      return;
    }

    setComboForm((prev) => ({
      ...prev,
      combo_name: '',
      damage: 0,
      drive_gauge_change: 0,
      combo_route: '',
      notes: ''
    }));
    await loadData();
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-row">
          <h1>SF6 Data Vault</h1>
          <button
            type="button"
            className={`lock-btn ${unlocked ? 'unlocked' : ''}`}
            onClick={toggleUnlock}
            title={unlocked ? '編集モード解除' : '編集モード(要パスワード)'}
          >
            {unlocked ? '🔓 編集モード ON' : '🔒 編集モード OFF'}
          </button>
        </div>
        <p>Supabaseへフレームデータ・コンボデータを登録/管理して、Vercelでそのまま公開できます。</p>
        <p>
          キャラ数: <strong>{characters.length}</strong> / フレームデータ: <strong>{frames.length}</strong> / コンボ:{' '}
          <strong>{combos.length}</strong> / 合計ダメージ: <strong>{totalDamage}</strong>
        </p>
        <div className="status">{status}</div>
      </section>

      {mode === 'register' && (
      <section className="accordion">
        <details className="accordion-item">
          <summary>1. キャラクター登録</summary>
          <div className="accordion-body">
          <p className="section-intro">
            最初にキャラクターを登録します。ここで登録したキャラがフレームデータ登録・コンボ登録の「キャラを選択」プルダウンに表示されます。
          </p>
          <form onSubmit={handleCharacterSubmit}>
            <label className="field">
              <span className="field-label">キャラクター名 <em>必須</em></span>
              <span className="field-help">SF6のキャラ名。例: リュウ、ジュリ、キャミィ</span>
              <input
                placeholder="例: リュウ"
                value={characterName}
                onChange={(event) => setCharacterName(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">補足メモ</span>
              <span className="field-help">任意。戦闘スタイルや特徴などをメモ</span>
              <textarea
                placeholder="例: 波動・昇龍タイプの基本キャラ"
                value={characterNotes}
                onChange={(event) => setCharacterNotes(event.target.value)}
              />
            </label>
            <button type="submit">キャラクターを追加</button>
          </form>
          </div>
        </details>

        <details className="accordion-item">
          <summary>2. フレームデータ登録</summary>
          <div className="accordion-body">
          <p className="section-intro">
            技マスタに登録した技を選んで、フレームデータを記録します。技がリストに無い場合は先に「6. 技マスター登録」で追加してください。数値はすべてフレーム単位 (1F = 1/60秒)。
          </p>
          <form onSubmit={handleFrameSubmit}>
            <label className="field">
              <span className="field-label">キャラクター <em>必須</em></span>
              <span className="field-help">マスタに登録済みのキャラから選択</span>
              <select
                value={frameForm.character_id}
                onChange={(event) =>
                  setFrameForm((prev) => ({ ...prev, character_id: event.target.value, master_move_id: '' }))
                }
                required
              >
                <option value="">キャラを選択</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">技 (マスタから選択) <em>必須</em></span>
              <span className="field-help">
                選択したキャラの技マスタが対象。技を選ぶと技名・コマンドが自動セットされます。
              </span>
              <select
                value={frameForm.master_move_id}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, master_move_id: event.target.value }))}
                required
                disabled={!frameForm.character_id}
              >
                <option value="">
                  {frameForm.character_id
                    ? masterMoves.filter((m) => m.character_id === frameForm.character_id).length === 0
                      ? '技マスタが未登録です（6. 技マスター登録で追加）'
                      : '技を選択'
                    : 'まずキャラを選択してください'}
                </option>
                {masterMoves
                  .filter((move) => move.character_id === frameForm.character_id)
                  .map((move) => (
                    <option key={move.id} value={move.id}>
                      [{move.category}] {move.move_name} ({move.command})
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">発生 (F) <em>必須</em></span>
              <span className="field-help">技を入力してから攻撃判定が出るまでのフレーム数</span>
              <input
                type="number"
                placeholder="例: 13"
                value={frameForm.startup}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, startup: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">持続 (F) <em>必須</em></span>
              <span className="field-help">攻撃判定が出続けているフレーム数</span>
              <input
                type="number"
                placeholder="例: 3"
                value={frameForm.active}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, active: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">硬直 (F) <em>必須</em></span>
              <span className="field-help">攻撃終了後に動けないフレーム数 (空振り時)</span>
              <input
                type="number"
                placeholder="例: 22"
                value={frameForm.recovery}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, recovery: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">ヒット時の有利不利 (F) <em>必須</em></span>
              <span className="field-help">プラスは自分有利、マイナスは相手有利。例: +3 なら 3</span>
              <input
                type="number"
                placeholder="例: 3"
                value={frameForm.on_hit}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, on_hit: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">ガード時の有利不利 (F) <em>必須</em></span>
              <span className="field-help">ガードされた時の有利不利。例: -2 なら -2 を入力</span>
              <input
                type="number"
                placeholder="例: -2"
                value={frameForm.on_block}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, on_block: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">補足</span>
              <span className="field-help">任意。属性 (中段/下段/打撃/投げ)、用途、キャンセル可否などのメモ</span>
              <textarea
                placeholder="例: キャンセル可、ヒット時コンボ始動"
                value={frameForm.notes}
                onChange={(event) => setFrameForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button type="submit">フレームデータを追加</button>
          </form>
          </div>
        </details>

        <details className="accordion-item">
          <summary>3. コンボ登録</summary>
          <div className="accordion-body">
          <p className="section-intro">
            実戦で使うコンボレシピを登録します。難易度・ダメージ・ドライブゲージ消費の目安を一覧で比較できるようになります。
          </p>
          <form onSubmit={handleComboSubmit}>
            <label className="field">
              <span className="field-label">キャラクター <em>必須</em></span>
              <span className="field-help">「1. キャラクター登録」で追加したキャラから選択</span>
              <select
                value={comboForm.character_id}
                onChange={(event) => setComboForm((prev) => ({ ...prev, character_id: event.target.value }))}
                required
              >
                <option value="">キャラを選択</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">コンボ名 <em>必須</em></span>
              <span className="field-help">識別しやすい名前。例: 中央始動基本、画面端ノーゲージ</span>
              <input
                placeholder="例: 中央始動基本"
                value={comboForm.combo_name}
                onChange={(event) => setComboForm((prev) => ({ ...prev, combo_name: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">難易度</span>
              <span className="field-help">体感の難しさ。Easy / Normal / Hard から選択</span>
              <select
                value={comboForm.difficulty}
                onChange={(event) =>
                  setComboForm((prev) => ({ ...prev, difficulty: event.target.value as ComboForm['difficulty'] }))
                }
              >
                <option value="Easy">Easy (簡単)</option>
                <option value="Normal">Normal (普通)</option>
                <option value="Hard">Hard (難しい)</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">ダメージ <em>必須</em></span>
              <span className="field-help">コンボ完走時の合計ダメージ値</span>
              <input
                type="number"
                placeholder="例: 2800"
                value={comboForm.damage}
                onChange={(event) => setComboForm((prev) => ({ ...prev, damage: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">ドライブゲージ増減 <em>必須</em></span>
              <span className="field-help">コンボ全体での増減量。消費はマイナス、回収はプラス。例: -2 (2本消費)</span>
              <input
                type="number"
                placeholder="例: -2"
                value={comboForm.drive_gauge_change}
                onChange={(event) =>
                  setComboForm((prev) => ({ ...prev, drive_gauge_change: Number(event.target.value) }))
                }
                required
              />
            </label>
            <label className="field">
              <span className="field-label">コンボルート <em>必須</em></span>
              <span className="field-help">技の繋ぎを「&gt;」区切りで記述。例: 2MK &gt; OD波掌撃 &gt; 真空波動拳</span>
              <textarea
                placeholder="例: 2MK > OD波掌撃 > 真空波動拳"
                value={comboForm.combo_route}
                onChange={(event) => setComboForm((prev) => ({ ...prev, combo_route: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">補足</span>
              <span className="field-help">任意。始動条件、画面位置、難所のコツなど</span>
              <textarea
                placeholder="例: 画面端限定、目押し2回"
                value={comboForm.notes}
                onChange={(event) => setComboForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button type="submit">コンボを追加</button>
          </form>
          </div>
        </details>

        <details className="accordion-item">
          <summary>4. CSVインポート（フレーム）</summary>
          <div className="accordion-body">
            <p className="section-intro">
              スプレッドシートで作ったフレームデータを CSV でまとめて取り込みます。CSV内の <code>character</code> 列に書いたキャラ名は未登録なら自動で作成されます。
            </p>
            <p className="csv-headers">
              <strong>必須ヘッダー (1行目):</strong><br />
              character, move_name, command, startup, active, recovery, on_hit, on_block, notes
            </p>
            <p className="field-help">数値列 (startup / active / recovery / on_hit / on_block) は整数。notes は省略可。文字コードは UTF-8 推奨。</p>
            <label className="field">
              <span className="field-label">CSV ファイル</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => setFrameCsvFile(event.target.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={handleFrameCsvImport}>フレームCSVを取り込み</button>
          </div>
        </details>

        <details className="accordion-item">
          <summary>5. CSVインポート（コンボ）</summary>
          <div className="accordion-body">
            <p className="section-intro">
              コンボ表をまとめて登録します。1 行 = 1 コンボとして取り込みます。
            </p>
            <p className="csv-headers">
              <strong>必須ヘッダー (1行目):</strong><br />
              character, combo_name, difficulty, damage, drive_gauge_change, combo_route, notes
            </p>
            <p className="field-help">difficulty は Easy / Normal / Hard のいずれか。combo_route 内に「,」を含めるなら値全体を「&quot;」で囲んでください。</p>
            <label className="field">
              <span className="field-label">CSV ファイル</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => setComboCsvFile(event.target.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={handleComboCsvImport}>コンボCSVを取り込み</button>
          </div>
        </details>

        <details className="accordion-item">
          <summary>6. 技マスター登録</summary>
          <div className="accordion-body">
            <p className="section-intro">
              キャラごとの技マスタ (技名 + コマンド + 種類) を管理します。ここに登録した技がフレームデータ登録のプルダウンと「キャラ情報」ページに反映されます。
            </p>
            <form onSubmit={handleMasterMoveSubmit}>
              <label className="field">
                <span className="field-label">キャラクター <em>必須</em></span>
                <span className="field-help">対象のキャラを選択</span>
                <select
                  value={masterMoveForm.character_id}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({ ...prev, character_id: event.target.value }))
                  }
                  required
                >
                  <option value="">キャラを選択</option>
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">技名 <em>必須</em></span>
                <span className="field-help">例: 立ち弱K、波動拳、真空波動拳</span>
                <input
                  placeholder="例: 波動拳"
                  value={masterMoveForm.move_name}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({ ...prev, move_name: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">コマンド <em>必須</em></span>
                <span className="field-help">入力表記。例: 5LK、2MK、236P、623K</span>
                <input
                  placeholder="例: 236P"
                  value={masterMoveForm.command}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({ ...prev, command: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">種類 <em>必須</em></span>
                <span className="field-help">
                  通常技 / 特殊技 / 必殺技 / OD必殺技 / SA1 / SA2 / SA3 / 投げ / その他
                </span>
                <select
                  value={masterMoveForm.category}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({
                      ...prev,
                      category: event.target.value as MoveCategory
                    }))
                  }
                  required
                >
                  {MOVE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">表示順</span>
                <span className="field-help">数字が小さいほど上に表示。同種別内での並び替え用 (任意)</span>
                <input
                  type="number"
                  value={masterMoveForm.display_order}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">補足</span>
                <span className="field-help">任意。属性 (中段/下段) や特記事項</span>
                <textarea
                  placeholder="例: 中段、キャンセル可"
                  value={masterMoveForm.notes}
                  onChange={(event) =>
                    setMasterMoveForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </label>
              <button type="submit">技マスタを追加</button>
            </form>

            {masterMoveForm.character_id && (
              <div className="master-move-list">
                <h3>登録済み技マスタ</h3>
                {masterMoves.filter((m) => m.character_id === masterMoveForm.character_id).length === 0 ? (
                  <p className="field-help">このキャラの技マスタはまだありません。</p>
                ) : (
                  <ul>
                    {masterMoves
                      .filter((m) => m.character_id === masterMoveForm.character_id)
                      .map((move) => (
                        <li key={move.id}>
                          <span className="move-pill">{move.category}</span>
                          <strong>{move.move_name}</strong>
                          <code>{move.command}</code>
                          {unlocked && (
                            <span className="row-actions">
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => setEditingMasterMove(move)}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="link-btn danger"
                                onClick={() => handleMasterMoveDelete(move.id)}
                              >
                                削除
                              </button>
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </details>
      </section>
      )}

      {mode === 'characters' && (
      <section className="accordion character-info">
        <details className="accordion-item">
          <summary>基礎情報一覧 ({characters.length}キャラ)</summary>
          <div className="accordion-body">
            <p className="field-help">
              全キャラの基礎ステータス比較表。列ヘッダーをクリックで並び替え、行クリックでそのキャラの詳細パネルを開きます。
            </p>
            <div className="table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th
                    onClick={() => toggleStatsSort('name')}
                    className={statsSort.key === 'name' ? `sort-${statsSort.dir}` : ''}
                  >キャラ</th>
                  <th
                    onClick={() => toggleStatsSort('health')}
                    className={statsSort.key === 'health' ? `sort-${statsSort.dir}` : ''}
                  >体力</th>
                  <th
                    onClick={() => toggleStatsSort('walk_fwd')}
                    className={statsSort.key === 'walk_fwd' ? `sort-${statsSort.dir}` : ''}
                  >前歩き</th>
                  <th
                    onClick={() => toggleStatsSort('walk_bwd')}
                    className={statsSort.key === 'walk_bwd' ? `sort-${statsSort.dir}` : ''}
                  >後歩き</th>
                  <th
                    onClick={() => toggleStatsSort('dash_fwd_frames')}
                    className={statsSort.key === 'dash_fwd_frames' ? `sort-${statsSort.dir}` : ''}
                  >前ダッシュ(F)</th>
                  <th
                    onClick={() => toggleStatsSort('dash_bwd_frames')}
                    className={statsSort.key === 'dash_bwd_frames' ? `sort-${statsSort.dir}` : ''}
                  >後ダッシュ(F)</th>
                  <th
                    onClick={() => toggleStatsSort('dash_fwd_distance')}
                    className={statsSort.key === 'dash_fwd_distance' ? `sort-${statsSort.dir}` : ''}
                  >前ダッシュ距離</th>
                  <th
                    onClick={() => toggleStatsSort('dash_bwd_distance')}
                    className={statsSort.key === 'dash_bwd_distance' ? `sort-${statsSort.dir}` : ''}
                  >後ダッシュ距離</th>
                  <th
                    onClick={() => toggleStatsSort('pre_jump')}
                    className={statsSort.key === 'pre_jump' ? `sort-${statsSort.dir}` : ''}
                  >プリジャンプ(F)</th>
                </tr>
              </thead>
              <tbody>
                {sortedCharacters.map((character) => (
                  <tr
                    key={character.id}
                    className={character.id === selectedCharacterId ? 'is-selected' : ''}
                    onClick={() => setSelectedCharacterId(character.id)}
                  >
                    <td><strong>{character.name}</strong></td>
                    <td>{character.health ?? '-'}</td>
                    <td>{character.walk_fwd ?? '-'}</td>
                    <td>{character.walk_bwd ?? '-'}</td>
                    <td>{character.dash_fwd_frames ?? '-'}</td>
                    <td>{character.dash_bwd_frames ?? '-'}</td>
                    <td>{character.dash_fwd_distance ?? '-'}</td>
                    <td>{character.dash_bwd_distance ?? '-'}</td>
                    <td>{character.pre_jump ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </details>

        <details className="accordion-item">
          <summary>
            キャラクター詳細{(() => {
              const target = characters.find((c) => c.id === selectedCharacterId);
              return target ? `: ${target.name}` : '';
            })()}
          </summary>
          <div className="accordion-body">
            <label className="field">
              <span className="field-label">キャラクター</span>
              <span className="field-help">選択するとステータス詳細と技マスタが下に表示されます</span>
              <select
                value={selectedCharacterId}
                onChange={(event) => setSelectedCharacterId(event.target.value)}
              >
                <option value="">キャラを選択</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedCharacterId && (() => {
              const target = characters.find((c) => c.id === selectedCharacterId);
              if (!target) return null;
              const moves = masterMoves.filter((m) => m.character_id === target.id);
              const movesByCategory = MOVE_CATEGORIES.map((cat) => ({
                category: cat,
                items: moves.filter((m) => m.category === cat)
              })).filter((group) => group.items.length > 0);
              return (
                <>
                  <div className="char-stats">
                    <h2>{target.name}</h2>
                    {target.archetype && <p className="archetype">{target.archetype}</p>}
                    <div className="stats-grid">
                      <div><span className="stat-label">体力</span><span className="stat-value">{target.health ?? '-'}</span></div>
                      <div><span className="stat-label">前歩き</span><span className="stat-value">{target.walk_fwd ?? '-'}</span></div>
                      <div><span className="stat-label">後歩き</span><span className="stat-value">{target.walk_bwd ?? '-'}</span></div>
                      <div><span className="stat-label">前ダッシュ (F)</span><span className="stat-value">{target.dash_fwd_frames ?? '-'}</span></div>
                      <div><span className="stat-label">後ダッシュ (F)</span><span className="stat-value">{target.dash_bwd_frames ?? '-'}</span></div>
                      <div><span className="stat-label">前ダッシュ距離</span><span className="stat-value">{target.dash_fwd_distance ?? '-'}</span></div>
                      <div><span className="stat-label">後ダッシュ距離</span><span className="stat-value">{target.dash_bwd_distance ?? '-'}</span></div>
                      <div><span className="stat-label">プリジャンプ (F)</span><span className="stat-value">{target.pre_jump ?? '-'}</span></div>
                    </div>
                    {target.style_notes && <p className="char-notes">{target.style_notes}</p>}
                  </div>

                  <div className="move-list">
                    <h2>技マスタ</h2>
                    {moves.length === 0 ? (
                      <p className="field-help">このキャラの技マスタはまだ登録されていません。「登録」→「6. 技マスター登録」から追加してください。</p>
                    ) : (
                      movesByCategory.map((group) => (
                        <div key={group.category} className="move-group">
                          <h3>{group.category}</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>技名</th>
                                <th>コマンド</th>
                                <th>補足</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((move) => (
                                <tr key={move.id}>
                                  <td>{move.move_name}</td>
                                  <td><code>{move.command}</code></td>
                                  <td>{move.notes ?? ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </details>
      </section>
      )}

      {mode === 'records' && (
      <>
      <section className="section">
        <h2>フレームデータ一覧</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>キャラ</th>
                <th>技名</th>
                <th>コマンド</th>
                <th>発生</th>
                <th>持続</th>
                <th>硬直</th>
                <th>ヒット</th>
                <th>ガード</th>
                <th>補足</th>
                {unlocked && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {frames.map((row) => (
                <tr key={row.id}>
                  <td>{row.character?.name}</td>
                  <td>{row.move_name}</td>
                  <td>{row.command}</td>
                  <td>{row.startup}</td>
                  <td>{row.active}</td>
                  <td>{row.recovery}</td>
                  <td>{row.on_hit}</td>
                  <td>{row.on_block}</td>
                  <td>{row.notes}</td>
                  {unlocked && (
                    <td className="row-actions">
                      <button type="button" className="link-btn" onClick={() => setEditingFrame(row)}>編集</button>
                      <button type="button" className="link-btn danger" onClick={() => handleFrameDelete(row.id)}>削除</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>コンボ一覧</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>キャラ</th>
                <th>コンボ名</th>
                <th>難易度</th>
                <th>ダメージ</th>
                <th>ゲージ増減</th>
                <th>ルート</th>
                <th>補足</th>
                {unlocked && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {combos.map((row) => (
                <tr key={row.id}>
                  <td>{row.character?.name}</td>
                  <td>{row.combo_name}</td>
                  <td>{row.difficulty}</td>
                  <td>{row.damage}</td>
                  <td>{row.drive_gauge_change}</td>
                  <td>{row.combo_route}</td>
                  <td>{row.notes}</td>
                  {unlocked && (
                    <td className="row-actions">
                      <button type="button" className="link-btn" onClick={() => setEditingCombo(row)}>編集</button>
                      <button type="button" className="link-btn danger" onClick={() => handleComboDelete(row.id)}>削除</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}

      {editingFrame && (
        <div className="modal-backdrop" onClick={() => setEditingFrame(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>フレームデータ編集</h2>
            <p className="field-help">{editingFrame.character?.name ?? ''} の技データを編集します。</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleFrameUpdate();
              }}
            >
              <label className="field">
                <span className="field-label">技名</span>
                <input
                  value={editingFrame.move_name}
                  onChange={(event) =>
                    setEditingFrame({ ...editingFrame, move_name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">コマンド</span>
                <input
                  value={editingFrame.command}
                  onChange={(event) =>
                    setEditingFrame({ ...editingFrame, command: event.target.value })
                  }
                  required
                />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span className="field-label">発生</span>
                  <input
                    type="number"
                    value={editingFrame.startup}
                    onChange={(event) =>
                      setEditingFrame({ ...editingFrame, startup: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">持続</span>
                  <input
                    type="number"
                    value={editingFrame.active}
                    onChange={(event) =>
                      setEditingFrame({ ...editingFrame, active: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">硬直</span>
                  <input
                    type="number"
                    value={editingFrame.recovery}
                    onChange={(event) =>
                      setEditingFrame({ ...editingFrame, recovery: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">ヒット</span>
                  <input
                    type="number"
                    value={editingFrame.on_hit}
                    onChange={(event) =>
                      setEditingFrame({ ...editingFrame, on_hit: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">ガード</span>
                  <input
                    type="number"
                    value={editingFrame.on_block}
                    onChange={(event) =>
                      setEditingFrame({ ...editingFrame, on_block: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">補足</span>
                <textarea
                  value={editingFrame.notes ?? ''}
                  onChange={(event) =>
                    setEditingFrame({ ...editingFrame, notes: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setEditingFrame(null)}>
                  キャンセル
                </button>
                <button type="submit">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCombo && (
        <div className="modal-backdrop" onClick={() => setEditingCombo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>コンボ編集</h2>
            <p className="field-help">{editingCombo.character?.name ?? ''} のコンボを編集します。</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleComboUpdate();
              }}
            >
              <label className="field">
                <span className="field-label">コンボ名</span>
                <input
                  value={editingCombo.combo_name}
                  onChange={(event) =>
                    setEditingCombo({ ...editingCombo, combo_name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">難易度</span>
                <select
                  value={editingCombo.difficulty}
                  onChange={(event) =>
                    setEditingCombo({
                      ...editingCombo,
                      difficulty: event.target.value as Combo['difficulty']
                    })
                  }
                >
                  <option value="Easy">Easy</option>
                  <option value="Normal">Normal</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>
              <div className="field-grid">
                <label className="field">
                  <span className="field-label">ダメージ</span>
                  <input
                    type="number"
                    value={editingCombo.damage}
                    onChange={(event) =>
                      setEditingCombo({ ...editingCombo, damage: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">ゲージ増減</span>
                  <input
                    type="number"
                    value={editingCombo.drive_gauge_change}
                    onChange={(event) =>
                      setEditingCombo({
                        ...editingCombo,
                        drive_gauge_change: Number(event.target.value)
                      })
                    }
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">コンボルート</span>
                <textarea
                  value={editingCombo.combo_route}
                  onChange={(event) =>
                    setEditingCombo({ ...editingCombo, combo_route: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">補足</span>
                <textarea
                  value={editingCombo.notes ?? ''}
                  onChange={(event) =>
                    setEditingCombo({ ...editingCombo, notes: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setEditingCombo(null)}>
                  キャンセル
                </button>
                <button type="submit">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMasterMove && (
        <div className="modal-backdrop" onClick={() => setEditingMasterMove(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>技マスタ編集</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleMasterMoveUpdate();
              }}
            >
              <label className="field">
                <span className="field-label">技名</span>
                <input
                  value={editingMasterMove.move_name}
                  onChange={(event) =>
                    setEditingMasterMove({ ...editingMasterMove, move_name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">コマンド</span>
                <input
                  value={editingMasterMove.command}
                  onChange={(event) =>
                    setEditingMasterMove({ ...editingMasterMove, command: event.target.value })
                  }
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">種類</span>
                <select
                  value={editingMasterMove.category}
                  onChange={(event) =>
                    setEditingMasterMove({
                      ...editingMasterMove,
                      category: event.target.value as MoveCategory
                    })
                  }
                >
                  {MOVE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">表示順</span>
                <input
                  type="number"
                  value={editingMasterMove.display_order}
                  onChange={(event) =>
                    setEditingMasterMove({
                      ...editingMasterMove,
                      display_order: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">補足</span>
                <textarea
                  value={editingMasterMove.notes ?? ''}
                  onChange={(event) =>
                    setEditingMasterMove({ ...editingMasterMove, notes: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setEditingMasterMove(null)}>
                  キャンセル
                </button>
                <button type="submit">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
