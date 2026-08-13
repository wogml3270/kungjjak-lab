'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

type Tab = 'profile' | 'solo' | 'co-op';
type SoloHistory = { id: string; mbti: string; completed_at: string };
type AxisResult = { dimension: string; left: string; leftTrait: string; right: string; rightTrait: string; chemistry: number; leftPercent: number; rightPercent: number };
type CoOpHistory = {
  id: string;
  score: number;
  createdAt: string;
  names: string[];
  exactMatches: number;
  closeMatches: number;
  strongMatches: number;
  axisResults: AxisResult[];
  gap: number;
  gapQuestion: string | null;
};

const tabs: Array<{ label: string; value: Tab; color: string }> = [
  { label: '내 정보', value: 'profile', color: 'bg-brand-pink' },
  { label: 'Solo 기록', value: 'solo', color: 'bg-brand-blue' },
  { label: '2인 기록', value: 'co-op', color: 'bg-brand-mint' },
];

export function MyPageDashboard({ coOpHistories, email, initialTab, name, provider, soloHistories }: {
  coOpHistories: CoOpHistory[];
  email: string;
  initialTab: Tab;
  name: string;
  provider: string;
  soloHistories: SoloHistory[];
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedResult, setSelectedResult] = useState<CoOpHistory | null>(null);

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    window.history.replaceState(null, '', `/mypage?tab=${nextTab}`);
  }

  return <>
    <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-3 gap-2 text-sm">
      {tabs.map((item) => <button aria-current={tab === item.value ? 'page' : undefined} className={`neo-button flex items-center justify-center text-center ${tab === item.value ? item.color : 'bg-white'}`} disabled={tab === item.value} key={item.value} onClick={() => changeTab(item.value)} type="button">{item.label}</button>)}
    </nav>

    {tab === 'profile' ? <section className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo"><h2 className="text-xl font-black">내 정보</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="font-black text-neutral-500">이름</dt><dd className="mt-1 font-bold">{name}</dd></div><div><dt className="font-black text-neutral-500">이메일</dt><dd className="mt-1 break-all font-bold">{email}</dd></div><div><dt className="font-black text-neutral-500">로그인 방식</dt><dd className="mt-1 font-bold">{provider}</dd></div></dl></section> : null}

    {tab === 'solo' ? <section className="mt-6 space-y-4">{soloHistories.length === 0 ? <Empty text="아직 저장된 Solo 기록이 없어요." /> : soloHistories.map((item) => <Link className="flex items-center justify-between rounded-2xl border-3 border-black bg-white p-5 shadow-neo transition-transform hover:-translate-y-0.5" href={`/solo/result/${item.id}`} key={item.id}><div><p className="text-2xl font-black">{item.mbti}</p><DateText value={item.completed_at} /></div><span aria-hidden className="text-2xl">→</span></Link>)}</section> : null}

    {tab === 'co-op' ? <section className="mt-6 space-y-4">{coOpHistories.length === 0 ? <Empty text="완료된 2인 멀티버스 기록이 없어요." /> : coOpHistories.map((item) => <button className="flex w-full items-center justify-between rounded-2xl border-3 border-black bg-white p-5 text-left shadow-neo transition-transform hover:-translate-y-0.5" key={item.id} onClick={() => setSelectedResult(item)} type="button"><div><p className="font-black">{item.names.join(' × ')}</p><DateText value={item.createdAt} /></div><span className="rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">{Math.round(item.score)}%</span></button>)}</section> : null}

    <ResultDrawer onClose={() => setSelectedResult(null)} result={selectedResult} />
  </>;
}

