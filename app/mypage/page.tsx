import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { MyPageDashboard } from '@/components/mypage/mypage-dashboard';
import { createClient } from '@/lib/supabase/server';

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const [{ data: { user } }, params] = await Promise.all([supabase.auth.getUser(), searchParams]);
  if (!user || user.is_anonymous) redirect('/login');

  const initialTab = params.tab === 'solo' || params.tab === 'co-op' ? params.tab : 'profile';
  const [{ data: soloHistories }, { data: memberships }] = await Promise.all([
    supabase.from('solo_results').select('id, mbti, completed_at').order('completed_at', { ascending: false }),
    supabase.from('participants').select('room_id, rooms(id, status, created_at, participants(display_name), reports(id, score, created_at))').eq('user_id', user.id).order('joined_at', { ascending: false }),
  ]);

  const coOpHistories = (memberships ?? []).flatMap((membership) => membership.rooms ?? []).flatMap((room) => {
    if (room.status !== 'completed') return [];
    const report = room.reports[0];
    if (!report) return [];
    const names = room.participants.map((participant) => participant.display_name).filter((value): value is string => Boolean(value));
    return [{ id: report.id, score: Number(report.score), createdAt: report.created_at ?? room.created_at, names: names.length === 2 ? names : ['나', '상대방'] }];
  });
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.preferred_username ?? '쿵짝 연구원';

  return <main className="mx-auto min-h-screen max-w-md px-5 py-8">
    <header className="flex items-center justify-between"><Link className="font-black underline underline-offset-4" href="/">← 홈</Link><SignOutButton /></header>
    <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg"><p className="text-xs font-black tracking-widest">MY LAB</p><h1 className="mt-2 text-3xl font-black">{name}님의 연구 기록</h1></section>
    <MyPageDashboard coOpHistories={coOpHistories} email={user.email ?? '이메일 비공개'} initialTab={initialTab} name={name} provider={user.app_metadata.provider === 'kakao' ? 'Kakao' : 'Google'} soloHistories={soloHistories ?? []} />
  </main>;
}
