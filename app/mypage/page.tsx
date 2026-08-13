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
  const [soloResult, membershipResult] = await Promise.all([
    supabase.from('solo_results').select('id, mbti, completed_at').order('completed_at', { ascending: false }),
    supabase.from('participants').select('room_id').eq('user_id', user.id).order('joined_at', { ascending: false }),
  ]);

  if (soloResult.error) console.error('[mypage] solo history query failed', soloResult.error);
  if (membershipResult.error) console.error('[mypage] membership query failed', membershipResult.error);

  const roomIds = [...new Set((membershipResult.data ?? []).map(({ room_id }) => room_id).filter(Boolean))];
  const [reportResult, participantResult] = roomIds.length
    ? await Promise.all([
        supabase.from('reports').select('id, room_id, score, created_at').in('room_id', roomIds).order('created_at', { ascending: false }),
        supabase.from('participants').select('room_id, display_name').in('room_id', roomIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (reportResult.error) console.error('[mypage] co-op report query failed', reportResult.error);
  if (participantResult.error) console.error('[mypage] participant name query failed', participantResult.error);

  const namesByRoom = new Map<string, string[]>();
  for (const participant of participantResult.data ?? []) {
    if (!participant.display_name) continue;
    namesByRoom.set(participant.room_id, [...(namesByRoom.get(participant.room_id) ?? []), participant.display_name]);
  }
  const coOpHistories = (reportResult.data ?? []).map((report) => {
    const names = namesByRoom.get(report.room_id) ?? [];
    return { id: report.id, score: Number(report.score), createdAt: report.created_at, names: names.length === 2 ? names : ['나', '상대방'] };
  });
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.preferred_username ?? '쿵짝 연구원';

  return <main className="mx-auto min-h-screen max-w-md px-5 py-8">
    <header className="flex items-center justify-between"><Link className="font-black underline underline-offset-4" href="/">← 홈</Link><SignOutButton /></header>
    <section className="mt-6 rounded-3xl border-3 border-black bg-brand-yellow p-6 shadow-neo-lg"><p className="text-xs font-black tracking-widest">MY LAB</p><h1 className="mt-2 text-3xl font-black">{name}님의 연구 기록</h1></section>
    <MyPageDashboard coOpHistories={coOpHistories} email={user.email ?? '이메일 비공개'} initialTab={initialTab} name={name} provider={user.app_metadata.provider === 'kakao' ? 'Kakao' : 'Google'} soloHistories={soloResult.data ?? []} />
  </main>;
}
