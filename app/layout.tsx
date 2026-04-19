import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SF6 Data Vault',
  description: 'ストリートファイター6のフレームデータとコンボを管理するアプリ'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="menu-bar">
          <div className="menu-inner">
            <h1>SF6 Data Vault</h1>
            <nav>
              <Link href="/register">登録</Link>
              <Link href="/records">確認</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
