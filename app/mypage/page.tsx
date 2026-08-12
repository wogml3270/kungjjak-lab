import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { createClient } from '@/lib/supabase/server';

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect('/login');

  const requestedTab = (await searchParams).tab;
  const tab = requestedTab === 'solo' || requestedTab === 'co-op' ? requestedTab : 'profile';
  const { data: histories } = tab === 'solo'
    ? await supabase.from('solo_results').select('id, mbti, confidence, axis_scores, completed_at').order('completed_at', { ascending: false })
    : { data: null };
  const { data: memberships } = tab === 'co-op'
    ? await supabase.from('participants').select('room_id, role, joined_at').eq('user_id', user.id).order('joined_at', { ascending: false })
    : { data: null };
  const roomIds = memberships?.map((item) => item.room_id) ?? [];
  const { data: coOpRooms } = roomIds.length
    ? await supabase.from('rooms').select('id, code, status, created_at, reports(score)').in('id', roomIds)
    : { data: [] };
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.preferred_username ?? '쿵짝 연구원';

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="flex items-center justify-between"><Link className="font-black underline underline-offset-4" href="/">← 홈</Link><SignOutButton /></header>
      <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg">
        <p className="text-xs font-black tracking-widest">MY LAB</p><h1 className="mt-2 text-3xl font-black">{name}님의 연구 기록</h1>
      </section>
      <nav aria-label="마이페이지 메뉴" className="mt-7 grid grid-cols-3 gap-2 text-sm">
        <Link className={`neo-button flex items-center justify-center ${tab === 'profile' ? 'bg-brand-pink' : 'bg-white'}`} href="/mypage?tab=profile">내 정보</Link>
        <Link className={`neo-button flex items-center justify-center ${tab === 'solo' ? 'bg-brand-blue' : 'bg-white'}`} href="/mypage?tab=solo">Solo 기록</Link>
        <Link className={`neo-button flex items-center justify-center text-center ${tab === 'co-op' ? 'bg-brand-mint' : 'bg-white'}`} href="/mypage?tab=co-op">2인 기록</Link>
      </nav>
      {tab === 'profile' ? (
        <section className="mt-6 rounded-3xl border-3 border-black bg-white p-6 shadow-neo">
          <h2 className="text-xl font-black">내 정보</h2>
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="font-black text-neutral-500">이름</dt><dd className="mt-1 font-bold">{name}</dd></div><div><dt className="font-black text-neutral-500">이메일</dt><dd className="mt-1 break-all font-bold">{user.email ?? '이메일 비공개'}</dd></div><div><dt className="font-black text-neutral-500">로그인 방식</dt><dd className="mt-1 font-bold">{user.app_metadata.provider === 'kakao' ? 'Kakao' : 'Google'}</dd></div></dl>
        </section>
      ) : tab === 'solo' ? (
        <section className="mt-6 space-y-4">
          {!histories?.length ? <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">아직 저장된 Solo 기록이 없어요.</div> : histories.map((item) => <Link className="flex items-center justify-between rounded-2xl border-3 border-black bg-white p-5 shadow-neo transition-transform hover:-translate-y-0.5" href={`/solo/result/${item.id}`} key={item.id}><div><p className="text-2xl font-black">{item.mbti}</p><p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(item.completed_at))}</p></div><span aria-hidden className="text-2xl">→</span></Link>)}
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          {!coOpRooms?.length ? <div className="rounded-3xl border-3 border-black bg-white p-6 text-center font-bold shadow-neo">아직 저장된 2인 멀티버스 기록이 없어요.</div> : coOpRooms.map((room) => { const report = Array.isArray(room.reports) ? room.reports[0] : room.reports; return <Link className="flex items-center justify-between rounded-2xl border-3 border-black bg-white p-5 shadow-neo" href={`/co-op/${room.code}`} key={room.id}><div><p className="font-black">방 코드 {room.code}</p><p className="mt-1 text-xs font-bold text-neutral-500">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(room.created_at))}</p></div><span className="rounded-full border-2 border-black bg-brand-yellow px-3 py-1 text-xs font-black">{report ? `${Math.round(Number(report.score))}%` : room.status === 'completed' ? '분석 완료' : '진행 중'}</span></Link>; })}
        </section>
      )}
    </main>
  );
}
