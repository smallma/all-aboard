import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wander-Fleet',
  description: '出遊車位動態分配 — 微縮汽車打包模擬器',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
