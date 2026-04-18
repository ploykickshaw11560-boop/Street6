import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SF6 Data Vault',
  description: 'ストリートファイター6のフレームデータとコンボを管理するアプリ'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
