'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { readSoloProgress } from '@/lib/solo/progress';

export function SoloResumeCard() {
  const [currentQuestion, setCurrentQuestion] = useState<number>();

  useEffect(() => {
    const syncProgress = () => {
      const progress = readSoloProgress();
      setCurrentQuestion(progress ? progress.currentIndex + 1 : undefined);
    };

    syncProgress();
    window.addEventListener('storage', syncProgress);
    window.addEventListener('solo-progress-changed', syncProgress);
    return () => {
      window.removeEventListener('storage', syncProgress);
      window.removeEventListener('solo-progress-changed', syncProgress);
    };
  }, []);

  if (currentQuestion === undefined) return null;

  return (
    <motion.aside
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mt-7 rounded-3xl border-3 border-black bg-brand-mint p-5 shadow-neo-lg"
      initial={{ opacity: 0, scale: 0.96, y: -12 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-widest">진행 중인 검사</p>
          <h2 className="mt-1 text-xl font-black">{currentQuestion}번째 질문부터 이어갈까요?</h2>
        </div>
        <span aria-hidden className="text-4xl">📌</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link className="neo-button flex items-center justify-center bg-brand-yellow text-center" href="/solo">
          이어서 검사하기
        </Link>
        <Link className="neo-button flex items-center justify-center bg-white text-center" href="/solo?new=1">
          새 검사 시작
        </Link>
      </div>
    </motion.aside>
  );
}
