'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { CourtCase } from '@/lib/court/types';

const tabs = ['pending_review', 'approved', 'rejected', 'hidden'] as const;
const labels: Record<string, string> = {
  pending_review: '검토 대기',
  approved: '승인',
  rejected: '반려',
  hidden: '숨김',
};
export function CourtModerationBoard({
  adminUserId,
  cases: initialCases,
}: {
  adminUserId: string;
  cases: CourtCase[];
}) {
  const [cases, setCases] = useState(initialCases);
  const [tab, setTab] = useState<string>('pending_review');
  const [selected, setSelected] = useState<CourtCase | null>(null);
  const visible = cases.filter((item) => item.moderation_status === tab);
  async function action(
    item: CourtCase,
    type: 'approve' | 'reject' | 'hide',
    reason?: string,
  ) {
    const next =
      type === 'approve'
        ? { moderation_status: 'approved', visibility: 'public' }
        : type === 'reject'
          ? { moderation_status: 'rejected', visibility: 'private' }
          : { moderation_status: 'hidden', visibility: 'private' };
    const supabase = createClient();
    const { error } = await supabase
      .from('court_cases')
      .update({ ...next, moderation_reason: reason ?? null })
      .eq('id', item.id);
    if (error) {
      window.alert('검수 결과를 저장하지 못했습니다.');
      return;
    }
    await supabase.from('moderation_actions').insert({
      case_id: item.id,
      admin_user_id: adminUserId,
      action: type,
      reason: reason ?? null,
    });
    setCases((items) =>
      items.map((caseItem) =>
        caseItem.id === item.id
          ? { ...caseItem, ...next, moderation_reason: reason ?? null }
          : caseItem,
      ),
    );
    setSelected(null);
  }
  return (
    <>
      <nav className="mt-6 grid grid-cols-4 gap-2">
        {tabs.map((item) => (
          <button
            className={`rounded-xl border-2 border-black px-2 py-3 text-xs font-black shadow-[2px_2px_0_#000] ${tab === item ? 'bg-brand-mint' : 'bg-white'}`}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {labels[item]}{' '}
            {
              cases.filter((courtCase) => courtCase.moderation_status === item)
                .length
            }
          </button>
        ))}
      </nav>
      <section className="mt-6 space-y-4">
        {visible.length ? (
          visible.map((item) => (
            <button
              className="w-full rounded-2xl border-3 border-black bg-white p-5 text-left shadow-neo"
              key={item.id}
              onClick={() => setSelected(item)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border-2 border-black bg-brand-blue px-2 py-1 text-[10px] font-black">
                  #{item.invite_code}
                </span>
                <time className="text-xs font-bold text-neutral-500">
                  {new Intl.DateTimeFormat('ko-KR').format(
                    new Date(item.created_at),
                  )}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-black">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm font-semibold">
                {item.summary}
              </p>
            </button>
          ))
        ) : (
          <p className="rounded-2xl border-3 border-black bg-white p-6 text-center font-black shadow-neo">
            해당 사건이 없습니다.
          </p>
        )}
      </section>
      <AnimatePresence>
        {selected ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/40"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.aside
              animate={{ x: 0 }}
              className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l-3 border-black bg-brand-bg p-5"
              exit={{ x: '100%' }}
              initial={{ x: '100%' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between">
                <p className="text-xs font-black tracking-widest">
                  CASE REVIEW
                </p>
                <button
                  className="size-10 rounded-full border-2 border-black bg-white text-xl font-black"
                  onClick={() => setSelected(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
              <h2 className="mt-5 text-2xl font-black">{selected.title}</h2>
              <p className="mt-3 rounded-2xl border-2 border-black bg-white p-4 text-sm font-semibold leading-6">
                {selected.summary}
              </p>
              <ReviewClaim
                label={`원고 · ${selected.plaintiff_name}`}
                text={selected.plaintiff_claim}
                color="bg-brand-pink"
              />
              <ReviewClaim
                label={`피고 · ${selected.defendant_name}`}
                text={selected.defendant_claim}
                color="bg-brand-blue"
              />
              {selected.moderation_status === 'pending_review' ? (
                <div className="mt-6 space-y-3">
                  <button
                    className="neo-button w-full bg-brand-mint"
                    onClick={() => action(selected, 'approve')}
                    type="button"
                  >
                    공개 승인
                  </button>
                  <button
                    className="neo-button w-full bg-brand-pink"
                    onClick={() => {
                      const reason =
                        window.prompt('반려 사유를 입력해 주세요.');
                      if (reason) void action(selected, 'reject', reason);
                    }}
                    type="button"
                  >
                    반려
                  </button>
                </div>
              ) : selected.moderation_status === 'approved' ? (
                <button
                  className="neo-button mt-6 w-full bg-brand-pink"
                  onClick={() => action(selected, 'hide', '관리자 숨김')}
                  type="button"
                >
                  공개 목록에서 숨기기
                </button>
              ) : null}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
function ReviewClaim({
  color,
  label,
  text,
}: {
  color: string;
  label: string;
  text: string;
}) {
  return (
    <section className={`mt-4 rounded-2xl border-3 border-black p-4 ${color}`}>
      <h3 className="font-black">{label}</h3>
      <p className="mt-2 text-sm font-semibold leading-6">{text}</p>
    </section>
  );
}
