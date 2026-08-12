'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type Tab = 'profile' | 'solo' | 'co-op';

const tabs: Array<{ label: string; value: Tab; color: string }> = [
  { label: '내 정보', value: 'profile', color: 'bg-brand-pink' },
  { label: 'Solo 기록', value: 'solo', color: 'bg-brand-blue' },
  { label: '2인 기록', value: 'co-op', color: 'bg-brand-mint' },
];

export function MyPageTabs({ activeTab }: { activeTab: Tab }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-3 gap-2 text-sm">
        {tabs.map((tab) => (
          <button
            aria-current={activeTab === tab.value ? 'page' : undefined}
            className={`neo-button flex items-center justify-center text-center ${activeTab === tab.value ? tab.color : 'bg-white'}`}
            disabled={isPending || activeTab === tab.value}
            key={tab.value}
            onClick={() => startTransition(() => router.push(`/mypage?tab=${tab.value}`))}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {isPending ? <div className="mt-6 rounded-3xl border-3 border-black bg-white p-8 shadow-neo"><LoadingSpinner label="연구 기록을 불러오고 있어요" /></div> : null}
    </>
  );
}
