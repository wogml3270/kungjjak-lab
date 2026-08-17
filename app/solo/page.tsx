import { SoloQuiz } from '@/components/solo/solo-quiz';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solo 연애 MBTI 검사',
  description:
    '24개 5점 척도 질문으로 나의 연애 성향과 MBTI 축별 강도를 알아보세요.',
  alternates: { canonical: '/solo' },
};

export default function SoloPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <SoloQuiz />
    </main>
  );
}
