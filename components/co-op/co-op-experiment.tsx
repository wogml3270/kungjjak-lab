'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { LikertScale, type LikertValue } from '@/components/LikertScale';
import { createClient } from '@/lib/supabase/client';
import { CoOpResultDisplay } from '@/components/co-op/co-op-result-display';

type Room = {
  id: string;
  code: string;
  status: string;
  host_user_id: string;
  current_question: number;
};
type Participant = {
  id: string;
  user_id: string;
  role: 'host' | 'guest';
  is_ready: boolean;
  display_name: string | null;
  avatar_url: string | null;
};
type Dimension = 'EI' | 'SN' | 'TF' | 'JP';
type Question = {
  id: string;
  position: number;
  title: string;
  positive_trait: string;
  dimension: Dimension;
};
type Response = {
  participant_id: string;
  question_id: string;
  score_value: number;
};

const TEST_LENGTH = 24;

const axisDefinitions = [
  {
    dimension: 'EI',
    left: '외향적',
    leftTrait: 'E',
    right: '내향적',
    rightTrait: 'I',
  },
  {
    dimension: 'SN',
    left: '현실적',
    leftTrait: 'S',
    right: '직관적',
    rightTrait: 'N',
  },
  {
    dimension: 'TF',
    left: '논리적',
    leftTrait: 'T',
    right: '감정적',
    rightTrait: 'F',
  },
  {
    dimension: 'JP',
    left: '계획적',
    leftTrait: 'J',
    right: '유연한',
    rightTrait: 'P',
  },
] as const;

function seededRandom(seedText: string) {
  let seed = [...seedText].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  );
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function selectQuestions(bank: Question[], code: string) {
  const random = seededRandom(code);
  const shuffle = (items: Question[]) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  };
  const traits = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
  return shuffle(
    traits.flatMap((trait) =>
      shuffle(
        bank.filter((question) => question.positive_trait === trait),
      ).slice(0, 3),
    ),
  );
}

