import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { CourtTemplate } from '@/lib/court/types';

export const metadata = { title: '사랑의 판결 받기' };

export default async function CourtPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('court_templates')
    .select(
      'id, category, title, summary, plaintiff_claim, defendant_claim, emoji, difficulty, is_featured',
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at');
  const templates = (data ?? []) as CourtTemplate[];
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="rounded-3xl border-3 border-black bg-brand-pink p-6 shadow-neo-lg">
        <Link className="text-sm font-black underline" href="/">
          ← 홈
        </Link>
        <span aria-hidden className="mt-5 block text-6xl">
          ⚖️
        </span>
        <p className="mt-4 text-xs font-black tracking-widest">LOVE COURT · v2</p>
        <h1 className="mt-2 text-4xl font-black">사랑의 판결 받기</h1>
        <p className="mt-3 font-bold leading-7">
          준비된 사건을 골라 친구들을 배심원으로 초대하거나, 우리만의 사건을 직접 만들어 보세요.
        </p>
        <Link className="neo-button mt-5 flex justify-center bg-brand-yellow" href="/court/new">
          내 사건 직접 만들기
        </Link>
      </header>
      <section className="mt-9">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-black text-neutral-500">CASE FILES</p>
            <h2 className="mt-1 text-2xl font-black">바로 시작하는 사건</h2>
          </div>
          <span className="text-3xl">📚</span>
        </div>
        <div className="mt-5 space-y-4">
          {templates.length ? (
            templates.map((item) => (
              <Link
                className="block rounded-3xl border-3 border-black bg-white p-5 shadow-neo transition-transform hover:-translate-y-1"
                href={`/court/new?template=${item.id}`}
                key={item.id}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border-2 border-black bg-brand-blue px-2 py-0.5 text-[10px] font-black">
                        {item.category}
                      </span>
                      <span className="rounded-full border-2 border-black bg-brand-yellow px-2 py-0.5 text-[10px] font-black">
                        {item.difficulty}
                      </span>
                      {item.is_featured ? (
                        <span className="rounded-full border-2 border-black bg-brand-pink px-2 py-0.5 text-[10px] font-black">
                          추천
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-black leading-7">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
                      {item.summary}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl border-3 border-black bg-brand-yellow p-5 text-center font-black">
              준비된 사건 데이터를 기다리고 있어요.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
