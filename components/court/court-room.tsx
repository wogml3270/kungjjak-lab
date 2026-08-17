'use client';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';
import type { CourtCase, CourtChoice } from '@/lib/court/types';

const choices: Array<{
  value: CourtChoice;
  label: string;
  description: string;
  color: string;
  emoji: string;
}> = [
  {
    value: 'plaintiff',
    label: '원고 승',
    description: '원고의 주장이 더 설득력 있어요.',
    color: 'bg-brand-pink',
    emoji: '🙋',
  },
  {
    value: 'both',
    label: '쌍방 과실',
    description: '두 사람 모두 돌아볼 부분이 있어요.',
    color: 'bg-brand-yellow',
    emoji: '🤝',
  },
  {
    value: 'defendant',
    label: '피고 승',
    description: '피고의 주장이 더 설득력 있어요.',
    color: 'bg-brand-blue',
    emoji: '🙆',
  },
];

export function CourtRoom({ code }: { code: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [courtCase, setCourtCase] = useState<CourtCase | null>();
  const [userId, setUserId] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [myChoice, setMyChoice] = useState<CourtChoice>();
  const [votes, setVotes] = useState<
    Array<{ choice: CourtChoice; opinion: string | null }>
  >([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try {
      const uid = await ensureAnonymousSession();
      setUserId(uid);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(Boolean(user && !user.is_anonymous));
      const { data, error: caseError } = await supabase
        .from('court_cases')
        .select(
          'id, invite_code, creator_user_id, title, summary, plaintiff_name, defendant_name, plaintiff_claim, defendant_claim, status, visibility, moderation_status, moderation_reason, closes_at, created_at',
        )
        .eq('invite_code', code)
        .maybeSingle();
      if (caseError) throw caseError;
      if (!data) {
        setCourtCase(null);
        return;
      }
      setCourtCase(data as CourtCase);
      const [{ data: ownVote }, { data: visibleVotes }] = await Promise.all([
        supabase
          .from('court_votes')
          .select('choice')
          .eq('case_id', data.id)
          .eq('voter_user_id', uid)
          .maybeSingle(),
        supabase
          .from('court_votes')
          .select('choice, opinion')
          .eq('case_id', data.id),
      ]);
      setMyChoice(ownVote?.choice as CourtChoice | undefined);
      setVotes(
        (visibleVotes ?? []) as Array<{
          choice: CourtChoice;
          opinion: string | null;
        }>,
      );
    } catch (cause) {
      console.error(cause);
      setError('재판 기록을 불러오지 못했어요.');
    }
  }, [code, supabase]);
  useEffect(() => {
    void load();
  }, [load]);
  async function vote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courtCase || !userId) return;
    const form = new FormData(event.currentTarget);
    const choice = String(form.get('choice')) as CourtChoice;
    const opinion = String(form.get('opinion') ?? '').trim() || null;
    const { error: voteError } = await supabase.from('court_votes').insert({
      case_id: courtCase.id,
      voter_user_id: userId,
      choice,
      opinion,
    });
    if (voteError) {
      setError(
        voteError.code === '23505'
          ? '이미 이 사건에 투표했어요.'
          : '투표를 저장하지 못했어요.',
      );
      return;
    }
    setMyChoice(choice);
    setMessage('배심원 의견이 접수됐어요!');
    await load();
  }
  async function updateCase(values: Partial<CourtCase>, success: string) {
    if (!courtCase) return;
    const { error: updateError } = await supabase
      .from('court_cases')
      .update(values)
      .eq('id', courtCase.id);
    if (updateError) {
      setError('상태를 변경하지 못했어요.');
      return;
    }
    setMessage(success);
    await load();
  }
  async function share() {
    const url = window.location.href;
    if (navigator.share)
      await navigator.share({
        title: courtCase?.title,
        text: '이 사랑의 사건에 배심원으로 참여해 주세요!',
        url,
      });
    else {
      await navigator.clipboard.writeText(url);
      setMessage('초대 링크를 복사했어요.');
    }
  }
  if (courtCase === undefined)
    return <Shell text="사건 기록을 펼치고 있어요…" />;
  if (!courtCase) return <Shell text="존재하지 않거나 비공개된 사건이에요." />;
  const isOwner = courtCase.creator_user_id === userId;
  const counts = choices.map((choice) => ({
    ...choice,
    count: votes.filter((voteItem) => voteItem.choice === choice.value).length,
  }));
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const showResult = courtCase.status === 'completed' || isOwner;
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <div className="flex items-center justify-between">
        <Link className="font-black underline" href="/court">
          ← 사건 목록
        </Link>
        <button
          className="rounded-full border-2 border-black bg-brand-yellow px-3 py-2 text-xs font-black shadow-[2px_2px_0_#000]"
          onClick={share}
          type="button"
        >
          초대하기
        </button>
      </div>
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border-3 border-black bg-brand-pink p-6 shadow-neo-lg"
        initial={{ opacity: 0, y: 20 }}
      >
        <p className="text-xs font-black tracking-widest">
          CASE #{courtCase.invite_code}
        </p>
        <span className="mt-3 block text-5xl">⚖️</span>
        <h1 className="mt-3 text-3xl font-black leading-tight">
          {courtCase.title}
        </h1>
        <p className="mt-3 font-semibold leading-7">{courtCase.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black">
          <span className="rounded-full border-2 border-black bg-white px-3 py-1">
            {courtCase.status === 'completed' ? '판결 완료' : '배심 진행 중'}
          </span>
          <span className="rounded-full border-2 border-black bg-brand-mint px-3 py-1">
            {courtCase.visibility === 'public' ? '공개 재판' : '초대 전용'}
          </span>
        </div>
      </motion.header>
      <section className="mt-6 grid grid-cols-2 gap-3">
        <Claim
          title={`원고 · ${courtCase.plaintiff_name}`}
          text={courtCase.plaintiff_claim}
          color="bg-brand-pink"
        />
        <Claim
          title={`피고 · ${courtCase.defendant_name}`}
          text={courtCase.defendant_claim}
          color="bg-brand-blue"
        />
      </section>
      {courtCase.status === 'voting' && !myChoice ? (
        <form
          className="mt-6 rounded-3xl border-3 border-black bg-white p-5 shadow-neo"
          onSubmit={vote}
        >
          <h2 className="text-xl font-black">배심원의 선택은?</h2>
          <div className="mt-4 space-y-3">
            {choices.map((choice) => (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-3 border-black p-4 ${choice.color}`}
                key={choice.value}
              >
                <input
                  className="size-5 accent-black"
                  name="choice"
                  required
                  type="radio"
                  value={choice.value}
                />
                <span className="text-2xl">{choice.emoji}</span>
                <span>
                  <b className="block font-black">{choice.label}</b>
                  <small className="font-bold">{choice.description}</small>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-5 block text-sm font-black">
            한 줄 의견 <span className="text-neutral-500">(선택)</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border-3 border-black p-3 font-bold"
              maxLength={300}
              name="opinion"
            />
          </label>
          <button
            className="neo-button mt-4 w-full bg-brand-yellow"
            type="submit"
          >
            판결에 한 표 던지기
          </button>
        </form>
      ) : (
        <section className="mt-6 rounded-3xl border-3 border-black bg-brand-mint p-5 text-center shadow-neo">
          <p className="text-3xl">🗳️</p>
          <h2 className="mt-2 text-xl font-black">
            {myChoice ? '내 투표가 접수됐어요' : '투표가 종료됐어요'}
          </h2>
          {!signedIn ? (
            <p className="mt-2 text-sm font-bold">
              로그인하면 내가 만든 사건과 기록을 관리할 수 있어요.
            </p>
          ) : null}
        </section>
      )}
      {showResult ? (
        <section className="mt-6 rounded-3xl border-3 border-black bg-white p-5 shadow-neo">
          <h2 className="text-xl font-black">현재 판결 현황 · {total}명</h2>
          <div className="mt-4 space-y-3">
            {counts.map((item) => (
              <div key={item.value}>
                <div className="flex justify-between text-sm font-black">
                  <span>{item.label}</span>
                  <span>
                    {total ? Math.round((item.count / total) * 100) : 0}% ·{' '}
                    {item.count}표
                  </span>
                </div>
                <div className="mt-1 h-5 overflow-hidden rounded-full border-2 border-black bg-neutral-100">
                  <motion.div
                    animate={{
                      width: `${total ? (item.count / total) * 100 : 0}%`,
                    }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {isOwner ? (
        <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-5 shadow-neo">
          <h2 className="font-black">재판장 관리</h2>
          <div className="mt-3 grid gap-3">
            {courtCase.status === 'voting' ? (
              <button
                className="neo-button bg-white"
                onClick={() =>
                  updateCase({ status: 'completed' }, '최종 판결을 확정했어요.')
                }
                type="button"
              >
                투표 종료하고 판결 확정
              </button>
            ) : null}
            {courtCase.moderation_status === 'private' ? (
              <button
                className="neo-button bg-brand-mint"
                onClick={() =>
                  updateCase(
                    { moderation_status: 'pending_review' },
                    '공개 재판소 검토를 신청했어요.',
                  )
                }
                type="button"
              >
                공개 재판소 등록 신청
              </button>
            ) : (
              <p className="rounded-xl border-2 border-black bg-white p-3 text-center text-sm font-black">
                공개 심사 상태: {courtCase.moderation_status}
              </p>
            )}
          </div>
        </section>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-mint p-3 text-center text-sm font-black">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 text-center text-sm font-black">
          {error}
        </p>
      ) : null}
    </main>
  );
}
function Claim({
  color,
  text,
  title,
}: {
  color: string;
  text: string;
  title: string;
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border-3 border-black p-4 shadow-neo ${color}`}
    >
      <h2 className="font-black">{title}</h2>
      <p className="mt-3 break-words text-sm font-semibold leading-6">{text}</p>
    </article>
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