function ResultDrawer({ onClose, result }: { onClose: () => void; result: CoOpHistory | null }) {
  useEffect(() => {
    if (!result) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [onClose, result]);

  return <AnimatePresence>
    {result ? <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/40" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        animate={{ x: 0 }}
        aria-label="2인 멀티버스 결과 상세"
        aria-modal="true"
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l-3 border-black bg-[#FFF8F0] px-5 py-6 shadow-[-8px_0_0_#000]"
        exit={{ x: '105%' }}
        initial={{ x: '105%' }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      >
        <div className="flex items-center justify-between"><p className="text-xs font-black tracking-widest">CO-OP RESULT</p><button aria-label="결과 닫기" className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-[2px_2px_0_#000]" onClick={onClose} type="button">×</button></div>
        <section className="mt-5 rounded-3xl border-3 border-black bg-brand-mint p-5 text-center shadow-neo-lg">
          <span aria-hidden className="block text-6xl">💞</span>
          <h2 className="mt-3 text-3xl font-black">우리의 쿵짝 스코어</h2>
          <p className="mt-2 text-sm font-black">{result.names.join(' × ')}</p>
          <p className="mt-3 text-7xl font-black">{Math.round(result.score)}<span className="text-3xl">%</span></p>
          <p className="mt-3 font-black">{scoreSummary(result.score)}</p>
          <div className="mt-6 grid grid-cols-3 gap-2"><ResultStat color="bg-brand-yellow" label="완전 일치" value={`${result.exactMatches}개`} /><ResultStat color="bg-brand-blue" label="비슷한 답" value={`${result.closeMatches}개`} /><ResultStat color="bg-brand-pink" label="강한 공감" value={`${result.strongMatches}개`} /></div>
        </section>

        <section className="mt-5 rounded-3xl border-3 border-black bg-white p-5 shadow-neo">
          <h3 className="text-lg font-black">우리의 심리 밸런스</h3>
          <p className="mt-1 text-xs font-semibold text-neutral-600">두 사람의 답변 강도를 네 가지 성향 축으로 분석했어요.</p>
          <div className="mt-5 space-y-5">{result.axisResults.map((axis) => <div key={axis.dimension}><div className="flex justify-between gap-2 text-xs font-black"><span>{axis.left}({axis.leftTrait}) {axis.leftPercent}%</span><span>{axis.rightPercent}% {axis.right}({axis.rightTrait})</span></div><div className="mt-2 flex h-4 overflow-hidden rounded-full border-2 border-black"><div className="bg-brand-pink" style={{ width: `${axis.leftPercent}%` }} /><div className="bg-brand-blue" style={{ width: `${axis.rightPercent}%` }} /></div><p className="mt-1 text-right text-[10px] font-black text-neutral-600">이 축의 쿵짝 {axis.chemistry}%</p></div>)}</div>
        </section>

        {result.gapQuestion ? <section className="mt-5 rounded-3xl border-3 border-black bg-brand-yellow p-5 shadow-neo"><p className="text-xs font-black tracking-wider">우리의 대화 포인트 💬</p><p className="mt-2 font-bold leading-6">“{result.gapQuestion}”</p><p className="mt-2 text-xs font-semibold">이 질문에서 {result.gap}단계 차이가 났어요. 서로의 이유를 물어보세요.</p></section> : null}
        <button className="neo-button mt-6 w-full bg-brand-yellow" onClick={onClose} type="button">2인 기록 목록으로</button>
      </motion.aside>
    </motion.div> : null}
  </AnimatePresence>;
}

function scoreSummary(score: number) { return score >= 85 ? '말하지 않아도 통하는 텔레파시형' : score >= 70 ? '닮음과 다름이 균형 잡힌 단짝형' : score >= 50 ? '차이를 발견할수록 재밌는 탐험형' : '대화할수록 가까워지는 반전형'; }
function ResultStat({ color, label, value }: { color: string; label: string; value: string }) { return <div className={`min-w-0 rounded-xl border-2 border-black p-2 ${color}`}><p className="text-lg font-black">{value}</p><p className="mt-1 text-[10px] font-black">{label}</p></div>; }
function DateText({ value }: { value: string }) { return <p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))}</p>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">{text}</div>; }
