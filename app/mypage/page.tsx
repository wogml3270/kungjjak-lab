import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { createClient } from '@/lib/supabase/server';

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect('/login');

  const tab = (await searchParams).tab === 'solo' ? 'solo' : 'profile';
  const { data: histories } = tab === 'solo'
    ? await supabase.from('solo_results').select('id, mbti, confidence, axis_scores, completed_at').order('completed_at', { ascending: false })
    : { data: null };
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.preferred_username ?? '쿵짝 연구원';

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="flex items-center justify-between"><Link className="font-black underline underline-offset-4" href="/">← 홈</Link><SignOutButton /></header>
      <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg">
        <p className="text-xs font-black tracking-widest">MY LAB</p><h1 className="mt-2 text-3xl font-black">{name}님의 연구 기록</h1>
      </section>
      <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-2 gap-3">
        <Link className={`neo-button flex items-center justify-center ${tab === 'profile' ? 'bg-brand-pink' : 'bg-white'}`} href="/mypage?tab=profile">내 정보</Link>
        <Link className={`neo-button flex items-center justify-center ${tab === 'solo' ? 'bg-brand-blue' : 'bg-white'}`} href="/mypage?tab=solo">Solo 기록</Link>
      </nav>
      {tab === 'profile' ? (
        <section className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo">
          <h2 className="text-xl font-black">내 정보</h2>
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="font-black text-neutral-500">이름</dt><dd className="mt-1 font-bold">{name}</dd></div><div><dt className="font-black text-neutral-500">이메일</dt><dd className="mt-1 break-all font-bold">{user.email ?? '이메일 비공개'}</dd></div><div><dt className="font-black text-neutral-500">로그인 방식</dt><dd className="mt-1 font-bold">{user.app_metadata.provider === 'kakao' ? 'Kakao' : 'Google'}</dd></div></dl>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          {!histories?.length ? <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">아직 저장된 Solo 기록이 없어요.</div> : histories.map((item) => <article className="flex items-center justify-between rounded-2xl border-3 border-black bg-white p-5 shadow-neo" key={item.id}><div><p className="text-2xl font-black">{item.mbti}</p><p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(item.completed_at))}</p></div><span className="rounded-full border-2 border-black bg-brand-mint px-3 py-1 text-xs font-black">확신도 {item.confidence}%</span></article>)}
        </section>
      )}
    </main>
  );
}
