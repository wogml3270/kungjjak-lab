'use client';

import { useState } from 'react';
import Link from 'next/link';

type Tab = 'profile' | 'solo' | 'co-op';
type SoloHistory = { id: string; mbti: string; completed_at: string };
type CoOpHistory = { id: string; score: number; createdAt: string; names: string[] };

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

    {tab === 'co-op' ? <section className="mt-6 space-y-4">{coOpHistories.length === 0 ? <Empty text="완료된 2인 멀티버스 기록이 없어요." /> : coOpHistories.map((item) => <Link className="flex items-center justify-between rounded-2xl border-3 border-black bg-white p-5 shadow-neo transition-transform hover:-translate-y-0.5" href={`/co-op/result/${item.id}`} key={item.id}><div><p className="font-black">{item.names.join(' × ')}</p><DateText value={item.createdAt} /></div><span className="rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">{Math.round(item.score)}%</span></Link>)}</section> : null}
  </>;
}

function DateText({ value }: { value: string }) { return <p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))}</p>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">{text}</div>; }
