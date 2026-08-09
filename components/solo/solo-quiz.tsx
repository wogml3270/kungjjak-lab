'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LikertScale, type LikertValue } from '@/components/LikertScale';
import { ensureAnonymousSession } from '@/lib/supabase/anonymous';
import { createClient } from '@/lib/supabase/client';

type Trait = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

type Question = {
  id: string;
  position: number;
  dimension: Dimension;
  title: string;
  positive_trait: Trait;
};

type Answer = {
  positiveTrait: Trait;
  value: LikertValue;
};

const QUESTIONS_PER_TRAIT = 3;
const TEST_LENGTH = 24;
const SESSION_QUESTION_IDS_KEY = 'solo_question_ids_v3';

const traitPairs = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

const traitGuide: Record<Trait, string> = {
  E: '함께 경험하고 대화할 때 에너지가 커져요.',
  I: '둘만의 조용한 시간에서 마음이 깊어져요.',
  S: '구체적인 표현과 작은 실천에 사랑을 느껴요.',
  N: '가능성과 의미를 나누는 대화를 좋아해요.',
  T: '명확한 기준과 솔직한 해결책이 편안해요.',
  F: '감정을 알아주고 공감받을 때 안심해요.',
  J: '미리 정한 약속과 계획이 관계를 안정시켜요.',
  P: '여유로운 선택과 즉흥적인 순간을 즐겨요.',
};

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomValues = new Uint32Array(1);
    window.crypto.getRandomValues(randomValues);
    const target = randomValues[0] % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }

  return result;
}

function selectBalancedQuestions(questionBank: Question[]) {
  const storedIds = window.sessionStorage.getItem(SESSION_QUESTION_IDS_KEY);

  if (storedIds) {
    const ids = JSON.parse(storedIds) as string[];
    const byId = new Map(questionBank.map((question) => [question.id, question]));
    const restored = ids.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question));

    if (restored.length === TEST_LENGTH) return restored;
  }

  const selected = traitPairs.flatMap(([left, right]) => [left, right]).flatMap((trait) => {
    const candidates = questionBank.filter((question) => question.positive_trait === trait);
    if (candidates.length < QUESTIONS_PER_TRAIT) throw new Error(`${trait} 성향 문항이 부족합니다.`);
    return shuffle(candidates).slice(0, QUESTIONS_PER_TRAIT);
  });
  const shuffled = shuffle(selected);
  window.sessionStorage.setItem(SESSION_QUESTION_IDS_KEY, JSON.stringify(shuffled.map(({ id }) => id)));
  return shuffled;
}

function calculateResult(answers: Record<string, Answer>) {
  const axisScores = Object.values(answers).reduce<Record<Dimension, number>>(
    (scores, answer) => {
      const dimension = traitPairs.find(([left, right]) => left === answer.positiveTrait || right === answer.positiveTrait);
      if (!dimension) return scores;

      const key = `${dimension[0]}${dimension[1]}` as Dimension;
      const direction = answer.positiveTrait === dimension[0] ? 1 : -1;
      scores[key] += answer.value * direction;
      return scores;
    },
    { EI: 0, SN: 0, TF: 0, JP: 0 },
  );

  const traits = traitPairs.map(([left, right]) => {
    const score = axisScores[`${left}${right}` as Dimension];
    return score >= 0 ? left : right;
  });

  return {
    mbti: traits.join(''),
    traits,
    spectra: traitPairs.map(([left, right]) => {
      const score = axisScores[`${left}${right}` as Dimension];
      const leftPercent = Math.round(((score + 12) / 24) * 100);
      return { left, right, leftPercent };
    }),
  };
}

