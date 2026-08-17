'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { clearSoloProgress, readSoloProgress } from '@/lib/solo/progress';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';

export function SoloResumeCard() {
  const [currentQuestion, setCurrentQuestion] = useState<number>();
  const [questionTitle, setQuestionTitle] = useState('');

  useEffect(() => {
    const syncProgress = async () => {
      const progress = readSoloProgress();
      if (!progress || progress.currentIndex < 1) {
        setCurrentQuestion(undefined);
        setQuestionTitle('');
        return;
      }
      setCurrentQuestion(progress.currentIndex + 1);
      try {
        await ensureAnonymousSession();
        const questionId = progress.questionIds[progress.currentIndex];
        const { data } = await createClient()
          .from('questions')
          .select('title')
          .eq('id', questionId)
          .single();
        setQuestionTitle(data?.title ?? '저장된 질문부터 계속해요.');
      } catch {
        setQuestionTitle('저장된 질문부터 계속해요.');
      }
    };

    void syncProgress();
    const handleProgressChange = () => {
      void syncProgress();
    };
    window.addEventListener('storage', handleProgressChange);
    window.addEventListener('solo-progress-changed', handleProgressChange);
    return () => {
      window.removeEventListener('storage', handleProgressChange);
      window.removeEventListener('solo-progress-changed', handleProgressChange);
    };
  }, []);

  if (currentQuestion === undefined) return null;

  return (
    <motion.aside
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative mt-7 rounded-3xl border-3 border-black bg-brand-mint p-5 shadow-neo-lg"
      initial={{ opacity: 0, scale: 0.96, y: -12 }}
    >
      <button
        aria-label="진행 중인 검사 삭제"
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border-2 border-black bg-white text-lg font-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={() => {
          clearSoloProgress();
          setCurrentQuestion(undefined);
        }}
        type="button"
      >
        ×
      </button>
      <div className="flex items-center justify-between gap-3 pr-8">
        <div>
          <p className="text-xs font-black tracking-widest">진행 중인 검사</p>
          <p className="mt-2 text-xs font-black text-neutral-600">{currentQuestion}번째 질문</p>
          <h2 className="mt-1 line-clamp-2 text-lg font-black leading-7">
            “{questionTitle || '질문을 불러오는 중…'}”
          </h2>
        </div>
        <span aria-hidden className="text-4xl">
          📌
        </span>
      </div>
      <div className="mt-5">
        <Link
          className="neo-button flex items-center justify-center bg-brand-yellow text-center"
          href="/solo"
        >
          이어서 검사하기
        </Link>
      </div>
    </motion.aside>
  );
}
