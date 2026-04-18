'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character, Combo, FrameData } from '@/lib/types';

type FrameForm = {
  character_id: string;
  move_name: string;
  command: string;
  startup: number;
  active: number;
  recovery: number;
  on_hit: number;
  on_block: number;
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

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [status, setStatus] = useState('読み込み中...');

  const [characterName, setCharacterName] = useState('');
  const [characterNotes, setCharacterNotes] = useState('');

  const [frameForm, setFrameForm] = useState<FrameForm>({
    character_id: '',
    move_name: '',
    command: '',
    startup: 0,
    active: 0,
    recovery: 0,
    on_hit: 0,
    on_block: 0,
    notes: ''
  });

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

  const loadData = async () => {
    setStatus('データを同期しています...');
    const [charactersResult, framesResult, combosResult] = await Promise.all([
      supabase.from('characters').select('*').order('name', { ascending: true }),
      supabase
        .from('frame_data')
        .select('*, character:characters(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('combos')
        .select('*, character:characters(name)')
        .order('created_at', { ascending: false })
    ]);

    if (charactersResult.error || framesResult.error || combosResult.error) {
      setStatus('読み込みに失敗しました。Supabaseのテーブル作成とRLS設定を確認してください。');
      return;
    }

    const characterRows = charactersResult.data ?? [];
    const frameRows = (framesResult.data ?? []) as FrameData[];
    const comboRows = (combosResult.data ?? []) as Combo[];

    setCharacters(characterRows);
    setFrames(frameRows);
    setCombos(comboRows);

    const firstCharacterId = characterRows[0]?.id ?? '';
    setFrameForm((prev) => ({ ...prev, character_id: prev.character_id || firstCharacterId }));
    setComboForm((prev) => ({ ...prev, character_id: prev.character_id || firstCharacterId }));

    setStatus('同期完了');
  };

  useEffect(() => {
    loadData();
  }, []);

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
    const { error } = await supabase.from('frame_data').insert({
      ...frameForm,
      notes: frameForm.notes.trim() || null
    });

    if (error) {
      setStatus(`フレームデータ登録エラー: ${error.message}`);
      return;
    }

    setFrameForm((prev) => ({
      ...prev,
      move_name: '',
      command: '',
      startup: 0,
      active: 0,
      recovery: 0,
      on_hit: 0,
      on_block: 0,
      notes: ''
    }));
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
        <h1>SF6 Data Vault</h1>
        <p>Supabaseへフレームデータ・コンボデータを登録/管理して、Vercelでそのまま公開できます。</p>
        <p>
          キャラ数: <strong>{characters.length}</strong> / フレームデータ: <strong>{frames.length}</strong> / コンボ:{' '}
          <strong>{combos.length}</strong> / 合計ダメージ: <strong>{totalDamage}</strong>
        </p>
        <div className="status">{status}</div>
      </section>

      <section className="cards">
        <article className="card">
          <h2>1. キャラクター登録</h2>
          <form onSubmit={handleCharacterSubmit}>
            <input
              placeholder="例: リュウ"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
            />
            <textarea
              placeholder="キャラの補足メモ"
              value={characterNotes}
              onChange={(event) => setCharacterNotes(event.target.value)}
            />
            <button type="submit">キャラクターを追加</button>
          </form>
        </article>

        <article className="card">
          <h2>2. フレームデータ登録</h2>
          <form onSubmit={handleFrameSubmit}>
            <select
              value={frameForm.character_id}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, character_id: event.target.value }))}
              required
            >
              <option value="">キャラを選択</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
            <input
              placeholder="技名"
              value={frameForm.move_name}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, move_name: event.target.value }))}
              required
            />
            <input
              placeholder="コマンド (例: 2MK)"
              value={frameForm.command}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, command: event.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="発生"
              value={frameForm.startup}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, startup: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              placeholder="持続"
              value={frameForm.active}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, active: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              placeholder="硬直"
              value={frameForm.recovery}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, recovery: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              placeholder="ヒット時"
              value={frameForm.on_hit}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, on_hit: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              placeholder="ガード時"
              value={frameForm.on_block}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, on_block: Number(event.target.value) }))}
              required
            />
            <textarea
              placeholder="補足"
              value={frameForm.notes}
              onChange={(event) => setFrameForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
            <button type="submit">フレームデータを追加</button>
          </form>
        </article>

        <article className="card">
          <h2>3. コンボ登録</h2>
          <form onSubmit={handleComboSubmit}>
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
            <input
              placeholder="コンボ名"
              value={comboForm.combo_name}
              onChange={(event) => setComboForm((prev) => ({ ...prev, combo_name: event.target.value }))}
              required
            />
            <select
              value={comboForm.difficulty}
              onChange={(event) =>
                setComboForm((prev) => ({ ...prev, difficulty: event.target.value as ComboForm['difficulty'] }))
              }
            >
              <option value="Easy">Easy</option>
              <option value="Normal">Normal</option>
              <option value="Hard">Hard</option>
            </select>
            <input
              type="number"
              placeholder="ダメージ"
              value={comboForm.damage}
              onChange={(event) => setComboForm((prev) => ({ ...prev, damage: Number(event.target.value) }))}
              required
            />
            <input
              type="number"
              placeholder="ドライブゲージ増減"
              value={comboForm.drive_gauge_change}
              onChange={(event) =>
                setComboForm((prev) => ({ ...prev, drive_gauge_change: Number(event.target.value) }))
              }
              required
            />
            <textarea
              placeholder="コンボルート (例: 2MK > OD波掌撃 > 真空波動拳)"
              value={comboForm.combo_route}
              onChange={(event) => setComboForm((prev) => ({ ...prev, combo_route: event.target.value }))}
              required
            />
            <textarea
              placeholder="補足"
              value={comboForm.notes}
              onChange={(event) => setComboForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
            <button type="submit">コンボを追加</button>
          </form>
        </article>
      </section>

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
