import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '쿵짝랩 - 커플 MBTI 성향 탐구소',
    short_name: '쿵짝랩',
    description: '혼자서도, 둘이서도 착착 맞는 커플 성향 탐구소',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8F0',
    theme_color: '#FFD966',
    lang: 'ko',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
