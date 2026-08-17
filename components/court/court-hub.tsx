'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import type { CourtCase, CourtTemplate } from '@/lib/court/types';

type CourtTab = 'official' | 'custom';

export function CourtHub({
  templates,
  publicCases,
}: {
  templates: CourtTemplate[];
  publicCases: CourtCase[];
}) {
  const [tab, setTab] = useState<CourtTab>('official');
  const tabs: Array<{ id: CourtTab; label: string; count: number }> = [
    { id: 'official', label: '바로 시작하는 사건', count: templates.length },
    { id: 'custom', label: '사용자 지정 사건', count: publicCases.length },
  ];

  return (
    <section className="mt-9">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border-3 border-black bg-white p-2 shadow-neo">
        {tabs.map((item) => (
          <button
            className={`rounded-xl border-2 border-black px-2 py-3 text-sm font-black transition-colors ${tab === item.id ? 'bg-brand-yellow' : 'bg-white'}`}
            key={item.id}
            onClick={() => setTab(item.id)}
            type="button"
          >
            {item.label} <span className="text-xs">{item.count}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="mt-5 space-y-4"
          exit={{ opacity: 0, x: -16 }}
          initial={{ opacity: 0, x: 16 }}
          key={tab}
        >
          {tab === 'official' ? (
            templates.map((item) => (
              <Link
                className="block rounded-3xl border-3 border-black bg-white p-5 shadow-neo transition-transform hover:-translate-y-1"
                href={`/court/official/${item.slug}`}
                key={item.id}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge color="bg-brand-blue">{item.category}</Badge>
                      <Badge color="bg-brand-yellow">{item.difficulty}</Badge>
                      {item.is_featured ? (
                        <Badge color="bg-brand-pink">추천</Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-black leading-7">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
                      {item.summary}
                    </p>
                    <p className="mt-3 text-xs font-black">
                      운영자 공식 사건 · 바로 투표하기 →
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : publicCases.length ? (
            publicCases.map((item) => (
              <Link
                className="block rounded-3xl border-3 border-black bg-brand-mint p-5 shadow-neo transition-transform hover:-translate-y-1"
                href={`/court/${item.invite_code}`}
                key={item.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge color="bg-white">승인 완료</Badge>
                  <span className="text-xs font-black">
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-black leading-7">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">
                  {item.summary}
                </p>
                <p className="mt-3 text-xs font-black">
                  {item.plaintiff_name} vs {item.defendant_name} · 배심 참여하기
                  →
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border-3 border-black bg-brand-blue p-6 text-center shadow-neo">
              <span className="text-4xl">🧑‍⚖️</span>
              <h2 className="mt-3 text-lg font-black">
                아직 승인된 사건이 없어요
              </h2>
              <p className="mt-2 text-sm font-bold">
                첫 번째 공개 사건의 주인공이 되어 보세요.
              </p>
              <Link
                className="neo-button mt-4 inline-flex bg-white"
                href="/court/new"
              >
                사건 접수하기
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={`rounded-full border-2 border-black px-2 py-0.5 text-[10px] font-black ${color}`}
    >
      {children}
    </span>
  );
}