export function CoOpExperiment({
  onLeave,
  participant,
  participants,
  room: initialRoom,
}: {
  onLeave: () => void;
  participant: Participant;
  participants: Participant[];
  room: Room;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState(initialRoom);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedValue, setSelectedValue] = useState<LikertValue>();
  const [myCompleted, setMyCompleted] = useState(false);
  const [partnerCompleted, setPartnerCompleted] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [error, setError] = useState('');
  const answerChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  const currentIndex = Math.max(0, room.current_question - 1);
  const question = questions[currentIndex];

  const refreshQuestionState = useCallback(
    async (questionId: string) => {
      const { data } = await supabase.rpc('get_co_op_question_status', {
        target_room_id: room.id,
        target_question_id: questionId,
      });
      const status = Array.isArray(data) ? data[0] : data;
      setMyCompleted(Boolean(status?.own_completed));
      setPartnerCompleted(Boolean(status?.partner_completed));
    },
    [participant.id, room.id, supabase],
  );

  useEffect(() => {
    async function loadQuestions() {
      const { data, error: questionError } = await supabase
        .from('questions')
        .select('id, position, title, positive_trait, dimension')
        .eq('is_active', true)
        .order('position');
      if (questionError || !data) {
        setError('질문을 불러오지 못했어요.');
        return;
      }
      setQuestions(selectQuestions(data as Question[], room.code));
    }
    loadQuestions();
  }, [room.code, supabase]);

  useEffect(() => {
    setSelectedValue(undefined);
    setMyCompleted(false);
    setPartnerCompleted(false);
    if (!question) return;
    refreshQuestionState(question.id).catch(console.error);
  }, [participant.id, question, refreshQuestionState, room.id, supabase]);

  useEffect(() => {
    if (!question) return;
    const channel = supabase
      .channel(`room:${room.id}:question:${question.id}`)
      .on('broadcast', { event: 'answer_completed' }, ({ payload }) => {
        if (
          payload.participantId !== participant.id &&
          payload.completed === true
        ) {
          setPartnerCompleted(true);
          refreshQuestionState(question.id).catch(console.error);
        }
      })
      .subscribe();
    answerChannelRef.current = channel;
    return () => {
      answerChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [participant.id, question, refreshQuestionState, room.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`room:${room.id}:experiment-state`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => setRoom(payload.new as Room),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, supabase]);

  useEffect(() => {
    if (!question || room.status !== 'in_progress') return;
    const fallback = window.setInterval(async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, code, status, host_user_id, current_question')
        .eq('id', room.id)
        .single();
      if (data) setRoom(data as Room);
      await refreshQuestionState(question.id);
    }, 2500);
    return () => window.clearInterval(fallback);
  }, [question, refreshQuestionState, room.id, room.status, supabase]);

  useEffect(() => {
    if (room.status !== 'completed') return;
    supabase
      .from('responses')
      .select('participant_id, question_id, score_value')
      .eq('room_id', room.id)
      .then(({ data }) => setResponses((data ?? []) as Response[]));
  }, [room.id, room.status, supabase]);

  async function submitAnswer() {
    if (!question || selectedValue === undefined || myCompleted) return;
    const { data: updatedRoom, error: responseError } = await supabase.rpc(
      'submit_co_op_response',
      {
        target_room_id: room.id,
        target_participant_id: participant.id,
        target_question_id: question.id,
        target_question_number: room.current_question,
        target_score_value: selectedValue,
      },
    );
    if (responseError) {
      setError('답변을 저장하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    setMyCompleted(true);
    if (updatedRoom)
      setRoom(
        (Array.isArray(updatedRoom) ? updatedRoom[0] : updatedRoom) as Room,
      );
    await answerChannelRef.current?.send({
      type: 'broadcast',
      event: 'answer_completed',
      payload: { participantId: participant.id, completed: true },
    });
  }

  if (room.status === 'completed') {
    const byQuestion = new Map<string, number[]>();
    responses.forEach((response) =>
      byQuestion.set(response.question_id, [
        ...(byQuestion.get(response.question_id) ?? []),
        response.score_value,
      ]),
    );
    const questionById = new Map(questions.map((item) => [item.id, item]));
    const axisResults = axisDefinitions.map((axis) => {
      const axisPairs = [...byQuestion.entries()].filter(
        ([questionId, values]) =>
          questionById.get(questionId)?.dimension === axis.dimension &&
          values.length === 2,
      );
      const difference = axisPairs.reduce(
        (sum, [, values]) => sum + Math.abs(values[0] - values[1]),
        0,
      );
      const chemistry = Math.round((1 - difference / 24) * 100);
      const tendencyScore = axisPairs.reduce((sum, [questionId, values]) => {
        const direction =
          questionById.get(questionId)?.positive_trait === axis.leftTrait
            ? 1
            : -1;
        return sum + (values[0] + values[1]) * direction;
      }, 0);
      const leftPercent = Math.round(((tendencyScore + 24) / 48) * 100);
      return {
        ...axis,
        chemistry,
        leftPercent,
        rightPercent: 100 - leftPercent,
      };
    });
    const score = Math.round(
      axisResults.reduce((sum, axis) => sum + axis.chemistry, 0) /
        axisResults.length,
    );
    const completedEntries = [...byQuestion.entries()].filter(
      ([, values]) => values.length === 2,
    );
    const completedPairs = completedEntries.map(([, values]) => values);
    const exactMatches = completedPairs.filter(
      ([first, second]) => first === second,
    ).length;
    const closeMatches = completedPairs.filter(
      ([first, second]) => Math.abs(first - second) <= 1,
    ).length;
    const strongMatches = completedPairs.filter(
      ([first, second]) => Math.abs(first) === 2 && first === second,
    ).length;
    const biggestGap = completedEntries.reduce(
      (largest, [questionId, values]) => {
        const gap = Math.abs(values[0] - values[1]);
        return gap > largest.gap ? { gap, questionId } : largest;
      },
      { gap: -1, questionId: '' },
    );
    const gapQuestion = questionById.get(biggestGap.questionId)?.title;
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
        <motion.section
          animate={{ opacity: 1 }}
          className="w-full min-w-0"
          initial={{ opacity: 0 }}
        >
          <p className="mb-4 text-xs font-black tracking-widest">
            EXPERIMENT COMPLETE
          </p>
          {responses.length === 48 ? (
            <CoOpResultDisplay
              axisResults={axisResults}
              closeMatches={closeMatches}
              exactMatches={exactMatches}
              gap={biggestGap.gap}
              gapQuestion={gapQuestion ?? null}
              profiles={participants.map((item) => ({
                name: item.display_name ?? '상대방',
                avatarUrl: item.avatar_url ?? '/default-profile.svg',
                role: item.role,
              }))}
              score={score}
              strongMatches={strongMatches}
            />
          ) : (
            <p className="rounded-3xl border-3 border-black bg-brand-yellow p-6 text-center font-black shadow-neo">
              두 사람의 답변을 분석하고 있어요.
            </p>
          )}
          <Link
            className="neo-button mt-7 flex items-center justify-center bg-brand-yellow"
            href="/mypage?tab=co-op"
          >
            2인 기록 보기
          </Link>
          <Link className="mt-4 block text-sm font-black underline" href="/">
            홈으로 돌아가기
          </Link>
        </motion.section>
      </main>
    );
  }

  if (!question)
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
        <p className="w-full rounded-3xl border-3 border-black bg-brand-yellow p-6 text-center font-black shadow-neo">
          질문을 준비하고 있어요…
        </p>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-8">
      <section className="w-full">
        <div className="flex items-center justify-between text-sm font-black">
          <span>둘이 함께 답하는 중</span>
          <div className="flex items-center gap-3">
            <span>
              {room.current_question} / {TEST_LENGTH}
            </span>
            <button
              aria-label="검사 나가기"
              className="flex size-8 items-center justify-center rounded-full border-2 border-black bg-white text-lg shadow-[2px_2px_0_#000]"
              onClick={onLeave}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        <div className="mt-3 h-4 overflow-hidden rounded-full border-3 border-black bg-white">
          <motion.div
            animate={{
              width: `${(room.current_question / TEST_LENGTH) * 100}%`,
            }}
            className="h-full bg-brand-blue"
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.article
            key={question.id}
            animate={{ opacity: 1, x: 0 }}
            className="mt-7 min-w-0 overflow-hidden rounded-3xl border-3 border-black bg-white p-4 shadow-neo-lg min-[380px]:p-6"
            exit={{ opacity: 0, x: -30 }}
            initial={{ opacity: 0, x: 30 }}
          >
            <p className="text-xs font-black text-neutral-500">
              질문 {room.current_question}
            </p>
            <h1 className="mb-8 mt-3 min-h-24 text-2xl font-black leading-9">
              {question.title}
            </h1>
            <LikertScale
              disabled={myCompleted}
              onChange={setSelectedValue}
              value={selectedValue}
            />
            <button
              className="neo-button mt-7 w-full bg-brand-yellow disabled:opacity-40"
              disabled={selectedValue === undefined || myCompleted}
              onClick={submitAnswer}
              type="button"
            >
              {myCompleted ? '내 답변 완료 ✓' : '이 답변으로 선택'}
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black">
              <p
                className={`rounded-xl border-2 border-black p-2 ${myCompleted ? 'bg-brand-mint' : 'bg-neutral-100'}`}
              >
                나 {myCompleted ? '완료' : '선택 중'}
              </p>
              <p
                className={`rounded-xl border-2 border-black p-2 ${partnerCompleted ? 'bg-brand-mint' : 'bg-neutral-100'}`}
              >
                상대방 {partnerCompleted ? '완료' : '선택 중'}
              </p>
            </div>
            {error ? (
              <p className="mt-4 text-sm font-bold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </motion.article>
        </AnimatePresence>
      </section>
    </main>
  );
}

function ResultStat({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`min-w-0 rounded-xl border-2 border-black p-2 ${color}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black">{label}</p>
    </div>
  );
}
