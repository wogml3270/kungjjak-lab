'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

type Tab = 'profile' | 'solo' | 'co-op';
type SoloHistory = { id: string; mbti: string; confidence: number; axis_scores: Record<string, number>; completed_at: string };
type AxisResult = { dimension: string; left: string; leftTrait: string; right: string; rightTrait: string; chemistry: number; leftPercent: number; rightPercent: number };
type CoOpHistory = {
  id: string;
  participantId: string;
  score: number;
  createdAt: string;
  names: string[];
  profiles: Array<{ name: string; avatarUrl: string }>;
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
  const [selectedSolo, setSelectedSolo] = useState<SoloHistory | null>(null);
  const [selectedResult, setSelectedResult] = useState<CoOpHistory | null>(null);
  const [visibleSoloHistories, setVisibleSoloHistories] = useState(soloHistories);
  const [visibleCoOpHistories, setVisibleCoOpHistories] = useState(coOpHistories);

  async function deleteSolo(item: SoloHistory) {
    if (!window.confirm(`${item.mbti} Solo 기록을 삭제할까요? 삭제 후 복구할 수 없어요.`)) return;
    const { error } = await createClient().from('solo_results').delete().eq('id', item.id);
    if (error) { window.alert('기록을 삭제하지 못했어요. 다시 시도해 주세요.'); return; }
    setVisibleSoloHistories((items) => items.filter(({ id }) => id !== item.id));
    if (selectedSolo?.id === item.id) setSelectedSolo(null);
  }

  async function deleteCoOp(item: CoOpHistory) {
    if (!window.confirm(`${item.names.join(' × ')} 기록을 내 목록에서 삭제할까요?`)) return;
    const { error } = await createClient().from('participants').update({ is_ready: false }).eq('id', item.participantId);
    if (error) { window.alert('기록을 삭제하지 못했어요. 다시 시도해 주세요.'); return; }
    setVisibleCoOpHistories((items) => items.filter(({ id }) => id !== item.id));
    if (selectedResult?.id === item.id) setSelectedResult(null);
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    window.history.replaceState(null, '', `/mypage?tab=${nextTab}`);
  }

  return <>
    <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-3 gap-2 text-sm">
      {tabs.map((item) => <button aria-current={tab === item.value ? 'page' : undefined} className={`neo-button flex items-center justify-center text-center ${tab === item.value ? item.color : 'bg-white'}`} disabled={tab === item.value} key={item.value} onClick={() => changeTab(item.value)} type="button">{item.label}</button>)}
    </nav>

    {tab === 'profile' ? <section className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo"><h2 className="text-xl font-black">내 정보</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="font-black text-neutral-500">이름</dt><dd className="mt-1 font-bold">{name}</dd></div><div><dt className="font-black text-neutral-500">이메일</dt><dd className="mt-1 break-all font-bold">{email}</dd></div><div><dt className="font-black text-neutral-500">로그인 방식</dt><dd className="mt-1 font-bold">{provider}</dd></div></dl></section> : null}

    {tab === 'solo' ? <section className="mt-6 space-y-4">{visibleSoloHistories.length === 0 ? <Empty text="아직 저장된 Solo 기록이 없어요." /> : visibleSoloHistories.map((item) => <div className="flex items-center gap-2" key={item.id}><button className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border-3 border-black bg-white p-5 text-left shadow-neo transition-transform hover:-translate-y-0.5" onClick={() => setSelectedSolo(item)} type="button"><div><p className="text-2xl font-black">{item.mbti}</p><DateText value={item.completed_at} /></div><span aria-hidden className="text-2xl">→</span></button><DeleteButton label={`${item.mbti} 기록 삭제`} onClick={() => void deleteSolo(item)} /></div>)}</section> : null}

    {tab === 'co-op' ? <section className="mt-6 space-y-4">{visibleCoOpHistories.length === 0 ? <Empty text="완료된 2인 멀티버스 기록이 없어요." /> : visibleCoOpHistories.map((item) => <div className="flex items-center gap-2" key={item.id}><button className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border-3 border-black bg-white p-5 text-left shadow-neo transition-transform hover:-translate-y-0.5" onClick={() => setSelectedResult(item)} type="button"><div className="min-w-0"><p className="truncate font-black">{item.names.join(' × ')}</p><DateText value={item.createdAt} /></div><span className="ml-2 shrink-0 rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">{Math.round(item.score)}%</span></button><DeleteButton label={`${item.names.join(' × ')} 기록 삭제`} onClick={() => void deleteCoOp(item)} /></div>)}</section> : null}

    <ResultDrawer onClose={() => setSelectedResult(null)} result={selectedResult} />
    <SoloResultDrawer onClose={() => setSelectedSolo(null)} result={selectedSolo} />
  </>;
}

const soloAxes = [{ key: 'EI', left: 'E', right: 'I' }, { key: 'SN', left: 'S', right: 'N' }, { key: 'TF', left: 'T', right: 'F' }, { key: 'JP', left: 'J', right: 'P' }] as const;
function clarityProfile(clarity: number) {
  if (clarity >= 60) return { label: '선명한 성향형', description: '여러 상황에서도 선호하는 방향이 비교적 뚜렷하게 나타났어요.' };
  if (clarity >= 30) return { label: '상황 적응형', description: '기본 성향은 있지만 사람과 상황에 맞춰 유연하게 반응하는 편이에요.' };
  return { label: '균형 탐색형', description: '한쪽 성향에 갇히기보다 서로 다른 방식을 고르게 활용하는 편이에요.' };
}

function SoloResultDrawer({ onClose, result }: { onClose: () => void; result: SoloHistory | null }) {
  useEffect(() => {
    if (!result) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [onClose, result]);
  const profile = result ? clarityProfile(result.confidence) : null;

  return <AnimatePresence>{result && profile ? <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/40" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={onClose}><motion.aside animate={{ x: 0 }} aria-label="Solo 결과 상세" aria-modal="true" className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l-3 border-black bg-[#FFF8F0] px-5 py-6 shadow-[-8px_0_0_#000]" exit={{ x: '105%' }} initial={{ x: '105%' }} onClick={(event) => event.stopPropagation()} role="dialog" transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
    <div className="flex items-center justify-between"><p className="text-xs font-black tracking-widest">SOLO RESULT</p><button aria-label="결과 닫기" className="flex size-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black shadow-[2px_2px_0_#000]" onClick={onClose} type="button">×</button></div>
    <section className="mt-5 rounded-3xl border-3 border-black bg-brand-mint p-6 shadow-neo-lg"><h2 className="text-5xl font-black">{result.mbti}</h2><div className="mt-4 rounded-2xl border-3 border-black bg-white p-4"><p className="text-xs font-black tracking-wider">나의 성향 표현 스타일</p><p className="mt-1 text-xl font-black">{profile.label}</p><p className="mt-2 text-xs font-semibold leading-5">{profile.description}</p></div><div className="mt-6 space-y-5">{soloAxes.map(({ key, left, right }) => { const score = Number(result.axis_scores[key] ?? 0); const leftPercent = Math.round(((score + 12) / 24) * 100); return <div key={key}><div className="flex justify-between text-xs font-black"><span>{left} {leftPercent}%</span><span>{100 - leftPercent}% {right}</span></div><div className="mt-2 flex h-4 overflow-hidden rounded-full border-2 border-black"><div className="bg-brand-pink" style={{ width: `${leftPercent}%` }} /><div className="bg-brand-blue" style={{ width: `${100 - leftPercent}%` }} /></div></div>; })}</div></section>
    <button className="neo-button mt-6 w-full bg-brand-yellow" onClick={onClose} type="button">Solo 기록 목록으로</button>
  </motion.aside></motion.div> : null}</AnimatePresence>;
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
        <section className="relative mt-5 overflow-hidden rounded-3xl border-3 border-black bg-brand-mint p-5 text-center shadow-neo-lg">
          <CelebrationParticles />
          <motion.span animate={{ scale: [0, 1.25, 1], rotate: [0, -8, 5, 0] }} aria-hidden className="relative block text-6xl" initial={{ scale: 0 }} transition={{ delay: .25, duration: .7 }}>💞</motion.span>
          <motion.h2 animate={{ opacity: 1, y: 0 }} className="relative mt-3 text-3xl font-black" initial={{ opacity: 0, y: 12 }} transition={{ delay: .4 }}>우리의 쿵짝 스코어</motion.h2>
          <div className="relative mx-auto mt-5 flex max-w-xs items-center justify-center gap-3">
            <ProfileBadge index={0} profile={result.profiles[0]} />
            <motion.span animate={{ scale: [0, 1.35, 1] }} aria-hidden className="shrink-0 text-2xl font-black" initial={{ scale: 0 }} transition={{ delay: .8 }}>×</motion.span>
            <ProfileBadge index={1} profile={result.profiles[1]} />
          </div>
          <motion.p animate={{ opacity: 1, scale: 1 }} className="relative mt-4 text-7xl font-black" initial={{ opacity: 0, scale: .65 }} transition={{ delay: .9, type: 'spring', stiffness: 240 }}>{Math.round(result.score)}<span className="text-3xl">%</span></motion.p>
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
function ProfileBadge({ index, profile }: { index: number; profile: { name: string; avatarUrl: string } }) { return <motion.div animate={{ opacity: 1, x: 0, rotate: index === 0 ? -3 : 3 }} className="min-w-0 flex-1" initial={{ opacity: 0, x: index === 0 ? -40 : 40 }} transition={{ delay: .45 + index * .12, type: 'spring' }}><motion.div className="mx-auto size-20 overflow-hidden rounded-full border-3 border-black bg-white shadow-neo" whileHover={{ scale: 1.08, rotate: 0 }}><img alt={`${profile.name} 프로필`} className="size-full object-cover" src={profile.avatarUrl} /></motion.div><p className="mt-2 truncate rounded-full border-2 border-black bg-white px-2 py-1 text-xs font-black">{profile.name}</p></motion.div>; }
function CelebrationParticles() { const colors = ['bg-brand-pink', 'bg-brand-yellow', 'bg-brand-blue', 'bg-white']; return <div aria-hidden className="pointer-events-none absolute inset-0">{Array.from({ length: 14 }, (_, index) => <motion.i animate={{ y: [0, 170], x: [0, index % 2 ? 18 : -18], rotate: [0, 240], opacity: [0, 1, 0] }} className={`absolute top-0 size-2 rounded-sm border border-black ${colors[index % colors.length]}`} initial={{ left: `${6 + index * 7}%`, y: -15, opacity: 0 }} key={index} transition={{ delay: .15 + index * .045, duration: 1.5, ease: 'easeOut' }} />)}</div>; }
function ResultStat({ color, label, value }: { color: string; label: string; value: string }) { return <div className={`min-w-0 rounded-xl border-2 border-black p-2 ${color}`}><p className="text-lg font-black">{value}</p><p className="mt-1 text-[10px] font-black">{label}</p></div>; }
function DateText({ value }: { value: string }) { return <p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))}</p>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">{text}</div>; }
function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) { return <button aria-label={label} className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-brand-pink text-lg shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" onClick={onClick} title="기록 삭제" type="button">🗑️</button>; }
