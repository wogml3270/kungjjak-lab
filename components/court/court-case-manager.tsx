'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { CourtCase } from '@/lib/court/types';

const statusLabel: Record<string, string> = {
  private: '비공개 · 초대 가능',
  pending_review: '공개 검수 중',
  approved: '공개 중',
  rejected: '수정 필요',
  hidden: '공개 중단',
};

export function CourtCaseManager({
  initialCases,
}: {
  initialCases: CourtCase[];
}) {
  const [cases, setCases] = useState(initialCases);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function remove(item: CourtCase) {
    if (!window.confirm(`“${item.title}” 사건과 모든 투표 기록을 삭제할까요?`))
      return;
    setBusyId(item.id);
    const { error } = await createClient()
      .from('court_cases')
      .delete()
      .eq('id', item.id);
    if (error)
      setMessage('사건을 삭제하지 못했어요. 공개 상태를 확인해 주세요.');
    else {
      setCases((current) =>
        current.filter((caseItem) => caseItem.id !== item.id),
      );
      setMessage('사건을 삭제했어요.');
    }
    setBusyId('');
  }

  async function requestReview(item: CourtCase) {
    setBusyId(item.id);
    const { error } = await createClient()
      .from('court_cases')
      .update({ moderation_status: 'pending_review', moderation_reason: null })
      .eq('id', item.id);
    if (error) setMessage('검수를 요청하지 못했어요.');
    else {
      setCases((current) =>
        current.map((caseItem) =>
          caseItem.id === item.id
            ? { ...caseItem, moderation_status: 'pending_review' }
            : caseItem,
        ),
      );
      setMessage('관리자에게 공개 검수를 요청했어요.');
    }
    setBusyId('');
  }

  return (
    <section className="mt-7 space-y-4">
      {message ? (
        <p className="rounded-xl border-2 border-black bg-brand-mint p-3 text-center text-sm font-black">
          {message}
        </p>
      ) : null}
      {cases.length ? (
        cases.map((item) => {
          const editable = ['private', 'rejected'].includes(
            item.moderation_status,
          );
          return (
            <article
              className="rounded-3xl border-3 border-black bg-white p-5 shadow-neo"
              key={item.id}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-[10px] font-black">
                  {statusLabel[item.moderation_status] ??
                    item.moderation_status}
                </span>
                <time className="text-xs font-bold">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-black">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">
                {item.summary}
              </p>
              {item.moderation_reason ? (
                <p className="mt-3 rounded-xl border-2 border-black bg-brand-pink p-3 text-xs font-black">
                  검수 의견: {item.moderation_reason}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  className="rounded-xl border-2 border-black bg-brand-mint p-3 text-center text-sm font-black"
                  href={`/court/${item.invite_code}`}
                >
                  사건 보기
                </Link>
                {editable ? (
                  <Link
                    className="rounded-xl border-2 border-black bg-brand-blue p-3 text-center text-sm font-black"
                    href={`/court/${item.invite_code}/edit`}
                  >
                    수정하기
                  </Link>
                ) : (
                  <button
                    className="rounded-xl border-2 border-black bg-neutral-200 p-3 text-sm font-black"
                    disabled
                    type="button"
                  >
                    수정 잠김
                  </button>
                )}
                {editable ? (
                  <button
                    className="rounded-xl border-2 border-black bg-brand-yellow p-3 text-sm font-black"
                    disabled={busyId === item.id}
                    onClick={() => void requestReview(item)}
                    type="button"
                  >
                    공개 검수 요청
                  </button>
                ) : null}
                {editable ? (
                  <button
                    className="rounded-xl border-2 border-black bg-brand-pink p-3 text-sm font-black"
                    disabled={busyId === item.id}
                    onClick={() => void remove(item)}
                    type="button"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </article>
          );
        })
      ) : (
        <p className="rounded-3xl border-3 border-black bg-white p-8 text-center font-black shadow-neo">
          아직 만든 사건이 없어요.
        </p>
      )}
    </section>
  );
}
