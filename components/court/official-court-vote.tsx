'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';
import type { CourtChoice, CourtTemplate } from '@/lib/court/types';

const choices: Array<{
  value: CourtChoice;
  label: string;
  color: string;
  emoji: string;
}> = [
  { value: 'plaintiff', label: '원고 승', color: 'bg-brand-pink', emoji: '🙋' },
  { value: 'both', label: '쌍방 과실', color: 'bg-brand-yellow', emoji: '🤝' },
  { value: 'defendant', label: '피고 승', color: 'bg-brand-blue', emoji: '🙆' },
];

export function OfficialCourtVote({ template }: { template: CourtTemplate }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState('');
  const [myChoice, setMyChoice] = useState<CourtChoice>();
  const [votes, setVotes] = useState<CourtChoice[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const uid = await ensureAnonymousSession();
      setUserId(uid);
      const { data } = await supabase
        .from('court_template_votes')
        .select('voter_user_id, choice')
        .eq('template_id', template.id);
      const items = (data ?? []) as Array<{
        voter_user_id: string;
        choice: CourtChoice;
      }>;
      setVotes(items.map((item) => item.choice));
      setMyChoice(items.find((item) => item.voter_user_id === uid)?.choice);
    } catch (cause) {
      console.error(cause);
      setError('투표 현황을 불러오지 못했어요.');
    }
  }, [supabase, template.id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function vote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const choice = String(form.get('choice')) as CourtChoice;
    const opinion = String(form.get('opinion') ?? '').trim() || null;
    const { error: voteError } = await supabase
      .from('court_template_votes')
      .insert({
        template_id: template.id,
        voter_user_id: userId,
        choice,
        opinion,
      });
    if (voteError) {
      setError(
        voteError.code === '23505'
          ? '이미 이 사건에 투표했어요.'
          : '투표하지 못했어요.',
      );
      return;
    }
    await load();
  }
  const counts = choices.map((item) => ({
    ...item,
    count: votes.filter((choice) => choice === item.value).length,
  }));

  return (
    <>
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border-3 border-black bg-brand-pink p-6 shadow-neo-lg"
        initial={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-black">
            운영자 공식 사건
          </span>
          <span className="text-4xl">{template.emoji}</span>
        </div>
        <h1 className="mt-5 text-3xl font-black leading-tight">
          {template.title}
        </h1>
        <p className="mt-3 font-semibold leading-7">{template.summary}</p>
      </motion.header>
      <section className="mt-6 grid grid-cols-2 gap-3">
        <Claim
          color="bg-brand-pink"
          text={template.plaintiff_claim}
          title="원고 주장"
        />
        <Claim
          color="bg-brand-blue"
          text={template.defendant_claim}
          title="피고 주장"
        />
      </section>
      {!myChoice ? (
        <form
          className="mt-6 rounded-3xl border-3 border-black bg-white p-5 shadow-neo"
          onSubmit={vote}
        >
          <h2 className="text-xl font-black">당신의 판결은?</h2>
          <div className="mt-4 space-y-3">
            {choices.map((item) => (
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
                <span className="text-2xl">{item.emoji}</span>
                <b className="font-black">{item.label}</b>
              </label>
            ))}
          </div>
          <textarea
            className="mt-4 min-h-24 w-full rounded-xl border-3 border-black p-3 font-bold"
            maxLength={300}
            name="opinion"
            placeholder="판결 이유를 남겨주세요 (선택)"
          />
          <button
            className="neo-button mt-4 w-full bg-brand-yellow"
            disabled={!userId}
            type="submit"
          >
            판결 확정하기
          </button>
        </form>
      ) : (
        <section className="mt-6 rounded-3xl border-3 border-black bg-brand-mint p-5 shadow-neo">
          <p className="text-center text-xl font-black">
            🎉 판결이 접수됐어요!
          </p>
          <div className="mt-5 space-y-3">
            {counts.map((item) => (
              <div key={item.value}>
                <div className="flex justify-between text-sm font-black">
                  <span>{item.label}</span>
                  <span>
                    {votes.length
                      ? Math.round((item.count / votes.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="mt-1 h-5 overflow-hidden rounded-full border-2 border-black bg-white">
                  <motion.div
                    animate={{
                      width: `${votes.length ? (item.count / votes.length) * 100 : 0}%`,
                    }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-black">
            총 {votes.length}명의 배심원이 참여했어요.
          </p>
        </section>
      )}
      {error ? (
        <p className="mt-4 rounded-xl border-2 border-black bg-brand-pink p-3 font-black">
          {error}
        </p>
      ) : null}
    </>
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
