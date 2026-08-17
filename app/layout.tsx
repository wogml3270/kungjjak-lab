import type { Metadata } from 'next';
import { AnonymousSession } from '@/components/auth/anonymous-session';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '쿵짝랩 | 커플 MBTI 성향 탐구소',
    template: '%s | 쿵짝랩',
  },
  description:
    '24개 질문으로 나의 연애 MBTI를 알아보고, 연인과 실시간으로 쿵짝 스코어를 확인하는 커플 성향 탐구소입니다.',
  keywords: [
    '쿵짝랩',
    '커플 MBTI',
    '연애 MBTI',
    'MBTI 검사',
    '커플 테스트',
    '궁합 테스트',
    '성향 테스트',
  ],
  authors: [{ name: '박재희', url: 'https://j-fe-blog.vercel.app/' }],
  creator: '박재희',
  publisher: '쿵짝랩',
  applicationName: '쿵짝랩',
  category: 'lifestyle',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '쿵짝랩',
    title: '쿵짝랩 | 우리 둘의 쿵짝, 몇 점일까?',
    description: '혼자 성향을 발견하고 연인과 함께 쿵짝 스코어를 측정해 보세요.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: '쿵짝랩 커플 성향 탐구소' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '쿵짝랩 | 커플 MBTI 성향 탐구소',
    description: '우리 둘의 쿵짝, 몇 점일까?',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '쿵짝랩',
              url: siteUrl,
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Any',
              description: 'Solo 연애 MBTI와 커플 실시간 성향 테스트를 제공하는 모바일 웹 서비스',
              author: { '@type': 'Person', name: '박재희', url: 'https://j-fe-blog.vercel.app/' },
            }).replace(/</g, '\\u003c'),
          }}
          type="application/ld+json"
        />
        <AnonymousSession />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
