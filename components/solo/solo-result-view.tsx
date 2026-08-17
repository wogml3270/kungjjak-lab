'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { readLocalSoloResult, type SoloResult } from '@/lib/solo/result';
import { createClient } from '@/lib/supabase/client';

const axes = [
  { key: 'EI', left: 'E', right: 'I' },
  { key: 'SN', left: 'S', right: 'N' },
  { key: 'TF', left: 'T', right: 'F' },
  { key: 'JP', left: 'J', right: 'P' },
] as const;

function clarityProfile(clarity: number) {
  if (clarity >= 60)
    return {
      label: '선명한 성향형',
      description:
        '여러 상황에서도 선호하는 방향이 비교적 뚜렷하게 나타났어요.',
    };
  if (clarity >= 30)
    return {
      label: '상황 적응형',
      description:
        '기본 성향은 있지만 사람과 상황에 맞춰 유연하게 반응하는 편이에요.',
    };
  return {
    label: '균형 탐색형',
    description:
      '한쪽 성향에 갇히기보다 서로 다른 방식을 고르게 활용하는 편이에요.',
  };
}

export function SoloResultView({ id }: { id: string }) {
  const [result, setResult] = useState<SoloResult | null>();

  useEffect(() => {
    const local = readLocalSoloResult(id);
    if (local) {
      setResult(local);
      return;
    }
    createClient()
      .from('solo_results')
      .select('id, mbti, confidence, axis_scores, answers, completed_at')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setResult(
          data
            ? {
                id: data.id,
                mbti: data.mbti,
                clarity: data.confidence,
                axisScores: data.axis_scores,
                answers: data.answers,
                completedAt: data.completed_at,
              }
            : null,
        );
      });
  }, [id]);

  if (result === undefined)
    return <ResultShell>결과를 불러오고 있어요…</ResultShell>;
  if (result === null) return <ResultShell>결과를 찾을 수 없어요.</ResultShell>;
  const profile = clarityProfile(result.clarity);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
      <motion.section
        animate={{ opacity: 1, scale: 1 }}
        className="w-full rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg"
        initial={{ opacity: 0, scale: 0.94 }}
      >
        <p className="text-xs font-black tracking-widest">SOLO RESULT</p>
        <h1 className="mt-3 text-5xl font-black">{result.mbti}</h1>
        <div className="mt-4 rounded-2xl border-3 border-black bg-white p-4">
          <p className="text-xs font-black tracking-wider">
            나의 성향 표현 스타일
          </p>
          <p className="mt-1 text-xl font-black">{profile.label}</p>
          <p className="mt-2 text-xs font-semibold leading-5">
            {profile.description}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {axes.map(({ key, left, right }) => {
            const score = result.axisScores[key];
            const leftPercent = Math.round(((score + 12) / 24) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-xs font-black">
                  <span>
                    {left} {leftPercent}%
                  </span>
                  <span>
                    {100 - leftPercent}% {right}
                  </span>
                </div>
                <div className="mt-1 flex h-4 overflow-hidden rounded-full border-2 border-black">
                  <div
                    className="bg-brand-pink"
                    style={{ width: `${leftPercent}%` }}
                  />
                  <div
                    className="bg-brand-blue"
                    style={{ width: `${100 - leftPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Link
          className="neo-button mt-7 flex items-center justify-center bg-brand-yellow"
          href="/mypage?tab=solo"
        >
          Solo 기록 보기
        </Link>
        <Link
          className="mt-4 block text-center text-sm font-black underline"
          href="/"
        >
          홈으로
        </Link>
      </motion.section>
    </main>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <p className="w-full rounded-3xl border-3 border-black bg-brand-yellow p-6 text-center font-black shadow-neo">
        {children}
      </p>
    </main>
  );
}
