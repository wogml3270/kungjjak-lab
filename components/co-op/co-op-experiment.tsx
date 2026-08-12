'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { LikertScale, type LikertValue } from '@/components/LikertScale';
import { createClient } from '@/lib/supabase/client';

type Room = { id: string; code: string; status: string; host_user_id: string; current_question: number };
type Participant = { id: string; user_id: string; role: 'host' | 'guest'; is_ready: boolean };
type Question = { id: string; position: number; title: string; positive_trait: string };
type Response = { participant_id: string; question_id: string; score_value: number };

const TEST_LENGTH = 24;

function seededRandom(seedText: string) {
  let seed = [...seedText].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
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
  return shuffle(traits.flatMap((trait) => shuffle(bank.filter((question) => question.positive_trait === trait)).slice(0, 3)));
}

export function CoOpExperiment({ participant, room: initialRoom }: { participant: Participant; room: Room }) {
  const supabase = useMemo(() => createClient(), []);
  const [room, setRoom] = useState(initialRoom);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedValue, setSelectedValue] = useState<LikertValue>();
  const [myCompleted, setMyCompleted] = useState(false);
  const [partnerCompleted, setPartnerCompleted] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [error, setError] = useState('');
  const answerChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const currentIndex = Math.max(0, room.current_question - 1);
  const question = questions[currentIndex];

  const refreshQuestionState = useCallback(async (questionId: string) => {
    const { data } = await supabase.rpc('get_co_op_question_status', {
      target_room_id: room.id,
      target_question_id: questionId,
    });
    const status = Array.isArray(data) ? data[0] : data;
    setMyCompleted(Boolean(status?.own_completed));
    setPartnerCompleted(Boolean(status?.partner_completed));
  }, [participant.id, room.id, supabase]);

  useEffect(() => {
    async function loadQuestions() {
      const { data, error: questionError } = await supabase
        .from('questions')
        .select('id, position, title, positive_trait')
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
        if (payload.participantId !== participant.id && payload.completed === true) {
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => setRoom(payload.new as Room))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    supabase.from('responses').select('participant_id, question_id, score_value').eq('room_id', room.id).then(({ data }) => setResponses((data ?? []) as Response[]));
  }, [room.id, room.status, supabase]);

  async function submitAnswer() {
    if (!question || selectedValue === undefined || myCompleted) return;
    const { data: updatedRoom, error: responseError } = await supabase.rpc('submit_co_op_response', {
      target_room_id: room.id,
      target_participant_id: participant.id,
      target_question_id: question.id,
      target_question_number: room.current_question,
      target_score_value: selectedValue,
    });
    if (responseError) {
      setError('답변을 저장하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    setMyCompleted(true);
    if (updatedRoom) setRoom((Array.isArray(updatedRoom) ? updatedRoom[0] : updatedRoom) as Room);
    await answerChannelRef.current?.send({ type: 'broadcast', event: 'answer_completed', payload: { participantId: participant.id, completed: true } });
  }

  if (room.status === 'completed') {
    const byQuestion = new Map<string, number[]>();
    responses.forEach((response) => byQuestion.set(response.question_id, [...(byQuestion.get(response.question_id) ?? []), response.score_value]));
    const difference = [...byQuestion.values()].reduce((sum, values) => sum + (values.length === 2 ? Math.abs(values[0] - values[1]) : 0), 0);
    const score = Math.round((1 - difference / 96) * 100);
    const completedPairs = [...byQuestion.values()].filter((values) => values.length === 2);
    const exactMatches = completedPairs.filter(([first, second]) => first === second).length;
    const closeMatches = completedPairs.filter(([first, second]) => Math.abs(first - second) <= 1).length;
    const strongMatches = completedPairs.filter(([first, second]) => Math.abs(first) === 2 && first === second).length;
    const biggestGap = completedPairs.reduce((largest, values, index) => {
      const gap = Math.abs(values[0] - values[1]);
      return gap > largest.gap ? { gap, index } : largest;
    }, { gap: -1, index: 0 });
    const summary = score >= 85 ? '말하지 않아도 통하는 텔레파시형' : score >= 70 ? '닮음과 다름이 균형 잡힌 단짝형' : score >= 50 ? '차이를 발견할수록 재밌는 탐험형' : '대화할수록 가까워지는 반전형';
    const gapQuestion = questions[biggestGap.index]?.title;
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
        <motion.section animate={{ opacity: 1, scale: 1 }} className="w-full min-w-0 rounded-3xl border-3 border-black bg-brand-mint p-5 text-center shadow-neo-lg sm:p-7" initial={{ opacity: 0, scale: 0.9 }}>
          <p className="text-xs font-black tracking-widest">EXPERIMENT COMPLETE</p>
          <span aria-hidden className="mt-5 block text-7xl">💞</span>
          <h1 className="mt-4 text-3xl font-black">우리의 쿵짝 스코어</h1>
          <p className="mt-3 text-7xl font-black">{responses.length === 48 ? score : '…'}<span className="text-3xl">%</span></p>
          <p className="mt-4 font-black">{responses.length === 48 ? summary : '두 사람의 답변을 분석하고 있어요.'}</p>
          {responses.length === 48 ? (
            <div className="mt-7 grid grid-cols-3 gap-2 text-center">
              <ResultStat label="완전 일치" value={`${exactMatches}개`} color="bg-brand-yellow" />
              <ResultStat label="비슷한 답" value={`${closeMatches}개`} color="bg-brand-blue" />
              <ResultStat label="강한 공감" value={`${strongMatches}개`} color="bg-brand-pink" />
            </div>
          ) : null}
          {responses.length === 48 && gapQuestion ? (
            <div className="mt-5 rounded-2xl border-3 border-black bg-white p-4 text-left">
              <p className="text-xs font-black tracking-wider">우리의 대화 포인트 💬</p>
              <p className="mt-2 text-sm font-bold leading-6">“{gapQuestion}”</p>
              <p className="mt-2 text-xs font-semibold">이 질문에서 {biggestGap.gap}단계 차이가 났어요. 서로의 이유를 물어보면 의외의 이야기가 시작될 거예요.</p>
            </div>
          ) : null}
          <Link className="neo-button mt-7 inline-flex items-center bg-brand-yellow" href="/">홈으로 돌아가기</Link>
        </motion.section>
      </main>
    );
  }

  if (!question) return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><p className="w-full rounded-3xl border-3 border-black bg-brand-yellow p-6 text-center font-black shadow-neo">질문을 준비하고 있어요…</p></main>;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-8">
      <section className="w-full">
        <div className="flex justify-between text-sm font-black"><span>둘이 함께 답하는 중</span><span>{room.current_question} / {TEST_LENGTH}</span></div>
        <div className="mt-3 h-4 overflow-hidden rounded-full border-3 border-black bg-white"><motion.div animate={{ width: `${room.current_question / TEST_LENGTH * 100}%` }} className="h-full bg-brand-blue" /></div>
        <AnimatePresence mode="wait">
          <motion.article key={question.id} animate={{ opacity: 1, x: 0 }} className="mt-7 min-w-0 overflow-hidden rounded-3xl border-3 border-black bg-white p-4 shadow-neo-lg min-[380px]:p-6" exit={{ opacity: 0, x: -30 }} initial={{ opacity: 0, x: 30 }}>
            <p className="text-xs font-black text-neutral-500">질문 {room.current_question}</p>
            <h1 className="mb-8 mt-3 min-h-24 text-2xl font-black leading-9">{question.title}</h1>
            <LikertScale disabled={myCompleted} onChange={setSelectedValue} value={selectedValue} />
            <button className="neo-button mt-7 w-full bg-brand-yellow disabled:opacity-40" disabled={selectedValue === undefined || myCompleted} onClick={submitAnswer} type="button">{myCompleted ? '내 답변 완료 ✓' : '이 답변으로 선택'}</button>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-black">
              <p className={`rounded-xl border-2 border-black p-2 ${myCompleted ? 'bg-brand-mint' : 'bg-neutral-100'}`}>나 {myCompleted ? '완료' : '선택 중'}</p>
              <p className={`rounded-xl border-2 border-black p-2 ${partnerCompleted ? 'bg-brand-mint' : 'bg-neutral-100'}`}>상대방 {partnerCompleted ? '완료' : '선택 중'}</p>
            </div>
            {error ? <p className="mt-4 text-sm font-bold text-red-700" role="alert">{error}</p> : null}
          </motion.article>
        </AnimatePresence>
      </section>
    </main>
  );
}

function ResultStat({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className={`min-w-0 rounded-xl border-2 border-black p-2 ${color}`}><p className="text-lg font-black">{value}</p><p className="mt-1 text-[10px] font-black">{label}</p></div>;
}
