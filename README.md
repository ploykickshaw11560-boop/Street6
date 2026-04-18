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
