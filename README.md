# SF6 Data Vault (Supabase + Next.js)

ストリートファイター6の**フレームデータ**と**コンボデータ**を、Supabaseへ登録・一覧表示できるWebアプリです。  
Vercelへそのままデプロイして公開できます。

## 機能
- キャラクターの登録
- フレームデータの登録・一覧
- コンボデータの登録・一覧
- Supabaseに永続化

## セットアップ

### 1) 依存関係をインストール
```bash
npm install
```

### 2) 環境変数を作成
`.env.example` をコピーして `.env.local` を作成し、Supabase情報を設定してください。

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Supabaseテーブル作成
SupabaseのSQLエディタで `supabase/schema.sql` を実行します。

### 4) 開発サーバー起動
```bash
npm run dev
```

## Vercel公開手順
1. GitHubにpush
2. Vercelで「New Project」からこのリポジトリを選択
3. Environment Variablesに以下を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## 注意
- 現在のRLSポリシーは「公開読み取り・公開挿入」です。運用時はAuth連携で制限をかけることを推奨します。


## CSVインポート

### フレームデータCSV
```csv
character,move_name,command,startup,active,recovery,on_hit,on_block,notes
リュウ,立ち中P,5MP,6,3,12,5,2,差し返しに使う
```

### コンボCSV
```csv
character,combo_name,difficulty,damage,drive_gauge_change,combo_route,notes
リュウ,中足波動,Easy,1420,-1,2MK > 波動拳,安定コンボ
```

- `character` はキャラクター名で指定します。存在しない名前は自動でキャラクター登録されます。
- `difficulty` は `Easy` / `Normal` / `Hard` のいずれかを指定してください。


## 画面構成
- `/register`: 登録画面（手入力・CSV取り込み）
- `/records`: 確認画面（フレーム/コンボ一覧）
