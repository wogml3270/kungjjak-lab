'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LiveCourtPlayer } from '@/components/court/official-court-vote';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';
import type { CourtCase, CourtRound } from '@/lib/court/types';

export function CourtRoom({ code }: { code: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [courtCase, setCourtCase] = useState<CourtCase | null>();
  const [rounds, setRounds] = useState<CourtRound[]>([]);
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try {
      const uid = await ensureAnonymousSession();
      setUserId(uid);
      const { data } = await supabase
        .from('court_cases')
        .select(
          'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
        )
        .eq('invite_code', code)
        .maybeSingle();
      if (!data) {
        setCourtCase(null);
        return;
      }
      const { data: roundData } = await supabase
        .from('court_rounds')
        .select(
          'id, round_order, round_type, title, content, emoji, evidence_label',
        )
        .eq('case_id', data.id)
        .order('round_order');
      setCourtCase(data as CourtCase);
      setRounds((roundData ?? []) as CourtRound[]);
    } catch (cause) {
      console.error(cause);
      setCourtCase(null);
    }
  }, [code, supabase]);
  useEffect(() => {
    void load();
  }, [load]);

  async function share() {
    const url = window.location.href;
    if (navigator.share)
      await navigator.share({
        title: courtCase?.title,
        text: '이 사건의 배심원이 되어주세요.',
        url,
      });
    else {
      await navigator.clipboard.writeText(url);
      setMessage('초대 링크를 복사했어요.');
    }
  }

  async function requestReview() {
    if (!courtCase) return;
    const { error } = await supabase
      .from('court_cases')
      .update({ moderation_status: 'pending_review', moderation_reason: null })
      .eq('id', courtCase.id);
    setMessage(error ? '검수를 요청하지 못했어요.' : '공개 검수를 요청했어요.');
    if (!error) await load();
  }

  if (courtCase === undefined)
    return <Shell text="사건 기록을 펼치고 있어요…" />;
  if (!courtCase)
    return <Shell text="존재하지 않거나 접근할 수 없는 사건이에요." />;
  const isOwner = courtCase.creator_user_id === userId;
  const editable = ['private', 'rejected'].includes(
    courtCase.moderation_status,
  );
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <Link className="font-black underline" href="/court">
          ← 사건 목록
        </Link>
        <button
          className="rounded-full border-2 border-black bg-brand-yellow px-3 py-2 text-xs font-black shadow-[2px_2px_0_#000]"
          onClick={() => void share()}
          type="button"
        >
          초대하기
        </button>
      </div>
      <LiveCourtPlayer
        createdAt={courtCase.created_at}
        rounds={rounds}
        subjectEmoji="⚖️"
        subjectId={courtCase.id}
        subjectKind="case"
        subjectTitle={courtCase.title}
      />
      {isOwner ? (
        <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-5 shadow-neo">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">사건 작성자 관리</h2>
            <span className="rounded-full border-2 border-black bg-white px-2 py-1 text-[10px] font-black">
              {courtCase.moderation_status}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              className="rounded-xl border-2 border-black bg-white p-3 text-center text-sm font-black"
              href="/court/manage"
            >
              전체 관리
            </Link>
            {editable ? (
              <Link
                className="rounded-xl border-2 border-black bg-brand-blue p-3 text-center text-sm font-black"
                href={`/court/${code}/edit`}
              >
                사건 수정
              </Link>
            ) : null}
            {editable ? (
              <button
                className="col-span-2 rounded-xl border-2 border-black bg-brand-mint p-3 text-sm font-black"
                onClick={() => void requestReview()}
                type="button"
              >
                공개 재판소 검수 요청
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-mint p-3 text-center text-sm font-black">
          {message}
        </p>
      ) : null}
    </main>
  );
}

function Shell({ text }: { text: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <p className="w-full rounded-3xl border-3 border-black bg-brand-yellow p-6 text-center font-black shadow-neo">
        {text}
      </p>
    </main>
  );
}
