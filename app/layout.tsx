import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '쿵짝랩 | 커플 성향 탐구소',
  description: '혼자서도, 둘이서도 착착 맞는 커플 성향 탐구소',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