export function SoloQuiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<LikertValue>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'completed'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const loadQuestions = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      await ensureAnonymousSession();
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('id, position, dimension, title, positive_trait')
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      if (!data || data.length < 50) throw new Error('질문 풀이 50개 이상 필요합니다.');

      setQuestions(selectBalancedQuestions(data as Question[]));
      setStatus('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '검사를 준비하지 못했습니다.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const result = useMemo(() => calculateResult(answers), [answers]);
  const question = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  function submitAnswer() {
    if (!question || selectedValue === undefined) return;

    setAnswers((current) => ({
      ...current,
      [question.id]: { positiveTrait: question.positive_trait, value: selectedValue },
    }));

    if (currentIndex === questions.length - 1) {
      setStatus('completed');
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedValue(undefined);
  }

  function restart() {
    window.sessionStorage.removeItem(SESSION_QUESTION_IDS_KEY);
    setAnswers({});
    setCurrentIndex(0);
    setSelectedValue(undefined);
    void loadQuestions();
  }

  if (status === 'loading') {
    return <StatusCard emoji="🧪" title="검사 도구를 준비하고 있어요" description="질문을 고르고 있어요. 잠시만 기다려 주세요." />;
  }

  if (status === 'error') {
    return (
      <StatusCard emoji="🥲" title="문항을 불러오지 못했어요" description={errorMessage}>
        <button className="neo-button mt-6 w-full bg-brand-yellow" onClick={() => void loadQuestions()} type="button">
          다시 시도하기
        </button>
      </StatusCard>
    );
  }

  if (status === 'completed') {
    return (
      <section className="w-full rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg">
        <p className="text-xs font-black tracking-[0.18em]">EXPERIMENT COMPLETE</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">나의 연애 MBTI</p>
            <h1 className="mt-1 text-5xl font-black tracking-tight">{result.mbti}</h1>
          </div>
          <span aria-hidden className="text-6xl">🧠</span>
        </div>

        <div className="mt-7 space-y-4">
          {result.spectra.map(({ left, right, leftPercent }) => (
            <div key={`${left}${right}`}>
              <div className="mb-1 flex justify-between text-xs font-black">
                <span>{left} {leftPercent}%</span>
                <span>{100 - leftPercent}% {right}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full border-2 border-black bg-brand-blue">
                <div className="h-full border-r-2 border-black bg-brand-pink" style={{ width: `${leftPercent}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border-3 border-black bg-white p-4">
          <h2 className="font-black">연애 사용 설명서</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold leading-6">
            {result.traits.map((trait) => <li key={trait}>• {traitGuide[trait]}</li>)}
          </ul>
        </div>

        <button className="neo-button mt-6 w-full bg-brand-yellow" onClick={restart} type="button">새 질문으로 다시 검사하기</button>
        <Link className="mt-4 block text-center text-sm font-black underline underline-offset-4" href="/">홈으로 돌아가기</Link>
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-1 text-sm font-black">
        <Link className="underline underline-offset-4" href="/">← 나가기</Link>
        <span>{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="mt-3 h-4 overflow-hidden rounded-full border-3 border-black bg-white">
        <div className="h-full bg-brand-yellow transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <article className="mt-7 rounded-3xl border-3 border-black bg-white p-6 shadow-neo-lg">
        <h1 className="flex min-h-44 items-center justify-center text-center text-2xl font-black leading-9">{question.title}</h1>
        <div className="mt-7 border-t-3 border-black pt-7">
          <LikertScale onChange={setSelectedValue} value={selectedValue} />
        </div>
        <button
          className="neo-button mt-8 w-full bg-brand-yellow disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none"
          disabled={selectedValue === undefined}
          onClick={submitAnswer}
          type="button"
        >
          {currentIndex === questions.length - 1 ? '결과 확인하기' : '다음 질문'}
        </button>
      </article>
    </section>
  );
}

function StatusCard({ children, description, emoji, title }: {
  children?: React.ReactNode;
  description: string;
  emoji: string;
  title: string;
}) {
  return (
    <section className="w-full rounded-3xl border-3 border-black bg-brand-pink p-6 text-center shadow-neo-lg">
      <span aria-hidden className="text-6xl">{emoji}</span>
      <h1 className="mt-5 text-2xl font-black">{title}</h1>
      <p className="mt-3 text-sm font-semibold leading-6">{description}</p>
      {children}
    </section>
  );
}
