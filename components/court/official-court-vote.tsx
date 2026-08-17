'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';
import type { CourtChoice, CourtRound } from '@/lib/court/types';

const verdicts: Array<{
  value: CourtChoice;
  label: string;
  color: string;
  emoji: string;
}> = [
  {
    value: 'plaintiff',
    label: '원고의 마음에 더 공감해요',
    color: 'bg-brand-pink',
    emoji: '🙋',
  },
  {
    value: 'both',
    label: '두 사람 모두 한 걸음씩 양보해야 해요',
    color: 'bg-brand-yellow',
    emoji: '🤝',
  },
  {
    value: 'defendant',
    label: '피고의 입장이 더 이해돼요',
    color: 'bg-brand-blue',
    emoji: '🙆',
  },
];

type PublicVerdict = {
  id: string;
  choice: CourtChoice;
  opinion: string | null;
  display_name: string | null;
  created_at: string;
};

export function LiveCourtPlayer({
  subjectId,
  subjectKind,
  subjectTitle,
  subjectEmoji,
  createdAt,
  rounds,
}: {
  subjectId: string;
  subjectKind: 'template' | 'case';
  subjectTitle: string;
  subjectEmoji: string;
  createdAt: string;
  rounds: CourtRound[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const subjectColumn = subjectKind === 'template' ? 'template_id' : 'case_id';
  const subjectPayload =
    subjectKind === 'template'
      ? { template_id: subjectId, case_id: null }
      : { template_id: null, case_id: subjectId };
  const [userId, setUserId] = useState('');
  const [position, setPosition] = useState(0);
  const [myChoice, setMyChoice] = useState<CourtChoice>();
  const [votes, setVotes] = useState<PublicVerdict[]>([]);
  const [error, setError] = useState('');
  const current = rounds[position];

  const load = useCallback(async () => {
    try {
      const uid = await ensureAnonymousSession();
      setUserId(uid);
      const [{ data: session }, { data: publicVotes }, { data: ownVote }] =
        await Promise.all([
          supabase
            .from('court_sessions')
            .select('current_round_order, completed_at')
            .eq(subjectColumn, subjectId)
            .eq('user_id', uid)
            .maybeSingle(),
          supabase
            .from('court_verdicts')
            .select('id, choice, opinion, display_name, created_at')
            .eq(subjectColumn, subjectId)
            .order('created_at', { ascending: false }),
          supabase
            .from('court_verdicts')
            .select('choice')
            .eq(subjectColumn, subjectId)
            .eq('voter_user_id', uid)
            .maybeSingle(),
        ]);
      const savedIndex = session
        ? Math.max(
            0,
            rounds.findIndex(
              (item) => item.round_order === session.current_round_order,
            ),
          )
        : 0;
      setPosition(savedIndex);
      setVotes((publicVotes ?? []) as PublicVerdict[]);
      setMyChoice(ownVote?.choice as CourtChoice | undefined);
    } catch (cause) {
      console.error(cause);
      setError('재판 진행 상태를 불러오지 못했어요.');
    }
  }, [rounds, subjectColumn, subjectId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moveNext(stance?: CourtChoice) {
    if (!current || !userId) return;
    if (
      stance &&
      current.round_type !== 'briefing' &&
      current.round_type !== 'verdict'
    ) {
      const { error: reactionError } = await supabase
        .from('court_round_reactions')
        .insert({ round_id: current.id, user_id: userId, stance });
      if (reactionError && reactionError.code !== '23505') {
        setError('현재 판단을 저장하지 못했어요.');
        return;
      }
    }
    const nextPosition = Math.min(position + 1, rounds.length - 1);
    await supabase.from('court_sessions').upsert(
      {
        ...subjectPayload,
        user_id: userId,
        current_round_order: rounds[nextPosition].round_order,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'template_id,case_id,user_id' },
    );
    setPosition(nextPosition);
  }

  async function submitVerdict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const choice = String(form.get('choice')) as CourtChoice;
    const opinion = String(form.get('opinion') ?? '').trim() || null;
    const { data: authData } = await supabase.auth.getUser();
    const displayName = authData.user?.is_anonymous
      ? '익명 배심원'
      : String(
          authData.user?.user_metadata.service_nickname ??
            authData.user?.user_metadata.name ??
            '익명 배심원',
        ).slice(0, 10);
    const { error: verdictError } = await supabase
      .from('court_verdicts')
      .insert({
        ...subjectPayload,
        voter_user_id: userId,
        choice,
        opinion,
        display_name: displayName,
      });
    if (verdictError) {
      setError(
        verdictError.code === '23505'
          ? '이미 판결을 제출했어요.'
          : '판결을 저장하지 못했어요.',
      );
      return;
    }
    await supabase.from('court_sessions').upsert(
      {
        ...subjectPayload,
        user_id: userId,
        current_round_order: current.round_order,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'template_id,case_id,user_id' },
    );
    setMyChoice(choice);
    await load();
  }

  if (!current)
    return (
      <p className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 font-black">
        재판 라운드를 준비하고 있어요.
      </p>
    );
  const counts = verdicts.map((item) => ({
    ...item,
    count: votes.filter((vote) => vote.choice === item.value).length,
  }));
  const opinions = votes.filter((vote) => vote.opinion);
  const progress = Math.round(((position + 1) / rounds.length) * 100);

  return (
    <>
      <header className="mt-6">
        <div className="mb-5 flex items-center justify-between rounded-2xl border-3 border-black bg-brand-pink p-4 shadow-neo">
          <div>
            <p className="text-[10px] font-black tracking-widest">LIVE COURT</p>
            <h1 className="mt-1 text-lg font-black leading-6">
              {subjectTitle}
            </h1>
          </div>
          <span className="text-4xl">{subjectEmoji}</span>
        </div>
        <div className="flex items-end justify-between text-xs font-black">
          <span>
            재판 진행 {position + 1}/{rounds.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-black bg-white">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-brand-blue"
          />
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.section
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          className="mt-5 rounded-3xl border-3 border-black bg-white p-6 shadow-neo-lg"
          exit={{ opacity: 0, x: -24 }}
          initial={{ opacity: 0, rotateX: -8, y: 20 }}
          key={current.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-widest">
                {roundLabel(current.round_type)}
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight">
                {current.title}
              </h1>
            </div>
            <span className="text-5xl">{current.emoji}</span>
          </div>
          {current.evidence_label ? (
            <p className="mt-5 inline-flex rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">
              {current.evidence_label}
            </p>
          ) : null}
          <p className="mt-5 whitespace-pre-line text-base font-semibold leading-8">
            {current.content}
          </p>

          {current.round_type === 'briefing' ? (
            <button
              className="neo-button mt-7 w-full bg-brand-yellow"
              disabled={!userId}
              onClick={() => void moveNext()}
              type="button"
            >
              재판 시작하기
            </button>
          ) : current.round_type === 'verdict' ? (
            myChoice ? (
              <Result
                counts={counts}
                opinions={opinions}
                total={votes.length}
              />
            ) : (
              <VerdictForm onSubmit={submitVerdict} />
            )
          ) : (
            <div className="mt-7">
              <p className="text-sm font-black">
                이 내용을 본 지금, 어느 쪽에 가까운가요?
              </p>
              <div className="mt-3 grid gap-3">
                {verdicts.map((item) => (
                  <button
                    className={`rounded-2xl border-3 border-black p-4 text-left text-sm font-black shadow-[2px_2px_0_#000] ${item.color}`}
                    key={item.value}
                    onClick={() => void moveNext(item.value)}
                    type="button"
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
      <p className="mt-4 text-center text-xs font-bold text-neutral-500">
        사건 등록일 · {formatDate(createdAt)}
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 font-black">
          {error}
        </p>
      ) : null}
    </>
  );
}

function VerdictForm({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-7" onSubmit={onSubmit}>
      <div className="space-y-3">
        {verdicts.map((item) => (
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-3 border-black p-4 ${item.color}`}
            key={item.value}
          >
            <input
              className="size-5 accent-black"
              name="choice"
              required
              type="radio"
              value={item.value}
            />
            <span>{item.emoji}</span>
            <b className="text-sm font-black">{item.label}</b>
          </label>
        ))}
      </div>
      <textarea
        className="mt-4 min-h-24 w-full rounded-xl border-3 border-black p-3 font-bold"
        maxLength={300}
        name="opinion"
        placeholder="판결 이유를 공개 의견으로 남겨주세요 (선택)"
      />
      <button className="neo-button mt-4 w-full bg-brand-yellow" type="submit">
        내 판결 제출하기
      </button>
    </form>
  );
}

function Result({
  counts,
  opinions,
  total,
}: {
  counts: Array<(typeof verdicts)[number] & { count: number }>;
  opinions: PublicVerdict[];
  total: number;
}) {
  return (
    <div className="mt-7">
      <p className="text-center text-xl font-black">
        {total < 3
          ? '🗳️ 배심 판결을 모으는 중이에요'
          : '📊 현재 배심 현황이에요'}
      </p>
      <p className="mt-2 text-center text-xs font-bold text-neutral-600">
        지금까지 {total}명이 판단했어요. 참여자가 늘어나면 결과도 계속 달라져요.
      </p>
      <div className="mt-5 space-y-3">
        {counts.map((item) => (
          <div key={item.value}>
            <div className="flex justify-between gap-3 text-xs font-black">
              <span>{item.label}</span>
              <span>
                {total ? Math.round((item.count / total) * 100) : 0}% (
                {item.count}명)
              </span>
            </div>
            <div className="mt-1 h-5 overflow-hidden rounded-full border-2 border-black">
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
      <div className="mt-7 border-t-2 border-black pt-5">
        <h2 className="font-black">배심원 공개 의견 · {opinions.length}개</h2>
        <div className="mt-3 space-y-3">
          {opinions.map((item) => (
            <article
              className="rounded-2xl border-2 border-black bg-brand-bg p-4"
              key={item.id}
            >
              <div className="flex justify-between text-xs font-black">
                <span>{item.display_name || '익명 배심원'}</span>
                <time>{formatDate(item.created_at)}</time>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                {item.opinion}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function roundLabel(type: CourtRound['round_type']) {
  return {
    briefing: 'CASE BRIEFING',
    plaintiff: 'PLAINTIFF',
    defendant: 'DEFENDANT',
    evidence: 'NEW EVIDENCE',
    verdict: 'FINAL VERDICT',
  }[type];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}
